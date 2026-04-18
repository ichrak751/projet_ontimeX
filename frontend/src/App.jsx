// App.jsx — Complete Punctuality System Frontend
// This is a single-file React app with multiple screens:
//   - Login / Register
//   - Home Dashboard
//   - Start Trip
//   - Reports
// It talks to our Node.js backend at http://localhost:3000

import { useState, useEffect } from 'react'
import axios from 'axios'

// ── API client ────────────────────────────────────────────────
// All requests go through this axios instance.
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
})

// Add the token to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─────────────────────────────────────────────────────────────
// STYLES — a minimal inline style system
// ─────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh', fontFamily: 'Segoe UI, Arial, sans-serif',
    background: '#f5f5f0', color: '#1a1a18'
  },
  navbar: {
    background: '#042C53', color: 'white', padding: '14px 24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  navTitle: { fontSize: '18px', fontWeight: '700' },
  navScore: {
    background: 'rgba(255,255,255,0.15)', borderRadius: '20px',
    padding: '4px 14px', fontSize: '13px'
  },
  main: { maxWidth: '760px', margin: '0 auto', padding: '24px 16px' },
  card: {
    background: 'white', border: '1px solid #d3d1c7',
    borderRadius: '12px', padding: '20px', marginBottom: '16px'
  },
  cardTitle: { fontSize: '14px', color: '#888780', marginBottom: '6px' },
  bigNum: { fontSize: '32px', fontWeight: '700', color: '#185FA5' },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #d3d1c7',
    borderRadius: '8px', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box'
  },
  btn: {
    width: '100%', padding: '12px', background: '#185FA5', color: 'white',
    border: 'none', borderRadius: '8px', fontSize: '15px',
    fontWeight: '600', cursor: 'pointer', marginBottom: '10px'
  },
  btnSecondary: {
    width: '100%', padding: '12px', background: 'white', color: '#185FA5',
    border: '1.5px solid #185FA5', borderRadius: '8px', fontSize: '15px',
    fontWeight: '600', cursor: 'pointer', marginBottom: '10px'
  },
  badge: (color) => ({
    display: 'inline-block', padding: '3px 12px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '700',
    background: { green: '#EAF3DE', amber: '#FAEEDA', red: '#FCEBEB' }[color],
    color:      { green: '#3B6D11', amber: '#854F0B', red:   '#A32D2D' }[color]
  }),
  tabs: { display: 'flex', borderBottom: '1px solid #d3d1c7', marginBottom: '20px' },
  tab: (active) => ({
    padding: '10px 18px', cursor: 'pointer', fontSize: '14px',
    fontWeight: active ? '600' : '400',
    borderBottom: active ? '2px solid #185FA5' : '2px solid transparent',
    color: active ? '#185FA5' : '#888780',
    background: 'none', border: 'none'
  }),
  error: {
    background: '#FCEBEB', color: '#A32D2D', borderRadius: '8px',
    padding: '10px 14px', fontSize: '13px', marginBottom: '12px'
  },
  success: {
    background: '#EAF3DE', color: '#3B6D11', borderRadius: '8px',
    padding: '10px 14px', fontSize: '13px', marginBottom: '12px'
  },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' },
}

