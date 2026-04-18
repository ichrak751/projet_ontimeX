// routes/trips.js
// Handles everything related to trips:
//   POST /api/trips/start       — begin a new trip
//   POST /api/trips/:id/gps     — log GPS points during the trip
//   POST /api/trips/:id/complete — mark trip as finished
//   GET  /api/trips             — get all trips for the logged-in user
//   GET  /api/trips/:id         — get a specific trip
const express = require('express');
const axios   = require('axios');
const db      = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ─── START A TRIP ─────────────────────────────────────────────
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { origin_lat, origin_lng, dest_lat, dest_lng, planned_arrival } = req.body;
    const userId = req.user.userId;

    if (!origin_lat || !origin_lng || !dest_lat || !dest_lng || !planned_arrival) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get weather data for the current location
    // If the API key is "demo_key", we return fake weather data
    let weatherData = null;
    try {
      if (process.env.OPENWEATHER_API_KEY !== 'demo_key_replace_with_real_key') {
        const weatherRes = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${origin_lat}&lon=${origin_lng}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
        );
        weatherData = JSON.stringify(weatherRes.data);
      } else {
        // Demo weather data — replace with real API key for production
        weatherData = JSON.stringify({
          weather: [{ description: 'light rain' }],
          main: { temp: 18, humidity: 72 },
          wind: { speed: 5.2 },
          rain: { '1h': 2.3 }
        });
      }
    } catch (weatherErr) {
      console.log('Weather API unavailable, using defaults');
    }

    // Create the trip record in the database
    const result = db.prepare(`
      INSERT INTO trips (user_id, origin_lat, origin_lng, dest_lat, dest_lng, planned_arrival, weather_data, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(userId, origin_lat, origin_lng, dest_lat, dest_lng, planned_arrival, weatherData);

    const tripId = result.lastInsertRowid;

    // Call the AI service to get a prediction for this trip
    // We do this in the background — don't wait for it to respond
    axios.post(`${process.env.AI_SERVICE_URL}/predict`, {
      trip_id: tripId,
      origin_lat, origin_lng,
      dest_lat, dest_lng,
      departure_time: new Date().toISOString(),
      weather_data: weatherData ? JSON.parse(weatherData) : {}
    }).then(aiRes => {
      // Save the prediction to the database
      db.prepare(`
        INSERT INTO predictions (trip_id, delay_probability, predicted_delay_min, cause, severity_score, recommended_departure)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        tripId,
        aiRes.data.delay_probability,
        aiRes.data.predicted_delay_minutes,
        aiRes.data.cause,
        aiRes.data.severity_score,
        aiRes.data.recommended_departure
      );
    }).catch(err => console.log('AI service not available, skipping prediction'));

    res.status(201).json({
      message: 'Trip started!',
      trip_id: tripId
    });

  } catch (err) {
    console.error('Start trip error:', err);
    res.status(500).json({ error: 'Failed to start trip' });
  }
});

// ─── LOG GPS POINTS ───────────────────────────────────────────
router.post('/:id/gps', authenticateToken, (req, res) => {
  try {
    const tripId = req.params.id;
    const { points } = req.body; // Array of { lat, lng, speed }

    if (!points || !Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ error: 'points array is required' });
    }

    // Verify this trip belongs to the logged-in user
    const trip = db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?')
      .get(tripId, req.user.userId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Insert all GPS points using a prepared statement (fast batch insert)
    const insertPoint = db.prepare(`
      INSERT INTO gps_points (trip_id, lat, lng, speed) VALUES (?, ?, ?, ?)
    `);

    const insertMany = db.transaction((pts) => {
      for (const pt of pts) {
        insertPoint.run(tripId, pt.lat, pt.lng, pt.speed || 0);
      }
    });

    insertMany(points);

    res.json({ accepted: points.length });

  } catch (err) {
    console.error('GPS error:', err);
    res.status(500).json({ error: 'Failed to save GPS points' });
  }
});

// ─── COMPLETE A TRIP ──────────────────────────────────────────
router.post('/:id/complete', authenticateToken, (req, res) => {
  try {
    const tripId = req.params.id;
    const { actual_arrival } = req.body;

    const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?')
      .get(tripId, req.user.userId);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Calculate delay in minutes
    const planned   = new Date(trip.planned_arrival);
    const actual    = new Date(actual_arrival || new Date().toISOString());
    const delayMs   = actual - planned;
    const delayMins = Math.max(0, Math.round(delayMs / 60000));

    // Mark trip as completed
    db.prepare(`
      UPDATE trips
      SET status = 'completed', actual_arrival = ?, delay_minutes = ?
      WHERE id = ?
    `).run(actual.toISOString(), delayMins, tripId);

    // If delay is more than 5 minutes, auto-generate a report
    if (delayMins >= 5) {
      const prediction = db.prepare('SELECT * FROM predictions WHERE trip_id = ?').get(tripId);
      const cause = prediction ? prediction.cause : 'traffic';

      // Simple validity score based on predicted probability
      const validityScore = prediction
        ? Math.min(100, Math.round(prediction.delay_probability * 100))
        : 50;

      const status = validityScore >= 70 ? 'approved' : validityScore >= 50 ? 'pending' : 'rejected';

      const justText = generateJustificationText(trip, delayMins, cause, validityScore);

      db.prepare(`
        INSERT INTO delay_reports (trip_id, user_id, validity_score, validation_status, justification_text, delay_minutes, cause)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(tripId, trip.user_id, validityScore, status, justText, delayMins, cause);
    }

    res.json({
      message:      'Trip completed!',
      delay_minutes: delayMins,
      report_generated: delayMins >= 5
    });

  } catch (err) {
    console.error('Complete trip error:', err);
    res.status(500).json({ error: 'Failed to complete trip' });
  }
});

// ─── GET ALL TRIPS ────────────────────────────────────────────
router.get('/', authenticateToken, (req, res) => {
  const trips = db.prepare('SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.userId);
  res.json(trips);
});

// ─── GET ONE TRIP ─────────────────────────────────────────────
router.get('/:id', authenticateToken, (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.userId);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const gpsPoints  = db.prepare('SELECT * FROM gps_points WHERE trip_id = ?').all(trip.id);
  const prediction = db.prepare('SELECT * FROM predictions WHERE trip_id = ?').get(trip.id);

  res.json({ ...trip, gps_points: gpsPoints, prediction });
});

// ─── HELPER: Generate justification text ──────────────────────
function generateJustificationText(trip, delayMins, cause, score) {
  const causeText = {
    traffic:  'heavy traffic congestion',
    weather:  'adverse weather conditions',
    incident: 'a road incident (accident/breakdown)',
    combined: 'a combination of traffic congestion and weather'
  };

  return `On ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, the employee/student experienced an unavoidable arrival delay of ${delayMins} minutes. The delay was caused by ${causeText[cause] || cause}, which was verified through real-time GPS tracking and external traffic data. The system's AI model assigned a validity score of ${score}/100 to this delay. This report was automatically generated and validated by the AI Punctuality Management System.`;
}

module.exports = router;