from fastapi import APIRouter

from ..schemas.request import PredictIn
from ..schemas.response import PredictOut

router = APIRouter()

MOCK = {
    "label": "spam",
    "score": 0.92,
    "action": "block",
    "reasons": ["high_score"],
    "ensemble": {
        "rf": {"label": "spam", "score": 0.95},
        "xgb": {"label": "spam", "score": 0.88}
    },
    "explain": [{"term":"free","weight":0.83},{"term":"offer","weight":0.72}],
    "anomaly": {"cluster":"C2","ood_score":0.18}
}

@router.post("/predict", response_model=PredictOut)
def predict(req: PredictIn):
    return MOCK