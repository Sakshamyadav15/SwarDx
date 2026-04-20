# SwarDx

SwarDx is a voice-based Parkinson's disease screening prototype that combines acoustic feature engineering with an XGBoost classifier and a web interface for audio upload or microphone recording.

The project contains:
- A Python inference backend built with FastAPI.
- A Next.js frontend for recording/uploading and viewing model results.
- Trained model artifacts and feature metadata used at runtime.
- A standalone evaluation script for folder-level testing on healthy vs PD samples.

## Repository Structure

```text
.
|-- api_server.py                # FastAPI inference service
|-- sample.py                    # Predictor and test folder evaluation script
|-- opxg_model.json              # Trained XGBoost model
|-- scaler.pkl                   # Trained StandardScaler
|-- threshold.txt                # Decision threshold used in inference
|-- feature_names.csv            # Expected feature ordering
|-- feature_importance.csv       # Exported feature importance values
|-- parkinson_opxg_robust.ipynb  # Training and experimentation notebook
|-- test_audios/
|   |-- healthy/
|   `-- pd/
`-- frontend/                    # Next.js application
```

## System Architecture

1. The frontend sends an audio file to `frontend/app/api/predict/route.ts`.
2. The Next.js route proxies the upload to the Python backend `/predict` endpoint.
3. The backend loads model artifacts, preprocesses audio, extracts eGeMAPSv02 features, and runs classification.
4. The frontend renders prediction confidence, feature explainability bars, and session history.

## Requirements

### Backend
- Python 3.10+
- A virtual environment is recommended

Python packages used by inference:
- fastapi
- uvicorn
- python-multipart
- xgboost
- opensmile
- librosa
- soundfile
- noisereduce
- scikit-learn
- joblib
- numpy

### Frontend
- Node.js 18+
- npm 9+

## Local Setup

## 1) Clone repository

```bash
git clone https://github.com/Sakshamyadav15/SwarDx.git
cd SwarDx
```

## 2) Backend setup

```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -U pip
pip install fastapi uvicorn python-multipart xgboost opensmile librosa soundfile noisereduce scikit-learn joblib numpy
```

Run backend:

```bash
uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

## 3) Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` by default.

## API Reference

## `GET /health`
Returns backend readiness.

Example response:

```json
{
  "status": "ok"
}
```

## `POST /predict`
Accepts multipart upload with field name `file`.

Example response:

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

## Folder-Level Evaluation

To evaluate the model against sample files in `test_audios/healthy` and `test_audios/pd`:

```bash
# from repository root with venv activated
python sample.py
```

The script prints:
- sample counts
- accuracy, precision, recall, F1, specificity, ROC-AUC
- confusion matrix
- failed file examples (if any)

## Notes on Local-Only Files

Root helper scripts intended only for local development are excluded from version control via `.gitignore`:
- `start_backend.ps1`
- `start_frontend.ps1`

This keeps repository history clean and portable across environments.

## Disclaimer

This project is a research and screening prototype. It is not a medical diagnostic device and should not be used as a substitute for clinical evaluation by qualified healthcare professionals.
