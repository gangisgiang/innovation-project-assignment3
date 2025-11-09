# app/schemas/response.py

from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel

class FeatureItem(BaseModel):
    """A single feature contribution used for explainability (e.g., SHAP/weights)."""
    term: str
    weight: float


class ModelScore(BaseModel):
    """Per-model label and score in an ensemble."""
    label: Literal["spam", "ham"]
    score: float


class AnomalyOut(BaseModel):
    """Out-of-distribution / clustering info for anomaly detection."""
    cluster: str
    ood_score: float


class PredictOut(BaseModel):
    """
    Final prediction result returned by the classifier.
    Includes overall label/score, action, reasons, per-model ensemble votes, explainability, and anomaly info.
    """
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
    """Metadata about available models/variants and artifacts."""
    available_variants: List[str]
    default_variant: str
    current: str
    artifacts: List[str]
    features: int
    classes: List[str]
    version: str


class Overview(BaseModel):
    """High-level overview stats for a batch."""
    total_messages: int
    spam_count: int
    ham_count: int
    avg_score: float


class ModelAgreement(BaseModel):
    """Agreement/disagreement counts across ensemble models."""
    agree: int
    disagree: int
    agreement_rate: float


class AnalyzeOut(BaseModel):
    """
    Aggregated analytics for a batch prediction.
    - score_distribution: histogram-like counts keyed by bucket label or range
    - actions/reasons: counts per action/reason
    - top_spam_indicators: highest-weighted indicative features
    """
    overview: Overview
    score_distribution: Dict[str, int]
    model_agreement: ModelAgreement
    actions: Dict[str, int]
    reasons: Dict[str, int]
    top_spam_indicators: List[FeatureItem]


# -----------------------------------------------------------------------------
# Standardized success & error wrappers
# -----------------------------------------------------------------------------

class ErrorDetail(BaseModel):
    """
    A single error detail entry, typically mapped from Pydantic/validation errors.
    - field: the specific field (last element of 'loc') if available
    - message: human-readable error message
    - type: machine-readable error type (e.g., 'value_error')
    """
    field: Optional[str] = None
    message: str
    type: Optional[str] = None


class ErrorResponse(BaseModel):
    """
    Standardized error payload so the frontend can parse uniformly.
    """
    error: str            # Machine-friendly error code/type
    message: str          # Human-readable message
    details: Optional[List[ErrorDetail]] = None
    status_code: int

    class Config:
        json_schema_extra = {
            "example": {
                "error": "validation_error",
                "message": "Invalid input provided",
                "details": [
                    {
                        "field": "text",
                        "message": "Text cannot be empty",
                        "type": "value_error"
                    }
                ],
                "status_code": 422
            }
        }


class SuccessResponse(BaseModel):
    """
    Generic success wrapper that can carry any domain-specific 'data' payload,
    e.g., PredictOut, AnalyzeOut, lists, etc.
    """
    success: bool = True
    message: str
    data: Optional[Any] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Prediction successful",
                "data": {
                    "label": "ham",
                    "score": 0.07,
                    "action": "allow",
                    "reasons": ["low_score"],
                    "ensemble": {
                        "rf": {"label": "ham", "score": 0.08},
                        "xgb": {"label": "ham", "score": 0.06}
                    },
                    "explain": [
                        {"term": "invoice", "weight": -0.12},
                        {"term": "meeting", "weight": -0.09}
                    ],
                    "anomaly": {
                        "cluster": "C3",
                        "ood_score": 0.0311
                    }
                }
            }
        }