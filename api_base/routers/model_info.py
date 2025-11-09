# routers/model_info.py
from fastapi import APIRouter
from ..loaders.model_loader import get_bundle
import os

router = APIRouter(prefix="/model", tags=["Model Info"])

@router.get("/info")
def get_model_info():
    """
    Trả về metadata/metrics an toàn để public. 
    KHÔNG cung cấp version, training_date… trừ khi bạn muốn.
    """
    bundle = get_bundle()

    tfidf_vocab_size = getattr(bundle, "rf_vectorizer", None)
    tfidf_vocab_size = getattr(tfidf_vocab_size, "vocabulary_", None)
    tfidf_vocab_size = len(tfidf_vocab_size) if tfidf_vocab_size else None

    rf_engineered_features = 7 
    xgb_feature_count = 23  

    xgb_metrics = {
        "accuracy": 0.9495,
        "precision": 0.9717,
        "recall": 0.9212,
        "f1": 0.9458,
        "auc": 0.9960
    }
    rf_metrics = {
        "accuracy": 0.9692,
        "precision": 0.9778,
        "recall": 0.9567,
        "f1": 0.9671,
        "auc": 0.9960
    }

    tagline = "Calibrated ensemble blending pattern-based and engineered signals for dependable spam & phishing detection."

    return {
        "model_name": "SPECTER Ensemble (XGB + RandomForest)",
        "tagline": tagline,
        "tfidf_vocab_size": tfidf_vocab_size,
        "rf_engineered_features": rf_engineered_features,
        "xgb_feature_count": xgb_feature_count,
        "xgb_accuracy": xgb_metrics["accuracy"],
        "xgb_precision": xgb_metrics["precision"],
        "xgb_recall": xgb_metrics["recall"],
        "xgb_f1": xgb_metrics["f1"],
        "xgb_auc": xgb_metrics["auc"],
        "rf_accuracy": rf_metrics["accuracy"],
        "rf_precision": rf_metrics["precision"],
        "rf_recall": rf_metrics["recall"],
        "rf_f1": rf_metrics["f1"],
        "rf_auc": rf_metrics["auc"]
    }