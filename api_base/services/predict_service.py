from __future__ import annotations
from typing import Dict, List, Tuple
import numpy as np
import scipy.sparse as sp
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import re

from ..loaders.model_loader import get_bundle
from ..utils.text_clean import clean_text
from ..utils.feature_engineering import extract_features
from ..routers.history import add_history_item

logger = logging.getLogger(__name__)


def extract_23_features(text: str) -> np.ndarray:
    """
    Compute the 23 engineered features expected by the XGBoost model.
    Returns a (1, 23) float32 numpy array.
    """
    if not text or not isinstance(text, str):
        text = ""
    cleaned_text = text.lower().strip()

    text_length = len(text)
    words = text.split()
    word_count = len(words)

    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    url_count = len(re.findall(url_pattern, text, re.IGNORECASE))

    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email_count = len(re.findall(email_pattern, text))

    phone_pattern = r'(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}'
    phone_count = len(re.findall(phone_pattern, text))

    has_url = 1 if url_count > 0 else 0
    has_email = 1 if email_count > 0 else 0

    currency_symbols = ['$', '€', '£', '¥', '₹', 'usd', 'eur', 'gbp', 'dollar', 'aud', 'vnd', 'rm', 'idr', 'sgd', 'rs', 'inr']
    currency_mentioned = 1 if any(sym in cleaned_text for sym in currency_symbols) else 0

    amount_pattern = r'\$\d+|\d+\s*(?:dollar|usd|euro|pound|aud)'
    amount_mentioned = 1 if re.search(amount_pattern, cleaned_text) else 0

    exclamation_count = text.count('!')
    question_count = text.count('?')
    excess_punct_pattern = r'[!?.]{2,}'
    excess_punct_count = len(re.findall(excess_punct_pattern, text))

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

    if word_count > 0:
        caps_words = sum(1 for word in words if word.isupper() and len(word) > 1)
        all_caps_word_ratio = caps_words / word_count
    else:
        all_caps_word_ratio = 0.0

    if text_length > 0:
        digit_count = sum(1 for char in text if char.isdigit())
        digit_ratio = digit_count / text_length
        symbol_count = sum(1 for char in text if not char.isalnum() and not char.isspace())
        symbol_ratio = symbol_count / text_length
    else:
        digit_ratio = 0.0
        symbol_ratio = 0.0

    if word_count > 0:
        avg_token_len = sum(len(word) for word in words) / word_count
        unique_words = len(set(word.lower() for word in words))
        unique_token_ratio = unique_words / word_count
    else:
        avg_token_len = 0.0
        unique_token_ratio = 0.0

    greetings = ['hi', 'hello', 'dear', 'hey', 'greetings']
    starts_with_greeting = 1 if any(cleaned_text.startswith(g) for g in greetings) else 0

    thanks_words = ['thanks', 'thank you', 'regards', 'sincerely', 'best regards']
    ends_with_thanks = 1 if any(cleaned_text.endswith(t) for t in thanks_words) else 0

    cta_keywords = [
        'click', 'call', 'buy', 'order', 'visit', 'download', 'subscribe',
        'register', 'sign up', 'act now', 'limited time', 'hurry', 'today'
    ]
    cta_keyword_count = sum(1 for keyword in cta_keywords if keyword in cleaned_text)

    spam_keywords = [
        'free', 'winner', 'won', 'prize', 'congratulations', 'claim',
        'urgent', 'act now', 'limited offer', 'guaranteed', 'cash',
        'money back', 'no obligation', 'risk free', 'discount'
    ]
    spam_keyword_count = sum(1 for keyword in spam_keywords if keyword in cleaned_text)

    phishing_keywords = [
        'verify', 'confirm', 'account', 'suspended', 'locked', 'security',
        'update', 'password', 'login', 'credentials', 'expire', 'validate',
        'authenticate', 'ssn', 'social security', 'bank account'
    ]
    phishing_keyword_count = sum(1 for keyword in phishing_keywords if keyword in cleaned_text)

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
    """
    Map a spam probability into an action recommendation.
    """
    if score >= 0.85:
        return "block"
    if score >= 0.5:
        return "quarantine"
    return "allow"


def _rf_predict(raw_text: str, clean_text_str: str, bundle) -> Tuple[str, float]:
    """
    RandomForest path: TF-IDF (N) concatenated with 7 engineered features.
    """
    vec = bundle.rf_vectorizer
    X_tfidf = vec.transform([clean_text_str])

    extra_feats = extract_features(raw_text, clean_text_str).reshape(1, -1)

    X_tfidf_dense = X_tfidf.toarray()
    X_combined = np.hstack([X_tfidf_dense, extra_feats])

    try:
        proba = bundle.rf.predict_proba(X_combined)[0, 1]
    except Exception as e:
        logger.error(f"Random Forest prediction failed: {e}")
        proba = 0.5

    label = "spam" if proba >= 0.5 else "ham"
    return label, float(proba)


