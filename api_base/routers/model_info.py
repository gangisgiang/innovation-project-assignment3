from fastapi import APIRouter
from ..schemas.response import ModelInfoOut
from ..loaders.model_loader import get_bundle

router = APIRouter()

@router.get("/model/info", response_model=ModelInfoOut)
def model_info():
    b = get_bundle()
    return {
        "available_variants": ["rf_tfidf","xgb_tfidf","kmeans_pca"],
        "default_variant": "rf_tfidf",
        "current": "Ensemble RF+XGB (+KMeans anomaly)",
        "artifacts": b.meta.get("artifacts", []),
        "features": len(getattr(b.rf_vectorizer, "vocabulary_", {})),
        "classes": b.meta.get("classes", ["ham","spam"]),
        "version": "1.0.0"
    }