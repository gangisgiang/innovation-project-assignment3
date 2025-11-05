from __future__ import annotations
from typing import Dict, List, Tuple
import numpy as np
import scipy.sparse as sp
import logging

from ..loaders.model_loader import get_bundle
from ..utils.text_clean import clean_text
from ..utils.feature_engineering import extract_features

logger = logging.getLogger(__name__)

import re

def extract_23_features(text: str) -> np.ndarray:
    if not text or not isinstance(text, str):
        text = ""
    
    cleaned_text = text.lower().strip()
    
    # 1. text_length
    text_length = len(text)
    
    # 2. word_count
    words = text.split()
    word_count = len(words)
    
    # 3. url_count
    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    url_count = len(re.findall(url_pattern, text, re.IGNORECASE))
    
    # 4. email_count
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email_count = len(re.findall(email_pattern, text))
    
    # 5. phone_count
    phone_pattern = r'(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}'
    phone_count = len(re.findall(phone_pattern, text))
    
    # 6. has_url
    has_url = 1 if url_count > 0 else 0
    
    # 7. has_email
    has_email = 1 if email_count > 0 else 0
    
    # 8. currency_mentioned
    currency_symbols = ['$', '€', '£', '¥', '₹', 'usd', 'eur', 'gbp', 'dollar', 'aud', 'vnd', 'rm', 'idr', 'sgd', 'rs', 'inr']
    currency_mentioned = 1 if any(sym in cleaned_text for sym in currency_symbols) else 0
    
    # 9. amount_mentioned
    amount_pattern = r'\$\d+|\d+\s*(?:dollar|usd|euro|pound|aud)'
    amount_mentioned = 1 if re.search(amount_pattern, cleaned_text) else 0
    
    # 10. exclamation_count
    exclamation_count = text.count('!')
    
    # 11. question_count
    question_count = text.count('?')
    
    # 12. excess_punct_count (multiple consecutive punctuation)
    excess_punct_pattern = r'[!?.]{2,}'
    excess_punct_count = len(re.findall(excess_punct_pattern, text))
    
    # 13. repeated_char_max (maximum sequence of repeated characters)
    repeated_char_max = 0
    if text:
        current_char = text[0]
        current_count = 1
        for char in text[1:]:
            if char == current_char and char.isalnum():
                current_count += 1
            else:
                repeated_char_max = max(repeated_char_max, current_count)
                current_char = char
                current_count = 1
        repeated_char_max = max(repeated_char_max, current_count)
    
    # 14. all_caps_word_ratio
    if word_count > 0:
        caps_words = sum(1 for word in words if word.isupper() and len(word) > 1)
        all_caps_word_ratio = caps_words / word_count
    else:
        all_caps_word_ratio = 0.0
    
    # 15. digit_ratio
    if text_length > 0:
        digit_count = sum(1 for char in text if char.isdigit())
        digit_ratio = digit_count / text_length
    else:
        digit_ratio = 0.0
    
    # 16. symbol_ratio
    if text_length > 0:
        symbol_count = sum(1 for char in text if not char.isalnum() and not char.isspace())
        symbol_ratio = symbol_count / text_length
    else:
        symbol_ratio = 0.0
    
    # 17. avg_token_len
    if word_count > 0:
        avg_token_len = sum(len(word) for word in words) / word_count
    else:
        avg_token_len = 0.0
    
    # 18. unique_token_ratio
    if word_count > 0:
        unique_words = len(set(word.lower() for word in words))
        unique_token_ratio = unique_words / word_count
    else:
        unique_token_ratio = 0.0
    
    # 19. starts_with_greeting
    greetings = ['hi', 'hello', 'dear', 'hey', 'greetings']
    starts_with_greeting = 1 if any(cleaned_text.startswith(g) for g in greetings) else 0
    
    # 20. ends_with_thanks
    thanks_words = ['thanks', 'thank you', 'regards', 'sincerely', 'best regards']
    ends_with_thanks = 1 if any(cleaned_text.endswith(t) for t in thanks_words) else 0
    
    # 21. cta_keyword_count (Call-to-Action)
    cta_keywords = [
        'click', 'call', 'buy', 'order', 'visit', 'download', 'subscribe',
        'register', 'sign up', 'act now', 'limited time', 'hurry', 'today'
    ]
    cta_keyword_count = sum(1 for keyword in cta_keywords if keyword in cleaned_text)
    
    # 22. spam_keyword_count
    spam_keywords = [
        'free', 'winner', 'won', 'prize', 'congratulations', 'claim',
        'urgent', 'act now', 'limited offer', 'guaranteed', 'cash',
        'money back', 'no obligation', 'risk free', 'discount'
    ]
    spam_keyword_count = sum(1 for keyword in spam_keywords if keyword in cleaned_text)
    
    # 23. phishing_keyword_count
    phishing_keywords = [
        'verify', 'confirm', 'account', 'suspended', 'locked', 'security',
        'update', 'password', 'login', 'credentials', 'expire', 'validate',
        'authenticate', 'ssn', 'social security', 'bank account'
    ]
    phishing_keyword_count = sum(1 for keyword in phishing_keywords if keyword in cleaned_text)
    
    # Combine all features in the correct order
    features = np.array([[
        text_length,
        word_count,
        url_count,
        email_count,
        phone_count,
        has_url,
        has_email,
        currency_mentioned,
        amount_mentioned,
        exclamation_count,
        question_count,
        excess_punct_count,
        repeated_char_max,
        all_caps_word_ratio,
        digit_ratio,
        symbol_ratio,
        avg_token_len,
        unique_token_ratio,
        starts_with_greeting,
        ends_with_thanks,
        cta_keyword_count,
        spam_keyword_count,
        phishing_keyword_count
    ]], dtype=np.float32)
    
    return features

