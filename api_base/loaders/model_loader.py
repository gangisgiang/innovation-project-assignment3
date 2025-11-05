from __future__ import annotations
from pathlib import Path
from typing import Any, Dict, Optional
import joblib
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Path to artifacts directory
# From api_base/loaders/model_loader.py -> ../../backend_app/artifacts
ARTIFACT_DIR = (Path(__file__).resolve().parents[2] / "backend_app" / "artifacts").resolve()

class ArtifactBundle:
    """Container for all loaded models and vectorizers"""
    
    def __init__(self) -> None:
        self.rf = None                # RandomForest model
        self.rf_vectorizer = None     # TF-IDF for RandomForest
        self.rf_scaler = None         # Scaler (optional, not used)
        
        self.xgb = None               # XGBoost model
        
        self.kmeans = None            # KMeans clustering
        self.kmeans_vectorizer = None # TF-IDF for KMeans
        self.pca = None               # PCA for KMeans
        
        self.meta: Dict[str, Any] = {}

    def ok(self) -> bool:
        """Check if all required models are loaded"""
        return all([
            self.rf is not None,
            self.rf_vectorizer is not None,
            self.xgb is not None,
            self.kmeans is not None,
            self.kmeans_vectorizer is not None,
            self.pca is not None,
        ])
        # Note: scaler is NOT required

# Global bundle instance
_BUNDLE: Optional[ArtifactBundle] = None

def _load(path: Path):
    """Load a pickle file"""
    if not path.exists():
        raise FileNotFoundError(f"Model file not found: {path}")
    logger.info(f"Loading: {path.name}")
    return joblib.load(str(path))

def load_all() -> ArtifactBundle:
    """Load all model artifacts. Idempotent - safe to call multiple times."""
    global _BUNDLE
    
    if _BUNDLE is not None:
        logger.info("Models already loaded, returning cached bundle")
        return _BUNDLE

    logger.info(f"Loading models from: {ARTIFACT_DIR}")
    
    if not ARTIFACT_DIR.exists():
        raise FileNotFoundError(f"Artifacts directory not found: {ARTIFACT_DIR}")

    bundle = ArtifactBundle()

    try:
        # Load Model 2: RandomForest + TF-IDF
        logger.info("Loading Model 2 (RandomForest)...")
        bundle.rf = _load(ARTIFACT_DIR / "model2_random_forest.pkl")
        bundle.rf_vectorizer = _load(ARTIFACT_DIR / "model2_tfidf_vectorizer.pkl")
        
        # Scaler is optional and NOT USED (causes dimension mismatch)
        scaler_path = ARTIFACT_DIR / "model2_scaler.pkl"
        if scaler_path.exists():
            try:
                bundle.rf_scaler = _load(scaler_path)
                logger.info("⚠️  Scaler loaded but NOT USED (dimension mismatch)")
            except Exception as e:
                logger.info(f"Scaler load failed (not critical): {e}")
                bundle.rf_scaler = None
        else:
            logger.info("No scaler found (this is fine)")

        # Load Model 1: XGBoost
        logger.info("Loading Model 1 (XGBoost)...")
        bundle.xgb = _load(ARTIFACT_DIR / "model_1_xgboost.pkl")

        # Load Model 3: KMeans + PCA + TF-IDF
        logger.info("Loading Model 3 (KMeans)...")
        bundle.kmeans = _load(ARTIFACT_DIR / "model3_kmeans.pkl")
        bundle.pca = _load(ARTIFACT_DIR / "model3_pca.pkl")
        bundle.kmeans_vectorizer = _load(ARTIFACT_DIR / "model3_tfidf_vectorizer.pkl")

        # Store metadata
        bundle.meta = {
            "artifacts_dir": str(ARTIFACT_DIR),
            "artifacts": sorted([p.name for p in ARTIFACT_DIR.glob("*.pkl")]),
            "has_scaler": bundle.rf_scaler is not None,
            "uses_scaler": False,  # We don't use it
            "classes": getattr(bundle.rf, "classes_", ["ham", "spam"])
        }

        if not bundle.ok():
            raise RuntimeError("Failed to load all required models")

        logger.info("✅ All models loaded successfully!")
        logger.info("ℹ️  Note: Scaler not used (Random Forest doesn't need it)")
        _BUNDLE = bundle
        return bundle

    except Exception as e:
        logger.error(f"❌ Error loading models: {e}")
        raise

def get_bundle() -> ArtifactBundle:
    """Get the loaded bundle (loads if necessary)"""
    return load_all()