// routes/predictions.js
//   GET  /api/predictions/pre-trip  — get AI prediction before a trip
//   GET  /api/predictions/recommendation — get departure recommendation

const express = require('express');
const axios   = require('axios');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ─── PRE-TRIP PREDICTION ──────────────────────────────────────
router.get('/pre-trip', authenticateToken, async (req, res) => {
  try {
    const { origin_lat, origin_lng, dest_lat, dest_lng, departure_time } = req.query;

    if (!origin_lat || !dest_lat) {
      return res.status(400).json({ error: 'origin and destination coordinates required' });
    }

    try {
      // Try to call the Python AI service
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/predict`, {
        origin_lat:     parseFloat(origin_lat),
        origin_lng:     parseFloat(origin_lng),
        dest_lat:       parseFloat(dest_lat),
        dest_lng:       parseFloat(dest_lng),
        departure_time: departure_time || new Date().toISOString()
      }, { timeout: 5000 });

      res.json(aiResponse.data);

    } catch (aiErr) {
      // AI service is down — return a sensible fallback
      console.log('AI service unavailable, using fallback prediction');
      const hour = new Date().getHours();
      const isPeak = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);

      res.json({
        delay_probability:       isPeak ? 0.65 : 0.25,
        predicted_delay_minutes: isPeak ? 12 : 4,
        confidence_lower:        isPeak ? 8 : 2,
        confidence_upper:        isPeak ? 18 : 8,
        cause:                   isPeak ? 'traffic' : 'none',
        severity_score:          isPeak ? 65 : 20,
        source:                  'fallback',
        note:                    'AI service unavailable — using time-of-day heuristic'
      });
    }

  } catch (err) {
    console.error('Prediction error:', err);
    res.status(500).json({ error: 'Failed to get prediction' });
  }
});

// ─── DEPARTURE RECOMMENDATION ─────────────────────────────────
router.get('/recommendation', authenticateToken, async (req, res) => {
  try {
    const { required_arrival } = req.query;
    if (!required_arrival) {
      return res.status(400).json({ error: 'required_arrival datetime is needed' });
    }

    const arrival  = new Date(required_arrival);
    const hour = arrival.getHours();
    const isPeak = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);

    // Buffer times: peak hours need more buffer
    const bufferMinutes = isPeak ? 20 : 8;
    const recommended = new Date(arrival.getTime() - bufferMinutes * 60000);

    res.json({
      recommended_departure: recommended.toISOString(),
      buffer_minutes:        bufferMinutes,
      risk_tier:             isPeak ? 'caution' : 'safe',
      reason:                isPeak ? 'Peak hour traffic expected' : 'Normal traffic conditions'
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to get recommendation' });
  }
});

module.exports = router;