def _xgb_predict(raw_text: str, clean_text_str: str, bundle) -> Tuple[str, float]:
    """
    XGBoost path: uses the fixed 23 engineered features.
    """
    X_features = extract_23_features(raw_text)
    try:
        proba = bundle.xgb.predict_proba(X_features)[0, 1]
    except:
        try:
            pred = float(bundle.xgb.predict(X_features)[0])
            proba = 1.0 if pred == 1 else 0.0
        except Exception as e:
            logger.error(f"XGBoost prediction failed: {e}")
            logger.error(f"Feature shape: {X_features.shape}, expected: (1, 23)")
            proba = 0.5

    label = "spam" if proba >= 0.5 else "ham"
    return label, float(proba)


def _kmeans_anomaly(clean_text_str: str, bundle) -> Dict:
    """
    Compute an out-of-distribution score using KMeans on PCA-transformed TF-IDF.
    """
    vec = bundle.kmeans_vectorizer
    X = vec.transform([clean_text_str])
    X_dense = X.toarray()
    Z = bundle.pca.transform(X_dense)

    centers = bundle.kmeans.cluster_centers_
    dists = np.linalg.norm(Z - centers, axis=1)
    min_dist = float(np.min(dists))

    ood_score = 1.0 - np.exp(-min_dist)
    cluster_idx = int(np.argmin(dists))

    return {
        "cluster": f"C{cluster_idx}",
        "ood_score": float(round(ood_score, 4))
    }


def explain_from_rf(bundle, raw_text: str, clean_text_str: str, top_k: int = 8) -> List[Dict]:
    """
    Produce per-text explanatory terms by combining TF-IDF contribution
    and engineered feature contributions.
    """
    vec = bundle.rf_vectorizer
    try:
        tfidf_names = vec.get_feature_names_out()
    except:
        try:
            tfidf_names = vec.get_feature_names()
        except:
            return []

    X_tfidf = vec.transform([clean_text_str])
    tfidf_values = X_tfidf.toarray()[0]

    extra_feats = extract_features(raw_text, clean_text_str)
    engineered_names = [
        "text_length", "word_count", "url_count", "has_url",
        "currency_mentioned", "exclamation_count", "digit_ratio"
    ]

    if not hasattr(bundle.rf, "feature_importances_"):
        tfidf_scores = tfidf_values
        engineered_scores = extra_feats
    else:
        importances = bundle.rf.feature_importances_
        tfidf_importances = importances[:len(tfidf_names)]
        engineered_importances = importances[len(tfidf_names):len(tfidf_names)+7]
        tfidf_scores = tfidf_values * tfidf_importances
        engineered_scores = extra_feats * engineered_importances

    result = []

    non_zero_indices = np.where(tfidf_values > 0)[0]
    if len(non_zero_indices) > 0:
        sorted_indices = non_zero_indices[np.argsort(tfidf_scores[non_zero_indices])[::-1]]
        top_tfidf = sorted_indices[:min(len(sorted_indices), 10)]
        for idx in top_tfidf:
            if idx < len(tfidf_names):
                result.append({
                    "term": str(tfidf_names[idx]),
                    "weight": float(round(tfidf_scores[idx], 4))
                })

    spam_keywords = [
        "free", "win", "prize", "congratulations", "money",
        "click", "offer", "urgent", "credit", "bonus",
        "cashback", "deal", "discount", "limited", "gift"
    ]
    text_lower = raw_text.lower()
    found_keywords = []
    for keyword in spam_keywords:
        if keyword in text_lower:
            spam_weight = 0.05 if keyword in ["free", "win", "urgent", "act now", "guaranteed"] else 0.03
            found_keywords.append({"term": keyword, "weight": spam_weight})
    result.extend(found_keywords)

    for name, value, score in zip(engineered_names, extra_feats, engineered_scores):
        if name in ["text_length", "word_count"]:
            continue
        if value > 0 and score > 0.0001:
            if name == "has_url":
                readable_name = "Contains URL"
            elif name == "currency_mentioned":
                readable_name = "Money/Currency Mentioned"
            elif name == "url_count":
                readable_name = f"URLs Found ({int(value)})"
            elif name == "exclamation_count":
                readable_name = f"Exclamation Marks ({int(value)})"
            elif name == "digit_ratio":
                readable_name = f"Number Characters ({value:.1%})"
            else:
                readable_name = name.replace("_", " ").title()
            result.append({"term": readable_name, "weight": float(round(score, 4))})

    result.sort(key=lambda x: x["weight"], reverse=True)

    seen_terms = set()
    unique_results = []
    for item in result:
        term_lower = item["term"].lower()
        if term_lower not in seen_terms:
            seen_terms.add(term_lower)
            unique_results.append(item)

    return unique_results[:top_k]