// ─────────────────────────────────────────────────────────────
// AUTH SCREEN — Login and Register
// ─────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode,     setMode]     = useState('login')   // 'login' | 'register'
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
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '360px', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '36px' }}>⏱</div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#042C53' }}>Punctuality App</h1>
          <p style={{ color: '#888780', fontSize: '14px' }}>AI-powered delay management</p>
        </div>
        <div style={s.tabs}>
          <button style={s.tab(mode === 'login')}    onClick={() => setMode('login')}>Log In</button>
          <button style={s.tab(mode === 'register')} onClick={() => setMode('register')}>Register</button>
        </div>
        {error && <div style={s.error}>{error}</div>}
        {mode === 'register' && (
          <input style={s.input} placeholder="Full name"
            value={name} onChange={e => setName(e.target.value)} />
        )}
        <input style={s.input} type="email" placeholder="Email address"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input style={s.input} type="password" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
        <button style={s.btn} onClick={submit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>
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

  useEffect(() => {
    // On mount, fetch a prediction for a demo trip
    api.get('/predictions/pre-trip?origin_lat=36.8065&origin_lng=10.1815&dest_lat=36.8190&dest_lng=10.1657')
      .then(r => setPrediction(r.data)).catch(() => {})

    const arrival = new Date()
    arrival.setHours(9, 0, 0)
    api.get(`/predictions/recommendation?required_arrival=${arrival.toISOString()}`)
      .then(r => setRec(r.data)).catch(() => {})
  }, [])

  const completedTrips = trips.filter(t => t.status === 'completed')
  const delayedTrips   = trips.filter(t => t.delay_minutes > 5)
  const pctOnTime = completedTrips.length
    ? Math.round((1 - delayedTrips.length / completedTrips.length) * 100)
    : 100

  const riskColor = !prediction ? 'green'
    : prediction.delay_probability > 0.6 ? 'red'
    : prediction.delay_probability > 0.35 ? 'amber' : 'green'

  return (
    <div>
      <h2 style={{ marginBottom: '16px' }}>Good morning, {user.full_name.split(' ')[0]}! 👋</h2>

      <div style={s.grid2}>
        <div style={s.card}>
          <div style={s.cardTitle}>Punctuality score</div>
          <div style={s.bigNum}>{pctOnTime}%</div>
          <div style={{ fontSize: '12px', color: '#888780' }}>{completedTrips.length} trips recorded</div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Delays (all time)</div>
          <div style={s.bigNum}>{delayedTrips.length}</div>
          <div style={{ fontSize: '12px', color: '#888780' }}>of {completedTrips.length} trips</div>
        </div>
      </div>

      {prediction && (
        <div style={{ ...s.card, borderLeft: `4px solid ${riskColor === 'red' ? '#A32D2D' : riskColor === 'amber' ? '#854F0B' : '#3B6D11'}` }}>
          <div style={s.row}>
            <div style={s.cardTitle}>AI Prediction — next trip</div>
            <span style={s.badge(riskColor)}>
              {riskColor === 'red' ? 'High Risk' : riskColor === 'amber' ? 'Caution' : 'On Track'}
            </span>
          </div>
          <div style={{ fontSize: '15px', margin: '8px 0' }}>
            <strong>{Math.round(prediction.delay_probability * 100)}%</strong> chance of delay
              ·  
            Est. <strong>+{Math.round(prediction.predicted_delay_minutes)} min</strong>
          </div>
          {prediction.cause !== 'none' && (
            <div style={{ fontSize: '13px', color: '#5f5e5a' }}>
              Cause: {prediction.cause}  |  Severity: {prediction.severity_score}/100
            </div>
          )}
          {rec && (
            <div style={{ marginTop: '10px', padding: '10px', background: '#E6F1FB', borderRadius: '8px', fontSize: '13px' }}>
              Recommended departure: <strong>{new Date(rec.recommended_departure).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</strong>
               ({rec.buffer_minutes} min buffer — {rec.reason})
            </div>
          )}
        </div>
      )}

      <button style={s.btn} onClick={onStartTrip}>Start New Trip</button>

      <div style={s.card}>
        <div style={{ ...s.cardTitle, marginBottom: '12px' }}>Recent trips</div>
        {trips.length === 0 && <div style={{ color: '#888780', fontSize: '14px' }}>No trips yet. Start your first trip!</div>}
        {trips.slice(0, 5).map(t => (
          <div key={t.id} style={{ ...s.row, padding: '10px 0', borderBottom: '1px solid #f0efe9' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Trip #{t.id}</div>
              <div style={{ fontSize: '12px', color: '#888780' }}>{new Date(t.created_at).toLocaleDateString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={s.badge(t.delay_minutes > 5 ? 'red' : 'green')}>
                {t.delay_minutes > 5 ? `+${t.delay_minutes} min late` : 'On time'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// START TRIP SCREEN
// ─────────────────────────────────────────────────────────────
function StartTripScreen({ onBack, onTripStarted }) {
  const [form, setForm] = useState({
    origin_lat:      '36.8065',
    origin_lng:      '10.1815',
    dest_lat:        '36.8190',
    dest_lng:        '10.1657',
    planned_arrival: ''
  })
  const [msg,     setMsg]     = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [tripId,  setTripId]  = useState(null)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const startTrip = async () => {
    setError(''); setLoading(true)
    try {
      const res = await api.post('/trips/start', {
        origin_lat:      parseFloat(form.origin_lat),
        origin_lng:      parseFloat(form.origin_lng),
        dest_lat:        parseFloat(form.dest_lat),
        dest_lng:        parseFloat(form.dest_lng),
        planned_arrival: form.planned_arrival || new Date(Date.now() + 30*60000).toISOString()
      })
      setTripId(res.data.trip_id)
      setMsg(`Trip #${res.data.trip_id} started! GPS tracking active.`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start trip')
    } finally {
      setLoading(false)
    }
  }

  const completeTrip = async () => {
    setLoading(true)
    try {
      const res = await api.post(`/trips/${tripId}/complete`, {
        actual_arrival: new Date().toISOString()
      })
      const delay = res.data.delay_minutes
      setMsg(`Trip completed! Delay: ${delay} min. ${res.data.report_generated ? 'Report generated.' : 'No report needed.'}`)
      onTripStarted()
    } catch (err) {
      setError('Failed to complete trip')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={onBack} style={{ background:'none', border:'none', color:'#185FA5', cursor:'pointer', fontSize:'14px', marginBottom:'16px', padding:0 }}>
        ← Back to Dashboard
      </button>
      <h2 style={{ marginBottom: '16px' }}>Start New Trip</h2>
      {error && <div style={s.error}>{error}</div>}
      {msg && <div style={s.success}>{msg}</div>}
      {!tripId ? (
        <div style={s.card}>
          <div style={s.cardTitle}>Origin (latitude, longitude)</div>
          <div style={s.grid2}>
            <input style={s.input} placeholder="Origin lat" value={form.origin_lat} onChange={e => update('origin_lat', e.target.value)} />
            <input style={s.input} placeholder="Origin lng" value={form.origin_lng} onChange={e => update('origin_lng', e.target.value)} />
          </div>
          <div style={s.cardTitle}>Destination</div>
          <div style={s.grid2}>
            <input style={s.input} placeholder="Dest lat" value={form.dest_lat} onChange={e => update('dest_lat', e.target.value)} />
            <input style={s.input} placeholder="Dest lng" value={form.dest_lng} onChange={e => update('dest_lng', e.target.value)} />
          </div>
          <div style={s.cardTitle}>Planned arrival time</div>
          <input style={s.input} type="datetime-local" onChange={e => update('planned_arrival', new Date(e.target.value).toISOString())} />
          <button style={s.btn} onClick={startTrip} disabled={loading}>
            {loading ? 'Starting...' : 'Start Trip & Enable Tracking'}
          </button>
        </div>
      ) : (
        <div style={s.card}>
          <div style={{ fontSize: '15px', marginBottom: '16px' }}>
            Trip #{tripId} is active. GPS tracking running...
          </div>
          <button style={{ ...s.btn, background: '#A32D2D' }} onClick={completeTrip} disabled={loading}>
            {loading ? 'Completing...' : 'Complete Trip (I Arrived)'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// REPORTS SCREEN
// ─────────────────────────────────────────────────────────────
function ReportsScreen() {
  const [reports, setReports] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api.get('/reports').then(r => setReports(r.data)).catch(() => {})
  }, [])

  if (selected) return (
    <div>
      <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'#185FA5', cursor:'pointer', fontSize:'14px', marginBottom:'16px', padding:0 }}>
        ← Back to Reports
      </button>
      <div style={{ ...s.card, borderTop: '4px solid #0F6E56' }}>
        <div style={s.row}>
          <div><strong>Report #{selected.id}</strong> — Trip #{selected.trip_id}</div>
          <span style={s.badge(selected.validation_status === 'approved' ? 'green' : selected.validation_status === 'rejected' ? 'red' : 'amber')}>
            {selected.validation_status}
          </span>
        </div>
        <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #f0efe9' }} />
        <div style={s.grid2}>
          <div><div style={s.cardTitle}>Delay</div><strong>{selected.delay_minutes} min</strong></div>
          <div><div style={s.cardTitle}>Validity score</div><strong>{selected.validity_score}/100</strong></div>
          <div><div style={s.cardTitle}>Cause</div><strong>{selected.cause}</strong></div>
          <div><div style={s.cardTitle}>Date</div><strong>{new Date(selected.created_at).toLocaleDateString()}</strong></div>
        </div>
        <div style={{ marginTop: '14px' }}>
          <div style={s.cardTitle}>Official justification text</div>
          <div style={{ background: '#f7f6f2', borderRadius: '8px', padding: '14px', fontSize: '14px', lineHeight: '1.7', marginTop: '8px' }}>
            {selected.justification_text}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <h2 style={{ marginBottom: '16px' }}>Delay Reports</h2>
      {reports.length === 0 && (
        <div style={s.card}>
          <div style={{ color: '#888780' }}>No delay reports yet. Complete a trip with a delay to generate one.</div>
        </div>
      )}
      {reports.map(r => (
        <div key={r.id} style={{ ...s.card, cursor: 'pointer' }} onClick={() => setSelected(r)}>
          <div style={s.row}>
            <div>
              <div style={{ fontWeight: '600' }}>Report #{r.id} — Trip #{r.trip_id}</div>
              <div style={{ fontSize: '12px', color: '#888780', marginTop: '2px' }}>{new Date(r.created_at).toLocaleDateString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={s.badge(r.validation_status === 'approved' ? 'green' : r.validation_status === 'rejected' ? 'red' : 'amber')}>
                {r.validation_status}
              </span>
              <div style={{ fontSize: '12px', color: '#888780', marginTop: '4px' }}>{r.delay_minutes} min delay</div>
            </div>
          </div>
        </div>
      ))}
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
  const [screen, setScreen] = useState('home')  // 'home' | 'trip' | 'reports'
  const [trips,  setTrips]  = useState([])
  const [tab,    setTab]    = useState('home')

  const loadTrips = () => {
    api.get('/trips').then(r => setTrips(r.data)).catch(() => {})
  }

  useEffect(() => { if (user) loadTrips() }, [user])

  const logout = () => {
    localStorage.clear()
    setUser(null)
    setTrips([])
  }

  if (!user) return <AuthScreen onLogin={u => { setUser(u); loadTrips() }} />

  return (
    <div style={s.page}>
      <nav style={s.navbar}>
        <span style={s.navTitle}>⏱ Punctuality App</span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={s.navScore}>{user.full_name}</span>
          <button onClick={logout} style={{ background:'rgba(255,255,255,0.1)', color:'white', border:'none', borderRadius:'6px', padding:'4px 12px', cursor:'pointer', fontSize:'13px' }}>Logout</button>
        </div>
      </nav>

      <main style={s.main}>
        {tab === 'home' && screen === 'home' && (
          <HomeDashboard user={user} trips={trips} onStartTrip={() => setScreen('trip')} />
        )}
        {tab === 'home' && screen === 'trip' && (
          <StartTripScreen onBack={() => setScreen('home')} onTripStarted={() => { loadTrips(); setScreen('home') }} />
        )}
        {tab === 'reports' && <ReportsScreen />}
      </main>

      <div style={{ position: 'fixed', bottom: '0', left: '0', right: '0', background: 'white', borderTop: '1px solid #d3d1c7', display: 'flex', justifyContent: 'space-around' }}>
        {[['home', 'Home'], ['reports', 'Reports']].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setScreen('home') }}
            style={{ ...s.tab(tab === key), flex: 1, padding: '14px', borderBottom: 'none',
              borderTop: tab === key ? '2px solid #185FA5' : '2px solid transparent' }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ height: '60px' }} /> {/* Bottom nav spacer */}
    </div>
  )
}
