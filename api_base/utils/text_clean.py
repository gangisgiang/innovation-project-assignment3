import re
import html
import unicodedata
_RE_WS = re.compile(r"\s+")  # Collapse whitespace
_RE_URL = re.compile(r"(https?://\S+|www\.\S+)", re.I)  # URL detector
_RE_EMAIL = re.compile(r"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}", re.I)  # Email detector
_RE_NUM = re.compile(r"\b\d[\d,.\-/]*\b")  # Number detector
_RE_HTML = re.compile(r"<[^>]+>")  # HTML tags
_ALLOWED = re.compile(r"[^a-z0-9\s@#\.\<\>]")  # Whitelist characters
_RE_DASHES = re.compile(r"[\u2010-\u2015\u2212-]+")  # Unicode dashes

def _norm_unicode(s: str) -> str:
    s = html.unescape(str(s))
    s = unicodedata.normalize("NFKC", s).casefold()
    return "".join(ch for ch in s if (ch >= " " or ch in "\n\t"))

def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    
    # Step 1: Unicode normalization and lowercase
    s = _norm_unicode(text)
    s = s.lower()
    
    # Step 2: Remove HTML and normalize dashes
    s = _RE_HTML.sub(" ", s)
    s = _RE_DASHES.sub(" ", s)
    
    # Step 3: Mask tokens (ORDER MATTERS!)
    s = _RE_URL.sub(" <url> ", s)
    s = _RE_EMAIL.sub(" <email> ", s)
    s = _RE_NUM.sub(" <num> ", s)
    
    # Step 4: Remove non-whitelisted characters
    s = _ALLOWED.sub(" ", s)
    
    # Step 5: Collapse whitespace
    s = _RE_WS.sub(" ", s).strip()
    
    return s

def basic_clean(text: str) -> str:
    """
    Alias for clean_text() to maintain compatibility.
    """
    return clean_text(text)