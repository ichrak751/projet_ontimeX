# main.py
# This is the FastAPI web server for the AI service.
# It receives prediction requests from the Node.js backend
# and returns predictions from the machine learning model.

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import math

# Import our ML model
from model import predictor

app = FastAPI(
    title="Punctuality AI Service",
    description="Machine learning delay prediction API",
    version="1.0.0"
)

# Allow requests from our Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


# ──────────────────────────────────────────────────────────────
# Request / Response Models (Pydantic validates the input for us)
# ──────────────────────────────────────────────────────────────

class PredictionRequest(BaseModel):
    trip_id:        Optional[int] = None
    origin_lat:     float
    origin_lng:     float
    dest_lat:       float
    dest_lng:       float
    departure_time: Optional[str] = None
    weather_data:   Optional[dict] = {}


# ──────────────────────────────────────────────────────────────
# Helper: Extract features from a request
# ──────────────────────────────────────────────────────────────

def extract_features(req: PredictionRequest) -> dict:
    """Convert a PredictionRequest into the feature dict the model expects."""

    # Parse departure time
    if req.departure_time:
        dt = datetime.fromisoformat(req.departure_time.replace('Z', '+00:00'))
    else:
        dt = datetime.now()

    hour        = dt.hour
    day_of_week = dt.weekday()  # 0=Monday, 6=Sunday
    is_weekend  = 1 if day_of_week >= 5 else 0
    is_peak     = 1 if ((7 <= hour <= 9) or (16 <= hour <= 19)) and not is_weekend else 0

    # Estimate distance using the Haversine formula
    # (great-circle distance between two GPS points)
    R   = 6371  # Earth radius in km
    lat1, lng1 = math.radians(req.origin_lat), math.radians(req.origin_lng)
    lat2, lng2 = math.radians(req.dest_lat),   math.radians(req.dest_lng)
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlng/2)**2
    distance_km = max(1, R * 2 * math.asin(math.sqrt(a)))

    # Extract weather features
    weather     = req.weather_data or {}
    main_w      = weather.get('main', {})
    rain_w      = weather.get('rain', {})
    rain_intensity = rain_w.get('1h', 0.0)
    temperature    = main_w.get('temp', 20.0)

    # Simulate congestion based on hour (in production: use live traffic API)
    congestion_base = 7.5 if is_peak else 2.5
    import random; random.seed(hour)  # Deterministic for same hour
    congestion = min(10, congestion_base + random.uniform(-1, 1.5))

    return {
        'hour':           hour,
        'day_of_week':    day_of_week,
        'congestion':     congestion,
        'rain_intensity': rain_intensity,
        'temperature':    temperature,
        'incident':       0,  # In production: check live incident APIs
        'distance_km':    distance_km,
        'is_weekend':     is_weekend,
        'is_peak':        is_peak
    }


# ──────────────────────────────────────────────────────────────
# API ENDPOINTS
# ──────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "AI Service is running!", "model": "GradientBoosting Ensemble v1.0"}

@app.post("/predict")
def predict_delay(req: PredictionRequest):
    """
    Main prediction endpoint.
    Receives trip details and returns delay probability + magnitude.
    """
    try:
        features = extract_features(req)
        result   = predictor.predict(features)

        # Add recommended departure (buffer depends on risk)
        buffer_min = 20 if result['delay_probability'] > 0.6 else 10
        rec_departure = (datetime.now() - timedelta(minutes=buffer_min)).isoformat()

        result["recommended_departure"] = rec_departure
        result["trip_id"] = req.trip_id
        result["features_used"] = features  # For transparency/explainability

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "OK", "models_loaded": True}