// routes/reports.js
//   GET /api/reports         — get all reports for the logged-in user
//   GET /api/reports/:id     — get a specific report

const express = require('express');
const db      = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const reports = db.prepare(`
    SELECT r.*, t.origin_lat, t.origin_lng, t.dest_lat, t.dest_lng,
           t.planned_arrival, t.actual_arrival
    FROM delay_reports r
    JOIN trips t ON r.trip_id = t.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `).all(req.user.userId);

  res.json(reports);
});

router.get('/:id', authenticateToken, (req, res) => {
  const report = db.prepare(`
    SELECT r.*, t.origin_lat, t.origin_lng, t.dest_lat, t.dest_lng,
           t.planned_arrival, t.actual_arrival, t.weather_data,
           u.full_name, u.email
    FROM delay_reports r
    JOIN trips t ON r.trip_id = t.id
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ? AND r.user_id = ?
  `).get(req.params.id, req.user.userId);

  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
});

module.exports = router;