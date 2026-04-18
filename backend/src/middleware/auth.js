// auth.js
// This "middleware" runs BEFORE our route handlers.
// It checks if the request has a valid login token.
// If not, it blocks the request and returns a 401 error.

const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  // The token comes in the request header like:
  // Authorization: Bearer eyJhbGciOiJIUzI1N...
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Please log in first.' });
  }

  try {
    // Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach the user info to the request so routes can use it
    req.user = decoded;
    // Move on to the actual route handler
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token is invalid or expired. Please log in again.' });
  }
}

module.exports = { authenticateToken };