from fastapi import APIRouter, Query
from typing import List
import logging

from ..schemas.request import PredictBatchIn
from ..schemas.response import PredictOut, AnalyzeOut
from ..services.predict_service import predict_batch, analyze_batch
from ..utils.responses import success_response, error_response

router = APIRouter(prefix="/predict-batch", tags=["Batch"])
logger = logging.getLogger(__name__)


@router.post("", response_model=None)
def predict_batch_route(
    req: PredictBatchIn,
    wrap: bool = Query(False, description="Return unified {success,message,data} if true; raw array otherwise"),
):
    """
    Run batch prediction on multiple email texts.

    - Default (wrap=false): returns RAW `List[PredictOut]` for backward compatibility with existing frontend
    - wrap=true: returns standardized SuccessResponse { success, message, data }
    """
    try:
        max_workers = min(8, max(2, len(req.items) // 10))
        results: List[PredictOut] = predict_batch(req.items, max_workers=max_workers)

        if wrap:
            return success_response("Batch prediction completed", data=results)
        # Legacy raw shape (keeps current BatchCharts.js working)
        return results

    except Exception as e:
        logger.exception("Batch prediction failed")
        # Keep error shape standardized; frontend typically only checks !ok for errors
        return error_response("batch_prediction_failed", str(e), 500)


@router.post("/analyze", response_model=None)
def analyze_batch_route(
    req: PredictBatchIn,
    wrap: bool = Query(False, description="Return unified {success,message,data} if true; raw object otherwise"),
):
    """
    Analyze a batch of messages and return aggregated statistics.

    - Default (wrap=false): returns RAW `AnalyzeOut` dict (legacy shape)
    - wrap=true: returns standardized SuccessResponse { success, message, data }
    """
    try:
        max_workers = min(8, max(2, len(req.items) // 10))
        analysis: AnalyzeOut = analyze_batch(req.items, max_workers=max_workers)

        if wrap:
            return success_response("Batch analysis completed", data=analysis)
        # Legacy raw shape (keeps current BatchCharts.js working)
        return analysis

    except Exception as e:
        logger.exception("Batch analysis failed")
        return error_response("batch_analysis_failed", str(e), 500)