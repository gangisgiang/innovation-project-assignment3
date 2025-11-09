# app/routers/history.py

from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Dict, Any, Literal

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field, validator

from ..schemas.response import FeatureItem, ModelScore, AnomalyOut
from ..utils.responses import success_response, error_response

import uuid

router = APIRouter(prefix="/history", tags=["History"])

HISTORY: List[Dict[str, Any]] = []

class HistoryItem(BaseModel):
    id: str
    label: Literal["spam", "ham"]
    score: float = Field(ge=0.0, le=1.0)
    text: str = ""
    timestamp: str  # ISO 8601 string with 'Z' (UTC) suffix
    reasons: List[str] = []
    explain: List[FeatureItem] = []
    action: Optional[Literal["allow", "quarantine", "block"]] = None
    ensemble: Dict[str, ModelScore] = {}
    anomaly: Optional[AnomalyOut] = None

    @validator("timestamp")
    def ensure_utc_z(cls, v: str) -> str:
        # Normalize to UTC with Z if possible
        try:
            dt = datetime.fromisoformat(v.replace("Z", "+00:00"))
            return dt.replace(tzinfo=None).isoformat(timespec="seconds") + "Z"
        except Exception:
            return v


class Feedback(BaseModel):
    """Schema for updating user feedback on a record."""
    label: Optional[Literal["spam", "ham"]] = None
    comment: Optional[str] = None  # kept for flexibility if you store it

def _parse_iso_to_dt(s: str) -> Optional[datetime]:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None


def add_history_item(
    *,
    label: Literal["spam", "ham"],
    score: float,
    text: str = "",
    reasons: Optional[List[str]] = None,
    explain: Optional[List[Dict[str, Any]]] = None,
    action: Optional[Literal["allow", "quarantine", "block"]] = None,
    ensemble: Optional[Dict[str, Any]] = None,
    anomaly: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Helper used by predict_service to add a new record to the in-memory history.
    """
    record = {
        "id": str(uuid.uuid4()),
        "label": label,
        "score": float(score),
        "text": text or "",
        "timestamp": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "reasons": reasons or [],
        "explain": explain or [],
        "action": action or None,
        "ensemble": ensemble or {},
        "anomaly": anomaly or None,
    }
    HISTORY.append(record)
    return record


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------
@router.get("/", response_model=None)
def get_history(
    # Pagination
    limit: int = Query(100, ge=1, le=1000, description="Max items to return"),
    offset: int = Query(0, ge=0, description="Items to skip before returning results"),

    # Filters
    label: Optional[Literal["spam", "ham"]] = Query(None, description="Filter by final label"),
    min_score: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum score inclusive"),
    max_score: Optional[float] = Query(None, ge=0.0, le=1.0, description="Maximum score inclusive"),
    action: Optional[Literal["allow", "quarantine", "block"]] = Query(None, description="Filter by action"),
    start_date: Optional[str] = Query(None, description="ISO datetime, e.g. 2024-01-01T00:00:00Z"),
    end_date: Optional[str] = Query(None, description="ISO datetime, e.g. 2024-12-31T23:59:59Z"),

    # Enhanced filters
    q: Optional[str] = Query(None, description="Case-insensitive substring match against 'text'"),
    reasons_any: Optional[List[str]] = Query(
        None,
        alias="reasons_any",
        description="Return items that contain ANY of these reasons (comma-separated)"
    ),

    # Sorting
    sort_by: Literal["timestamp", "score"] = Query("timestamp", description="Sort key"),
    order: Literal["asc", "desc"] = Query("desc", description="Sort order"),
):
    """
    Return filtered history with pagination and consistent API shape.

    Response:
    {
      "success": true,
      "message": "Fetched history",
      "data": {
        "items": [...HistoryItem...],
        "total": 123,
        "limit": 100,
        "offset": 0
      }
    }
    """
    # Start from newest->oldest to align with prior behavior
    data: List[Dict[str, Any]] = list(reversed(HISTORY))

    # Apply filters
    if label:
        data = [item for item in data if item.get("label") == label]

    if min_score is not None:
        data = [item for item in data if float(item.get("score", 0)) >= min_score]

    if max_score is not None:
        data = [item for item in data if float(item.get("score", 0)) <= max_score]

    if action:
        data = [item for item in data if item.get("action") == action]

    if start_date:
        start_dt = _parse_iso_to_dt(start_date)
        if start_dt is None:
            return error_response("invalid_query", "Invalid start_date format", 400)
        data = [
            item for item in data
            if _parse_iso_to_dt(item.get("timestamp", "")) and
               _parse_iso_to_dt(item["timestamp"]) >= start_dt
        ]

    if end_date:
        end_dt = _parse_iso_to_dt(end_date)
        if end_dt is None:
            return error_response("invalid_query", "Invalid end_date format", 400)
        data = [
            item for item in data
            if _parse_iso_to_dt(item.get("timestamp", "")) and
               _parse_iso_to_dt(item["timestamp"]) <= end_dt
        ]

    if q:
        q_lower = q.lower()
        data = [item for item in data if q_lower in (item.get("text") or "").lower()]

    if reasons_any:
        reasons_set = {r.strip().lower() for r in reasons_any if r and r.strip()}
        if reasons_set:
            def contains_any_reasons(it: Dict[str, Any]) -> bool:
                item_reasons = {str(r).lower() for r in (it.get("reasons") or [])}
                return bool(item_reasons & reasons_set)
            data = [item for item in data if contains_any_reasons(item)]

    # Sorting
    reverse = (order == "desc")
    if sort_by == "score":
        data.sort(key=lambda x: float(x.get("score", 0.0)), reverse=reverse)
    else:
        # sort_by == "timestamp"
        def ts_key(x: Dict[str, Any]):
            dt = _parse_iso_to_dt(x.get("timestamp", ""))
            # Use very old fallback if parsing fails so bad timestamps go last on desc
            return dt or datetime.min
        data.sort(key=ts_key, reverse=reverse)

    # Total BEFORE pagination
    total = len(data)

    # Pagination
    page_items = data[offset: offset + limit]

    # Validate to HistoryItem for safer outputs (and nice OpenAPI if used as model)
    items: List[HistoryItem] = []
    for raw in page_items:
        try:
            items.append(HistoryItem(**raw))
        except Exception:
            # If an item is malformed, skip it; alternatively, collect and return details
            continue

    return success_response(
        "Fetched history",
        data={
            "items": [i.dict() for i in items],
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_next": offset + limit < total,
            "has_prev": offset > 0,
            "page": (offset // limit) + 1,
            "total_pages": (total + limit - 1) // limit,
        }
    )


@router.delete("/{record_id}", response_model=None)
def delete_history_item(record_id: str):
    """
    Delete a single history record by its ID.
    """
    for i, item in enumerate(HISTORY):
        if item.get("id") == record_id:
            HISTORY.pop(i)
            return success_response(f"Record {record_id} deleted")
    return error_response("not_found", "Record not found", 404)


@router.put("/{record_id}", response_model=None)
def update_feedback(record_id: str, feedback: Feedback):
    """
    Update label and/or comment for an existing record.
    Note: comment is optional; persist it only if you store it on the item.
    """
    for item in HISTORY:
        if item.get("id") == record_id:
            if feedback.label is not None:
                item["label"] = feedback.label
            if feedback.comment is not None:
                # persist alongside other fields; keep schema flexible
                item["comment"] = feedback.comment
            return success_response(f"Record {record_id} updated", data=item)
    return error_response("not_found", "Record not found", 404)
