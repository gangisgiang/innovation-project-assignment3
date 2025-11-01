from __future__ import annotations
from typing import Dict, List, Tuple
import numpy as np

from ..loaders.model_loader import get_bundle
from ..utils.text_clean import basic_clean

# Map score -> action recommendation (tweak thresholds to your needs)
def decide_action(score: float) -> str:
    if score >= 0.85:  # very confident spam
        return "block"
    if score >= 0.5:   # medium confidence
        return "quarantine"
    return "allow"

def _rf_predict(clean_text: str, bundle) -> Tuple[str, float]:
    vec = bundle.rf_vectorizer
    X = vec.transform([clean_text])  # sparse
    # Try scaler path if available
    if bundle.rf_scaler is not None:
        try:
            Xd = X.toarray()
            Xs = bundle.rf_scaler.transform(Xd)
            p = bundle.rf.predict_proba(Xs)[0, 1] if hasattr(bundle.rf, "predict_proba") else float(bundle.rf.predict(Xs)[0])
            lbl = "spam" if p >= 0.5 else "ham"
            return lbl, float(p)
        except Exception:
            pass
    # Fallbacks: sparse or dense without scaler
    try:
        p = bundle.rf.predict_proba(X)[0, 1] if hasattr(bundle.rf, "predict_proba") else float(bundle.rf.predict(X)[0])
        lbl = "spam" if p >= 0.5 else "ham"
        return lbl, float(p)
    except Exception:
        Xd = X.toarray()
        p = bundle.rf.predict_proba(Xd)[0, 1] if hasattr(bundle.rf, "predict_proba") else float(bundle.rf.predict(Xd)[0])
        lbl = "spam" if p >= 0.5 else "ham"
        return lbl, float(p)

def _xgb_predict(clean_text: str, bundle) -> Tuple[str, float]:
    """
    Assumption: model1 (XGBoost) uses the same TF-IDF as model2.
    If you trained it with a different vectorizer, load that vectorizer
    and replace this call accordingly.
    """
    vec = bundle.rf_vectorizer
    X = vec.transform([clean_text])
    try:
        p = bundle.xgb.predict_proba(X)[0, 1]
    except Exception:
        p = float(bundle.xgb.predict(X)[0])  # rare case
        # If the model returns class directly, convert to prob-like 0/1
        p = 1.0 if p == 1 else 0.0
    lbl = "spam" if p >= 0.5 else "ham"
    return lbl, float(p)

def _kmeans_anomaly(clean_text: str, bundle) -> Dict:
    """
    Vectorize with model3 TF-IDF, project with PCA, then compute distance
    to nearest cluster center. Convert to a simple 0..1 ood_score.
    """
    vec = bundle.kmeans_vectorizer
    X = vec.transform([clean_text])
    Z = bundle.pca.transform(X.toarray())  # PCA expects dense
    centers = bundle.kmeans.cluster_centers_
    # Compute L2 distance to each center
    dists = np.linalg.norm(Z - centers, axis=1)
    dmin = float(np.min(dists))
    # Normalize distance to 0..1 using a simple logistic-ish scaling
    # (You can calibrate with training-set distances if needed)
    ood = 1.0 - np.exp(-dmin)                 # 0 (in-cluster) -> close to 1 (far)
    # Identify closest cluster index
    cidx = int(np.argmin(dists))
    return {"cluster": f"C{cidx}", "ood_score": float(round(ood, 4))}

def explain_from_rf(bundle, top_k: int = 8) -> List[Dict]:
    """
    Provide global-ish explanation via feature importances (if available).
    For per-text explanations, use SHAP or similar (out of scope here).
    """
    vec = bundle.rf_vectorizer
    names = None
    try:
        names = vec.get_feature_names_out()
    except Exception:
        pass
    if names is None or not hasattr(bundle.rf, "feature_importances_"):
        return []
    fi = bundle.rf.feature_importances_
    idx = np.argsort(fi)[::-1][:top_k]
    out = []
    for i in idx:
        out.append({"term": str(names[i]), "weight": float(round(fi[i], 4))})
    return out

# ---------- Public API ----------

def predict_one(text: str) -> Dict:
    bundle = get_bundle()
    clean = basic_clean(text)

    rf_label, rf_score = _rf_predict(clean, bundle)
    xgb_label, xgb_score = _xgb_predict(clean, bundle)
    anomaly = _kmeans_anomaly(clean, bundle)

    # Ensemble: simple average of the two classifier probabilities
    avg_score = float((rf_score + xgb_score) / 2.0)
    label = "spam" if avg_score >= 0.5 else "ham"
    action = decide_action(avg_score)
    reasons: List[str] = []
    reasons.append("high_score" if avg_score >= 0.85 else "medium_score" if avg_score >= 0.5 else "low_score")

    explain = explain_from_rf(bundle, top_k=8)

    return {
        "label": label,
        "score": round(avg_score, 4),
        "action": action,
        "reasons": reasons,
        "ensemble": {
            "rf":  {"label": rf_label,  "score": round(rf_score, 4)},
            "xgb": {"label": xgb_label, "score": round(xgb_score, 4)},
        },
        "explain": explain,
        "anomaly": anomaly,
    }

def predict_batch(items: List[str]) -> List[Dict]:
    return [predict_one(t) for t in items]