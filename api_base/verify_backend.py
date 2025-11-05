"""
BACKEND VERIFICATION SCRIPT (Updated for api_base structure)
============================================================

Run this script from your api_base directory.

Usage:
    cd api_base  # or wherever you run your FastAPI app from
    python verify_backend.py
"""

import sys
import numpy as np
from pathlib import Path

print("=" * 80)
print("SPAM DETECTION BACKEND VERIFICATION")
print("=" * 80)

# Test 1: Import all required packages
print("\n[1/6] Testing package imports...")
try:
    import fastapi
    import uvicorn
    import pydantic
    import sklearn
    import xgboost
    import numpy
    import scipy
    import joblib
    import pandas
    print("✓ All required packages installed")
except ImportError as e:
    print(f"✗ Missing package: {e}")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)

# Test 2: Find artifacts directory
print("\n[2/6] Finding artifacts directory...")

# Try multiple possible locations
possible_paths = [
    Path("../backend_app/artifacts"),  # From api_base -> backend_app
    Path("backend_app/artifacts"),      # If running from parent
    Path("artifacts"),                  # If running from backend_app
    Path("../artifacts"),               # Alternative
]

ARTIFACT_DIR = None
for path in possible_paths:
    if path.exists():
        ARTIFACT_DIR = path.resolve()
        print(f"✓ Found artifacts at: {ARTIFACT_DIR}")
        break

if ARTIFACT_DIR is None:
    print("✗ Artifacts directory not found in any of these locations:")
    for path in possible_paths:
        print(f"  - {path.resolve()}")
    print("\nPlease specify the correct path to your artifacts directory.")
    sys.exit(1)

# Test 3: Check model files exist
print("\n[3/6] Checking model files...")

required_files = [
    "model_1_xgboost.pkl",
    "model2_random_forest.pkl",
    "model2_tfidf_vectorizer.pkl",
    "model3_kmeans.pkl",
    "model3_pca.pkl",
    "model3_tfidf_vectorizer.pkl"
]

missing_files = []
for file in required_files:
    if not (ARTIFACT_DIR / file).exists():
        print(f"✗ Missing: {file}")
        missing_files.append(file)
    else:
        print(f"✓ Found: {file}")

if missing_files:
    print(f"\n✗ Missing {len(missing_files)} required model files")
    sys.exit(1)

# Test 4: Load models
print("\n[4/6] Loading models...")
import joblib

try:
    xgb_model = joblib.load(ARTIFACT_DIR / "model_1_xgboost.pkl")
    rf_model = joblib.load(ARTIFACT_DIR / "model2_random_forest.pkl")
    rf_vectorizer = joblib.load(ARTIFACT_DIR / "model2_tfidf_vectorizer.pkl")
    print("✓ All models loaded successfully")
