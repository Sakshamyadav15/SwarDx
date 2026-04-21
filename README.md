---
title: Voice PD
emoji: 🎤
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
hf_oauth: true
pinned: false
---

# Voice-Based Parkinson's Disease Screening System

## Project Overview

SwarDx is a machine learning-powered voice analysis system designed to detect vocal biomarkers associated with Parkinson's Disease through acoustic analysis. The system analyzes voice recordings and provides probabilistic predictions with explainable metrics about vocal characteristics.

## Scientific Foundation

Parkinson's Disease commonly manifests vocal abnormalities including reduced pitch variation, tremor, breathiness, and altered articulation. This system leverages the eGeMAPSv02 acoustic feature set (88 parameters) extracted from voice recordings to identify these pathological patterns using an optimized XGBoost classifier.

### Key Acoustical Features Analyzed

- Vocal stability: Magnitude variation and tremor detection
- Pitch variation: Fundamental frequency characteristics
- Temporal consistency: Voice onset and offset timing
- Voice quality: Spectral properties and harmonic-to-noise ratio

## Technical Architecture

### Backend Components

**Audio Preprocessing Pipeline**
- Sample rate normalization to 16 kHz (required for feature consistency)
- Peak normalization to prevent clipping artifacts
- Silence trimming using voice activity detection (librosa spectral gating)
- Spectral noise gating with adaptive noise profiling (noisereduce library)
- Duration validation between 1.5 and 12 seconds

**Feature Extraction**
- OpenSMILE eGeMAPSv02 feature set: 88 functional-level acoustic parameters
- Automated feature computation from preprocessed audio
- Feature scaling using scikit-learn StandardScaler

**Classification Model**
- XGBoost binary classifier trained on clinical voice samples
- Threshold tuning for balanced sensitivity/specificity tradeoff
- Probability calibration to confidence scores

### API Endpoints

**POST /predict**
Accepts multipart audio file (WAV, MP3, OGG, etc.) and returns:
- Prediction: "healthy" or "parkinsons"
- Confidence: 0-100 percentage score
- Feature breakdown: Vocal stability, pitch variation, temporal consistency
- Raw model outputs: Label, probability, threshold

**GET /health**
Returns service status and model availability.

## Installation and Local Development

### Prerequisites

- Python 3.10 or higher
- FFmpeg (for audio format decoding)
- 2GB+ RAM
- Internet connection for dependency installation

### Setup for Windows

```powershell
# Clone repository
git clone https://github.com/Sakshamyadav15/SwarDx.git
cd SwarDx

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run API server
uvicorn api_server:app --host localhost --port 8000
```

The API will be available at http://localhost:8000 with interactive documentation at http://localhost:8000/docs

### Setup for Linux/macOS

```bash
git clone https://github.com/Sakshamyadav15/SwarDx.git
cd SwarDx

python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

uvicorn api_server:app --host localhost --port 8000
```

## Deployment

### Deploy to Hugging Face Spaces

The application is configured for deployment as a Docker container on Hugging Face Spaces.

**Via Web UI:**
1. Navigate to https://huggingface.co/spaces/Sakshamyadav15/Voice_PD
2. Go to Settings > Repo Info
3. Ensure SDK is set to "docker"
4. Push code to the space repository

**Via CLI:**

```bash
# Install Hugging Face CLI tools
pip install huggingface-hub

# Login to Hugging Face
huggingface-cli login

# Clone the space repository
git clone https://huggingface.co/spaces/Sakshamyadav15/Voice_PD
cd Voice_PD

# Copy application files
cp /path/to/SwarDx/* .

# Commit and push
git add .
git commit -m "Deploy SwarDx voice analysis model"
git push
```

The space will automatically build the Docker image and deploy the application. Access at: https://huggingface.co/spaces/Sakshamyadav15/Voice_PD

## Project Structure

```
SwarDx/
├── api_server.py                 # FastAPI application with /predict endpoint
├── sample.py                     # Model wrapper and audio preprocessing
├── opxg_model.json              # Trained XGBoost model weights
├── scaler.pkl                   # Feature normalization parameters
├── threshold.txt                # Decision threshold (tuned on validation set)
├── feature_names.csv            # 88 eGeMAPSv02 feature names (ordered)
├── feature_importance.csv       # Per-feature importance scores
├── parkinson_opxg_robust.ipynb  # Training notebook with model development pipeline
├── Dockerfile                   # Docker configuration for containerization
├── requirements.txt             # Python dependencies
├── README.md                    # This file
├── .gitignore                   # Git exclusions for large/local files
└── test_audios/                 # Sample audio files for testing (not in git)
    ├── healthy/                 # Control group voice samples
    └── pd/                      # Parkinson's disease patient voice samples
```

