from fastapi import APIRouter

from ..schemas.response import ModelInfoOut

router = APIRouter()

@router.get("/model/info", response_model=ModelInfoOut)
def model_info():
    return {
        "available_variants":["rf_tfidf","xgb_tfidf","kmeans_pca"],
        "default_variant":"rf_tfidf",
        "current":"Mock Ensemble RF+XGB (+KMeans anomaly)",
        "artifacts":[
            "model2_random_forest.pkl",
            "model2_tfidf_vectorizer.pkl",
            "model_1_xgboost.pkl",
            "model3_kmeans.pkl",
            "model3_tfidf_vectorizer.pkl",
            "model3_pca.pkl"
        ],
        "features":0,
        "classes":["ham","spam"],
        "version":"0.1.0"
    }