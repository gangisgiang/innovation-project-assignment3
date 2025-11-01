from fastapi import APIRouter
from typing import List
from ..schemas.request import PredictBatchIn
from ..schemas.response import PredictOut
from ..services.predict_service import predict_batch

router = APIRouter()

@router.post("/predict-batch", response_model=List[PredictOut])
def predict_batch_route(req: PredictBatchIn):
    return predict_batch(req.items)