def predict_one(text: str) -> Dict:
    """
    Predict a single text using RF + XGB ensemble, anomaly score, explanations,
    and persist the result to history.
    """
    bundle = get_bundle()
    cleaned = clean_text(text)

    if not cleaned or not text:
        result = {
            "label": "ham",
            "score": 0.0,
            "action": "allow",
            "reasons": ["Empty or Invalid Text"],
            "ensemble": {
                "rf": {"label": "ham", "score": 0.0},
                "xgb": {"label": "ham", "score": 0.0}
            },
            "explain": [],
            "anomaly": {"cluster": "C0", "ood_score": 0.0}
        }
        try:
            add_history_item(
                label=result["label"],
                score=result["score"],
                text=str(text or ""),
                reasons=result.get("reasons"),
                explain=result.get("explain"),
                action=result.get("action"),
                ensemble=result.get("ensemble"),
                anomaly=result.get("anomaly"),
            )
        except Exception as e:
            logger.warning(f"Failed to add history item (empty): {e}")
        return result

    rf_label, rf_score = _rf_predict(text, cleaned, bundle)
    xgb_label, xgb_score_raw = _xgb_predict(text, cleaned, bundle)

    dampening_factor = 0.4
    xgb_score = 0.5 + (xgb_score_raw - 0.5) * (1 - dampening_factor)
    xgb_label = "spam" if xgb_score >= 0.5 else "ham"

    anomaly = _kmeans_anomaly(cleaned, bundle)

    rf_confidence = abs(rf_score - 0.5)
    xgb_confidence = abs(xgb_score - 0.5)

    rf_weight_used = 0.70
    xgb_weight_used = 0.30
    avg_score = float((rf_weight_used * rf_score) + (xgb_weight_used * xgb_score))
    final_label = "spam" if avg_score >= 0.5 else "ham"
    action = decide_action(avg_score)

    reasons = []
    if avg_score >= 0.85:
        reasons.append("Very High Spam Probability")
    elif avg_score >= 0.7:
        reasons.append("High Spam Probability")
    elif avg_score >= 0.5:
        reasons.append("Likely Spam")
    elif avg_score >= 0.3:
        reasons.append("Likely Legitimate")
    else:
        reasons.append("Very Likely Legitimate")

    score_diff = abs(xgb_score - rf_score)
    if score_diff < 0.2:
        reasons.append("Both Models Agree")
    elif score_diff < 0.4:
        reasons.append("Models Show Slight Disagreement")
    else:
        reasons.append("Models Show Strong Disagreement")

    if rf_confidence > xgb_confidence + 0.1:
        reasons.append("Text Pattern Analysis is More Confident")
    elif xgb_confidence > rf_confidence + 0.1:
        reasons.append("Feature Analysis is More Confident")

    explain = explain_from_rf(bundle, text, cleaned, top_k=8)

    result = {
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
                "raw_score": round(xgb_score_raw, 4),
                "confidence": round(xgb_confidence, 4),
                "weight": round(xgb_weight_used, 4)
            }
        },
        "explain": explain,
        "anomaly": anomaly
    }

    try:
        add_history_item(
            label=result["label"],
            score=result["score"],
            text=text,
            reasons=result.get("reasons"),
            explain=result.get("explain"),
            action=result.get("action"),
            ensemble=result.get("ensemble"),
            anomaly=result.get("anomaly"),
        )
    except Exception as e:
        logger.warning(f"Failed to add history item: {e}")

    return result


def predict_batch(items: List[str], max_workers: int = 4) -> List[Dict]:
    """
    Predict a list of texts, preserving input order. Uses parallel workers for larger batches.
    """
    if not items:
        return []
    if len(items) <= 3:
        return [predict_one(text) for text in items]

    results = [None] * len(items)
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_index = {executor.submit(predict_one, text): idx for idx, text in enumerate(items)}
        for future in as_completed(future_to_index):
            idx = future_to_index[future]
            try:
                results[idx] = future.result()
            except Exception as e:
                logger.error(f"Batch prediction failed for item {idx}: {e}")
                results[idx] = {
                    "label": "ham",
                    "score": 0.5,
                    "action": "quarantine",
                    "reasons": ["prediction_error"],
                    "ensemble": {
                        "rf": {"label": "ham", "score": 0.5},
                        "xgb": {"label": "ham", "score": 0.5}
                    },
                    "explain": [],
                    "anomaly": {"cluster": "C0", "ood_score": 0.0},
                    "error": str(e)
                }
    return results


