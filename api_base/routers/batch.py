from fastapi import APIRouter, HTTPException
from typing import List
from ..schemas.request import PredictBatchIn
from ..schemas.response import PredictOut
from ..services.predict_service import predict_batch, analyze_batch

router = APIRouter()

@router.post("/predict-batch", response_model=List[PredictOut])
def predict_batch_route(req: PredictBatchIn):
    """
    Predict on multiple email texts (batch processing).
    
    Maximum 500 items per request.
    Returns list of predictions in same order as input.
    """
    try:
        max_workers = min(8, max(2, len(req.items) // 10))
        results = predict_batch(req.items, max_workers=max_workers)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Batch prediction failed: {str(e)}"
        )


@router.post("/predict-batch/analyze")
def analyze_batch_route(req: PredictBatchIn):
    """
    Analyze a batch of messages and return comprehensive statistics.
    
    **Returns:**
    - Overview (total, spam/ham counts, avg score)
    - Score distribution
    - Model agreement analysis
    - Action recommendations
    - Top spam indicators
    """
    try:
        max_workers = min(8, max(2, len(req.items) // 10))
        analysis = analyze_batch(req.items, max_workers=max_workers)
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Batch analysis failed: {str(e)}"
        )