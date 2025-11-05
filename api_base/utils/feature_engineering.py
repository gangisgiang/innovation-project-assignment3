import re
import numpy as np

# Reuse regex patterns from text_clean
from .text_clean import _RE_EMAIL, _RE_URL

# Additional patterns for feature engineering
_RE_PHONE = re.compile(r"\b(?:\+?\d[\s\-()]?){6,}\b")
_RE_MONEY = re.compile(r"(?:usd|aud|eur|gbp|vnd|rm|idr|sgd|rs|inr)\b|[$€£¥₫₩₹]", re.I)
_RE_AMOUNT = re.compile(r"(?:[$€£¥₫₩₹]\s*\d[\d,\.]*|\b\d[\d,\.]*\s*(?:usd|aud|eur|gbp|vnd|rm|idr|sgd|rs|inr)\b)", re.I)

# CTA words
_CTA_WORDS = {
    "click", "verify", "update", "confirm", "login", "password", "account",
    "win", "winner", "prize", "free", "offer", "deal", "limited", "urgent", "now"
}

def _ratio(num, denom):
    """Safe division"""
    return num / denom if denom > 0 else 0.0

def _tokenize(text):
    """Simple whitespace tokenizer"""
    return text.split()

def extract_features(raw_text: str, cleaned_text: str) -> np.ndarray:
    # Basic counts
    text_length = len(cleaned_text)
    tokens = _tokenize(cleaned_text)
    word_count = len(tokens)
    
    # URL count
    url_count = len(re.findall(r"http\S+|www\S+", raw_text))
    has_url = 1 if url_count > 0 else 0
    
    # Currency mentioned
    currency_mentioned = 1 if _RE_MONEY.search(raw_text) else 0
    
    # Exclamation count
    exclamation_count = raw_text.count("!")
    
    # Digit ratio
    digit_ratio = _ratio(sum(ch.isdigit() for ch in raw_text), len(raw_text)) if raw_text else 0.0
    
    # Return as numpy array
    features = np.array([
        text_length,
        word_count,
        url_count,
        has_url,
        currency_mentioned,
        exclamation_count,
        digit_ratio
    ], dtype=np.float64)
    
    return features