def decide_action(score: float) -> str:
    """Map spam probability score to action recommendation"""
    if score >= 0.85:
        return "block"      # Very confident spam
    if score >= 0.5:
        return "quarantine" # Medium confidence
    return "allow"          # Likely legitimate

def _rf_predict(raw_text: str, clean_text_str: str, bundle) -> Tuple[str, float]:
    vec = bundle.rf_vectorizer
    
    # Get TF-IDF features (3000 dimensions)
    X_tfidf = vec.transform([clean_text_str])  # sparse matrix (1, 3000)
    
    # Get engineered features (7 dimensions)
    extra_feats = extract_features(raw_text, clean_text_str)  # array (7,)
    extra_feats = extra_feats.reshape(1, -1)  # (1, 7)
    
    # Concatenate: TF-IDF (sparse) + extra (dense) = combined
    X_tfidf_dense = X_tfidf.toarray()  # (1, 3000)
    X_combined = np.hstack([X_tfidf_dense, extra_feats])  # (1, 3007)
    
    # Note: Scaler is NOT used (causes dimension mismatch)
    
    # Predict
    try:
        proba = bundle.rf.predict_proba(X_combined)[0, 1]
    except Exception as e:
        logger.error(f"Random Forest prediction failed: {e}")
        proba = 0.5  # Default to uncertain
    
    label = "spam" if proba >= 0.5 else "ham"
    return label, float(proba)


def _xgb_predict(raw_text: str, clean_text_str: str, bundle) -> Tuple[str, float]:
    # Extract the 23 features that XGBoost expects
    X_features = extract_23_features(raw_text)  # Shape: (1, 23)
    
    # Predict
    try:
        proba = bundle.xgb.predict_proba(X_features)[0, 1]
    except:
        try:
            # Fallback for models that don't have predict_proba
            pred = float(bundle.xgb.predict(X_features)[0])
            proba = 1.0 if pred == 1 else 0.0
        except Exception as e:
            logger.error(f"XGBoost prediction failed: {e}")
            logger.error(f"Feature shape: {X_features.shape}, expected: (1, 23)")
            proba = 0.5
    
    label = "spam" if proba >= 0.5 else "ham"
    return label, float(proba)


