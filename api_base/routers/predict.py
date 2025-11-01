from fastapi import APIRouter
from ..schemas.request import PredictIn
from ..schemas.response import PredictOut
from ..services.predict_service import predict_one

router = APIRouter()

@router.post("/predict", response_model=PredictOut)
def predict(req: PredictIn):
    return predict_one(req.text)