from __future__ import annotations
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import joblib

# Resolve artifacts dir: <project-root>/backend_app/artifacts
# (api_base/loaders/model_loader.py -> .. -> .. -> project root)
ARTIFACT_DIR = (Path(__file__).resolve().parents[2] / "backend_app" / "artifacts").resolve()

class ArtifactBundle:
    """
    Holds all loaded models/vectorizers so we load once and reuse.
    """
    def __init__(self) -> None:
        self.rf = None                # RandomForest model2
        self.rf_vectorizer = None     # TF-IDF for model2
        self.rf_scaler = None         # optional scaler for model2

        self.xgb = None               # XGBoost model1
        # Assumption: model1 uses same TF-IDF features as model2.
        # If your model1 used a different vectorizer, add and load it here.

        self.kmeans = None            # KMeans (model3)
        self.kmeans_vectorizer = None # TF-IDF for model3
        self.pca = None               # PCA for model3

        self.meta: Dict[str, Any] = {}

    def ok(self) -> bool:
        return all([
            self.rf is not None,
            self.rf_vectorizer is not None,
            self.xgb is not None,
            self.kmeans is not None,
            self.kmeans_vectorizer is not None,
            self.pca is not None,
        ])

_BUNDLE: Optional[ArtifactBundle] = None

def _load(path: Path):
    return joblib.load(str(path))

def load_all() -> ArtifactBundle:
    """
    Load every artifact we need into memory.
    Idempotent — safe to call multiple times.
    """
    global _BUNDLE
    if _BUNDLE is not None:
        return _BUNDLE

    bundle = ArtifactBundle()

    # --- Model 2: RandomForest + TF-IDF (+ optional scaler)
    rf_path  = ARTIFACT_DIR / "model2_random_forest.pkl"
    rf_vec   = ARTIFACT_DIR / "model2_tfidf_vectorizer.pkl"
    rf_scal  = ARTIFACT_DIR / "model2_scaler.pkl"     # may or may not exist

    bundle.rf = _load(rf_path)
    bundle.rf_vectorizer = _load(rf_vec)
    if rf_scal.exists():
        try:
            bundle.rf_scaler = _load(rf_scal)
        except Exception:
            bundle.rf_scaler = None

    # --- Model 1: XGBoost classifier
    xgb_path = ARTIFACT_DIR / "model_1_xgboost.pkl"
    bundle.xgb = _load(xgb_path)

    # --- Model 3: KMeans + PCA + TF-IDF
    km_path   = ARTIFACT_DIR / "model3_kmeans.pkl"
    pca_path  = ARTIFACT_DIR / "model3_pca.pkl"
    km_vec    = ARTIFACT_DIR / "model3_tfidf_vectorizer.pkl"

    bundle.kmeans = _load(km_path)
    bundle.pca = _load(pca_path)
    bundle.kmeans_vectorizer = _load(km_vec)

    bundle.meta = {
        "artifacts_dir": str(ARTIFACT_DIR),
        "artifacts": sorted([p.name for p in ARTIFACT_DIR.glob("*.pkl")]),
        "has_scaler": bundle.rf_scaler is not None,
        "classes": getattr(bundle.rf, "classes_", ["ham", "spam"])
    }

    _BUNDLE = bundle
    return bundle

def get_bundle() -> ArtifactBundle:
    return load_all()