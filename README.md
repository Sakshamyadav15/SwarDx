# SwarDx: Voice-Based Parkinson's Disease Screening

SwarDx (formerly VoicePD) is an intelligent, voice-based screening application that analyzes audio recordings to detect vocal biomarkers associated with Parkinson's Disease. It combines a robust Machine Learning pipeline with an interactive web interface, allowing users to upload audio or record directly from their microphone for evaluation.

## Key Features

- **Robust Audio Preprocessing**: Handles real-world microphone noise (from phones and laptops) using spectral noise gating (`noisereduce`), silence trimming (VAD via `librosa`), and strict sample rate normalization (16kHz).
- **Advanced Feature Extraction**: Uses the **OpenSMILE** library to extract the **eGeMAPSv02** feature set (88 acoustic parameters), which are clinical standards for voice analysis.
- **XGBoost Classifier**: An optimized, threshold-tuned XGBoost model mapped to real-time confidence scores.
- **Explainable Metrics**: Breaks down predictions into vocal stability, pitch variation, and temporal consistency metrics on the frontend.
- **Modern Full-Stack Architecture**: A fast Python/FastAPI backend paired with a responsive Next.js frontend integrating Radix UI components.

## Repository Architecture

```text
SwarDx/
|-- api_server.py                # FastAPI backend serving the ML model
|-- sample.py                    # Local evaluation script for batch testing
|-- opxg_model.json              # Pre-trained XGBoost model weights
|-- scaler.pkl                   # Scikit-Learn StandardScaler for features
|-- threshold.txt                # Calibrated decision threshold
|-- feature_names.csv            # Ordered feature names for validation
|-- feature_importance.csv       # XGBoost feature importance scores
|-- parkinson_opxg_robust.ipynb  # Training notebook (SMOTE + OpenSMILE + XGBoost)
|-- test_audios/                 # Folder with sample .wav/.mp3 files 
|   |-- healthy/
|   `-- pd/
`-- frontend/                    # Next.js web application 
```

## System Requirements

- **Backend**: Python 3.10+
- **Frontend**: Node.js 18+ and npm
- **OS**: Windows, macOS, or Linux

## Setup & Run Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Sakshamyadav15/SwarDx.git
cd SwarDx
```

### 2. Start the Backend (FastAPI + ML)
Open a terminal and set up a Python virtual environment:
```bash
# Windows
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install core dependencies
pip install fastapi uvicorn python-multipart xgboost opensmile librosa soundfile noisereduce scikit-learn joblib numpy

# Run the API server
uvicorn api_server:app --host 0.0.0.0 --port 8000
```
*The backend API will be available at `http://localhost:8000`.*

### 3. Start the Frontend (Next.js)
Open a **new** terminal:
```bash
cd frontend
npm install
npm run dev
```
*The frontend application will be available at `http://localhost:3000`.*

---

## Direct Model Evaluation (CLI)

If you want to evaluate the model's performance directly on local audio files without the web UI, you can run the `sample.py` script. Place your testing audio files (.wav, .mp3, etc.) into the `test_audios/healthy` and `test_audios/pd` directories respectively.

```bash
# Ensure your virtual environment is activated
python sample.py
```

The script processes all audio files in the directories, extracts the OpenSMILE features, runs the XGBoost model, and outputs inference metrics including:
- Accuracy, Precision, Recall, F1-Score, Specificity, ROC-AUC
- A full Confusion Matrix
- Identifications of failed or un-parseable audio samples

---

## API Documentation

### `POST /predict`
The primary endpoint to run inference on an audio file.

**Request:**
`multipart/form-data` with a single file field named `file` (supports .wav, .mp3, .ogg, etc.).

**Response Details:**
```json
{
  "prediction": "healthy",
  "confidence": 81.24,
  "sensitivity": 71.43,
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