def predict_batch_with_metadata(items: List[str], max_workers: int = 4) -> Dict:
    """
    Predict a list of texts and return predictions plus summary statistics and timing.
    """
    start_time = time.time()
    predictions = predict_batch(items, max_workers=max_workers)

    total = len(predictions)
    spam_count = sum(1 for p in predictions if p["label"] == "spam")
    ham_count = total - spam_count
    scores = [p["score"] for p in predictions]
    avg_score = sum(scores) / total if total > 0 else 0.0
    high_confidence = sum(1 for s in scores if s < 0.2 or s > 0.8)

    actions = {}
    for p in predictions:
        action = p.get("action", "unknown")
        actions[action] = actions.get(action, 0) + 1

    elapsed = time.time() - start_time
    items_per_sec = total / elapsed if elapsed > 0 else 0

    return {
        "predictions": predictions,
        "summary": {
            "total": total,
            "spam": spam_count,
            "ham": ham_count,
            "spam_percentage": round(spam_count / total * 100, 2) if total > 0 else 0,
            "avg_score": round(avg_score, 4),
            "high_confidence": high_confidence,
            "actions": actions
        },
        "processing": {
            "time_seconds": round(elapsed, 3),
            "items_per_second": round(items_per_sec, 1),
            "workers_used": max_workers
        }
    }


def predict_batch_stream(items: List[str], max_workers: int = 4):
    """
    Generator that yields (index, prediction) as soon as each item completes.
    """
    if not items:
        return
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_index = {executor.submit(predict_one, text): idx for idx, text in enumerate(items)}
        for future in as_completed(future_to_index):
            idx = future_to_index[future]
            try:
                result = future.result()
                yield (idx, result)
            except Exception as e:
                logger.error(f"Streaming prediction failed for item {idx}: {e}")
                yield (idx, {
                    "label": "ham",
                    "score": 0.5,
                    "action": "quarantine",
                    "reasons": ["prediction_error"],
                    "error": str(e)
                })


def predict_batch_with_indices(
    items: List[str],
    indices: List[int] = None,
    max_workers: int = 4
) -> Dict[int, Dict]:
    """
    Predict a list of texts and return a mapping from provided indices to predictions.
    """
    if indices is None:
        indices = list(range(len(items)))
    if len(indices) != len(items):
        raise ValueError("Length of indices must match length of items")

    predictions = predict_batch(items, max_workers=max_workers)
    return {idx: pred for idx, pred in zip(indices, predictions)}


def predict_batch_filtered(
    items: List[str],
    filter_label: str = None,
    min_score: float = None,
    max_score: float = None,
    max_workers: int = 4
) -> List[Tuple[int, Dict]]:
    """
    Predict a list of texts and return only those that satisfy the provided filters.
    """
    predictions = predict_batch(items, max_workers=max_workers)
    results = []
    for idx, pred in enumerate(predictions):
        if filter_label and pred["label"] != filter_label:
            continue
        if min_score is not None and pred["score"] < min_score:
            continue
        if max_score is not None and pred["score"] > max_score:
            continue
        results.append((idx, pred))
    return results


