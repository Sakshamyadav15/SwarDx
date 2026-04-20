"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts"

type ScreenState = "input" | "processing" | "results"

interface AnalysisResult {
  prediction: "healthy" | "parkinsons"
  confidence: number
  sensitivity: number
  specificity: number
  features: {
    vocalStability: number
    pitchVariation: number
    temporalConsistency: number
  }
}

interface HistoryItem {
  id: string
  filename: string
  timestamp: string
  prediction: "healthy" | "parkinsons"
  confidence: number
}

const HISTORY_KEY = "swardx_inference_history"
const MAX_HISTORY_ITEMS = 12

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const result = new Int16Array(buffer.length * numChannels);
  
  let offset = 0;
  for (let i = 0; i < numChannels; i++) {
    const channelData = buffer.getChannelData(i);
    for (let j = 0; j < channelData.length; j++) {
      let sample = Math.max(-1, Math.min(1, channelData[j]));
      sample = sample < 0 ? sample * 32768 : sample * 32767;
      result[j * numChannels + i] = sample;
    }
  }
  
  const dataLength = result.length * 2;
  const bufferArray = new ArrayBuffer(44 + dataLength);
  const view = new DataView(bufferArray);
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  
  const dataView = new Int16Array(bufferArray, 44);
  dataView.set(result);
  
  return new Blob([view], { type: 'audio/wav' });
}

