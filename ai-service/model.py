# model.py
# This file contains the machine learning model for delay prediction.
# We use scikit-learn's GradientBoostingClassifier (similar to XGBoost).
# The model is trained on synthetic (fake) data to demonstrate the concept.
# In production, you would train it on months of real trip data.

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, mean_absolute_error
import joblib
import os
import json

# ──────────────────────────────────────────────────────────────
# STEP 1: Generate Synthetic Training Data
# In a real system, this would come from months of real trips.
# Here we create realistic fake data that teaches the model
# to recognize patterns like "rush hour = more delays"
# ──────────────────────────────────────────────────────────────

def generate_training_data(n_samples=5000):
    """Generate realistic synthetic training data."""
    np.random.seed(42)  # Makes results reproducible

    data = []

    for _ in range(n_samples):
        # Random departure hour (0-23)
        hour = np.random.randint(0, 24)

        # Day of week (0=Monday, 6=Sunday)
        day_of_week = np.random.randint(0, 7)

        # Congestion index (0=free flow, 10=gridlock)
        # Higher during rush hours on weekdays
        is_peak = (hour in range(7, 10) or hour in range(16, 20)) and day_of_week < 5
        base_congestion = 7.0 if is_peak else 2.5
        congestion = np.clip(base_congestion + np.random.normal(0, 1.5), 0, 10)

        # Rain intensity (mm/h) — higher rain = more delays
        rain_intensity = max(0, np.random.exponential(2) if np.random.random() < 0.3 else 0)

        # Temperature (affects driving behavior)
        temperature = np.random.normal(20, 8)

        # Incident on route (0 or 1)
        incident = 1 if np.random.random() < 0.08 else 0

        # Distance in km
        distance_km = np.random.uniform(2, 30)

        # Is weekend?
        is_weekend = 1 if day_of_week >= 5 else 0

        # ── CALCULATE DELAY (the "truth" we're teaching the model) ──
        # This formula represents real-world delay logic
        delay_minutes = (
            congestion * 1.5          # congestion is the main driver
            + rain_intensity * 0.8    # rain adds delay
            + incident * 12           # incidents cause big delays
            + distance_km * 0.1      # longer trips = more exposure
            - is_weekend * 3         # weekends have less traffic
            + np.random.normal(0, 2) # random noise
        )
        delay_minutes = max(0, delay_minutes)

        # Is this a "significant delay"? (more than 5 minutes)
        is_delayed = 1 if delay_minutes >= 5 else 0

        data.append({
            'hour':          hour,
            'day_of_week':   day_of_week,
            'congestion':    congestion,
            'rain_intensity': rain_intensity,
            'temperature':   temperature,
            'incident':      incident,
            'distance_km':   distance_km,
            'is_weekend':    is_weekend,
            'is_peak':       1 if is_peak else 0,
            'delay_minutes': delay_minutes,
            'is_delayed':    is_delayed
        })

    return pd.DataFrame(data)


# ──────────────────────────────────────────────────────────────
# STEP 2: The Feature columns (inputs to the model)
# ──────────────────────────────────────────────────────────────

FEATURE_COLUMNS = [
    'hour', 'day_of_week', 'congestion',
    'rain_intensity', 'temperature', 'incident',
    'distance_km', 'is_weekend', 'is_peak'
]

MODEL_PATH      = 'delay_classifier.pkl'
REGRESSOR_PATH  = 'delay_regressor.pkl'
SCALER_PATH     = 'scaler.pkl'


# ──────────────────────────────────────────────────────────────
# STEP 3: Train and Save the Models
# ──────────────────────────────────────────────────────────────

def train_and_save():
    """Train models on synthetic data and save to disk."""
    print("🤖 Generating training data...")
    df = generate_training_data(5000)

    X = df[FEATURE_COLUMNS]
    y_class = df['is_delayed']     # Will there be a delay? (yes/no)
    y_reg   = df['delay_minutes']  # How many minutes delayed?

    # Scale features so all values are in a similar range
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, yc_train, yc_test, yr_train, yr_test = train_test_split(
        X_scaled, y_class, y_reg, test_size=0.2, random_state=42
    )

    # ── CLASSIFIER: Will there be a delay? ──
    print("🤖 Training delay classifier...")
    classifier = GradientBoostingClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42
    )
    classifier.fit(X_train, yc_train)
    auc = roc_auc_score(yc_test, classifier.predict_proba(X_test)[:, 1])
    print(f"✅ Classifier AUC-ROC: {auc:.3f}")

    # ── REGRESSOR: How many minutes will the delay be? ──
    print("🤖 Training delay magnitude regressor...")
    regressor = GradientBoostingRegressor(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42
    )
    regressor.fit(X_train, yr_train)
    mae = mean_absolute_error(yr_test, regressor.predict(X_test))
    print(f"✅ Regressor MAE: {mae:.2f} minutes")

    # Save all three objects to disk
    joblib.dump(classifier, MODEL_PATH)
    joblib.dump(regressor,  REGRESSOR_PATH)
    joblib.dump(scaler,     SCALER_PATH)
    print("💾 Models saved to disk!")


# ──────────────────────────────────────────────────────────────
# STEP 4: Load Models and Make Predictions
# ──────────────────────────────────────────────────────────────

class DelayPredictor:
    def __init__(self):
        # Load or train models when the class is created
        if not os.path.exists(MODEL_PATH):
            print("No saved model found. Training from scratch...")
            train_and_save()

        self.classifier = joblib.load(MODEL_PATH)
        self.regressor  = joblib.load(REGRESSOR_PATH)
        self.scaler     = joblib.load(SCALER_PATH)
        print("✅ Models loaded and ready!")

    def predict(self, features: dict) -> dict:
        """
        Takes a dictionary of features and returns predictions.
        features: { hour, day_of_week, congestion, rain_intensity,
                    temperature, incident, distance_km, is_weekend, is_peak }
        """
        # Build a DataFrame from the features (same format as training)
        X = pd.DataFrame([{col: features.get(col, 0) for col in FEATURE_COLUMNS}])
        X_scaled = self.scaler.transform(X)

        # Classification: probability of a delay
        delay_prob = float(self.classifier.predict_proba(X_scaled)[0][1])

        # Regression: expected delay in minutes
        predicted_min = float(max(0, self.regressor.predict(X_scaled)[0]))

        # Determine cause based on feature importance
        cause = 'none'
        if features.get('incident') == 1:
            cause = 'incident'
        elif features.get('congestion', 0) > 6 and features.get('rain_intensity', 0) > 3:
            cause = 'combined'
        elif features.get('congestion', 0) > 6:
            cause = 'traffic'
        elif features.get('rain_intensity', 0) > 3:
            cause = 'weather'

        # Severity score (0-100)
        severity = int(min(100, delay_prob * predicted_min * 2.5))

        return {
            "delay_probability":       round(delay_prob, 3),
            "predicted_delay_minutes": round(predicted_min, 1),
            "confidence_lower":        round(predicted_min * 0.7, 1),
            "confidence_upper":        round(predicted_min * 1.4, 1),
            "cause":                   cause,
            "severity_score":          severity
        }


# Create a single global predictor instance
predictor = DelayPredictor()


# Run this file directly to retrain models:
if __name__ == "__main__":
    train_and_save()
    print("\n📊 Test prediction:")
    result = predictor.predict({
        'hour': 8, 'day_of_week': 1, 'congestion': 8,
        'rain_intensity': 5, 'temperature': 15,
        'incident': 0, 'distance_km': 12,
        'is_weekend': 0, 'is_peak': 1
    })
    print(json.dumps(result, indent=2))