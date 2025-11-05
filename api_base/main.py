from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.predict import router as predict_router
from .routers.batch import router as batch_router
from .routers.model_info import router as info_router

app = FastAPI(
    title="Spam Detection API",
    description="Production-grade spam detection with ensemble models",
    version="1.0.0"
)

# Configure CORS
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
            "/docs"
        ]
    }

@app.get("/health")
def health():
    return {"status": "ok"}

# Include routers
app.include_router(predict_router, tags=["Prediction"])
app.include_router(batch_router, tags=["Batch"])
app.include_router(info_router, tags=["Model Info"])