import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Navigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'
import api from '../utils/api'
import {
  User, Edit3, MapPin, Globe, Code, Briefcase, Calendar, X,
  CheckCircle, XCircle, Clock, Code2, Flame, Target, Trophy,
  Loader2, Save, TrendingUp, ExternalLink,
} from 'lucide-react'

// ── Constants ──────────────────────────────────────────────────────────────────
const LEVEL_COLORS = {
  Novice:       { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)' },
  Beginner:     { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)'  },
  Intermediate: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)'  },
  Advanced:     { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  Expert:       { color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.3)' },
}

const DIFF_COLORS = {
  Easy:   '#34d399',
  Medium: '#fbbf24',
  Hard:   '#f87171',
}

const STATUS_STYLES = {
  Accepted:              { color: '#34d399', icon: CheckCircle },
  'Wrong Answer':        { color: '#f87171', icon: XCircle },
  'Time Limit Exceeded': { color: '#fbbf24', icon: Clock },
  'Runtime Error':       { color: '#f97316', icon: XCircle },
  'Compile Error':       { color: '#ef4444', icon: XCircle },
}

// ── Heatmap Component ─────────────────────────────────────────────────────────
const ActivityHeatmap = ({ heatmapData, totalSubmissions, streak }) => {
  // Generate 365 days of cells
  const cells = useMemo(() => {
    const result = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 364; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const count = heatmapData[key] || 0
      result.push({ date: key, count, day: d.getDay(), weekIndex: Math.floor((364 - i) / 7) })
    }
    return result
  }, [heatmapData])

  // Group by weeks for grid layout
  const weeks = useMemo(() => {
    const w = []
    for (let i = 0; i < 53; i++) {
      w.push(cells.filter(c => c.weekIndex === i))
    }
    return w
  }, [cells])

  const getColor = (count) => {
    if (count === 0) return 'rgba(255,255,255,0.03)'
    if (count === 1) return 'rgba(124,58,237,0.25)'
    if (count <= 3)  return 'rgba(124,58,237,0.45)'
    if (count <= 5)  return 'rgba(124,58,237,0.65)'
    return 'rgba(124,58,237,0.9)'
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div style={{
      background: 'rgba(19,19,31,0.7)', border: '1px solid var(--border)',
      borderRadius: '16px', padding: '20px 24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {totalSubmissions} submissions
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>in the last year</span>
        </div>
        {streak > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
            padding: '4px 10px', borderRadius: '8px',
          }}>
            <Flame style={{ width: '13px', height: '13px', color: '#fbbf24' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24' }}>{streak} day streak</span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
        {/* Month labels */}
        <div style={{ display: 'flex', gap: '0px', marginBottom: '4px', marginLeft: '18px' }}>
          {weeks.map((week, i) => {
            const firstDay = week[0]
            if (!firstDay) return null
            const date = new Date(firstDay.date)
            if (date.getDate() <= 7 && date.getDate() >= 1) {
              return (
                <span key={i} style={{
                  fontSize: '0.6rem', color: 'var(--text-subtle)',
                  width: '13px', textAlign: 'center', flexShrink: 0,
                }}>
                  {months[date.getMonth()]}
                </span>
              )
            }
            return <span key={i} style={{ width: '13px', flexShrink: 0 }} />
          })}
        </div>

        <div style={{ display: 'flex', gap: '2px' }}>
          {/* Day labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '4px', flexShrink: 0 }}>
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
              <span key={i} style={{ fontSize: '0.55rem', color: 'var(--text-subtle)', height: '11px', lineHeight: '11px' }}>{d}</span>
            ))}
          </div>

          {/* Cells */}
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {Array.from({ length: 7 }).map((_, di) => {
                const cell = week.find(c => c.day === di)
                return (
                  <div
                    key={di}
                    title={cell ? `${cell.date}: ${cell.count} submission${cell.count !== 1 ? 's' : ''}` : ''}
                    style={{
                      width: '11px', height: '11px', borderRadius: '2px',
                      background: cell ? getColor(cell.count) : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-subtle)', marginRight: '4px' }}>Less</span>
        {[0, 1, 2, 4, 6].map(n => (
          <div key={n} style={{ width: '11px', height: '11px', borderRadius: '2px', background: getColor(n) }} />
        ))}
        <span style={{ fontSize: '0.6rem', color: 'var(--text-subtle)', marginLeft: '4px' }}>More</span>
      </div>
    </div>
  )
}

// ── Solved Stats Ring ─────────────────────────────────────────────────────────
const SolvedRing = ({ stats }) => {
  const total = stats?.totalProblems || 0
  const solved = stats?.solvedCount || 0
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0

  const byDiff = { Easy: { solved: 0, total: 0 }, Medium: { solved: 0, total: 0 }, Hard: { solved: 0, total: 0 } }
  if (stats?.topicMastery) {
    // We'll compute from backend — for now use total/solved
  }

  const radius = 50
  const stroke = 8
  const circumference = 2 * Math.PI * radius

  return (
    <div style={{
      background: 'rgba(19,19,31,0.7)', border: '1px solid var(--border)',
      borderRadius: '16px', padding: '24px', textAlign: 'center',
    }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textAlign: 'left' }}>Solved Problems</h3>

      <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 16px' }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          <motion.circle
            cx="60" cy="60" r={radius} fill="none"
            stroke="url(#ring-grad)" strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (circumference * pct) / 100 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            transform="rotate(-90 60 60)"
          />
          <defs>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{solved}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/ {total} Solved</span>
        </div>
      </div>

      {/* Difficulty breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Object.entries(DIFF_COLORS).map(([diff, color]) => {
          const dm = stats?.difficultyBreakdown?.[diff] || { solved: 0, total: 0 }
          return (
            <div key={diff} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{diff}</span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {dm.solved}<span style={{ color: 'var(--text-subtle)' }}>/{dm.total}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Edit Profile Modal ────────────────────────────────────────────────────────
const EditProfileModal = ({ profile, onClose, onSave }) => {
  const [form, setForm] = useState({
    name:     profile.name || '',
    bio:      profile.bio || '',
    location: profile.location || '',
    website:  profile.website || '',
    github:   profile.github || '',
    linkedin: profile.linkedin || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { data } = await api.patch('/user/profile', form)
      onSave(data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { key: 'name',     label: 'Display Name', icon: User,     max: 50 },
    { key: 'bio',      label: 'Bio',          icon: Edit3,    max: 300, multiline: true },
    { key: 'location', label: 'Location',     icon: MapPin,   max: 100 },
    { key: 'website',  label: 'Website',      icon: Globe,    max: 200 },
    { key: 'github',   label: 'GitHub',       icon: Code,     max: 100 },
    { key: 'linkedin', label: 'LinkedIn URL', icon: Briefcase, max: 200 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '480px',
          background: 'rgba(19,19,31,0.95)', border: '1px solid var(--border)',
          borderRadius: '20px', padding: '28px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          maxHeight: '80vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Profile</h2>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px',
            padding: '6px', cursor: 'pointer', color: 'var(--text-muted)',
          }}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {fields.map(({ key, label, icon: Icon, max, multiline }) => (
            <div key={key}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                <Icon style={{ width: '13px', height: '13px' }} />
                {label}
              </label>
              {multiline ? (
                <textarea
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  maxLength={max}
                  rows={3}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)', borderRadius: '10px',
                    padding: '10px 12px', fontSize: '0.85rem', color: 'var(--text-primary)',
                    outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                  }}
                />
              ) : (
                <input
                  type="text"
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  maxLength={max}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)', borderRadius: '10px',
                    padding: '10px 12px', fontSize: '0.85rem', color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            marginTop: '12px', padding: '8px 12px', borderRadius: '8px',
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            color: '#fca5a5', fontSize: '0.8rem',
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-muted)', fontWeight: 600,
            fontSize: '0.85rem', cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{
            flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
            color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: '14px', height: '14px' }} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Recent Submissions ────────────────────────────────────────────────────────
const RecentSubmissions = ({ submissions }) => (
  <div style={{
    background: 'rgba(19,19,31,0.7)', border: '1px solid var(--border)',
    borderRadius: '16px', overflow: 'hidden',
  }}>
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
      <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Submissions</h3>
    </div>
    {submissions.length === 0 ? (
      <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
        No submissions yet. Solve a problem to see your activity here!
      </div>
    ) : (
      submissions.map((s, i) => {
        const st = STATUS_STYLES[s.status] || STATUS_STYLES['Runtime Error']
        const Icon = st.icon
        return (
          <div key={s._id || i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: i < submissions.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icon style={{ width: '14px', height: '14px', color: st.color, flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {s.problem?.title || `Problem #${s.problem?.problemNumber}`}
                </span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.7rem', color: DIFF_COLORS[s.problem?.difficulty] || '#94a3b8' }}>
                    {s.problem?.difficulty}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                    {s.language}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: st.color }}>{s.status}</span>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        )
      })
    )}
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const Profile = () => {
  const navigate = useNavigate()
  const { username } = useParams()
  const { user: currentUser, isGuest, login } = useUserStore()

  const [profile, setProfile]         = useState(null)
  const [stats, setStats]             = useState(null)
  const [heatmapData, setHeatmapData] = useState({})
  const [heatmapMeta, setHeatmapMeta] = useState({ totalSubmissions: 0, streak: 0 })
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [showEdit, setShowEdit]       = useState(false)

  if (!currentUser || isGuest) {
    return <Navigate to="/login" replace />
  }

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const urlSuffix = username ? `/${username}` : ''
        const [profileRes, statsRes, heatmapRes, subsRes] = await Promise.all([
          api.get(`/user/profile${urlSuffix}`),
          api.get(`/user/stats${urlSuffix}`),
          api.get(`/user/heatmap${urlSuffix}`),
          api.get(`/user/submissions${urlSuffix}`),
        ])

        setProfile(profileRes.data)
        setStats({
          ...statsRes.data,
          difficultyBreakdown: buildDiffBreakdown(statsRes.data),
        })
        setHeatmapData(heatmapRes.data.heatmap || {})
        setHeatmapMeta({
          totalSubmissions: heatmapRes.data.totalSubmissions,
          streak: heatmapRes.data.streak,
        })
        setSubmissions(subsRes.data || [])
      } catch (err) {
        console.error('Profile fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [username])

  const buildDiffBreakdown = (statsData) => {
    // Build from topic mastery or problems
    const breakdown = { Easy: { solved: 0, total: 0 }, Medium: { solved: 0, total: 0 }, Hard: { solved: 0, total: 0 } }
    // We'll use totalProblems and solvedCount for now
    breakdown.Easy.total = statsData.totalProblems || 0
    breakdown.Easy.solved = statsData.solvedCount || 0
    return breakdown
  }

  const handleProfileSave = (updatedProfile) => {
    setProfile(updatedProfile)
    // Update zustand store so navbar reflects changes
    const token = localStorage.getItem('token')
    if (token) {
      login({ ...currentUser, ...updatedProfile }, token)
    }
  }

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  const lc = LEVEL_COLORS[profile?.currentLevel] || LEVEL_COLORS.Beginner

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 4rem)', gap: '12px', color: 'var(--text-muted)' }}>
        <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem' }}>Loading profile...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '28px 20px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Profile Header Card ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(19,19,31,0.7)', border: '1px solid var(--border)',
          borderRadius: '18px', padding: '28px', marginBottom: '20px',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Decorative */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '160px', height: '160px',
          background: `radial-gradient(circle, ${lc.bg} 0%, transparent 70%)`,
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative' }}>
          {/* Avatar */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
            background: profile?.picture ? `url(${profile.picture}) center/cover` : 'linear-gradient(135deg, #7c3aed, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `3px solid ${lc.border}`,
            boxShadow: `0 0 20px ${lc.bg}`,
          }}>
            {!profile?.picture && (
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>
                {profile?.name?.trim()?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {profile?.name}
              </h1>
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, color: lc.color,
                background: lc.bg, border: `1px solid ${lc.border}`,
                padding: '3px 10px', borderRadius: '999px',
              }}>
                {profile?.currentLevel}
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 10px', maxWidth: '400px', lineHeight: 1.5 }}>
              {profile?.bio || 'No bio yet. Click edit to add one!'}
            </p>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              {profile?.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                  <MapPin style={{ width: '12px', height: '12px' }} /> {profile.location}
                </span>
              )}
              {joinDate && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                  <Calendar style={{ width: '12px', height: '12px' }} /> Joined {joinDate}
                </span>
              )}
              {profile?.website && (
                <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                   target="_blank" rel="noopener noreferrer"
                   style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#a78bfa', textDecoration: 'none' }}>
                  <Globe style={{ width: '12px', height: '12px' }} /> Website
                  <ExternalLink style={{ width: '10px', height: '10px' }} />
                </a>
              )}
              {profile?.github && (
                <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer"
                   style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                  <Code style={{ width: '12px', height: '12px' }} /> {profile.github}
                </a>
              )}
              {profile?.linkedin && (
                <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                   target="_blank" rel="noopener noreferrer"
                   style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#0a66c2', textDecoration: 'none' }}>
                  <Briefcase style={{ width: '12px', height: '12px' }} /> LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Edit button (Only if it's our own profile) */}
          {(profile?._id === currentUser?._id) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEdit(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '8px 14px', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600,
                transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              <Edit3 style={{ width: '13px', height: '13px' }} />
              Edit Profile
            </motion.button>
          )}
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: '24px', marginTop: '20px', paddingTop: '16px',
          borderTop: '1px solid var(--border)',
        }}>
          {[
            { label: 'Solved', value: stats?.solvedCount ?? 0, icon: CheckCircle, color: '#34d399' },
            { label: 'Submissions', value: heatmapMeta.totalSubmissions, icon: Code2, color: '#a78bfa' },
            { label: 'Accuracy', value: stats?.accuracy != null ? `${stats.accuracy}%` : '0%', icon: Target, color: '#fbbf24' },
            { label: 'Streak', value: `${heatmapMeta.streak}d`, icon: Flame, color: '#f97316' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon style={{ width: '14px', height: '14px', color }} />
              <div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</span>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', margin: 0 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Heatmap ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ marginBottom: '20px' }}
      >
        <ActivityHeatmap
          heatmapData={heatmapData}
          totalSubmissions={heatmapMeta.totalSubmissions}
          streak={heatmapMeta.streak}
        />
      </motion.div>

      {/* ── Grid: Solved Ring + Recent Submissions ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SolvedRing stats={stats} />

          {/* Language Stats */}
          <div style={{
            marginTop: '16px', background: 'rgba(19,19,31,0.7)',
            border: '1px solid var(--border)', borderRadius: '16px', padding: '20px',
          }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Languages</h3>
            {['C++', 'Python 3', 'Java', 'JavaScript'].map((lang, i) => (
              <div key={lang} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0',
                borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lang}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>
                  {submissions.filter(s =>
                    (lang === 'C++' && s.language === 'cpp') ||
                    (lang === 'Python 3' && s.language === 'python') ||
                    (lang === 'Java' && s.language === 'java') ||
                    (lang === 'JavaScript' && s.language === 'javascript')
                  ).length} submissions
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <RecentSubmissions submissions={submissions} />
        </motion.div>
      </div>

      {/* ── Edit Profile Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showEdit && (
          <EditProfileModal
            profile={profile}
            onClose={() => setShowEdit(false)}
            onSave={handleProfileSave}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
