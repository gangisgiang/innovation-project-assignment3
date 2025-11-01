from fastapi import APIRouter

from ..schemas.request import PredictBatchIn
from ..schemas.response import PredictOut

from typing import List

router = APIRouter()

ROW1 = {
    "label": "spam",
    "score": 0.98,
    "action": "block",
    "reasons": ["high_score"],
    "ensemble": {"rf":{"label":"spam","score":0.99},"xgb":{"label":"spam","score":0.96}},
    "explain":[{"term":"free","weight":0.91}],
    "anomaly":{"cluster":"C0","ood_score":0.12}
}
ROW2 = {
    "label":"ham",
    "score":0.07,
    "action":"allow",
    "reasons":["low_score"],
    "ensemble":{"rf":{"label":"ham","score":0.03},"xgb":{"label":"ham","score":0.11}},
    "explain":[],
    "anomaly":{"cluster":"C1","ood_score":0.09}
}

@router.post("/predict-batch", response_model=List[PredictOut])
def predict_batch(req: PredictBatchIn):
    out = []
    for i, _ in enumerate(req.items):
        out.append(ROW1 if i % 2 == 0 else ROW2)
    return out