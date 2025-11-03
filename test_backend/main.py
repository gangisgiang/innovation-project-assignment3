from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from model import SimpleModel
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # URL of React application
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = SimpleModel()

class PredictRequest(BaseModel):
    input_text: str

@app.get("/")
async def root():
    return {"message": "Welcome to the Spam Prediction Model API"}

@app.post("/predict")
async def predict_spam(req: PredictRequest):
    try:
        prediction = model.predict(req.input_text)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Model not available on server")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")

    label = "Ham" if int(prediction) == 0 else "Spam"
    return {"predicted_spam": label, "raw_prediction": int(prediction)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)