def _kmeans_anomaly(clean_text_str: str, bundle) -> Dict:
    vec = bundle.kmeans_vectorizer
    X = vec.transform([clean_text_str])
    
    # Apply PCA (needs dense input)
    X_dense = X.toarray()
    Z = bundle.pca.transform(X_dense)
    
    # Compute distance to cluster centers
    centers = bundle.kmeans.cluster_centers_
    dists = np.linalg.norm(Z - centers, axis=1)
    min_dist = float(np.min(dists))
    
    # Normalize distance to 0..1 score
    ood_score = 1.0 - np.exp(-min_dist)
    
    # Find closest cluster
    cluster_idx = int(np.argmin(dists))
    
    return {
        "cluster": f"C{cluster_idx}",
        "ood_score": float(round(ood_score, 4))
    }

def explain_from_rf(bundle, top_k: int = 8) -> List[Dict]:
    vec = bundle.rf_vectorizer
    
    # Get TF-IDF feature names
    try:
        tfidf_names = vec.get_feature_names_out()
    except:
        try:
            tfidf_names = vec.get_feature_names()
        except:
            return []
    
    # Add engineered feature names (7 features used by RF)
    engineered_names = [
        "text_length", "word_count", "url_count", "has_url",
        "currency_mentioned", "exclamation_count", "digit_ratio"
    ]
    all_names = list(tfidf_names) + engineered_names
    
    # Get feature importances
    if not hasattr(bundle.rf, "feature_importances_"):
        return []
    
    importances = bundle.rf.feature_importances_
    
    # Ensure we have the right number of importances
    if len(importances) != len(all_names):
        logger.warning(f"Feature count mismatch: {len(importances)} vs {len(all_names)}")
        # Just use TF-IDF features
        all_names = list(tfidf_names)
        importances = importances[:len(tfidf_names)]
    
    # Get top K
    top_indices = np.argsort(importances)[::-1][:top_k]
    
    result = []
    for idx in top_indices:
        if idx < len(all_names):
            result.append({
                "term": str(all_names[idx]),
                "weight": float(round(importances[idx], 4))
            })
    
    return result

def predict_one(text: str) -> Dict:
    # Load models
    bundle = get_bundle()
    
    # Clean text
    cleaned = clean_text(text)
    
    if not cleaned or not text:
        # Empty text - return safe default
        return {
            "label": "ham",
            "score": 0.0,
            "action": "allow",
            "reasons": ["empty_text"],
            "ensemble": {
                "rf": {"label": "ham", "score": 0.0},
                "xgb": {"label": "ham", "score": 0.0}
            },
            "explain": [],
            "anomaly": {"cluster": "C0", "ood_score": 0.0}
        }
    
    # Get predictions from both models
    rf_label, rf_score = _rf_predict(text, cleaned, bundle)      # TF-IDF + 7 features
    xgb_label, xgb_score = _xgb_predict(text, cleaned, bundle)   # 23 engineered features
    
    # Get anomaly detection
    anomaly = _kmeans_anomaly(cleaned, bundle)
    
    # Calculate confidence for each model (distance from 0.5 = uncertainty)
    # A score of 0.5 means the model is completely uncertain
    # Scores near 0 or 1 mean the model is very confident
    rf_confidence = abs(rf_score - 0.5)
    xgb_confidence = abs(xgb_score - 0.5)
    
    total_confidence = rf_confidence + xgb_confidence
    
    # If both models are very uncertain (both scores near 0.5)
    if total_confidence < 0.1:
        # Use simple average when both uncertain
        avg_score = (rf_score + xgb_score) / 2.0
        rf_weight_used = 0.5
        xgb_weight_used = 0.5
    else:
        # Weight by confidence: more confident model gets more weight
        rf_weight = rf_confidence / total_confidence
        xgb_weight = xgb_confidence / total_confidence
        
        avg_score = (rf_weight * rf_score) + (xgb_weight * xgb_score)
        rf_weight_used = rf_weight
        xgb_weight_used = xgb_weight
    
    avg_score = float(avg_score)
    final_label = "spam" if avg_score >= 0.5 else "ham"
    
    # Decide action
    action = decide_action(avg_score)
    
    # Generate reasons
    reasons = []
    if avg_score >= 0.85:
        reasons.append("high_confidence_spam")
    elif avg_score >= 0.7:
        reasons.append("likely_spam")
    elif avg_score >= 0.5:
        reasons.append("possible_spam")
    elif avg_score >= 0.3:
        reasons.append("likely_legitimate")
    else:
        reasons.append("high_confidence_legitimate")
    
    # Add agreement/disagreement
    score_diff = abs(xgb_score - rf_score)
    if score_diff < 0.2:
        reasons.append("models_agree")
    elif score_diff < 0.4:
        reasons.append("models_disagree_slightly")
    else:
        reasons.append("models_disagree_strongly")
    
    # Add confidence info
    if rf_confidence > xgb_confidence:
        reasons.append("rf_more_confident")
    elif xgb_confidence > rf_confidence:
        reasons.append("xgb_more_confident")
    
    # Get explanations (from RF only, as it has interpretable features)
    explain = explain_from_rf(bundle, top_k=8)
    
    return {
        "label": final_label,
        "score": round(avg_score, 4),
        "action": action,
        "reasons": reasons,
        "ensemble": {
            "rf": {
                "label": rf_label, 
                "score": round(rf_score, 4),
                "confidence": round(rf_confidence, 4),
                "weight": round(rf_weight_used, 4)
            },
            "xgb": {
                "label": xgb_label, 
                "score": round(xgb_score, 4),
                "confidence": round(xgb_confidence, 4),
                "weight": round(xgb_weight_used, 4)
            }
        },
        "explain": explain,
        "anomaly": anomaly
    }

