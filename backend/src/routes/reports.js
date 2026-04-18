// routes/reports.js
// Regular users see their own reports.
// Managers see ALL reports from ALL users.

const express = require('express')
const db      = require('../database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// ─── GET REPORTS (role-aware) ──────────────────────────────
router.get('/', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?')
    .get(req.user.userId)

  let reports

  if (user.role === 'manager') {
    // Managers see every report from every user
    reports = db.prepare(`
      SELECT r.*,
             u.full_name, u.email,
             t.planned_arrival, t.actual_arrival,
             t.origin_lat, t.origin_lng, t.dest_lat, t.dest_lng
      FROM delay_reports r
      JOIN users u ON r.user_id = u.id
      JOIN trips t ON r.trip_id = t.id
      ORDER BY r.created_at DESC
    `).all()
  } else {
    // Regular users only see their own reports
    reports = db.prepare(`
      SELECT r.*,
             t.planned_arrival, t.actual_arrival
      FROM delay_reports r
      JOIN trips t ON r.trip_id = t.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).all(req.user.userId)
  }

  res.json(reports)
})

// ─── GET ONE REPORT ────────────────────────────────────────
router.get('/:id', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?')
    .get(req.user.userId)

  // Managers can view any report, users only their own
  const whereClause = user.role === 'manager'
    ? 'WHERE r.id = ?'
    : 'WHERE r.id = ? AND r.user_id = ' + req.user.userId

  const report = db.prepare(`
    SELECT r.*,
           u.full_name, u.email,
           t.planned_arrival, t.actual_arrival, t.weather_data
    FROM delay_reports r
    JOIN users u ON r.user_id = u.id
    JOIN trips t ON r.trip_id = t.id
    ${whereClause}
  `).get(req.params.id)

  if (!report) return res.status(404).json({ error: 'Report not found' })
  res.json(report)
})

// ─── MANAGER: APPROVE OR REJECT A REPORT ──────────────────
router.patch('/:id/status', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?')
    .get(req.user.userId)

  if (user.role !== 'manager') {
    return res.status(403).json({ error: 'Only managers can approve or reject reports' })
  }

  const { status } = req.body // 'approved' or 'rejected'
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved or rejected' })
  }

  db.prepare('UPDATE delay_reports SET validation_status = ? WHERE id = ?')
    .run(status, req.params.id)

  res.json({ message: `Report ${status} successfully` })
})

// ─── MANAGER: GET ALL EMPLOYEES ────────────────────────────
router.get('/manager/employees', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?')
    .get(req.user.userId)

  if (user.role !== 'manager') {
    return res.status(403).json({ error: 'Access denied' })
  }

  const employees = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.role, u.created_at,
           COUNT(t.id) as total_trips,
           SUM(CASE WHEN t.delay_minutes > 5 THEN 1 ELSE 0 END) as delayed_trips
    FROM users u
    LEFT JOIN trips t ON u.id = t.user_id
    WHERE u.role != 'manager'
    GROUP BY u.id
    ORDER BY u.full_name
  `).all()

  res.json(employees)
})

module.exports = router