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

# Expose a debug flag in app.state (avoid using non-existent app.debug)
app.state.DEBUG = os.getenv("DEBUG", "0") in {"1", "true", "True"}

# Use uvicorn's logger if present so messages surface in the server console
logger = logging.getLogger("uvicorn.error")
if not logger.handlers:
    # Fallback basicConfig if running without uvicorn
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

# Routers
app.include_router(predict_router, tags=["Prediction"])
app.include_router(batch_router, tags=["Batch"])
app.include_router(info_router, tags=["Model Info"])
app.include_router(history_router, tags=["History"])

def _error_payload(request: Request, error: str, message: str, status_code: int, details=None):
    """
    Build a consistent error JSON body.
    """
    return {
        "error": error,                         # machine-friendly code
        "message": message,                     # human-friendly message
        "status_code": status_code,
        "path": str(request.url.path),
        "method": request.method,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "details": details,
    }

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Standardizes HTTPException responses from Starlette/FastAPI.
    """
    # exc.detail can be str or dict; normalize the outward shape
    message = exc.detail if isinstance(exc.detail, str) else "HTTP error"
    payload = _error_payload(
        request=request,
        error="http_error",
        message=message,
        status_code=exc.status_code,
        details=None if isinstance(exc.detail, str) else exc.detail,
    )
    # Only warn for 4xx, error for 5xx
    log_fn = logger.warning if 400 <= exc.status_code < 500 else logger.error
    log_fn(f"HTTPException {exc.status_code}: {message} | {request.method} {request.url}")
    return JSONResponse(status_code=exc.status_code, content=payload)

@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handles validation errors raised during request parsing/validation.
    """
    payload = _error_payload(
        request=request,
        error="validation_error",
        message="Invalid input data",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        details=exc.errors(),
    )
    logger.warning(f"Validation error: {request.method} {request.url} | {exc.errors()}")
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=payload)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for unhandled exceptions.
    """
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
