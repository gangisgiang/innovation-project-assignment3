from fastapi import APIRouter, HTTPException
from ..schemas.response import ModelInfoOut
from ..loaders.model_loader import get_bundle

router = APIRouter()

@router.get("/model/info", response_model=ModelInfoOut)
def model_info():
    try:
        bundle = get_bundle()
        
        # Get feature count from vectorizer vocabulary
        vocab_size = len(getattr(bundle.rf_vectorizer, "vocabulary_", {}))
        
        return {
            "available_variants": ["rf_tfidf", "xgb_tfidf", "kmeans_pca"],
            "default_variant": "ensemble_rf_xgb",
            "current": "Ensemble: Random Forest + XGBoost (+ K-Means anomaly)",
            "artifacts": bundle.meta.get("artifacts", []),
            "features": vocab_size,
            "classes": bundle.meta.get("classes", ["ham", "spam"]),
            "version": "1.0.0"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get model info: {str(e)}"
        )