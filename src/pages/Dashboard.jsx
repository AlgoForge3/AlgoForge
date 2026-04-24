import { useEffect, useState, useMemo } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'
import api from '../utils/api'
import { Zap, TrendingUp, Target, ArrowRight, Lock, CheckCircle, Loader2, Search } from 'lucide-react'

const difficultyStyle = (d) => {
  if (d === 'Easy')   return { color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' }
  if (d === 'Medium') return { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)' }
  return                     { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' }
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
}

const itemVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }
}

const StatCard = ({ label, value, icon: Icon, color }) => (
  <motion.div variants={itemVariants} style={{
    background: 'rgba(19,19,31,0.7)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '20px 22px',
    display: 'flex', flexDirection: 'column', gap: '4px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon style={{ width: '15px', height: '15px', color }} />
      </div>
    </div>
    <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</span>
  </motion.div>
)

const TopicBar = ({ label, pct, delay = 0 }) => (
  <motion.div variants={itemVariants} style={{ marginBottom: '14px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '0.85rem', color: '#a78bfa', fontWeight: 700 }}>{pct}%</span>
    </div>
    <div style={{ background: 'rgba(139,92,246,0.08)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
        style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }}
      />
    </div>
  </motion.div>
)

export const Dashboard = () => {
  const { userLevel, isGuest, user } = useUserStore()
  const navigate = useNavigate()

  // ── Real data state ──────────────────────────────────────────────────
  const [problems, setProblems]         = useState([])
  const [searchTerm, setSearchTerm]     = useState('')
  const [visibleCount, setVisibleCount] = useState(50)
  const [stats, setStats]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  // Allow both logged-in users and guests to view dashboard
  if (!userLevel && !isGuest) {
    return <Navigate to="/assessment" replace />
  }

  // ── Fetch problems + stats on mount ──────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        // Always fetch problems (public endpoint)
        const { data: problemsData } = await api.get('/problems')
        setProblems(problemsData)

        // Fetch stats only for logged-in users
        if (user && !isGuest) {
          try {
            const { data: statsData } = await api.get('/user/stats')
            setStats(statsData)
          } catch (err) {
            console.warn('Stats fetch failed:', err)
          }
        }
      } catch (err) {
        console.error('Failed to fetch problems:', err)
        setError('Failed to load problems. Is the backend running?')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, isGuest])

  // ── Recommendation logic ─────────────────────────────────────────────
  const recommended = useMemo(() => {
    if (problems.length === 0) return null

    let targetDifficulty = 'Easy'
    if (userLevel === 'Intermediate') targetDifficulty = 'Medium'
    if (userLevel === 'Advanced')     targetDifficulty = 'Hard'
    if (userLevel === 'Expert')       targetDifficulty = 'Hard'

    // Filter problems strictly by user tier
    const candidates = problems.filter(p => p.difficulty === targetDifficulty)
    const pool = candidates.length > 0 ? candidates : problems

    // Pick a pseudo-random problem from the pool so it feels infinite,
    // but bound it to the length of the pool so it doesn't crash.
    const seedOffset = Math.floor(Math.random() * pool.length)
    return pool[seedOffset] || pool[0]
  }, [problems, userLevel])
  const displayName = user?.name || (isGuest ? 'Explorer' : 'Learner')

  // Stats values (real or placeholder)
  const solvedCount = stats?.solvedCount ?? (isGuest ? '—' : '0')
  const accuracy     = stats?.accuracy != null ? `${stats.accuracy}%` : (isGuest ? '—' : '0%')
  const topicMastery = stats?.topicMastery || []

  // ── Problem Filter Logic ─────────────────────────────────────────────
  const filteredProblems = problems.filter(p => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    const matchTitle = p.title && p.title.toLowerCase().includes(term)
    const matchTopic = p.topics && p.topics.some(t => t.toLowerCase().includes(term))
    return matchTitle || matchTopic
  })

  const handleSolve = (problemNumber) => {
    if (isGuest) {
      alert('Please sign in or create a free account to solve problems and track your progress!')
      navigate('/register')
    } else {
      navigate(`/problem/${problemNumber}`)
    }
  }

  // ── Loading state ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 4rem)', gap: '12px', color: 'var(--text-muted)' }}>
        <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem' }}>Loading dashboard...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Guest Banner */}
      {isGuest && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '12px', padding: '12px 18px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock style={{ width: '16px', height: '16px', color: '#a78bfa' }} />
            <span style={{ fontSize: '0.85rem', color: '#c4b5fd' }}>
              You're in <strong>Guest Mode</strong> — your progress won't be saved.
            </span>
          </div>
          <Link to="/register" style={{
            fontSize: '0.8rem', fontWeight: 600, color: 'white',
            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
            padding: '6px 14px', borderRadius: '8px', textDecoration: 'none',
          }}>Create Free Account →</Link>
        </motion.div>
      )}

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            color: '#fca5a5', fontSize: '0.85rem', padding: '12px 16px',
            borderRadius: '12px', marginBottom: '24px',
          }}
        >
          {error}
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        variants={containerVariants} initial="hidden" animate="visible"
        style={{
          borderRadius: '18px', padding: '32px 36px', marginBottom: '28px', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(99,102,241,0.08) 100%)',
          border: '1px solid rgba(124,58,237,0.2)',
        }}
      >
        {/* Decorative orb */}
        <div style={{
          position: 'absolute', right: '-60px', top: '-60px', width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <motion.p variants={itemVariants} style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#a78bfa', fontWeight: 500 }}>
          {isGuest ? '👁️ Guest Preview' : '✨ Welcome back'}
        </motion.p>
        <motion.h1 variants={itemVariants} style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Hello, {displayName}!
        </motion.h1>
        <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current Level:</span>
          <span style={{
            fontSize: '0.8rem', fontWeight: 700, color: '#a78bfa',
            background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
            padding: '4px 12px', borderRadius: '999px',
          }}>{userLevel}</span>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={containerVariants} initial="hidden" animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '28px' }}
      >
        <StatCard label="Problems Solved" value={solvedCount} icon={CheckCircle} color="#34d399" />
        <StatCard label="Total Problems"  value={problems.length} icon={Zap} color="#fbbf24" />
        <StatCard label="Accuracy"        value={accuracy} icon={TrendingUp} color="#a78bfa" />
      </motion.div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        {/* Topic Mastery */}
        <motion.div
          variants={containerVariants} initial="hidden" animate="visible"
          style={{
            background: 'rgba(19,19,31,0.7)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '24px',
          }}
        >
          <motion.h2 variants={itemVariants} style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Topic Mastery
          </motion.h2>
          {topicMastery.length > 0 ? (
            topicMastery.map((tm, i) => (
              <TopicBar key={tm.topic} label={`${tm.topic} (${tm.solved}/${tm.total})`} pct={tm.pct} delay={0.1 * (i + 1)} />
            ))
          ) : (
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {isGuest ? 'Sign in to track your mastery' : 'Solve problems to see your topic mastery here!'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Recommendation */}
        {recommended && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              borderRadius: '16px', padding: '24px', position: 'sticky', top: '80px',
              background: 'linear-gradient(145deg, rgba(124,58,237,0.12), rgba(99,102,241,0.06))',
              border: '1px solid rgba(124,58,237,0.25)',
              boxShadow: '0 20px 60px rgba(124,58,237,0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Target style={{ width: '18px', height: '18px', color: '#a78bfa' }} />
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Up Next For You</h2>
            </div>

            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
              Our engine selected a dynamic <strong style={{ color: '#a78bfa' }}>{userLevel}</strong> tier challenge specifically for you.
            </p>

            {/* Problem Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => handleSolve(recommended.problemNumber)}
              style={{
                background: 'rgba(8,8,15,0.6)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '16px', marginBottom: '16px',
                cursor: 'pointer', transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  color: difficultyStyle(recommended.difficulty).color,
                  background: difficultyStyle(recommended.difficulty).bg,
                  border: `1px solid ${difficultyStyle(recommended.difficulty).border}`,
                  padding: '3px 8px', borderRadius: '5px',
                }}>{recommended.difficulty}</span>
                <span style={{
                  fontSize: '0.72rem', color: 'var(--text-muted)',
                  background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '5px',
                }}>{recommended.topics?.[0] || 'General'}</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {recommended.title}
              </h3>
            </motion.div>

            <motion.button
              onClick={() => handleSolve(recommended.problemNumber)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                color: 'white', fontWeight: 700, fontSize: '0.875rem',
                padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
              }}
            >
              {isGuest ? <><Lock style={{ width: '14px' }} /> Sign In to Solve</> : <>Solve Now <ArrowRight style={{ width: '14px' }} /></>}
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* All Problems */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{ marginTop: '24px', background: 'rgba(19,19,31,0.7)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Problem Forge</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.1)', color: '#c4b5fd', fontWeight: 600 }}>{filteredProblems.length} available</span>
            </div>
          </div>
          
          <div style={{ position: 'relative', width: '100%' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'rgba(139, 92, 246, 0.6)' }} />
            <input 
              type="text" 
              placeholder="Search by title, topic, or keyword..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px 14px 44px',
                background: 'rgba(9, 19, 40, 0.4)', border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.95rem',
                outline: 'none', transition: 'all 0.2s ease',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.15)', e.currentTarget.style.background = 'rgba(19, 29, 50, 0.6)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)'; e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2)', e.currentTarget.style.background = 'rgba(9, 19, 40, 0.4)' }}
            />
          </div>
        </div>
        {filteredProblems.length === 0 && !error ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Search style={{ width: '32px', height: '32px', opacity: 0.3, margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>No problems found matching "{searchTerm}"</p>
          </div>
        ) : (
          filteredProblems.slice(0, visibleCount).map((p, i) => {
            const ds = difficultyStyle(p.difficulty)
            return (
              <motion.div
                key={p._id || p.problemNumber}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                onClick={() => handleSolve(p.problemNumber)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 24px', cursor: 'pointer',
                  borderBottom: i < problems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600, minWidth: '24px' }}>
                    {String(p.problemNumber).padStart(2, '0')}
                  </span>
                  <div>
                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</span>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {p.topics?.slice(0,2).map(t => (
                        <span key={t} style={{
                          fontSize: '0.7rem', color: 'var(--text-subtle)',
                          background: 'rgba(255,255,255,0.04)', padding: '2px 7px', borderRadius: '4px',
                        }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                    color: ds.color, background: ds.bg, border: `1px solid ${ds.border}`,
                    padding: '4px 10px', borderRadius: '6px',
                  }}>{p.difficulty}</span>
                  <ArrowRight style={{ width: '14px', height: '14px', color: 'var(--text-subtle)' }} />
                </div>
              </motion.div>
            )
          })
        )}
        
        {filteredProblems.length > visibleCount && !error && (
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <motion.button
              onClick={() => setVisibleCount(c => c + 50)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                color: '#c4b5fd',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Load More
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