def analyze_batch(items: List[str], max_workers: int = 4) -> Dict:
    """
    Run predictions and compute distributions, agreement, actions, reasons,
    and top explanatory terms. Includes raw and indexed details.
    """
    predictions = predict_batch(items, max_workers=max_workers)

    scores = [p["score"] for p in predictions]
    score_bins = {
        "0.0-0.2": sum(1 for s in scores if 0.0 <= s < 0.2),
        "0.2-0.4": sum(1 for s in scores if 0.2 <= s < 0.4),
        "0.4-0.6": sum(1 for s in scores if 0.4 <= s < 0.6),
        "0.6-0.8": sum(1 for s in scores if 0.6 <= s < 0.8),
        "0.8-1.0": sum(1 for s in scores if 0.8 <= s <= 1.0),
    }

    agreement = sum(
        1 for p in predictions
        if p["ensemble"]["rf"]["label"] == p["ensemble"]["xgb"]["label"]
    )
    disagreement = len(predictions) - agreement

    actions = {}
    for p in predictions:
        action = p["action"]
        actions[action] = actions.get(action, 0) + 1

    reason_counts = {}
    for p in predictions:
        for reason in p.get("reasons", []):
            reason_counts[reason] = reason_counts.get(reason, 0) + 1

    all_terms = {}
    for p in predictions:
        if p["label"] == "spam":
            for item in p.get("explain", []):
                term = item["term"]
                weight = item["weight"]
                if term not in all_terms:
                    all_terms[term] = []
                all_terms[term].append(weight)

    top_spam_indicators = [
        {"term": term, "avg_weight": sum(weights) / len(weights), "count": len(weights)}
        for term, weights in all_terms.items()
    ]
    top_spam_indicators.sort(key=lambda x: x["avg_weight"], reverse=True)

    return {
        "overview": {
            "total_messages": len(items),
            "spam_count": sum(1 for p in predictions if p["label"] == "spam"),
            "ham_count": sum(1 for p in predictions if p["label"] == "ham"),
            "avg_score": round(sum(scores) / len(scores), 4) if scores else 0,
        },
        "score_distribution": score_bins,
        "model_agreement": {
            "agree": agreement,
            "disagree": disagreement,
            "agreement_rate": round(agreement / len(predictions) * 100, 2) if predictions else 0
        },
        "actions": actions,
        "reasons": reason_counts,
        "top_spam_indicators": top_spam_indicators[:10],
        "details": predictions,
        "indexed_details": [
            {"index": i, "text": items[i], **predictions[i]}
            for i in range(len(items))
        ]
    }


def batch_summary(predictions: List[Dict]) -> str:
    """
    Produce a human-readable summary for a list of predictions.
    """
    total = len(predictions)
    spam = sum(1 for p in predictions if p["label"] == "spam")
    ham = total - spam
    avg_score = sum(p["score"] for p in predictions) / total if total > 0 else 0

    block = sum(1 for p in predictions if p["action"] == "block")
    quarantine = sum(1 for p in predictions if p["action"] == "quarantine")
    allow = sum(1 for p in predictions if p["action"] == "allow")

    summary = f"""
Batch Prediction Summary
========================
Total messages: {total}
Spam: {spam} ({spam/total*100:.1f}%)
Ham: {ham} ({ham/total*100:.1f}%)
Average score: {avg_score:.3f}

Recommended actions:
- Block: {block} messages
- Quarantine: {quarantine} messages
- Allow: {allow} messages
""".strip()
    return summary

def verify_setup():
    """
    Print model input diagnostics and execute a test prediction.
    """
    bundle = get_bundle()
    test_text = "Test message to verify feature dimensions"

    print("=" * 80)
    print("MODEL INPUT VERIFICATION")
    print("=" * 80)

    xgb_features = extract_23_features(test_text)
    print(f"\nModel 1 (XGBoost) Input:")
    print(f"  Expected: (1, 23)")
    print(f"  Actual: {xgb_features.shape}")
    print(f"  Match: {xgb_features.shape == (1, 23)}")
    if hasattr(bundle.xgb, 'n_features_in_'):
        print(f"  Model expects: {bundle.xgb.n_features_in_} features")
        if bundle.xgb.n_features_in_ != 23:
            print("  WARNING: Feature count mismatch")

    cleaned = clean_text(test_text)
    tfidf_features = bundle.rf_vectorizer.transform([cleaned])
    extra_feats = extract_features(test_text, cleaned).reshape(1, -1)
    combined_shape = (1, tfidf_features.shape[1] + extra_feats.shape[1])

    print(f"\nModel 2 (RandomForest) Input:")
    print(f"  TF-IDF shape: {tfidf_features.shape}")
    print(f"  Extra features shape: {extra_feats.shape}")
    print(f"  Combined shape: {combined_shape}")
    if hasattr(bundle.rf, 'n_features_in_'):
        print(f"  Model expects: {bundle.rf.n_features_in_} features")
        expected_combined = combined_shape[1]
        if bundle.rf.n_features_in_ != expected_combined:
            print("  WARNING: Feature count mismatch")

    print("\n")
    try:
        result = predict_one(test_text)
        print("Test prediction successful")
        print(f"  XGBoost score: {result['ensemble']['xgb']['score']:.4f} (weight: {result['ensemble']['xgb']['weight']:.2f})")
        print(f"  RandomForest score: {result['ensemble']['rf']['score']:.4f} (weight: {result['ensemble']['rf']['weight']:.2f})")
        print(f"  Ensemble score: {result['score']:.4f}")
    except Exception as e:
        print(f"Test prediction failed: {e}")
        import traceback
        traceback.print_exc()

    print("=" * 80)