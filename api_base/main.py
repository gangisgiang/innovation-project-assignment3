# main.py
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import os
from datetime import datetime

from .routers.predict import router as predict_router
from .routers.batch import router as batch_router
from .routers.model_info import router as info_router
from .routers.history import router as history_router

app = FastAPI(
    title="Spam Detection API",
    description="Production-grade spam detection with ensemble models",
    version="1.0.0"
)

# Expose a debug flag in app.state
app.state.DEBUG = os.getenv("DEBUG", "0") in {"1", "true", "True"}

# Use uvicorn's logger
logger = logging.getLogger("uvicorn.error")
if not logger.handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========== Custom Exception Class ==========
class APIException(Exception):
    """Custom exception with status code and details."""
    def __init__(self, error: str, message: str, status_code: int = 400, details=None):
        self.error = error
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


# ========== Root Routes ==========
@app.get("/")
def root():
    return {
        "message": "Spam Detection API",
        "version": "1.0.0",
        "endpoints": [
            "/health",
            "/predict",
            "/predict-batch",
            "/model/info",
            "/history",
            "/docs"
        ]
    }


@app.get("/health")
def health():
    return {"status": "ok"}


# ========== Include Routers ==========
app.include_router(predict_router, tags=["Prediction"])
app.include_router(batch_router, tags=["Batch"])
app.include_router(info_router, tags=["Model Info"])
app.include_router(history_router, tags=["History"])


# ========== Error Payload Helper ==========
def _error_payload(request: Request, error: str, message: str, status_code: int, details=None):
    """Build a consistent error JSON body."""
    return {
        "success": False,
        "error": error,
        "message": message,
        "status_code": status_code,
        "path": str(request.url.path),
        "method": request.method,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "details": details,
    }


# ========== Exception Handlers ==========

@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    """Handle custom API exceptions."""
    payload = _error_payload(
        request=request,
        error=exc.error,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
    )
    log_fn = logger.warning if 400 <= exc.status_code < 500 else logger.error
    log_fn(f"APIException {exc.status_code}: {exc.message} | {request.method} {request.url}")
    return JSONResponse(status_code=exc.status_code, content=payload)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Standardize HTTPException responses from Starlette/FastAPI."""
    message = exc.detail if isinstance(exc.detail, str) else "HTTP error"
    payload = _error_payload(
        request=request,
        error="http_error",
        message=message,
        status_code=exc.status_code,
        details=None if isinstance(exc.detail, str) else exc.detail,
    )
    log_fn = logger.warning if 400 <= exc.status_code < 500 else logger.error
    log_fn(f"HTTPException {exc.status_code}: {message} | {request.method} {request.url}")
    return JSONResponse(status_code=exc.status_code, content=payload)


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with field-level details."""
    
    # Map Pydantic errors to structured details
    details = []
    for error in exc.errors():
        # Extract field name from location tuple
        field = ".".join(str(loc) for loc in error["loc"][1:]) if len(error["loc"]) > 1 else None
        
        details.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"],
            "input": error.get("input"),  # Show what was received (optional)
        })
    
    payload = _error_payload(
        request=request,
        error="validation_error",
        message=f"Invalid input: {len(details)} error(s) found",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        details=details,
    )
    
    logger.warning(f"Validation error: {request.method} {request.url} | {details}")
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=payload)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions."""
    # Log full traceback
    logger.error(f"Unhandled exception at {request.method} {request.url}", exc_info=True)

    # In debug mode, expose the str(exc). In prod, hide internal details.
    details = str(exc) if app.state.DEBUG else None

    payload = _error_payload(
        request=request,
        error="internal_server_error",
        message="An unexpected error occurred. Please try again later.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        details=details,
    )
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=payload)