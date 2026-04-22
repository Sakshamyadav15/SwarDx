from __future__ import annotations

import os
import tempfile
from contextlib import suppress
from pathlib import Path
import sys
import numpy

# Compatibility shim for Numpy 2.0 pickle loading in Numpy 1.x
if not hasattr(numpy, "_core"):
    try:
        import numpy.core as core
        sys.modules["numpy._core"] = core
    except ImportError:
        sys.modules["numpy._core"] = numpy

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from sample import VoicePDPredictor

app = FastAPI(title="VoicePD Inference API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = VoicePDPredictor(
    model_path="opxg_model.json",
    scaler_path="scaler.pkl",
    threshold_path="threshold.txt",
    feature_names_path="feature_names.csv",
)


def _confidence_percent(pd_prob: float, label: str) -> float:
    healthy_prob = 1.0 - pd_prob
    if label == "Parkinsons":
        return round(pd_prob * 100.0, 2)
    return round(healthy_prob * 100.0, 2)


def _feature_breakdown(pd_prob: float) -> dict[str, float]:
    # Lightweight deterministic proxy values for UI explainability bars.
    # This keeps the existing template untouched while backend integration is added.
    vocal = max(15.0, min(85.0, 35.0 + pd_prob * 45.0))
    pitch = max(10.0, min(80.0, 50.0 - pd_prob * 25.0))
    temporal = max(10.0, min(80.0, 55.0 - pd_prob * 20.0))
    return {
        "vocalStability": round(vocal, 1),
        "pitchVariation": round(pitch, 1),
        "temporalConsistency": round(temporal, 1),
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict:
    suffix = Path(file.filename or "audio.wav").suffix or ".wav"

    tmp_path = None
    try:
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(data)
            tmp_path = tmp.name

        result = predictor.predict(tmp_path)
        if result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])

        label = result["label"]
        pd_prob = float(result["probability"])
        prediction = "parkinsons" if label == "Parkinsons" else "healthy"

        return {
            "prediction": prediction,
            "confidence": _confidence_percent(pd_prob, label),
            "sensitivity": 71.43,
            "specificity": 77.78,
            "features": _feature_breakdown(pd_prob),
            "raw": {
                "label": label,
                "pd_probability": round(pd_prob, 6),
                "threshold": predictor.threshold,
            },
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        if tmp_path:
            with suppress(OSError):
                os.unlink(tmp_path)
