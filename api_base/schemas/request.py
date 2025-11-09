from pydantic import BaseModel, Field, validator
from typing import List, Optional

class PredictIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Email text to classify")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Win FREE iPhone now! Click here immediately!"
            }
        }

class PredictBatchIn(BaseModel):
    items: List[str] = Field(..., min_length=1, max_length=500)
    
    @validator('items')
    def validate_items(cls, v):
        for i, item in enumerate(v):
            if not isinstance(item, str):
                raise ValueError(f"Item {i} must be a string")
            if len(item) == 0:
                raise ValueError(f"Item {i} cannot be empty")
            if len(item) > 10000:
                raise ValueError(f"Item {i} exceeds 10,000 character limit")
        
        # ✅ NEW: Check total batch size
        total_chars = sum(len(item) for item in v)
        if total_chars > 1_000_000:  # 1MB limit
            raise ValueError(
                f"Total batch size ({total_chars:,} chars) exceeds 1MB limit"
            )  
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    "Win FREE money now!!!",
                    "Hi team, meeting at 10am tomorrow",
                    "URGENT: Your account has been suspended"
                ]
            }
        }


class PredictBatchWithIndicesIn(BaseModel):
    """Batch prediction with custom indices (e.g., database IDs)"""
    items: List[str] = Field(
        ..., 
        min_length=1, 
        max_length=500, 
        description="List of texts"
    )
    indices: List[int] = Field(
        ...,
        description="List of custom indices (must match items length)"
    )

    @validator('indices')
    def validate_indices(cls, v, values):
        if 'items' in values and len(v) != len(values['items']):
            raise ValueError("Length of indices must match length of items")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "items": ["Spam message", "Ham message"],
                "indices": [1001, 1002]
            }
        }


class PredictBatchFilteredIn(BaseModel):
    """Batch prediction with filtering options"""
    items: List[str] = Field(..., min_length=1, max_length=500)
    label: Optional[str] = Field(None, description="Filter by 'spam' or 'ham'")
    min_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Minimum score")
    max_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Maximum score")

    @validator('label')
    def validate_label(cls, v):
        if v is not None and v not in ['spam', 'ham']:
            raise ValueError("label must be 'spam' or 'ham'")
        return v

    @validator('max_score')
    def validate_score_range(cls, v, values):
        if v is not None and 'min_score' in values and values['min_score'] is not None:
            if v < values['min_score']:
                raise ValueError("max_score must be >= min_score")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "items": ["Message 1", "Message 2", "Message 3"],
                "label": "spam",
                "min_score": 0.8
            }
        }

class BulkPredictIn(BaseModel):
    """For very large batches (will be processed in chunks)"""
    items: List[str] = Field(
        ..., 
        min_length=1, 
        max_length=10000,
        description="Large list of texts (will be chunked automatically)"
    )
    chunk_size: int = Field(
        default=100,
        ge=10,
        le=500,
        description="Size of processing chunks"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "items": ["Text 1", "Text 2", "..."],
                "chunk_size": 100
            }
        }

class AnalyzeBatchIn(BaseModel):
    """Request for batch analysis"""
    items: List[str] = Field(..., min_length=1, max_length=1000)
    include_predictions: bool = Field(
        default=False,
        description="Include full prediction objects in response"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "items": ["Message 1", "Message 2", "..."],
                "include_predictions": False
            }
        }