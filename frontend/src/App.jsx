// App.jsx — Complete Punctuality System Frontend
// Features:
//   - Login / Register
//   - Home Dashboard with AI predictions
//   - Start Trip with AUTO GPS detection
//   - Reports screen for employees
//   - Manager Dashboard with approve/reject
//
// Paste this entire file into: frontend/src/App.jsx

import { useState, useEffect } from 'react'
import axios from 'axios'

// ── API CLIENT ────────────────────────────────────────────────
// All requests go through this axios instance.
// Change the baseURL if your backend runs on a different port.
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
})

// Add the JWT token to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── STYLES ────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    fontFamily: 'Segoe UI, Arial, sans-serif',
    background: '#f5f5f0',
    color: '#1a1a18',
  },
  navbar: {
    background: '#042C53',
    color: 'white',
    padding: '14px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navTitle: { fontSize: '18px', fontWeight: '700' },
  navScore: {
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '20px',
    padding: '4px 14px',
    fontSize: '13px',
  },
  main: {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '24px 16px',
  },
  card: {
    background: 'white',
    border: '1px solid #d3d1c7',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '14px',
    color: '#888780',
    marginBottom: '6px',
  },
  bigNum: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#185FA5',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d3d1c7',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '10px',
    boxSizing: 'border-box',
    background: 'white',
    color: '#1a1a18',
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: '#185FA5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '10px',
  },
  btnSecondary: {
    width: '100%',
    padding: '12px',
    background: 'white',
    color: '#185FA5',
    border: '1.5px solid #185FA5',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '10px',
  },
  badge: (color) => ({
    display: 'inline-block',
    padding: '3px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    background: { green: '#EAF3DE', amber: '#FAEEDA', red: '#FCEBEB', blue: '#E6F1FB' }[color] || '#F1EFE8',
    color:      { green: '#3B6D11', amber: '#854F0B', red: '#A32D2D', blue: '#185FA5' }[color] || '#444441',
  }),
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #d3d1c7',
    marginBottom: '20px',
  },
  tab: (active) => ({
    padding: '10px 18px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: active ? '600' : '400',
    borderBottom: active ? '2px solid #185FA5' : '2px solid transparent',
    color: active ? '#185FA5' : '#888780',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #185FA5' : '2px solid transparent',
  }),
  error: {
    background: '#FCEBEB',
    color: '#A32D2D',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '12px',
  },
  success: {
    background: '#EAF3DE',
    color: '#3B6D11',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '12px',
  },
  info: {
    background: '#E6F1FB',
    color: '#185FA5',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '12px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
}

