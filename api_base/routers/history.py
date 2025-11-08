from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

router = APIRouter(prefix="/history", tags=["History"])

# Temporary in-memory storage (non-persistent)
HISTORY: List[Dict[str, Any]] = []

class Feedback(BaseModel):
    """Schema for updating user feedback."""
    label: Optional[str] = None
    comment: Optional[str] = None

@router.get("/")
def get_history():
    """
    Return all history records, sorted by most recent first.
    Each record contains: id, label, score, text, and timestamp.
    """
    return list(reversed(HISTORY))

@router.delete("/{record_id}")
def delete_history_item(record_id: str):
    """
    Delete a single record by its ID.
    """
    global HISTORY
    for i, item in enumerate(HISTORY):
        if item["id"] == record_id:
            HISTORY.pop(i)
            return {"message": f"Record {record_id} deleted"}
    raise HTTPException(status_code=404, detail="Record not found")

@router.put("/{record_id}")
def update_feedback(record_id: str, feedback: Feedback):
    """
    Update label and/or comment for an existing record.
    """
    for item in HISTORY:
        if item["id"] == record_id:
            if feedback.label is not None:
                item["label"] = feedback.label
            if feedback.comment:
                item["comment"] = feedback.comment
            return {"message": f"Record {record_id} updated", "data": item}
    raise HTTPException(status_code=404, detail="Record not found")

def add_history_item(
    *,
    label: str,
    score: float,
    text: str = "",
    reasons: Optional[List[str]] = None,
    explain: Optional[List[Dict[str, Any]]] = None,
    action: Optional[str] = None,
    ensemble: Optional[Dict[str, Any]] = None,
    anomaly: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Helper function used by predict_service to add a new record
    to the in-memory history list.
    """
    record = {
        "id": str(uuid.uuid4()),
        "label": label,
        "score": float(score),
        "text": text,
        "timestamp": datetime.utcnow().isoformat(),
        "reasons": reasons or [],
        "explain": explain or [],
        "action": action or None,
        "ensemble": ensemble or {},
        "anomaly": anomaly or {},
    }
    HISTORY.append(record)
    return record