export default function RecordContent() {
  const [screenState, setScreenState] = useState<ScreenState>("input")
  const [isRecording, setIsRecording] = useState(false)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : undefined
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current)
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const arrayBuffer = await audioBlob.arrayBuffer()
          const decodedAudio = await audioContext.decodeAudioData(arrayBuffer)
          const wavBlob = audioBufferToWav(decodedAudio)
          const file = new File([wavBlob], "recorded_voice_sample.wav", { type: "audio/wav" })
          setAudioFile(file)
        } catch (e) {
          console.error("Audio encoding failed, falling back to raw recording blob", e)
          const file = new File([audioBlob], "recorded_voice_sample.webm", { type: "audio/webm" })
          setAudioFile(file)
        }
        
        // Stop all tracks
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      alert("Microphone access is required to record.")
    }
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioFile(file)
    }
  }, [])

  const analyzeAudio = useCallback(async () => {
    if (!audioFile) return;
    
    setScreenState("processing")
    
    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      
      const response = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Analysis failed");
      }
      
      const data = await response.json();
      setResult(data);

      if (audioFile && (data.prediction === "healthy" || data.prediction === "parkinsons") && typeof data.confidence === "number") {
        const nextItem: HistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          filename: audioFile.name,
          timestamp: new Date().toISOString(),
          prediction: data.prediction,
          confidence: Number(data.confidence.toFixed(2)),
        }
        setHistory((prev) => [nextItem, ...prev].slice(0, MAX_HISTORY_ITEMS))
      }

      setScreenState("results");
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please try again.");
      setScreenState("input");
    }
  }, [audioFile])

  const downloadReport = useCallback(() => {
    if (!result || !audioFile) return;

    try {
      const classification =
        result.prediction === "healthy"
          ? "Likely Healthy"
          : "Potential Parkinson's Indicators"

      const reportText = [
        "PARKINSON'S DISEASE ANALYSIS",
        "Generated by VoicePD (Research Only)",
        "",
        `File Evaluated: ${audioFile.name}`,
        `Date of Analysis: ${new Date().toLocaleString()}`,
        "",
        "PREDICTION SUMMARY",
        `Classification: ${classification}`,
        `Confidence Score: ${result.confidence}%`,
        `Sensitivity: ${result.sensitivity}%`,
        `Specificity: ${result.specificity}%`,
        "",
        "SHAP FEATURE EXPLAINABILITY",
        `Vocal Stability: ${result.features.vocalStability}% impact`,
        `Pitch Variation: ${result.features.pitchVariation}% impact`,
        `Temporal Consistency: ${result.features.temporalConsistency}% impact`,
        "",
        "Disclaimer: This tool is for research and screening purposes only and is not a medical diagnosis.",
      ].join("\n")

      const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `VoicePD_Report_${audioFile.name}.txt`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert("Failed to generate report.")
    }
  }, [result, audioFile]);

  const resetAnalysis = useCallback(() => {
    setScreenState("input")
    setAudioFile(null)
    setResult(null)
    setRecordingTime(0)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const chartData = history
    .slice()
    .reverse()
    .map((item, idx) => ({
      name: `${idx + 1}`,
      confidence: item.confidence,
      prediction: item.prediction,
      filename: item.filename,
      time: new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }))

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(HISTORY_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as HistoryItem[]
      if (Array.isArray(parsed)) {
        setHistory(parsed.slice(0, MAX_HISTORY_ITEMS))
      }
    } catch {
      // Ignore corrupted history.
    }
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch {
      // Ignore write errors in private mode/storage-restricted contexts.
    }
  }, [history])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return (
    <main className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto p-6 pt-24 pb-8">
      <AnimatePresence mode="wait">
        {screenState === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <div className="mb-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white text-xs font-light px-3 py-2 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-light text-white mb-2">
                  <span className="font-medium italic instrument">Voice</span> Analysis
                </h1>
                <p className="text-white/60 text-sm">
                  Upload or record a short voice sample to analyze speech patterns
                </p>
              </div>

              {/* Record Button */}
              <div className="flex flex-col items-center mb-8">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isRecording 
                      ? "bg-red-500/20 border-2 border-red-500" 
                      : "bg-white/10 border-2 border-white/30 hover:bg-white/20 hover:border-white/50"
                  }`}
                >
                  {isRecording && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-red-500"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`w-10 h-10 ${isRecording ? "text-red-500" : "text-white"}`}
                  >
                    <path
                      d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
                      fill="currentColor"
                    />
                    <path
                      d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
                <p className="text-white/60 text-sm mt-4">
                  {isRecording ? `Recording... ${formatTime(recordingTime)}` : "Click to record"}
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/40 text-xs">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all duration-200"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.wav,.mp3"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white/40 mx-auto mb-2">
                  <path
                    d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
                    fill="currentColor"
                  />
                </svg>
                <p className="text-white/60 text-sm">
                  {audioFile ? audioFile.name : "Upload Audio (.wav, .mp3)"}
                </p>
              </div>

              {/* File Info */}
              {audioFile && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-4 bg-white/5 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm">{audioFile.name}</p>
                      <p className="text-white/40 text-xs">Ready for analysis</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                </motion.div>
              )}

              {/* Analyze Button */}
              {audioFile && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={analyzeAudio}
                  className="w-full mt-6 px-8 py-4 rounded-full bg-white text-black font-medium text-sm transition-all duration-200 hover:bg-white/90 cursor-pointer"
                >
                  Analyze Voice Sample
                </motion.button>
              )}

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-4 mt-8 text-white/40 text-xs">
                <span>Non-invasive</span>
                <span>•</span>
                <span>No equipment required</span>
                <span>•</span>
                <span>Research only</span>
              </div>
            </div>

            {history.length > 0 && (
              <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-sm font-medium">Session History</h3>
                  <button
                    onClick={clearHistory}
                    className="text-[11px] text-white/60 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                </div>

                <div className="h-40 w-full mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(10,10,10,0.95)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          color: "white",
                        }}
                        formatter={(value: number, _name, payload) => [`${value}%`, payload?.payload?.prediction === "healthy" ? "Healthy" : "Parkinsons"]}
                        labelFormatter={(label, payload) => {
                          const point = payload?.[0]?.payload
                          return point ? `#${label} • ${point.time} • ${point.filename}` : `#${label}`
                        }}
                      />
                      <Bar dataKey="confidence" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell
                            key={`${entry.name}-${entry.time}`}
                            fill={entry.prediction === "healthy" ? "rgba(34,197,94,0.85)" : "rgba(249,115,22,0.85)"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 max-h-32 overflow-auto pr-1">
                  {history.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
                      <div className="truncate pr-2 text-white/80">{item.filename}</div>
                      <div className={`shrink-0 ${item.prediction === "healthy" ? "text-green-400" : "text-amber-300"}`}>
                        {item.prediction === "healthy" ? "Healthy" : "Parkinsons"} • {item.confidence}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {screenState === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
              {/* Loading Animation */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-white/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-4 rounded-full border-2 border-white/30"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>

              <h2 className="text-xl font-light text-white mb-2">
                Analyzing Speech Patterns...
              </h2>
              <p className="text-white/60 text-sm mb-6">
                Extracting features, evaluating vocal stability, and generating prediction
              </p>

              {/* Progress Steps */}
              <div className="space-y-3 text-left">
                {["Extracting audio features", "Analyzing vocal patterns", "Generating prediction"].map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.5 }}
                    className="flex items-center gap-3 text-white/60 text-sm"
                  >
                    <motion.div
                      className="w-4 h-4 rounded-full border border-white/30 flex items-center justify-center"
                      animate={{ backgroundColor: ["rgba(255,255,255,0)", "rgba(255,255,255,0.2)", "rgba(255,255,255,0)"] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    </motion.div>
                    {step}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {screenState === "results" && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-lg"
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
              {/* Prediction Result */}
              <div className="text-center mb-8">
                <div className={`inline-flex items-center px-4 py-2 rounded-full mb-4 ${
                  result.prediction === "healthy" 
                    ? "bg-green-500/20 text-green-400" 
                    : "bg-amber-500/20 text-amber-300"
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    result.prediction === "healthy" ? "bg-green-400" : "bg-amber-300"
                  }`} />
                  <span className="text-sm font-medium">
                    {result.prediction === "healthy" ? "Likely Healthy" : "Potential Parkinson&apos;s Indicators"}
                  </span>
                </div>
                <p className="text-white/60 text-sm">
                  Confidence Score: <span className="text-white font-medium">{result.confidence}%</span>
                </p>
              </div>

              {/* Pre-recorded Metrics (Removed User Request) */}

              {/* Explainability Section */}
              <div className="mb-8 bg-black/40 rounded-2xl p-6 border border-white/10 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">SHAP Deep AI Analysis</h3>
                    <p className="text-white/40 text-xs">Based on 1536 derived acoustic pool vectors</p>
                  </div>
                </div>

                <p className="text-white/60 text-xs mb-6 font-light leading-relaxed">
                  SHAP indicates that variability-related features (captured via <span className="font-medium text-emerald-300">standard deviation pooling</span>) 
                  contribute significantly to Parkinson&apos;s predictions, aligning with known vocal instability in PD patients compared to <span className="text-sky-300">mean temporal traits</span>.
                </p>

                <div className="space-y-6">
                  {/* Heatmap-style bars */}
                  {[
                    { label: "Vocal Stability", sub: "Std Features [768:1536]", value: result.features.vocalStability, color: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]", emptyColor: "bg-emerald-900/20" },
                    { label: "Pitch Variation", sub: "Mean Subset [0:384]", value: result.features.pitchVariation, color: "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.55)]", emptyColor: "bg-sky-900/20" },
                    { label: "Temporal Consistency", sub: "Mean Subset [384:768]", value: result.features.temporalConsistency, color: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.55)]", emptyColor: "bg-amber-900/20" },
                  ].map((feature) => (
                    <div key={feature.label} className="flex flex-col gap-2">
                      <div className="flex justify-between items-end mb-1">
                        <div className="flex flex-col">
                          <span className="text-white/90 text-sm font-medium">{feature.label}</span>
                          <span className="text-white/40 text-[10px] uppercase tracking-wider">{feature.sub}</span>
                        </div>
                        <span className="text-white/80 font-mono text-sm bg-white/5 px-2 py-0.5 rounded border border-white/10">
                          {feature.value}%
                        </span>
                      </div>
                      
                      {/* Elegant Discrete Heatmap Grid */}
                      <div className="flex gap-[2px] w-full">
                        {Array.from({ length: 40 }).map((_, i) => {
                          const isFilled = i < Math.round((feature.value / 100) * 40);
                          return (
                            <motion.div
                              key={i}
                              className={`h-4 flex-1 rounded-sm ${isFilled ? feature.color : `${feature.emptyColor} border border-white/5`}`}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: 0.1 + (i * 0.02) }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {history.length > 0 && (
                <div className="mb-8 bg-black/40 rounded-2xl p-6 border border-white/10 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white font-medium">Inference History</h3>
                      <p className="text-white/40 text-xs">Current session recordings only</p>
                    </div>
                    <button
                      onClick={clearHistory}
                      className="text-[11px] text-white/60 hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="h-48 w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(10,10,10,0.95)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 12,
                            color: "white",
                          }}
                          formatter={(value: number, _name, payload) => [`${value}%`, payload?.payload?.prediction === "healthy" ? "Healthy" : "Parkinsons"]}
                          labelFormatter={(label, payload) => {
                            const point = payload?.[0]?.payload
                            return point ? `#${label} • ${point.time} • ${point.filename}` : `#${label}`
                          }}
                        />
                        <Bar dataKey="confidence" radius={[6, 6, 0, 0]}>
                          {chartData.map((entry) => (
                            <Cell
                              key={`${entry.name}-${entry.time}`}
                              fill={entry.prediction === "healthy" ? "rgba(34,197,94,0.85)" : "rgba(245,158,11,0.85)"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 max-h-36 overflow-auto pr-1">
                    {history.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
                        <div className="truncate pr-2 text-white/80">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {item.filename}
                        </div>
                        <div className={`shrink-0 ${item.prediction === "healthy" ? "text-green-400" : "text-amber-300"}`}>
                          {item.prediction === "healthy" ? "Healthy" : "Parkinsons"} • {item.confidence}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={resetAnalysis}
                  className="flex-1 px-6 py-3 rounded-full bg-transparent border border-white/30 text-white font-normal text-sm transition-all duration-200 hover:bg-white/10 hover:border-white/50 cursor-pointer"
                >
                  New Analysis
                </button>
                <button 
                  onClick={downloadReport}
                  className="flex-1 px-6 py-3 rounded-full bg-white text-black font-normal text-sm transition-all duration-200 hover:bg-white/90 cursor-pointer"
                >
                  Download Report
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-white/30 text-xs text-center mt-6 leading-relaxed">
                This tool is for research and screening purposes only and is not a medical diagnosis. Please consult a healthcare professional for clinical evaluation.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
