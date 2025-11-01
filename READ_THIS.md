# 🧠 FE Quick Start – Spam Detector API

## 1️⃣ Base URL

- Dev local: **`http://127.0.0.1:8000`**
- Recommended environment variable for FE: 
  ```bash
  VITE_API_BASE_URL=http://127.0.0.1:8000
  ```

---

## 2️⃣ Endpoints & Contract

### **A. GET /health**
- Check if the backend server is alive.
- **Response:**
  ```json
  {"status": "ok"}
  ```

### **B. POST /predict**
- **Request:**
  ```json
  { "text": "Win a FREE iPhone! Click here" }
  ```

- **Response:**
  ```json
  {
    "label": "spam",
    "score": 0.92,
    "action": "block",
    "reasons": ["high_score"],
    "ensemble": {
      "rf": {"label": "spam", "score": 0.95},
      "xgb": {"label": "spam", "score": 0.88}
    },
    "explain": [{"term": "free", "weight": 0.83}, {"term": "click", "weight": 0.77}],
    "anomaly": {"cluster": "C2", "ood_score": 0.18}
  }
  ```

### **C. POST /predict-batch**
- **Request:**
  ```json
  {
    "items": [
      "Win FREE $$$ now!!",
      "Hi team, see you at 10am.",
      "Your account needs verification!"
    ]
  }
  ```

- **Response:**
  ```json
  [
    {"label": "spam", "score": 0.98, "action": "block", ...},
    {"label": "ham", "score": 0.07, "action": "allow", ...},
    {"label": "spam", "score": 0.76, "action": "quarantine", ...}
  ]
  ```

### **D. GET /model/info**
- **Response:**
  ```json
  {
    "available_variants": ["rf_tfidf","xgb_tfidf","kmeans_pca"],
    "default_variant": "rf_tfidf",
    "current": "Mock Ensemble RF+XGB (+KMeans anomaly)",
    "features": 0,
    "classes": ["ham","spam"],
    "version": "0.1.0"
  }
  ```

---

## 3️⃣ UI Guidelines for FE

| Screen | API | Display |
|-----------|-----|-----------|
| Single Predict | `/predict` | Input form for one sentence → result card (label, score, action, top keywords) |
| Batch Predict | `/predict-batch` | Textarea for multiple lines → table of results (index, preview, label, score, action) |
| Model Info | `/model/info` | Display model name + version in a small section |
| Health | `/health` | Show “Server online ✅” indicator |

---

## 4️⃣ Error Handling & States

| Situation | Status code | Recommended handling |
|-------------|--------------|-------------|
| Invalid or empty input | 422 | Show “Input invalid” |
| Too many items in batch | 413 | Show “Too many items (max 500)” |
| Server error / connection issue | 500 / network | Show “Server unavailable, try again” |

---

## 5️⃣ Example JSON (for quick mock/testing)

### **Sample /predict (strong spam)**
```json
{
  "label": "spam",
  "score": 0.92,
  "action": "block",
  "reasons": ["high_score"],
  "ensemble": {
    "rf": {"label": "spam", "score": 0.95},
    "xgb": {"label": "spam", "score": 0.88}
  },
  "explain": [{"term": "free", "weight": 0.83}],
  "anomaly": {"cluster": "C2", "ood_score": 0.18}
}
```

### **Sample /predict-batch (mixed spam/ham)**
```json
[
  {
    "label": "spam",
    "score": 0.98,
    "action": "block",
    "reasons": ["high_score"],
    "ensemble": {
      "rf": {"label": "spam", "score": 0.99},
      "xgb": {"label": "spam", "score": 0.96}
    },
    "explain": [{"term": "free", "weight": 0.91}],
    "anomaly": {"cluster": "C0", "ood_score": 0.12}
  },
  {
    "label": "ham",
    "score": 0.07,
    "action": "allow",
    "reasons": ["low_score"],
    "ensemble": {
      "rf": {"label": "ham", "score": 0.03},
      "xgb": {"label": "ham", "score": 0.11}
    },
    "explain": [],
    "anomaly": {"cluster": "C1", "ood_score": 0.09}
  }
]
```

---

## 6️⃣ Frontend Checklist

- [ ] Set `BASE_URL` = `http://127.0.0.1:8000`
- [ ] Call `GET /health` before rendering main UI
- [ ] Use `/predict` for single sentence detection
- [ ] Use `/predict-batch` for multi-line detection
- [ ] Use `/model/info` to display model name/version
- [ ] Handle all states: loading / success / error / empty
- [ ] Visualize label, score, and action clearly (color-coded)
- [ ] Don't assume `explain` always has values