// ─────────────────────────────────────────────────────────────
// AUTH SCREEN — Login and Register
// ─────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode,     setMode]     = useState('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const submit = async () => {
    setError(''); setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const body = mode === 'login'
        ? { email, password }
        : { email, password, full_name: name }
      const res = await api.post(endpoint, body)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      onLogin(res.data.user)
    } catch (err) {
      setError(err.response?.data?.error || 'Cannot connect to server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '360px', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>⏱</div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#042C53', margin: '0 0 6px' }}>
            OnTimeX
          </h1>
          <p style={{ color: '#888780', fontSize: '14px', margin: 0 }}>
            AI-powered delay management
          </p>
        </div>

        <div style={s.tabs}>
          <button style={s.tab(mode === 'login')}    onClick={() => { setMode('login');    setError('') }}>Log In</button>
          <button style={s.tab(mode === 'register')} onClick={() => { setMode('register'); setError('') }}>Register</button>
        </div>

        {error && <div style={s.error}>{error}</div>}

        {mode === 'register' && (
          <input
            style={s.input}
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}
        <input
          style={s.input}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          style={s.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <button style={s.btn} onClick={submit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#888780', marginTop: '8px' }}>
          {mode === 'login'
            ? "Don't have an account? Click Register above."
            : 'Already have an account? Click Log In above.'}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// HOME DASHBOARD
// ─────────────────────────────────────────────────────────────
function HomeDashboard({ user, trips, onStartTrip }) {
  const [prediction, setPrediction] = useState(null)
  const [rec,        setRec]        = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    // Fetch AI prediction for a demo route on load
    api.get('/predictions/pre-trip?origin_lat=36.8065&origin_lng=10.1815&dest_lat=36.8190&dest_lng=10.1657')
      .then(r => setPrediction(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))

    // Fetch departure recommendation for 9am today
    const arrival = new Date()
    arrival.setHours(9, 0, 0, 0)
    if (arrival < new Date()) arrival.setDate(arrival.getDate() + 1)
    api.get(`/predictions/recommendation?required_arrival=${arrival.toISOString()}`)
      .then(r => setRec(r.data))
      .catch(() => {})
  }, [])

  const completedTrips = trips.filter(t => t.status === 'completed')
  const delayedTrips   = trips.filter(t => t.delay_minutes > 5)
  const pctOnTime = completedTrips.length
    ? Math.round((1 - delayedTrips.length / completedTrips.length) * 100)
    : 100

  const riskColor = !prediction ? 'green'
    : prediction.delay_probability > 0.6  ? 'red'
    : prediction.delay_probability > 0.35 ? 'amber'
    : 'green'

  const riskLabel = riskColor === 'red' ? 'High Risk'
    : riskColor === 'amber' ? 'Caution' : 'On Track'

  return (
    <div>
      <h2 style={{ marginBottom: '4px' }}>
        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
        {user.full_name.split(' ')[0]}! 👋
      </h2>
      <p style={{ color: '#888780', fontSize: '13px', marginBottom: '20px' }}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {/* Stats */}
      <div style={s.grid2}>
        <div style={s.card}>
          <div style={s.cardTitle}>Punctuality score</div>
          <div style={{ ...s.bigNum, color: pctOnTime >= 80 ? '#3B6D11' : pctOnTime >= 60 ? '#854F0B' : '#A32D2D' }}>
            {pctOnTime}%
          </div>
          <div style={{ fontSize: '12px', color: '#888780', marginTop: '4px' }}>
            {completedTrips.length} trips recorded
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Delays (all time)</div>
          <div style={{ ...s.bigNum, color: delayedTrips.length > 0 ? '#A32D2D' : '#3B6D11' }}>
            {delayedTrips.length}
          </div>
          <div style={{ fontSize: '12px', color: '#888780', marginTop: '4px' }}>
            of {completedTrips.length} trips
          </div>
        </div>
      </div>

      {/* AI Prediction Card */}
      {loading && (
        <div style={s.card}>
          <div style={{ color: '#888780', fontSize: '14px' }}>Loading AI prediction...</div>
        </div>
      )}

      {!loading && prediction && (
        <div style={{
          ...s.card,
          borderLeft: `4px solid ${riskColor === 'red' ? '#A32D2D' : riskColor === 'amber' ? '#854F0B' : '#3B6D11'}`,
        }}>
          <div style={s.row}>
            <div style={{ ...s.cardTitle, marginBottom: 0 }}>AI Prediction — next commute</div>
            <span style={s.badge(riskColor)}>{riskLabel}</span>
          </div>

          <div style={{ fontSize: '18px', fontWeight: '600', margin: '10px 0 4px' }}>
            {Math.round(prediction.delay_probability * 100)}% chance of delay
            &nbsp;·&nbsp;
            Est. +{Math.round(prediction.predicted_delay_minutes)} min
          </div>

          {prediction.cause && prediction.cause !== 'none' && (
            <div style={{ fontSize: '13px', color: '#5f5e5a', marginBottom: '8px' }}>
              Main cause: <strong>{prediction.cause}</strong>
              &nbsp;·&nbsp;
              Severity: <strong>{prediction.severity_score}/100</strong>
            </div>
          )}

          {rec && (
            <div style={{ background: '#E6F1FB', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginTop: '8px' }}>
              Recommended departure:{' '}
              <strong>
                {new Date(rec.recommended_departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
              &nbsp;({rec.buffer_minutes} min buffer — {rec.reason})
            </div>
          )}

          {prediction.source === 'fallback' && (
            <div style={{ fontSize: '11px', color: '#888780', marginTop: '8px' }}>
              Note: AI service offline — using time-of-day estimate
            </div>
          )}
        </div>
      )}

      <button style={s.btn} onClick={onStartTrip}>
        Start New Trip
      </button>

      {/* Recent Trips */}
      <div style={s.card}>
        <div style={{ ...s.cardTitle, fontSize: '15px', fontWeight: '600', color: '#1a1a18', marginBottom: '14px' }}>
          Recent trips
        </div>
        {trips.length === 0 && (
          <div style={{ color: '#888780', fontSize: '14px' }}>
            No trips yet. Click "Start New Trip" to begin!
          </div>
        )}
        {trips.slice(0, 6).map(t => (
          <div key={t.id} style={{
            ...s.row,
            padding: '10px 0',
            borderBottom: '1px solid #f0efe9',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Trip #{t.id}</div>
              <div style={{ fontSize: '12px', color: '#888780' }}>
                {new Date(t.created_at).toLocaleDateString()} · {t.status}
              </div>
            </div>
            <span style={s.badge(t.delay_minutes > 5 ? 'red' : 'green')}>
              {t.delay_minutes > 5 ? `+${t.delay_minutes} min late` : 'On time'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// START TRIP SCREEN — with AUTO GPS
// ─────────────────────────────────────────────────────────────
function StartTripScreen({ onBack, onTripStarted }) {
  const [form, setForm] = useState({
    origin_lat:      '',
    origin_lng:      '',
    dest_lat:        '',
    dest_lng:        '',
    planned_arrival: '',
  })
  const [msg,       setMsg]       = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [tripId,    setTripId]    = useState(null)
  const [gpsStatus, setGpsStatus] = useState('')

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── AUTO-DETECT GPS LOCATION ON SCREEN OPEN ────────────────
  useEffect(() => {
    setGpsStatus('Detecting your location...')

    if (!navigator.geolocation) {
      setGpsStatus('GPS not supported. Enter coordinates manually.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(f => ({
          ...f,
          origin_lat: position.coords.latitude.toFixed(6),
          origin_lng: position.coords.longitude.toFixed(6),
        }))
        setGpsStatus('✅ Your location detected automatically!')
      },
      (err) => {
        setGpsStatus('Could not detect location automatically. Please type coordinates manually.')
        console.log('GPS error:', err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [])

  const startTrip = async () => {
    setError(''); setLoading(true)
    try {
      if (!form.origin_lat || !form.origin_lng || !form.dest_lat || !form.dest_lng) {
        setError('Please fill in all coordinates before starting.')
        setLoading(false)
        return
      }

      const res = await api.post('/trips/start', {
        origin_lat:      parseFloat(form.origin_lat),
        origin_lng:      parseFloat(form.origin_lng),
        dest_lat:        parseFloat(form.dest_lat),
        dest_lng:        parseFloat(form.dest_lng),
        planned_arrival: form.planned_arrival
          ? new Date(form.planned_arrival).toISOString()
          : new Date(Date.now() + 30 * 60000).toISOString(),
      })
      setTripId(res.data.trip_id)
      setMsg(`Trip #${res.data.trip_id} started successfully! Tracking is active.`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start trip. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const completeTrip = async () => {
    setLoading(true)
    try {
      const res = await api.post(`/trips/${tripId}/complete`, {
        actual_arrival: new Date().toISOString(),
      })
      const delay = res.data.delay_minutes
      setMsg(
        `Trip completed! ` +
        (delay > 5
          ? `You were ${delay} minutes late. A justification report has been generated automatically.`
          : `You arrived on time! Great job.`)
      )
      setTimeout(() => onTripStarted(), 2000)
    } catch (err) {
      setError('Failed to complete trip.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: '#185FA5', cursor: 'pointer', fontSize: '14px', marginBottom: '16px', padding: 0 }}
      >
        ← Back to Dashboard
      </button>
      <h2 style={{ marginBottom: '16px' }}>Start New Trip</h2>

      {error && <div style={s.error}>{error}</div>}
      {msg   && <div style={s.success}>{msg}</div>}

      {!tripId ? (
        <div style={s.card}>

          {/* GPS Status */}
          {gpsStatus && (
            <div style={gpsStatus.includes('✅') ? s.success : s.info}>
              {gpsStatus}
            </div>
          )}

          {/* Origin */}
          <div style={{ ...s.cardTitle, marginBottom: '8px' }}>
            Your current location (auto-filled from GPS)
          </div>
          <div style={s.grid2}>
            <div>
              <label style={{ fontSize: '12px', color: '#888780', display: 'block', marginBottom: '4px' }}>
                Latitude
              </label>
              <input
                style={s.input}
                placeholder="e.g. 36.8065"
                value={form.origin_lat}
                onChange={e => update('origin_lat', e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888780', display: 'block', marginBottom: '4px' }}>
                Longitude
              </label>
              <input
                style={s.input}
                placeholder="e.g. 10.1815"
                value={form.origin_lng}
                onChange={e => update('origin_lng', e.target.value)}
              />
            </div>
          </div>

          {/* Destination */}
          <div style={{ ...s.cardTitle, marginBottom: '4px' }}>Destination coordinates</div>
          <div style={{ fontSize: '12px', color: '#888780', marginBottom: '8px' }}>
            Tip: right-click any spot on Google Maps → first line shows coordinates
          </div>
          <div style={s.grid2}>
            <div>
              <label style={{ fontSize: '12px', color: '#888780', display: 'block', marginBottom: '4px' }}>
                Latitude
              </label>
              <input
                style={s.input}
                placeholder="e.g. 36.8978"
                value={form.dest_lat}
                onChange={e => update('dest_lat', e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888780', display: 'block', marginBottom: '4px' }}>
                Longitude
              </label>
              <input
                style={s.input}
                placeholder="e.g. 10.1657"
                value={form.dest_lng}
                onChange={e => update('dest_lng', e.target.value)}
              />
            </div>
          </div>

          {/* Planned arrival */}
          <div style={{ ...s.cardTitle, marginBottom: '8px' }}>Planned arrival time</div>
          <input
            style={s.input}
            type="datetime-local"
            onChange={e => update('planned_arrival', e.target.value)}
          />

          <button
            style={{
              ...s.btn,
              opacity: (!form.origin_lat || !form.dest_lat) ? 0.6 : 1,
            }}
            onClick={startTrip}
            disabled={loading}
          >
            {loading ? 'Starting...' : 'Start Trip & Enable Tracking'}
          </button>

          {(!form.origin_lat || !form.dest_lat) && (
            <div style={{ fontSize: '12px', color: '#888780', textAlign: 'center', marginTop: '4px' }}>
              Waiting for GPS or manual coordinates
            </div>
          )}
        </div>
      ) : (
        <div style={s.card}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            Trip #{tripId} is active
          </div>
          <div style={{ fontSize: '14px', color: '#5f5e5a', marginBottom: '20px' }}>
            GPS tracking is running. Click the button below when you arrive at your destination.
          </div>
          <button
            style={{ ...s.btn, background: '#A32D2D' }}
            onClick={completeTrip}
            disabled={loading}
          >
            {loading ? 'Completing...' : 'I Arrived — Complete Trip'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// REPORTS SCREEN — for regular employees
// ─────────────────────────────────────────────────────────────
function ReportsScreen() {
  const [reports,  setReports]  = useState([])
  const [selected, setSelected] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.get('/reports')
      .then(r => setReports(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── REPORT DETAIL ──
  if (selected) return (
    <div>
      <button
        onClick={() => setSelected(null)}
        style={{ background: 'none', border: 'none', color: '#185FA5', cursor: 'pointer', fontSize: '14px', marginBottom: '16px', padding: 0 }}
      >
        ← Back to Reports
      </button>

      <div style={{ ...s.card, borderTop: '4px solid #0F6E56' }}>
        <div style={s.row}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px' }}>
              Report #{selected.id}
            </div>
            <div style={{ fontSize: '13px', color: '#888780', marginTop: '2px' }}>
              Trip #{selected.trip_id} · {new Date(selected.created_at).toLocaleDateString()}
            </div>
          </div>
          <span style={s.badge(
            selected.validation_status === 'approved' ? 'green' :
            selected.validation_status === 'rejected' ? 'red' : 'amber'
          )}>
            {selected.validation_status}
          </span>
        </div>

        <hr style={{ margin: '14px 0', border: 'none', borderTop: '1px solid #f0efe9' }} />

        <div style={s.grid2}>
          <div>
            <div style={s.cardTitle}>Total delay</div>
            <strong style={{ fontSize: '20px' }}>{selected.delay_minutes} min</strong>
          </div>
          <div>
            <div style={s.cardTitle}>Validity score</div>
            <strong style={{ fontSize: '20px', color: selected.validity_score >= 70 ? '#3B6D11' : '#854F0B' }}>
              {selected.validity_score}/100
            </strong>
          </div>
          <div>
            <div style={s.cardTitle}>Cause</div>
            <strong>{selected.cause || 'unknown'}</strong>
          </div>
          <div>
            <div style={s.cardTitle}>Status</div>
            <strong>{selected.validation_status}</strong>
          </div>
        </div>

        <div style={{ marginTop: '14px' }}>
          <div style={{ ...s.cardTitle, marginBottom: '8px' }}>Official justification text</div>
          <div style={{
            background: '#f7f6f2',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            lineHeight: '1.8',
            color: '#1a1a18',
          }}>
            {selected.justification_text}
          </div>
        </div>

        <div style={{ marginTop: '16px', padding: '12px', background: '#E6F1FB', borderRadius: '8px', fontSize: '13px', color: '#185FA5' }}>
          This report was automatically generated and validated by the AI Punctuality System.
          {selected.validation_status === 'approved'
            ? ' It has been approved by your manager.'
            : selected.validation_status === 'rejected'
            ? ' It has been reviewed and rejected by your manager.'
            : ' It is awaiting manager review.'}
        </div>
      </div>
    </div>
  )

  // ── REPORTS LIST ──
  return (
    <div>
      <h2 style={{ marginBottom: '6px' }}>My Delay Reports</h2>
      <p style={{ color: '#888780', fontSize: '13px', marginBottom: '20px' }}>
        Reports are generated automatically when a trip delay exceeds 5 minutes.
      </p>

      {loading && (
        <div style={s.card}>
          <div style={{ color: '#888780' }}>Loading reports...</div>
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div style={s.card}>
          <div style={{ color: '#888780', textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
            <div>No delay reports yet.</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              Complete a trip with a delay of more than 5 minutes to generate one.
            </div>
          </div>
        </div>
      )}

      {reports.map(r => (
        <div
          key={r.id}
          style={{ ...s.card, cursor: 'pointer' }}
          onClick={() => setSelected(r)}
        >
          <div style={s.row}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '3px' }}>
                Report #{r.id} — {r.delay_minutes} min delay
              </div>
              <div style={{ fontSize: '12px', color: '#888780' }}>
                {new Date(r.created_at).toLocaleDateString()} · Cause: {r.cause || 'unknown'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={s.badge(
                r.validation_status === 'approved' ? 'green' :
                r.validation_status === 'rejected' ? 'red' : 'amber'
              )}>
                {r.validation_status}
              </span>
              <div style={{ fontSize: '11px', color: '#888780', marginTop: '4px' }}>
                Score: {r.validity_score}/100
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MANAGER DASHBOARD
// Only visible to users with role = 'manager'
// ─────────────────────────────────────────────────────────────
function ManagerDashboard() {
  const [reports,   setReports]   = useState([])
  const [employees, setEmployees] = useState([])
  const [view,      setView]      = useState('reports')
  const [selected,  setSelected]  = useState(null)
  const [msg,       setMsg]       = useState('')
  const [loading,   setLoading]   = useState(true)

  const loadData = () => {
    api.get('/reports').then(r => setReports(r.data)).catch(() => {})
    api.get('/reports/manager/employees').then(r => setEmployees(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const updateStatus = async (reportId, status) => {
    try {
      await api.patch(`/reports/${reportId}/status`, { status })
      setMsg(`Report ${status} successfully.`)
      loadData()
      if (selected) setSelected(prev => ({ ...prev, validation_status: status }))
    } catch (err) {
      setMsg('Failed to update report status.')
    }
  }

  const pendingCount   = reports.filter(r => r.validation_status === 'pending').length
  const approvedCount  = reports.filter(r => r.validation_status === 'approved').length
  const rejectedCount  = reports.filter(r => r.validation_status === 'rejected').length

  // ── REPORT DETAIL ──
  if (selected) return (
    <div>
      <button
        onClick={() => { setSelected(null); setMsg('') }}
        style={{ background: 'none', border: 'none', color: '#185FA5', cursor: 'pointer', fontSize: '14px', marginBottom: '16px', padding: 0 }}
      >
        ← Back to Reports
      </button>

      {msg && <div style={selected.validation_status === 'approved' ? s.success : selected.validation_status === 'rejected' ? s.error : s.info}>{msg}</div>}

      <div style={{ ...s.card, borderTop: '4px solid #0F6E56' }}>
        <div style={s.row}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px' }}>Report #{selected.id}</div>
            <div style={{ fontSize: '13px', color: '#888780', marginTop: '2px' }}>
              {selected.full_name} — {selected.email}
            </div>
          </div>
          <span style={s.badge(
            selected.validation_status === 'approved' ? 'green' :
            selected.validation_status === 'rejected' ? 'red' : 'amber'
          )}>
            {selected.validation_status}
          </span>
        </div>

        <hr style={{ margin: '14px 0', border: 'none', borderTop: '1px solid #f0efe9' }} />

        <div style={s.grid2}>
          <div><div style={s.cardTitle}>Employee</div><strong>{selected.full_name}</strong></div>
          <div><div style={s.cardTitle}>Delay</div><strong style={{ fontSize: '18px' }}>{selected.delay_minutes} min</strong></div>
          <div><div style={s.cardTitle}>Cause</div><strong>{selected.cause || 'unknown'}</strong></div>
          <div>
            <div style={s.cardTitle}>Validity score</div>
            <strong style={{ color: selected.validity_score >= 70 ? '#3B6D11' : '#854F0B' }}>
              {selected.validity_score}/100
            </strong>
          </div>
          <div><div style={s.cardTitle}>Date</div><strong>{new Date(selected.created_at).toLocaleDateString()}</strong></div>
          <div><div style={s.cardTitle}>Current status</div><strong>{selected.validation_status}</strong></div>
        </div>

        <div style={{ marginTop: '14px' }}>
          <div style={{ ...s.cardTitle, marginBottom: '8px' }}>Justification text (AI generated)</div>
          <div style={{
            background: '#f7f6f2',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            lineHeight: '1.8',
          }}>
            {selected.justification_text}
          </div>
        </div>

        {/* Approve / Reject — show for pending reports */}
        {selected.validation_status === 'pending' && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => updateStatus(selected.id, 'approved')}
              style={{ ...s.btn, background: '#3B6D11', flex: 1, marginBottom: 0 }}
            >
              Approve Report
            </button>
            <button
              onClick={() => updateStatus(selected.id, 'rejected')}
              style={{ ...s.btn, background: '#A32D2D', flex: 1, marginBottom: 0 }}
            >
              Reject Report
            </button>
          </div>
        )}

        {selected.validation_status !== 'pending' && (
          <div style={{ ...s.info, marginTop: '16px' }}>
            This report has already been {selected.validation_status}.
          </div>
        )}
      </div>
    </div>
  )

  // ── MAIN MANAGER VIEW ──
  return (
    <div>
      <h2 style={{ marginBottom: '4px' }}>Manager Dashboard</h2>
      <p style={{ color: '#888780', fontSize: '13px', marginBottom: '20px' }}>
        Review and manage employee delay reports
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={s.card}>
          <div style={s.cardTitle}>Pending</div>
          <div style={{ ...s.bigNum, color: pendingCount > 0 ? '#854F0B' : '#888780' }}>
            {pendingCount}
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Approved</div>
          <div style={{ ...s.bigNum, color: '#3B6D11' }}>{approvedCount}</div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Rejected</div>
          <div style={{ ...s.bigNum, color: '#A32D2D' }}>{rejectedCount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button style={s.tab(view === 'reports')} onClick={() => setView('reports')}>
          Delay Reports ({reports.length})
        </button>
        <button style={s.tab(view === 'employees')} onClick={() => setView('employees')}>
          Employees ({employees.length})
        </button>
      </div>

      {/* REPORTS LIST */}
      {view === 'reports' && (
        <div>
          {loading && <div style={s.card}><div style={{ color: '#888780' }}>Loading...</div></div>}
          {!loading && reports.length === 0 && (
            <div style={s.card}>
              <div style={{ color: '#888780', textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                No reports yet. Reports appear here when employees experience delays.
              </div>
            </div>
          )}
          {reports.map(r => (
            <div
              key={r.id}
              style={{ ...s.card, cursor: 'pointer' }}
              onClick={() => setSelected(r)}
            >
              <div style={s.row}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '3px' }}>
                    {r.full_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888780' }}>
                    {new Date(r.created_at).toLocaleDateString()} · {r.delay_minutes} min delay · {r.cause}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={s.badge(
                    r.validation_status === 'approved' ? 'green' :
                    r.validation_status === 'rejected' ? 'red' : 'amber'
                  )}>
                    {r.validation_status}
                  </span>
                  <div style={{ fontSize: '11px', color: '#888780', marginTop: '4px' }}>
                    Score: {r.validity_score}/100
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EMPLOYEES LIST */}
      {view === 'employees' && (
        <div>
          {employees.length === 0 && (
            <div style={s.card}>
              <div style={{ color: '#888780', textAlign: 'center', padding: '20px 0' }}>
                No employees registered yet.
              </div>
            </div>
          )}
          {employees.map(e => (
            <div key={e.id} style={s.card}>
              <div style={s.row}>
                <div>
                  <div style={{ fontWeight: '600' }}>{e.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#888780', marginTop: '2px' }}>
                    {e.email}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>
                    {e.total_trips || 0} trips
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: (e.delayed_trips || 0) > 0 ? '#A32D2D' : '#3B6D11',
                    marginTop: '2px',
                  }}>
                    {e.delayed_trips || 0} delays
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ROOT APP COMPONENT
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [user,   setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [screen, setScreen] = useState('home')
  const [trips,  setTrips]  = useState([])
  const [tab,    setTab]    = useState('home')

  const loadTrips = () => {
    api.get('/trips').then(r => setTrips(r.data)).catch(() => {})
  }

  useEffect(() => {
    if (user) loadTrips()
  }, [user])

  const logout = () => {
    localStorage.clear()
    setUser(null)
    setTrips([])
    setScreen('home')
    setTab('home')
  }

  // Not logged in — show auth screen
  if (!user) return <AuthScreen onLogin={u => { setUser(u); loadTrips() }} />

  const isManager = user.role === 'manager'

  return (
    <div style={s.page}>

      {/* TOP NAVBAR */}
      <nav style={s.navbar}>
        <span style={s.navTitle}>⏱ OnTimeX App</span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={s.navScore}>
            {user.full_name} {isManager ? '👔 Manager' : ''}
          </span>
          <button
            onClick={logout}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '13px' }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={s.main}>

        {/* MANAGER sees their special dashboard */}
        {isManager && <ManagerDashboard />}

        {/* REGULAR USER sees normal screens */}
        {!isManager && tab === 'home' && screen === 'home' && (
          <HomeDashboard
            user={user}
            trips={trips}
            onStartTrip={() => setScreen('trip')}
          />
        )}
        {!isManager && tab === 'home' && screen === 'trip' && (
          <StartTripScreen
            onBack={() => setScreen('home')}
            onTripStarted={() => { loadTrips(); setScreen('home') }}
          />
        )}
        {!isManager && tab === 'reports' && <ReportsScreen />}

      </main>

      {/* BOTTOM NAV — only for regular employees */}
      {!isManager && (
        <div style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          background: 'white',
          borderTop: '1px solid #d3d1c7',
          display: 'flex',
          justifyContent: 'space-around',
          zIndex: 100,
        }}>
          {[['home', '🏠', 'Home'], ['reports', '📋', 'Reports']].map(([key, icon, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setScreen('home') }}
              style={{
                flex: 1,
                padding: '12px',
                background: 'none',
                border: 'none',
                borderTop: tab === key ? '2px solid #185FA5' : '2px solid transparent',
                color: tab === key ? '#185FA5' : '#888780',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: tab === key ? '600' : '400',
              }}
            >
              <div style={{ fontSize: '18px' }}>{icon}</div>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Spacer so content doesn't hide behind bottom nav */}
      <div style={{ height: '70px' }} />

    </div>
  )
}


