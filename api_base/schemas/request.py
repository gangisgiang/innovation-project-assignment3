from pydantic import BaseModel, Field
from typing import List

class PredictIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Email text to classify")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Win FREE iPhone now! Click here immediately!"
            }
        }

class PredictBatchIn(BaseModel):
    items: List[str] = Field(..., min_items=1, max_items=500, description="List of email texts")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    "Win FREE money now!!!",
                    "Hi team, meeting at 10am tomorrow"
                ]
            }
        }