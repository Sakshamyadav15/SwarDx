"use client"

import Header from "@/components/header"
import HeroContent from "@/components/hero-content"
import PulsingCircle from "@/components/pulsing-circle"
import ShaderBackground from "@/components/shader-background"
import { motion } from "framer-motion"

export default function ShaderShowcase() {
  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <ShaderBackground>
          <div />
        </ShaderBackground>
      </div>
      
      <div className="relative z-10">
        <Header />
        
        {/* Landing Section */}
        <section className="relative min-h-[calc(100vh-80px)]" id="home">
          <HeroContent />
          <PulsingCircle />
        </section>

        {/* About Section */}
        <section id="about" className="min-h-screen flex items-center justify-center p-6 py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="w-full max-w-4xl bg-black/40 backdrop-blur-xl rounded-3xl p-10 md:p-16 border border-white/10 shadow-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-light text-white mb-8">
              <span className="font-medium italic instrument">About</span> VoicePD
            </h2>
            <div className="space-y-6 text-white/80 font-light leading-relaxed text-lg">
              <p>
                VoicePD is a speech-based Parkinson&apos;s screening workflow built around robust acoustic preprocessing,
                eGeMAPSv02 voice biomarkers, and a calibrated XGBoost classifier for practical microphone recordings.
              </p>
              <div className="grid md:grid-cols-2 gap-8 mt-12">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-white font-medium mb-3">Non-Invasive</h3>
                  <p className="text-sm text-white/60">Upload or record a short voice sample directly from phone or laptop. No specialized clinical hardware required.</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-white font-medium mb-3">Model Pipeline</h3>
                  <p className="text-sm text-white/60">Noise-reduced 16kHz preprocessing + openSMILE eGeMAPSv02 (88 features) + scaled XGBoost inference.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Research Section */}
        <section id="research" className="min-h-screen flex items-center justify-center p-6 py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="w-full max-w-4xl bg-black/40 backdrop-blur-xl rounded-3xl p-10 md:p-16 border border-white/10 shadow-2xl"
          >
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1">
                <h2 className="text-4xl md:text-5xl font-light text-white mb-8">
                  <span className="font-medium italic instrument">Research</span> & Tech
                </h2>
                <div className="space-y-6 text-white/80 font-light leading-relaxed">
                  <p>
                    Vocal changes are commonly reported early in Parkinson&apos;s, including reduced loudness,
                    monotone pitch, instability, and altered temporal coordination.
                  </p>
                  <p>
                    The current deployment uses <span className="text-white font-medium">XGBoost + eGeMAPSv02</span> with
                    a calibrated decision threshold of <span className="text-white font-medium">0.4955</span>.
                  </p>
                  <p>
                    Reported performance varies by cohort, recording setup, and validation protocol.
                    For transparency, evaluation metrics should be interpreted in the context of the
                    exact split strategy and test population.
                  </p>
                </div>
              </div>
              <div className="w-full md:w-1/3">
                <div className="aspect-square rounded-full border border-white/20 flex flex-col items-center justify-center bg-white/5 backdrop-blur-md p-8 text-center shadow-[0_0_50px_rgba(139,92,246,0.15)] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                  <p className="text-5xl font-light text-white mb-2 relative z-10 tracking-tighter">0.4955</p>
                  <p className="text-xs text-white/50 tracking-widest uppercase relative z-10">Calibrated Threshold</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="min-h-screen flex items-center justify-center p-6 py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="w-full max-w-3xl bg-black/40 backdrop-blur-xl rounded-3xl p-10 md:p-16 border border-white/10 shadow-2xl text-center"
          >
            <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
              <span className="font-medium italic instrument">Get in</span> Touch
            </h2>
            <p className="text-white/60 font-light mb-12 text-lg max-w-lg mx-auto">
              Want to learn more about the code, models, or potential collaborations? We're open to research inquiries.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:saksham.jadav@gmail.com" 
                className="flex items-center justify-center gap-3 text-white/90 hover:text-white px-8 py-4 bg-white/10 rounded-full border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all font-light"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                saksham.jadav@gmail.com
              </a>
              <a 
                href="http://github.com/Sakshamyadav15/SwarDx" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 text-white/90 hover:text-white px-8 py-4 bg-white/10 rounded-full border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all font-light"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub Repository
              </a>
            </div>
          </motion.div>
        </section>

      </div>
    </div>
  )
}
