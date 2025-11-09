from fastapi.responses import JSONResponse
from typing import Any, List, Optional
from ..schemas.response import SuccessResponse, ErrorResponse, ErrorDetail


def success_response(
    message: str,
    data: Optional[Any] = None,
    status_code: int = 200,
) -> JSONResponse:
    """
    Standardized success response for all endpoints.
    """
    payload = SuccessResponse(message=message, data=data)
    return JSONResponse(status_code=status_code, content=payload.dict())


def error_response(
    error: str,
    message: str,
    status_code: int,
    details: Optional[List[dict | ErrorDetail]] = None,
) -> JSONResponse:
    """
    Standardized error response.
    Accepts either a list of dicts or ErrorDetail objects in `details`.
    """
    # Normalize details list
    normalized_details = []
    if details:
        for d in details:
            if isinstance(d, ErrorDetail):
                normalized_details.append(d.dict())
            elif isinstance(d, dict):
                normalized_details.append(d)
            else:
                normalized_details.append({"message": str(d)})

    payload = ErrorResponse(
        error=error,
        message=message,
        details=normalized_details or None,
        status_code=status_code,
    )
    return JSONResponse(status_code=status_code, content=payload.dict())