// database.js
// This file creates our SQLite database and all the tables we need.
// SQLite stores everything in a single file (punctuality.db) — no server needed!

const Database = require('better-sqlite3');
const path = require('path');

// Create (or open) the database file in the backend folder
const db = new Database(path.join(__dirname, '../punctuality.db'));

// Enable Write-Ahead Logging for better performance
db.pragma('journal_mode = WAL');

// Create the USERS table
// This stores everyone who signs up to the app
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT    UNIQUE NOT NULL,
    password   TEXT    NOT NULL,
    full_name  TEXT    NOT NULL,
    role       TEXT    DEFAULT 'employee',
    home_lat   REAL,
    home_lng   REAL,
    work_lat   REAL,
    work_lng   REAL,
    created_at TEXT    DEFAULT (datetime('now'))
  )
`);

// Create the TRIPS table
// This records every journey a user makes
db.exec(`
  CREATE TABLE IF NOT EXISTS trips (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL,
    origin_lat       REAL    NOT NULL,
    origin_lng       REAL    NOT NULL,
    dest_lat         REAL    NOT NULL,
    dest_lng         REAL    NOT NULL,
    planned_arrival  TEXT    NOT NULL,
    actual_arrival   TEXT,
    delay_minutes    INTEGER DEFAULT 0,
    status           TEXT    DEFAULT 'pending',
    weather_data     TEXT,
    created_at       TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create the GPS_POINTS table
// This stores every GPS location recorded during a trip
db.exec(`
  CREATE TABLE IF NOT EXISTS gps_points (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id    INTEGER NOT NULL,
    lat        REAL    NOT NULL,
    lng        REAL    NOT NULL,
    speed      REAL    DEFAULT 0,
    recorded_at TEXT   DEFAULT (datetime('now')),
    FOREIGN KEY (trip_id) REFERENCES trips(id)
  )
`);

// Create the PREDICTIONS table
// This stores what the AI predicted for each trip
db.exec(`
  CREATE TABLE IF NOT EXISTS predictions (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id               INTEGER NOT NULL,
    delay_probability     REAL,
    predicted_delay_min   REAL,
    cause                 TEXT,
    severity_score        INTEGER,
    recommended_departure TEXT,
    created_at            TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (trip_id) REFERENCES trips(id)
  )
`);

// Create the DELAY_REPORTS table
// This stores the auto-generated justification reports
db.exec(`
  CREATE TABLE IF NOT EXISTS delay_reports (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id            INTEGER NOT NULL,
    user_id            INTEGER NOT NULL,
    validity_score     INTEGER DEFAULT 0,
    validation_status  TEXT    DEFAULT 'pending',
    justification_text TEXT,
    delay_minutes      INTEGER DEFAULT 0,
    cause              TEXT,
    created_at         TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (trip_id) REFERENCES trips(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create the NOTIFICATIONS table
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    trip_id    INTEGER,
    type       TEXT    NOT NULL,
    title      TEXT    NOT NULL,
    body       TEXT    NOT NULL,
    is_read    INTEGER DEFAULT 0,
    created_at TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

console.log('✅ Database connected and all tables created');

module.exports = db;