def predict_batch(items: List[str]) -> List[Dict]:
    """Predict on multiple texts"""
    return [predict_one(text) for text in items]

def verify_setup():
    """
    Verify that models are receiving the correct number of features.
    Run this once on startup to confirm everything is configured correctly.
    """
    bundle = get_bundle()
    test_text = "Test message to verify feature dimensions"
    
    print("=" * 80)
    print("MODEL INPUT VERIFICATION")
    print("=" * 80)
    
    # Check Model 1 (XGBoost)
    xgb_features = extract_23_features(test_text)
    print(f"\n✓ Model 1 (XGBoost) Input:")
    print(f"  Expected: (1, 23)")
    print(f"  Actual: {xgb_features.shape}")
    print(f"  Match: {xgb_features.shape == (1, 23)}")
    
    if hasattr(bundle.xgb, 'n_features_in_'):
        print(f"  Model expects: {bundle.xgb.n_features_in_} features")
        if bundle.xgb.n_features_in_ != 23:
            print(f"  ⚠ WARNING: Feature count mismatch!")
    
    # Check Model 2 (RandomForest)
    cleaned = clean_text(test_text)
    tfidf_features = bundle.rf_vectorizer.transform([cleaned])
    extra_feats = extract_features(test_text, cleaned).reshape(1, -1)
    combined_shape = (1, tfidf_features.shape[1] + extra_feats.shape[1])
    
    print(f"\n✓ Model 2 (RandomForest) Input:")
    print(f"  TF-IDF shape: {tfidf_features.shape}")
    print(f"  Extra features shape: {extra_feats.shape}")
    print(f"  Combined shape: {combined_shape}")
    
    if hasattr(bundle.rf, 'n_features_in_'):
        print(f"  Model expects: {bundle.rf.n_features_in_} features")
        expected_combined = combined_shape[1]
        if bundle.rf.n_features_in_ != expected_combined:
            print(f"  ⚠ WARNING: Feature count mismatch!")
    
    print("\n" + "=" * 80)
    
    # Try a test prediction
    try:
        result = predict_one(test_text)
        print("\n✓ Test prediction successful!")
        print(f"  XGBoost score: {result['ensemble']['xgb']['score']:.4f} (weight: {result['ensemble']['xgb']['weight']:.2%})")
        print(f"  RandomForest score: {result['ensemble']['rf']['score']:.4f} (weight: {result['ensemble']['rf']['weight']:.2%})")
        print(f"  Ensemble score: {result['score']:.4f}")
    except Exception as e:
        print(f"\n✗ Test prediction failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("=" * 80)