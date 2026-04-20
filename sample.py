import os
import tempfile
import warnings
from pathlib import Path

import joblib
import librosa
import noisereduce as nr
import numpy as np
import opensmile
import soundfile as sf
import xgboost as xgb
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

warnings.filterwarnings("ignore")

# Audio configuration must match training pipeline.
TARGET_SR = 16000
MIN_DURATION_S = 1.5
MAX_DURATION_S = 12.0
TOP_DB = 30
NOISE_REDUCE = True

smile = opensmile.Smile(
    feature_set=opensmile.FeatureSet.eGeMAPSv02,
    feature_level=opensmile.FeatureLevel.Functionals,
)


def load_and_preprocess(file_path, augment=False):
    """Load and preprocess audio with the same steps used in training."""
    try:
        audio, sr = librosa.load(file_path, sr=None, mono=True)

        if sr != TARGET_SR:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=TARGET_SR)

        peak = np.max(np.abs(audio))
        if peak > 0:
            audio = audio / peak

        audio, _ = librosa.effects.trim(audio, top_db=TOP_DB)

        duration = len(audio) / TARGET_SR
        if duration < MIN_DURATION_S:
            return None
        if duration > MAX_DURATION_S:
            max_samples = int(MAX_DURATION_S * TARGET_SR)
            start = (len(audio) - max_samples) // 2
            audio = audio[start : start + max_samples]

        if NOISE_REDUCE:
            noise_sample_len = min(int(0.3 * TARGET_SR), len(audio))
            if noise_sample_len > 0:
                noise_profile = audio[:noise_sample_len]
                audio = nr.reduce_noise(
                    y=audio,
                    sr=TARGET_SR,
                    y_noise=noise_profile,
                    prop_decrease=0.75,
                    stationary=False,
                )

        # Kept for API compatibility with the notebook pipeline.
        _ = augment
        return audio
    except Exception:
        return None


def extract_features(audio_array, sr=TARGET_SR):
    """Extract eGeMAPSv02 features from a preprocessed audio numpy array."""
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = tmp.name

        sf.write(tmp_path, audio_array, sr, subtype="PCM_16")
        df = smile.process_file(tmp_path)
        return df.values.flatten().astype(np.float32)
    except Exception:
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


class VoicePDPredictor:
    def __init__(
        self,
        model_path="opxg_model.json",
        scaler_path="scaler.pkl",
        threshold_path="threshold.txt",
        feature_names_path="feature_names.csv",
    ):
        self.model = xgb.XGBClassifier()
        self.model.load_model(model_path)
        self.scaler = joblib.load(scaler_path)

        with open(threshold_path, "r", encoding="utf-8") as f:
            self.threshold = float(f.read().strip())

        self.expected_feature_count = sum(1 for _ in open(feature_names_path, "r", encoding="utf-8"))

        print(f"VoicePDPredictor loaded | threshold={self.threshold:.4f}")

    def predict(self, file_path):
        audio = load_and_preprocess(file_path, augment=False)
        if audio is None:
            return {"error": "preprocessing_failed"}

        features = extract_features(audio)
        if features is None:
            return {"error": "feature_extraction_failed"}

        if features.shape[0] != self.expected_feature_count:
            return {"error": f"feature_mismatch_{features.shape[0]}"}

        features = np.nan_to_num(features, nan=0.0).reshape(1, -1)
        features_scaled = self.scaler.transform(features)

        prob = float(self.model.predict_proba(features_scaled)[0][1])
        label = "Parkinsons" if prob >= self.threshold else "Healthy"
        return {"label": label, "probability": prob, "error": None}


def _collect_audio_files(folder):
    exts = {".wav", ".mp3", ".ogg", ".flac", ".m4a"}
    return sorted([p for p in Path(folder).rglob("*") if p.suffix.lower() in exts])


def evaluate_test_folders(predictor, base_dir="test_audios"):
    healthy_files = _collect_audio_files(Path(base_dir) / "healthy")
    pd_files = _collect_audio_files(Path(base_dir) / "pd")

    y_true = []
    y_pred = []
    y_prob = []
    failed = []

    for file_path in healthy_files:
        result = predictor.predict(str(file_path))
        if result["error"]:
            failed.append((str(file_path), result["error"]))
            continue
        y_true.append(0)
        y_pred.append(1 if result["label"] == "Parkinsons" else 0)
        y_prob.append(result["probability"])

    for file_path in pd_files:
        result = predictor.predict(str(file_path))
        if result["error"]:
            failed.append((str(file_path), result["error"]))
            continue
        y_true.append(1)
        y_pred.append(1 if result["label"] == "Parkinsons" else 0)
        y_prob.append(result["probability"])

    if not y_true:
        raise RuntimeError("No valid audio files were processed.")

    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()

    metrics = {
        "healthy_total": len(healthy_files),
        "pd_total": len(pd_files),
        "used_samples": len(y_true),
        "failed_samples": len(failed),
        "accuracy": accuracy_score(y_true, y_pred),
        "precision_pd": precision_score(y_true, y_pred, zero_division=0),
        "recall_pd": recall_score(y_true, y_pred, zero_division=0),
        "f1_pd": f1_score(y_true, y_pred, zero_division=0),
        "specificity_healthy": (tn / (tn + fp)) if (tn + fp) > 0 else 0.0,
        "roc_auc": roc_auc_score(y_true, y_prob) if len(set(y_true)) > 1 else float("nan"),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "failed_examples": failed[:10],
    }
    return metrics


if __name__ == "__main__":
    predictor = VoicePDPredictor(
        model_path="opxg_model.json",
        scaler_path="scaler.pkl",
        threshold_path="threshold.txt",
        feature_names_path="feature_names.csv",
    )

    metrics = evaluate_test_folders(predictor, base_dir="test_audios")

    print("\n=== Inference Metrics on test_audios ===")
    print(f"Healthy files        : {metrics['healthy_total']}")
    print(f"PD files             : {metrics['pd_total']}")
    print(f"Used samples         : {metrics['used_samples']}")
    print(f"Failed samples       : {metrics['failed_samples']}")
    print(f"Accuracy             : {metrics['accuracy']:.4f}")
    print(f"Precision (PD)       : {metrics['precision_pd']:.4f}")
    print(f"Recall (PD)          : {metrics['recall_pd']:.4f}")
    print(f"F1-score (PD)        : {metrics['f1_pd']:.4f}")
    print(f"Specificity (Healthy): {metrics['specificity_healthy']:.4f}")
    print(f"ROC-AUC              : {metrics['roc_auc']:.4f}")

    cm = metrics["confusion_matrix"]
    print(
        "Confusion Matrix [Healthy=0, PD=1] -> "
        f"TN={cm['tn']} FP={cm['fp']} FN={cm['fn']} TP={cm['tp']}"
    )

    if metrics["failed_examples"]:
        print("\nFailed examples (up to 10):")
        for path, error in metrics["failed_examples"]:
            print(f"  {path} -> {error}")