except Exception as e:
    print(f"✗ Failed to load models: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 5: Check model feature expectations
print("\n[5/6] Verifying model feature dimensions...")

# XGBoost should expect 23 features
if hasattr(xgb_model, 'n_features_in_'):
    xgb_features = xgb_model.n_features_in_
    print(f"XGBoost expects: {xgb_features} features")
    if xgb_features != 23:
        print(f"⚠ WARNING: XGBoost should expect 23 features, got {xgb_features}")
        print(f"   Your model was trained on {xgb_features} features")
        if xgb_features > 1000:
            print(f"   → This looks like it was trained on TF-IDF features")
            print(f"   → You should use Option B (retrain) or ensure you have the right model file")
        else:
            print(f"   → The corrected code expects exactly 23 features")
            print(f"   → You may need to retrain your XGBoost model")
    else:
        print("✓ XGBoost configuration correct (23 features)")
else:
    print("⚠ Cannot determine XGBoost feature count")
    xgb_features = None

# Random Forest should expect TF-IDF + 7 features
if hasattr(rf_model, 'n_features_in_'):
    rf_features = rf_model.n_features_in_
    vocab_size = len(rf_vectorizer.vocabulary_)
    expected_rf = vocab_size + 7
    print(f"\nRandomForest expects: {rf_features} features")
    print(f"  TF-IDF vocab: {vocab_size}")
    print(f"  Extra features: 7")
    print(f"  Expected total: {expected_rf}")
    
    if rf_features == expected_rf:
        print("✓ RandomForest configuration correct")
    elif rf_features == vocab_size:
        print(f"⚠ WARNING: RandomForest expects only TF-IDF ({vocab_size}), no extra features")
        print(f"   Your RF model may not have been trained with the 7 engineered features")
    else:
        print(f"⚠ WARNING: Expected {expected_rf}, got {rf_features}")
else:
    print("⚠ Cannot determine RandomForest feature count")

# Test 6: Test 23-feature extraction
print("\n[6/6] Testing 23-feature extraction...")

# Import the function from corrected file if available, otherwise define it
import re

def extract_23_features(text: str) -> np.ndarray:
    """Extract 23 features for XGBoost"""
    if not text or not isinstance(text, str):
        text = ""
    
    cleaned_text = text.lower().strip()
    words = text.split()
    text_length = len(text)
    word_count = len(words)
    
    # URL patterns
    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    url_count = len(re.findall(url_pattern, text, re.IGNORECASE))
    
    # Email patterns
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email_count = len(re.findall(email_pattern, text))
    
    # Phone patterns
    phone_pattern = r'(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}'
    phone_count = len(re.findall(phone_pattern, text))
    
    has_url = 1 if url_count > 0 else 0
    has_email = 1 if email_count > 0 else 0
    
    # Currency
    currency_symbols = ['$', '€', '£', '¥', '₹', 'usd', 'eur', 'gbp', 'dollar']
    currency_mentioned = 1 if any(sym in cleaned_text for sym in currency_symbols) else 0
    
    amount_pattern = r'\$\d+|\d+\s*(?:dollar|usd|euro|pound|aud)'
    amount_mentioned = 1 if re.search(amount_pattern, cleaned_text) else 0
    
    exclamation_count = text.count('!')
    question_count = text.count('?')
    
    excess_punct_pattern = r'[!?.]{2,}'
    excess_punct_count = len(re.findall(excess_punct_pattern, text))
    
    # Repeated chars
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
    
    # Ratios
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
    
    # Greetings and closings
    greetings = ['hi', 'hello', 'dear', 'hey', 'greetings']
    starts_with_greeting = 1 if any(cleaned_text.startswith(g) for g in greetings) else 0
    
    thanks_words = ['thanks', 'thank you', 'regards', 'sincerely']
    ends_with_thanks = 1 if any(cleaned_text.endswith(t) for t in thanks_words) else 0
    
    # Keywords
    cta_keywords = ['click', 'call', 'buy', 'order', 'visit', 'download', 'subscribe',
                    'register', 'sign up', 'act now', 'limited time', 'hurry', 'today']
    cta_keyword_count = sum(1 for keyword in cta_keywords if keyword in cleaned_text)
    
    spam_keywords = ['free', 'winner', 'won', 'prize', 'congratulations', 'claim',
                     'urgent', 'limited offer', 'guaranteed', 'cash', 'discount']
    spam_keyword_count = sum(1 for keyword in spam_keywords if keyword in cleaned_text)
    
    phishing_keywords = ['verify', 'confirm', 'account', 'suspended', 'locked', 'security',
                         'update', 'password', 'login', 'credentials', 'expire', 'validate']
    phishing_keyword_count = sum(1 for keyword in phishing_keywords if keyword in cleaned_text)
    
    features = np.array([[
        text_length, word_count, url_count, email_count, phone_count,
        has_url, has_email, currency_mentioned, amount_mentioned,
        exclamation_count, question_count, excess_punct_count,
        repeated_char_max, all_caps_word_ratio, digit_ratio,
        symbol_ratio, avg_token_len, unique_token_ratio,
        starts_with_greeting, ends_with_thanks, cta_keyword_count,
        spam_keyword_count, phishing_keyword_count
    ]], dtype=np.float32)
    
    return features

test_text = "CONGRATULATIONS! You've WON $1000! Click here NOW!"
features = extract_23_features(test_text)

print(f"Test text: {test_text}")
print(f"Extracted features shape: {features.shape}")
print(f"Expected shape: (1, 23)")

if features.shape == (1, 23):
    print("✓ Feature extraction working correctly")
    print(f"Sample values:")
    print(f"  - text_length: {features[0,0]:.0f}")
    print(f"  - spam_keywords: {features[0,21]:.0f}")
    print(f"  - phishing_keywords: {features[0,22]:.0f}")
else:
    print(f"✗ Feature extraction shape mismatch!")
    sys.exit(1)

# Test 7: Test predictions
print("\n[7/7] Testing model predictions...")

try:
    # Test XGBoost with 23 features
    xgb_proba = xgb_model.predict_proba(features)[0]
    xgb_score = xgb_proba[1]
    print(f"✓ XGBoost prediction successful")
    print(f"  Spam probability: {xgb_score:.4f}")
    
    if 0.0 <= xgb_score <= 1.0:
        print("✓ Score in valid range [0, 1]")
    else:
        print(f"⚠ Score out of range: {xgb_score}")
    
    # Check if prediction makes sense (obvious spam should score high)
    if xgb_score > 0.6:
        print("✓ Correctly identifies obvious spam (score > 0.6)")
    elif xgb_score > 0.4:
        print(f"⚠ Uncertain prediction (score = {xgb_score:.4f})")
        print("   Model might not be working optimally")
    else:
        print(f"✗ WARNING: Obvious spam scored low ({xgb_score:.4f})")
        print("   This indicates the model is NOT working correctly")
        print("   Possible causes:")
        print("   1. Model expects different features than what we're providing")
        print("   2. Model was trained on different feature set")
        print("   3. Model file is corrupted or incorrect")
        print("\n   RECOMMENDED ACTION:")
        if xgb_features and xgb_features != 23:
            print(f"   → Your model expects {xgb_features} features, not 23")
            print("   → Use Option B: Retrain XGBoost with TF-IDF")
            print("   → Run: python option_b_retrain_xgboost_tfidf.py")
        else:
            print("   → Verify your model_1_xgboost.pkl file is correct")
            print("   → Check if it matches the training notebook")
    
except Exception as e:
    print(f"✗ XGBoost prediction failed: {e}")
    print("\nThis likely means:")
    if xgb_features and xgb_features != 23:
        print(f"  → Feature dimension mismatch: model expects {xgb_features}, got 23")
        print("  → SOLUTION: Use Option B (retrain with TF-IDF)")
    else:
        print("  → Model file may be corrupted or incompatible")
        print("  → Try reloading or retraining the model")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test RandomForest (simplified test)
print(f"\nRandomForest test (simplified)...")
try:
    test_cleaned = test_text.lower()
    tfidf_features = rf_vectorizer.transform([test_cleaned])
    print(f"  TF-IDF shape: {tfidf_features.shape}")
    print("✓ RandomForest TF-IDF transform working")
except Exception as e:
    print(f"✗ RandomForest test failed: {e}")

# Summary
print("\n" + "=" * 80)
print("VERIFICATION SUMMARY")
print("=" * 80)

success = True
warnings = []

if xgb_features != 23:
    success = False
    warnings.append(f"XGBoost expects {xgb_features} features, not 23")

if features.shape != (1, 23):
    success = False
    warnings.append("Feature extraction not producing 23 features")

if xgb_score <= 0.4:
    success = False
    warnings.append(f"XGBoost not detecting obvious spam (scored {xgb_score:.4f})")

if success and xgb_score > 0.6:
    print("\n✅ ALL CHECKS PASSED!")
    print("\nYour backend setup is correct:")
    print("  • XGBoost expects 23 features ✓")
    print("  • Feature extraction produces 23 features ✓")
    print("  • Models can make predictions ✓")
    print("  • Predictions are sensible ✓")
    print(f"  • Artifacts directory: {ARTIFACT_DIR}")
    
    print("\n📋 Next steps:")
    print("  1. Copy corrected_predict_service.py to your services/ directory")
    print("  2. Update the ARTIFACT_DIR path in model_loader.py if needed")
    print("  3. Start your FastAPI server")
    print("  4. Test predictions via API")
    
else:
    print("\n⚠ ISSUES DETECTED")
    print("\n🔴 Problems found:")
    for warning in warnings:
        print(f"  • {warning}")
    
    print("\n💡 Recommended solutions:")
    if xgb_features and xgb_features != 23:
        print("\n  OPTION B (Recommended): Retrain XGBoost with TF-IDF")
        print(f"    Your XGBoost model expects {xgb_features} features (likely TF-IDF)")
        print("    This means it wasn't trained on 23 engineered features")
        print("    → Use option_b_retrain_xgboost_tfidf.py to retrain")
        print("    → This creates a unified TF-IDF pipeline for both models")
        print("    → Takes 1-2 hours but is cleaner long-term")
    else:
        print("\n  Check your model file:")
        print("    → Ensure model_1_xgboost.pkl is from the correct training run")
        print("    → Verify it was trained on 23 engineered features")
        print("    → Consider retraining if uncertain")

print("\n" + "=" * 80)
print(f"\n📁 Artifacts location: {ARTIFACT_DIR}")
print("=" * 80)