from fastapi import APIRouter, HTTPException
from typing import List
from ..schemas.request import PredictBatchIn
from ..schemas.response import PredictOut
from ..services.predict_service import predict_batch

router = APIRouter()

@router.post("/predict-batch", response_model=List[PredictOut])
def predict_batch_route(req: PredictBatchIn):
    try:
        results = predict_batch(req.items)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Batch prediction failed: {str(e)}"
        )