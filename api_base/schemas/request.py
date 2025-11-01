from pydantic import BaseModel, Field
from typing import List

class PredictIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)

class PredictBatchIn(BaseModel):
    items: List[str] = Field(..., min_items=1, max_items=500)
