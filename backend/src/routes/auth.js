// routes/auth.js
// Two endpoints:
//   POST /api/auth/register  — create a new account
//   POST /api/auth/login     — log in and get a token

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../database');

const router = express.Router();

// ─── REGISTER ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    // Validate — make sure all required fields are present
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'email, password, and full_name are required' });
    }

    // Check if this email is already registered
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'This email is already registered' });
    }

    // Hash the password — NEVER store plain text passwords!
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const result = db.prepare(`
      INSERT INTO users (email, password, full_name, role)
      VALUES (?, ?, ?, ?)
    `).run(email, hashedPassword, full_name, role || 'employee');

    // Create a login token for the new user
    const token = jwt.sign(
      { userId: result.lastInsertRowid, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: result.lastInsertRowid, email, full_name, role: role || 'employee' }
    });

  } catch (err) {
  console.error('Register error:', err);
  res.status(500).json({ error: err.message });
}
});

// ─── LOGIN ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // Find the user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }

    // Compare the given password with the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }

    // Create a JWT token valid for 7 days
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id:        user.id,
        email:     user.email,
        full_name: user.full_name,
        role:      user.role
      }
    });

  } catch (err) {
  console.error('Register error:', err);
  res.status(500).json({ error: err.message });
}
});

module.exports = router;