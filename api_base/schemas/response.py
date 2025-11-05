from pydantic import BaseModel
from typing import List, Literal, Dict

class FeatureItem(BaseModel):
    term: str
    weight: float

class ModelScore(BaseModel):
    label: Literal["spam", "ham"]
    score: float

class AnomalyOut(BaseModel):
    cluster: str
    ood_score: float

class PredictOut(BaseModel):
    label: Literal["spam", "ham"]
    score: float
    action: Literal["allow", "quarantine", "block"]
    reasons: List[str]
    ensemble: Dict[str, ModelScore]
    explain: List[FeatureItem]
    anomaly: AnomalyOut

    class Config:
        json_schema_extra = {
            "example": {
                "label": "spam",
                "score": 0.95,
                "action": "block",
                "reasons": ["high_score"],
                "ensemble": {
                    "rf": {"label": "spam", "score": 0.94},
                    "xgb": {"label": "spam", "score": 0.96}
                },
                "explain": [
                    {"term": "free", "weight": 0.23},
                    {"term": "win", "weight": 0.18}
                ],
                "anomaly": {
                    "cluster": "C1",
                    "ood_score": 0.2341
                }
            }
        }

class ModelInfoOut(BaseModel):
    available_variants: List[str]
    default_variant: str
    current: str
    artifacts: List[str]
    features: int
    classes: List[str]
    version: str