from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.predict import router as predict_router
from .routers.batch import router as batch_router
from .routers.model_info import router as info_router

app = FastAPI(title="Spam Detector API (Base Mock)", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(predict_router)
app.include_router(batch_router)
app.include_router(info_router)