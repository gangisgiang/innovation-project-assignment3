"""
Text cleaning utilities matching the exact preprocessing used during model training.

IMPORTANT: These functions MUST match the preprocessing in data_proc_part1.ipynb
to ensure prediction accuracy. Any mismatch will cause poor model performance.
"""

import re
import html
import unicodedata

# -------------------------
# Precompiled regex patterns (matching training exactly)
# -------------------------
_RE_WS = re.compile(r"\s+")  # Collapse whitespace
_RE_URL = re.compile(r"(https?://\S+|www\.\S+)", re.I)  # URL detector
_RE_EMAIL = re.compile(r"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}", re.I)  # Email detector
_RE_NUM = re.compile(r"\b\d[\d,.\-/]*\b")  # Number detector
_RE_HTML = re.compile(r"<[^>]+>")  # HTML tags
_ALLOWED = re.compile(r"[^a-z0-9\s@#\.\<\>]")  # Whitelist characters
_RE_DASHES = re.compile(r"[\u2010-\u2015\u2212-]+")  # Unicode dashes

def _norm_unicode(s: str) -> str:
    """
    Normalize unicode to NFKC and unescape HTML entities.
    Ensures control characters (except newlines/tabs) are dropped.
    """
    s = html.unescape(str(s))
    s = unicodedata.normalize("NFKC", s).casefold()
    return "".join(ch for ch in s if (ch >= " " or ch in "\n\t"))

def clean_text(text: str) -> str:
    """
    Return a **masked, lowercased, whitespace-collapsed** string.
    
    This MUST match the preprocessing used during model training.
    
    Steps:
      1. Unicode normalize + lowercase
      2. Strip HTML tags and normalize unicode dashes
      3. Mask URLs → <url>, emails → <email>, numbers → <num>
      4. Remove non-whitelisted characters (keeps a-z, 0-9, @ # . < > and space)
      5. Collapse whitespace
    
    Examples:
        >>> clean_text("Visit HTTP://example.com NOW!!! Get $1000 FREE")
        'visit <url> now get <num> free'
        
        >>> clean_text("Email: test@spam.com to WIN!!!")
        'email <email> to win'
    """
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