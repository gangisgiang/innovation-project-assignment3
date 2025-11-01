import re

_WS_RE = re.compile(r"\s+")

def basic_clean(text: str) -> str:
    """
    Very light cleaning: lowercase, strip, collapse whitespace.
    Keep it minimal to match training preprocessing assumptions.
    """
    if text is None:
        return ""
    t = text.strip().lower()
    t = _WS_RE.sub(" ", t)
    return t