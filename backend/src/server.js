// server.js
// This is the main file that starts our Express web server.
// It loads all the routes and begins listening for requests.

require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const authRoutes  = require('./routes/auth');
const tripRoutes  = require('./routes/trips');
const predRoutes  = require('./routes/predictions');
const repRoutes   = require('./routes/reports');

// This line is what creates the database and tables
require('./database');

const app = express();

// ─── MIDDLEWARE ────────────────────────────────────────────────
// These run on EVERY request before the route handlers
app.use(cors()); // Allow requests from any origin (for development)
app.use(express.json()); // Parse JSON request bodies

// ─── ROUTES ───────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/trips',       tripRoutes);
app.use('/api/predictions', predRoutes);
app.use('/api/reports',     repRoutes);

// ─── HEALTH CHECK ─────────────────────────────────────────────
// A simple endpoint to check if the server is running
app.get('/health', (req, res) => {
  res.json({
    status:    'OK',
    message:   'Punctuality API is running!',
    timestamp: new Date().toISOString()
  });
});

// ─── 404 HANDLER ──────────────────────────────────────────────
// If no route matched, return a friendly 404
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── START SERVER ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health\n`);
});

