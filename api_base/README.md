# SPECTER: Spam Detection System

**An intelligent spam detection system powered by ensemble machine learning**

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Model Details](#model-details)
- [Troubleshooting](#troubleshooting)
- [Authors](#authors)

---

## Overview

**SPECTER** (Spam and Phishing Email Classification Through Ensemble Recognition) is a full-stack web application that detects spam and malicious emails using machine learning. Built for COS30049 - Computing Technology Innovation Project at Swinburne University.

### Key Highlights

- **Ensemble ML Models**: Combines Random Forest and XGBoost
- **Interactive Visualizations**: D3.js, Plotly.js, and Chart.js charts
- **Batch Processing**: Process multiple emails with parallel execution
- **Modern UI**: Material-UI with dark mode support
- **Explainable AI**: Feature importance and confidence scores
- **RESTful API**: FastAPI backend with automatic documentation

---

## Features

### Machine Learning Capabilities

- Ensemble Classification: Random Forest + XGBoost
- Confidence Dampening: Handles model disagreement
- Feature Engineering: 23 custom features + TF-IDF vectorization
- Anomaly Detection: K-Means clustering for outlier detection
- Explainability: Feature importance showing key classification terms
- Action Recommendations: Automatic allow/quarantine/block mapping

### User Interface

- Split-Pane Layout: Resizable interface with input and results panes
- Dark/Light Mode: Theme switching
- Multiple Chart Types:
  - Score Distribution Bar Chart (D3.js)
  - Model Agreement Scatter Plot (D3.js)
  - Spam/Ham Pie Chart (D3.js)
  - Reasons Bubble Chart with zoom/pan (D3.js)
  - Ensemble Comparison Bar Chart (Plotly.js)
  - Feature Importance Plot (Plotly.js)
  - Prediction Timeline (Chart.js)
  - Model Agreement Chart (Chart.js)
- Responsive Design: Works on desktop, tablet, and mobile

### Backend Features

- Parallel Processing: ThreadPoolExecutor for batch predictions
- Input Validation: Pydantic schemas with custom validators
- History Management: CRUD operations with filtering and pagination
- Error Handling: Global exception handlers with detailed messages
- Auto Documentation: Swagger UI at `/docs`

---

## System Requirements

| Component | Requirement |
|-----------|-------------|
| **Python** | 3.11 or higher |
| **Node.js** | 18.x or higher |
| **RAM** | 4 GB minimum |
| **Disk Space** | 2 GB free space |
| **Browser** | Chrome, Firefox, Safari, or Edge (recent versions) |

---

## Installation

### Backend Setup

#### 1. Create and Activate Virtual Environment

**Windows:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
```

#### 2. Install Dependencies

```bash
pip install fastapi uvicorn pydantic scikit-learn xgboost numpy pandas scipy joblib python-multipart --break-system-packages
```

**Required packages:**
- fastapi
- uvicorn[standard]
- pydantic
- scikit-learn
- xgboost
- numpy
- pandas
- scipy
- joblib
- python-multipart

---

### Frontend Setup

```bash
cd frontend
npm install
```

**Main dependencies:**
- react
- react-dom
- react-router-dom
- @mui/material
- @mui/icons-material
- @emotion/react
- @emotion/styled
- d3
- react-plotly.js
- plotly.js
- chart.js
- react-chartjs-2

---

## Running the Application

### Start Backend Server

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will run on:** http://localhost:8000

**API Documentation:** http://localhost:8000/docs

---

### Start Frontend Server

**Open a new terminal:**

```bash
cd frontend
npm start
```

**Frontend will run on:** http://localhost:3000

---

## Usage Guide

### Single Prediction Mode

1. Navigate to http://localhost:3000
2. Enter email text in the left input pane
3. Click "Predict" button
4. View results in the right pane:
   - Classification label (spam/ham)
   - Confidence score
   - Recommended action
   - Ensemble model scores
   - Feature importance chart

**Example Input:**
```
WIN FREE iPhone NOW! Click here to claim your prize!
```

---

### Batch Prediction Mode

1. Toggle to "Batch Mode" using the switch
2. Enter multiple emails separated by `///`
3. Choose mode:
   - **Predict**: Individual results table
   - **Analyze**: Aggregated statistics with charts
4. Click "Predict"
5. Explore visualizations

**Example Input:**
```
Win FREE money now! Click here.
///
Meeting reminder: Team standup at 10am tomorrow.
///
URGENT: Verify your account immediately!
```

---

### History Management

1. Navigate to "Previous Results" page
2. View past predictions
3. Filter by label, score range, or date
4. Sort by timestamp or score
5. Export data to CSV or charts to PNG/SVG
6. Delete individual records

---

### Dark Mode

Click the moon/sun icon in the top-right corner to toggle dark/light mode.

---

## API Documentation

### Base URL

```
http://localhost:8000
```

---

### Available Endpoints

#### 1. Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok"
}
```

---

#### 2. Single Prediction

```http
POST /predict
Content-Type: application/json

{
  "text": "Your email text here"
}
```

**Response:**
```json
{
  "label": "spam",
  "score": 0.945,
  "action": "block",
  "reasons": ["high_score", "spam_keywords"],
  "ensemble": {
    "rf": {"label": "spam", "score": 0.923},
    "xgb": {"label": "spam", "score": 0.967}
  },
  "explain": [
    {"term": "free", "weight": 0.41},
    {"term": "win", "weight": 0.38}
  ],
  "anomaly": {
    "cluster": "C1",
    "ood_score": 0.23
  }
}
```

**Validation:**
- Text must be 1-10,000 characters
- Text cannot be empty

---

#### 3. Batch Prediction

```http
POST /predict-batch
Content-Type: application/json

{
  "items": ["message 1", "message 2", "message 3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Batch prediction completed (3 items)",
  "data": {
    "predictions": [
      { "label": "spam", "score": 0.94, "action": "block" },
      { "label": "ham", "score": 0.08, "action": "allow" },
      { "label": "spam", "score": 0.87, "action": "quarantine" }
    ],
    "total": 3,
    "spam_count": 2,
    "ham_count": 1
  }
}
```

**Limits:**
- Maximum 500 items per batch
- Maximum 1MB total batch size

---

#### 4. Batch Analysis

```http
POST /predict-batch/analyze
Content-Type: application/json

{
  "items": ["message 1", "message 2"]
}
```

**Response:**
```json
{
  "overview": {
    "total_messages": 2,
    "spam_count": 1,
    "ham_count": 1,
    "avg_score": 0.5
  },
  "score_distribution": {
    "0.0-0.2": 1,
    "0.2-0.4": 0,
    "0.4-0.6": 0,
    "0.6-0.8": 0,
    "0.8-1.0": 1
  },
  "model_agreement": {
    "agree": 2,
    "disagree": 0,
    "agreement_rate": 100.0
  },
  "actions": {
    "allow": 1,
    "block": 1
  },
  "reasons": {
    "high_score": 1,
    "low_score": 1
  },
  "top_spam_indicators": [
    {"term": "free", "weight": 0.45, "count": 1}
  ]
}
```

---

#### 5. Get History

```http
GET /history?limit=100&offset=0
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | int | Items per page (default: 100, max: 1000) |
| `offset` | int | Skip N items (default: 0) |
| `label` | string | Filter by "spam" or "ham" |
| `min_score` | float | Minimum score (0.0-1.0) |
| `max_score` | float | Maximum score (0.0-1.0) |
| `action` | string | Filter by action |
| `start_date` | ISO date | From date |
| `end_date` | ISO date | To date |
| `q` | string | Search in text |
| `sort_by` | string | "timestamp" or "score" |
| `order` | string | "asc" or "desc" |

**Response:**
```json
{
  "success": true,
  "message": "Fetched history",
  "data": {
    "items": [
      {
        "id": "abc123",
        "label": "spam",
        "score": 0.95,
        "text": "Sample text",
        "timestamp": "2025-11-09T12:00:00Z",
        "reasons": ["high_score"],
        "action": "block"
      }
    ],
    "total": 123,
    "limit": 100,
    "offset": 0,
    "has_next": true,
    "has_prev": false
  }
}
```

---

#### 6. Delete History Record

```http
DELETE /history/{record_id}
```

**Response:**
```json
{
  "success": true,
  "message": "Record abc123 deleted"
}
```

---

#### 7. Update History Feedback

```http
PUT /history/{record_id}
Content-Type: application/json

{
  "label": "ham",
  "comment": "False positive"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Record abc123 updated",
  "data": { }
}
```

---

### Interactive Documentation

Visit http://localhost:8000/docs for interactive Swagger UI where you can test all endpoints.

---

## Architecture

### System Overview

```
┌─────────────────┐
│  React Frontend │  (Port 3000)
│   Material-UI   │
│   D3.js/Plotly  │
└────────┬────────┘
         │ HTTP/JSON
         ▼
┌─────────────────┐
│ FastAPI Backend │  (Port 8000)
│   - /predict    │
│   - /batch      │
│   - /history    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   ML Models     │
│  - Random Forest│
│  - XGBoost      │
│  - K-Means      │
└─────────────────┘
```

### Component Architecture

**Frontend:**
- `App.js` - Main application with split-pane layout
- `BatchCharts.js` - D3.js visualizations
- `PreviousResults.js` - History management
- `PredictionProvider.js` - State management context
- `background.js` - Theme provider

**Backend:**
- `main.py` - FastAPI app with CORS and error handlers
- `routers/` - API endpoints (predict, batch, history)
- `services/predict_service.py` - ML prediction logic
- `schemas/` - Pydantic request/response models
- `utils/` - Text cleaning and feature engineering

---

## Project Structure

```
specter/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── predict.py
│   │   │   ├── batch.py
│   │   │   └── history.py
│   │   ├── services/
│   │   │   └── predict_service.py
│   │   ├── schemas/
│   │   │   ├── request.py
│   │   │   └── response.py
│   │   └── utils/
│   │       ├── text_clean.py
│   │       ├── feature_engineering.py
│   │       └── responses.py
│   └── models/
│       ├── random_forest.pkl
│       ├── xgboost.pkl
│       ├── tfidf_vectorizer.pkl
│       ├── kmeans_anomaly.pkl
│       └── pca_transformer.pkl
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js
│       ├── App.js
│       ├── BatchCharts.js
│       ├── BatchChartsContainer.js
│       ├── PreviousResults.js
│       ├── PredictionProvider.js
│       ├── background.js
│       └── About.js
└── README.md
```

---

## Model Details

### Ensemble Architecture

#### Random Forest Classifier

**Input Features:**
- TF-IDF vectors (vocabulary size varies)
- 7 engineered features:
  1. Text length
  2. Word count
  3. URL count
  4. Has URL (boolean)
  5. Currency mentioned (boolean)
  6. Exclamation count
  7. Digit ratio

**Implementation in:** `feature_engineering.py`

---

#### XGBoost Classifier

**Input Features:** 23 engineered features:

1. Text length
2. Word count
3. URL count
4. Email count
5. Phone count
6. Has URL
7. Has email
8. Currency mentioned
9. Amount mentioned
10. Exclamation count
11. Question count
12. Excess punctuation count
13. Repeated character max
14. All-caps word ratio
15. Digit ratio
16. Symbol ratio
17. Average token length
18. Unique token ratio
19. Starts with greeting
20. Ends with thanks
21. CTA keyword count
22. Spam keyword count
23. Phishing keyword count

**Implementation in:** `predict_service.py` (`extract_23_features`)

---

### Text Preprocessing

**Steps (in `text_clean.py`):**

1. HTML entity unescaping
2. Unicode normalization (NFKC)
3. Lowercase conversion
4. HTML tag removal
5. URL masking to `<url>`
6. Email masking to `<email>`
7. Number masking to `<num>`
8. Character whitelisting (keeps a-z, 0-9, special tokens)
9. Whitespace collapsing

---

### Ensemble Strategy

```python
# Weighted average
ensemble_score = 0.4 * rf_score + 0.6 * xgb_score

# Confidence dampening when models disagree
if rf_label != xgb_label:
    dampen_factor = 0.7
    rf_score *= dampen_factor
    xgb_score *= dampen_factor
```

**Action Mapping:**
- Score greater than or equal to 0.85: `block`
- Score greater than or equal to 0.5: `quarantine`
- Score less than 0.5: `allow`

---

### Anomaly Detection

**K-Means Clustering:**

1. Transform text to TF-IDF
2. Apply PCA reduction
3. Find nearest cluster center
4. Calculate distance
5. Convert to OOD score: `1 - exp(-distance)`

---

## Troubleshooting

### Backend Won't Start

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
# Activate virtual environment
source venv/bin/activate  # Windows: venv\Scripts\activate

# Reinstall dependencies
pip install fastapi uvicorn pydantic scikit-learn xgboost numpy --break-system-packages
```

---

**Error:** `FileNotFoundError: models/random_forest.pkl`

**Solution:**
- Ensure you have trained model files in `backend/models/`
- Files needed:
  - `random_forest.pkl`
  - `xgboost.pkl`
  - `tfidf_vectorizer.pkl`
  - `tfidf_vectorizer_kmeans.pkl`
  - `kmeans_anomaly.pkl`
  - `pca_transformer.pkl`

---

### Frontend Won't Start

**Error:** `Cannot find module 'react'`

**Solution:**
```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

**Error:** CORS error in browser console

**Solution:**
- Ensure backend is running on port 8000
- Check `main.py` CORS settings:
```python
allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"]
```

---

### Predictions Return Errors

**Error:** `422 Unprocessable Entity`

**Solution:**
- Check input text is not empty
- Verify text length is less than 10,000 characters
- For batch: maximum 500 items, total size less than 1MB

---

**Error:** `500 Internal Server Error`

**Solution:**
- Check backend console for detailed error
- Verify all model files are present
- Ensure text preprocessing works:
```python
from app.utils.text_clean import clean_text
result = clean_text("test message")
print(result)
```

---

### Charts Not Rendering

**Solution:**

1. Check browser console for errors
2. Verify D3.js is installed: `npm list d3`
3. Try clearing browser cache
4. Check if data is being passed correctly

---

## Authors

**SPECTER Development Team**

- Uyen Giang Thai - 104828510
- Duong Ha Tien Le - 104700948
- Michael Campbell - 104959054

**Course:** COS30049 - Computing Technology Innovation Project  
**Institution:** Swinburne University of Technology  
**Semester:** 2, 2025

---

## License

This project is for educational purposes as part of COS30049 coursework at Swinburne University of Technology.

**Copyright 2025 SPECTER Development Team**

---

## Support

For issues or questions:
- Check API documentation: http://localhost:8000/docs
- Review error messages in backend console
- Check browser developer console for frontend errors

---

**Last Updated:** November 9, 2025  
**Version:** 1.0.0