## Model Performance

The XGBoost classifier was trained on a balanced dataset with stratified cross-validation:

- Accuracy: 85.7%
- Sensitivity (true positive rate): 85.7%
- Specificity (true negative rate): 85.7%
- F1-Score: 0.857
- ROC-AUC: 0.93

## Usage Examples

### Via API (cURL)

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "accept: application/json" \
  -F "file=@voice_sample.wav"
```

### Via Python Requests

```python
import requests

with open("voice_sample.wav", "rb") as f:
    files = {"file": f}
    response = requests.post(
        "http://localhost:8000/predict",
        files=files
    )

result = response.json()
print(f"Prediction: {result['prediction']}")
print(f"Confidence: {result['confidence']}%")
print(f"Vocal Stability: {result['features']['vocalStability']}%")
```

### Testing with Provided Samples

Place audio files in test_audios/ directory (organized as healthy/ and pd/ subdirectories) then use sample.py for batch evaluation.

## Important Notes

**Clinical Validation Status:** This system is a research prototype. Results should not be used for clinical diagnosis without professional medical evaluation. All predictions represent probabilistic estimates based on acoustic analysis only.

**Audio Requirements:** 
- Minimum duration: 1.5 seconds
- Maximum duration: 12 seconds
- Recommended format: WAV (44.1 kHz or higher, will be resampled to 16 kHz)
- Should contain sustained phonation (minimize speech, prefer vowels)

**Privacy:** Audio files are processed on-device and not stored or transmitted for analytics.

## Dependencies

Primary libraries and versions:
- FastAPI 0.104.1: Web framework for API
- xgboost 2.0.0: Gradient boosting classifier
- librosa 0.10.0: Audio analysis utilities
- opensmile 2.4.2: Feature extraction (eGeMAPSv02)
- soundfile 0.12.1: Audio I/O
- noisereduce 3.0.0: Spectral noise gating
- scikit-learn 1.3.2: Model preprocessing
- uvicorn 0.24.0: ASGI server

See requirements.txt for complete dependency list.

## Troubleshooting

**Model loading fails:** Ensure all pkl, json, txt, and csv files are in the working directory and paths match exactly.

**Audio processing errors:** Verify audio format is supported (WAV, MP3, OGG) and duration is between 1.5-12 seconds.

**Predictions seem inconsistent:** Background noise and recording equipment affect analysis. Use consistent, quiet recording environment for reliable results.

**API returns 500 error:** Check that FFmpeg is installed and available in system PATH.

## Contributing

Contributions are welcome. Submit pull requests with:
- Clear description of changes
- Test results on sample audio files
- Updated documentation where applicable

## License

MIT License - See LICENSE file for details.

## Author

Saksham Yadav
- GitHub: https://github.com/Sakshamyadav15
- Email: sakshamyadav15@gmail.com

## Acknowledgments

- OpenSMILE library for eGeMAPSv02 feature extraction
- librosa for audio processing utilities
- XGBoost for the gradient boosting framework
- Hugging Face for deployment infrastructure

## References

- Rusz J, et al. Acoustic features for detection of Parkinson's disease. Journal of Voice. 2013.
- Eyben F, et al. The Geneva Minimalistic Acoustic Parameter Set (GeMAPS). IEEE ASRU. 2015.
- Orozco-Arroyave JR, et al. New Spanish speech corpus database for the analysis of people suffering from Parkinson's disease. LREC. 2014.
  "specificity": 77.78,
  "features": {
    "vocalStability": 47.8,
    "pitchVariation": 41.6,
    "temporalConsistency": 43.9
  },
  "raw": {
    "label": "Healthy",
    "pd_probability": 0.187654,
    "threshold": 0.49545306
  }
}
```

---

## Disclaimer
SwarDx is intended for research, prototype, and educational purposes only. It is **not a certified medical diagnostic device** and must not be used as a substitute for clinical evaluation by a healthcare professional.
