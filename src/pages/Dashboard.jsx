import { useEffect, useState, useMemo } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'
import { useBookmarkStore } from '../store/useBookmarkStore'
import api from '../utils/api'
import { TopicSection } from '../components/TopicSection'
import { GroupStudyModal } from '../components/GroupStudyModal'
import {
  Zap, TrendingUp, CheckCircle, Loader2, Search,
  Lock, Users, Bookmark, Filter, ArrowRight
} from 'lucide-react'

/* ── Topic Mapping ─────────────────────────────────────────────────────────── */
const TOPIC_KEYWORDS = {
  'Arrays':                    ['Array', 'Sliding Window', 'Two Pointers', 'Prefix Sum', 'Sorting', 'Matrix'],
  'Strings':                   ['String', 'Hashing', 'Pattern Matching', 'Palindrome', 'Anagram'],
  'Linked Lists':              ['Linked List'],
  'Stacks & Queues':           ['Stack', 'Queue', 'Monotonic Stack', 'Monotonic Queue', 'Deque'],
  'Binary Search':             ['Binary Search'],
  'Recursion & Backtracking':  ['Backtracking', 'Recursion'],
  'Trees':                     ['Tree', 'Binary Tree', 'Binary Search Tree', 'BST', 'Trie'],
  'Graphs':                    ['Graph', 'BFS', 'DFS', 'Topological Sort', 'Union Find', 'Shortest Path'],
  'Dynamic Programming':       ['Dynamic Programming', 'DP', 'Memoization'],
  'Heaps & Priority Queues':   ['Heap', 'Priority Queue'],
  'Greedy':                    ['Greedy'],
  'Math & Bit Manipulation':   ['Math', 'Bit Manipulation', 'Number Theory'],
  'Advanced DS':               ['Segment Tree', 'Fenwick Tree', 'Design'],
}

const TOPIC_ORDER = Object.keys(TOPIC_KEYWORDS)

function categorizeProblem(problem) {
  const tags = (problem.topics || []).map(t => t.toLowerCase())
  for (const topic of TOPIC_ORDER) {
    const keywords = TOPIC_KEYWORDS[topic]
    for (const kw of keywords) {
      if (tags.some(t => t.includes(kw.toLowerCase()))) return topic
    }
  }
  return 'Other'
}

function groupByTopic(problems) {
  const groups = {}
  for (const topic of [...TOPIC_ORDER, 'Other']) groups[topic] = []
  for (const p of problems) {
    const topic = categorizeProblem(p)
    groups[topic].push(p)
  }
  // Remove empty groups
  for (const k of Object.keys(groups)) {
    if (groups[k].length === 0) delete groups[k]
  }
  return groups
}

/* ── Progress Ring SVG ─────────────────────────────────────────────────────── */
const ProgressRing = ({ solved, total, size = 110 }) => {
  const pct = total > 0 ? (solved / total) * 100 : 0
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke="url(#ringGrad)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {pct.toFixed(1)}%
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-subtle)', fontWeight: 600 }}>PROGRESS</span>
      </div>
    </div>
  )
}

/* ── Stat Card ─────────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    style={{
      background: 'rgba(19,19,31,0.7)', border: '1px solid var(--border)',
      borderRadius: '14px', padding: '18px 20px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon style={{ width: '14px', height: '14px', color }} />
      </div>
    </div>
    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Lexend', sans-serif" }}>{value}</span>
  </motion.div>
)

/* ── Main Dashboard ────────────────────────────────────────────────────────── */
export const Dashboard = () => {
  const { userLevel, isGuest, user } = useUserStore()
  const { bookmarks } = useBookmarkStore()
  const navigate = useNavigate()

  const [problems, setProblems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [diffFilter, setDiffFilter] = useState('All')
  const [showSaved, setShowSaved] = useState(false)
  const [groupStudyOpen, setGroupStudyOpen] = useState(false)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  if (!userLevel && !isGuest) return <Navigate to="/assessment" replace />

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); setError('')
      try {
        const { data: problemsData } = await api.get('/problems')
        setProblems(problemsData)
        if (user && !isGuest) {
          try {
            const { data: statsData } = await api.get('/user/stats')
            setStats(statsData)
          } catch (err) { console.warn('Stats fetch failed:', err) }
        }
      } catch (err) {
        console.error('Failed to fetch problems:', err)
        setError('Failed to load problems. Is the backend running?')
      } finally { setLoading(false) }
    }
    fetchData()
  }, [user, isGuest])

  // Filter pipeline: search → difficulty → saved
  const filteredProblems = useMemo(() => {
    let result = [...problems]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(p =>
        (p.title && p.title.toLowerCase().includes(term)) ||
        (p.topics && p.topics.some(t => t.toLowerCase().includes(term))) ||
        String(p.problemNumber).includes(term)
      )
    }
    if (diffFilter !== 'All') {
      result = result.filter(p => p.difficulty === diffFilter)
    }
    if (showSaved) {
      result = result.filter(p => bookmarks.includes(p.problemNumber))
    }
    return result
  }, [problems, searchTerm, diffFilter, showSaved, bookmarks])

  const topicGroups = useMemo(() => groupByTopic(filteredProblems), [filteredProblems])

  const solvedSet = useMemo(() => {
    const ids = stats?.solvedProblemIds || []
    return new Set(ids)
  }, [stats])

  const solvedCount = stats?.solvedCount ?? (isGuest ? '—' : '0')
  const displayName = user?.name || (isGuest ? 'Explorer' : 'Learner')

  const diffCounts = useMemo(() => ({
    Easy: problems.filter(p => p.difficulty === 'Easy').length,
    Medium: problems.filter(p => p.difficulty === 'Medium').length,
    Hard: problems.filter(p => p.difficulty === 'Hard').length,
  }), [problems])

  const handleSolve = (problemNumber) => {
    if (isGuest) {
      alert('Please sign in or create a free account to solve problems!')
      navigate('/register')
    } else {
      navigate(`/problem/${problemNumber}`)
    }
  }

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
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
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

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            color: '#fca5a5', fontSize: '0.85rem', padding: '12px 16px',
            borderRadius: '12px', marginBottom: '24px',
          }}
        >{error}</motion.div>
      )}

      {/* ── Hero Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{
          borderRadius: '18px', padding: '32px 36px', marginBottom: '24px',
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(99,102,241,0.06) 100%)',
          border: '1px solid rgba(124,58,237,0.18)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px',
        }}
      >
        <div style={{ position: 'absolute', right: '-60px', top: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#a78bfa', fontWeight: 500 }}>
            DSA Sheet — Most Important Interview Questions
          </p>
          <h1 style={{ margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Lexend', sans-serif" }}>
            AlgoForge Problem Sheet
          </h1>
          <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            • All DSA topics covered &nbsp; • Curated for placements & interviews
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.8rem', fontWeight: 700 }}>
            <span style={{ color: '#34d399' }}>Easy: {diffCounts.Easy}</span>
            <span style={{ color: 'var(--text-subtle)' }}>|</span>
            <span style={{ color: '#fbbf24' }}>Medium: {diffCounts.Medium}</span>
            <span style={{ color: 'var(--text-subtle)' }}>|</span>
            <span style={{ color: '#f87171' }}>Hard: {diffCounts.Hard}</span>
          </div>
        </div>
        <ProgressRing solved={typeof solvedCount === 'number' ? solvedCount : 0} total={problems.length} />
      </motion.div>

      {/* ── Stats Row ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Problems Solved" value={solvedCount} icon={CheckCircle} color="#34d399" />
        <StatCard label="Total Problems" value={problems.length} icon={Zap} color="#fbbf24" />
        <StatCard label="Saved Questions" value={bookmarks.length} icon={Bookmark} color="#a78bfa" />
      </div>

      {/* ── Action Bar ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        {/* Group Study */}
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setGroupStudyOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: 'rgba(83,221,252,0.08)', border: '1px solid rgba(83,221,252,0.2)',
            color: '#53ddfc', fontWeight: 600, fontSize: '0.82rem',
            padding: '9px 16px', borderRadius: '10px', cursor: 'pointer',
          }}
        >
          <Users style={{ width: '15px', height: '15px' }} /> Group Study
        </motion.button>

        {/* Saved Questions Toggle */}
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowSaved(s => !s)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: showSaved ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.06)',
            border: `1px solid ${showSaved ? 'rgba(251,191,36,0.4)' : 'rgba(251,191,36,0.15)'}`,
            color: '#fbbf24', fontWeight: 600, fontSize: '0.82rem',
            padding: '9px 16px', borderRadius: '10px', cursor: 'pointer',
          }}
        >
          <Bookmark style={{ width: '15px', height: '15px' }} />
          {showSaved ? 'Show All' : 'Saved Questions'}
        </motion.button>

        <div style={{ flex: 1 }} />

        {/* Difficulty Filters */}
        {['All', 'Easy', 'Medium', 'Hard'].map(d => {
          const isActive = diffFilter === d
          const colors = { All: '#a78bfa', Easy: '#34d399', Medium: '#fbbf24', Hard: '#f87171' }
          const c = colors[d]
          return (
            <motion.button
              key={d}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setDiffFilter(d)}
              style={{
                padding: '7px 16px', borderRadius: '999px', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 700,
                background: isActive ? `${c}18` : 'transparent',
                border: `1px solid ${isActive ? c + '50' : 'var(--border)'}`,
                color: isActive ? c : 'var(--text-subtle)',
                transition: 'all 0.15s',
              }}
            >{d}</motion.button>
          )
        })}
      </motion.div>

      {/* ── Search ───────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search style={{
          position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
          width: '18px', height: '18px', color: 'rgba(139,92,246,0.5)',
        }} />
        <input
          type="text" placeholder="Search by title, topic, or problem number..."
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%', padding: '14px 16px 14px 44px',
            background: 'rgba(9,19,40,0.4)', border: '1px solid rgba(139,92,246,0.15)',
            borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.9rem',
            outline: 'none', transition: 'all 0.2s',
          }}
          onFocus={e => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.15)'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {/* ── Problem count badge ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Filter style={{ width: '14px', height: '14px', color: 'var(--text-subtle)' }} />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Showing <strong style={{ color: '#a78bfa' }}>{filteredProblems.length}</strong> of {problems.length} problems
        </span>
      </div>

      {/* ── Topic Accordion Sections ────────────────────────────────────────── */}
      {Object.keys(topicGroups).length === 0 && !error ? (
        <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Search style={{ width: '32px', height: '32px', opacity: 0.3, margin: '0 auto 12px' }} />
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
            No problems found matching "{searchTerm}"
          </p>
        </div>
      ) : (
        Object.entries(topicGroups).map(([topic, probs]) => (
          <TopicSection
            key={topic}
            topic={topic}
            problems={probs}
            solvedSet={solvedSet}
            onSolve={handleSolve}
            isGuest={isGuest}
          />
        ))
      )}

      {/* ── Group Study Modal ────────────────────────────────────────────────── */}
      <GroupStudyModal isOpen={groupStudyOpen} onClose={() => setGroupStudyOpen(false)} />
    </div>
  )
}
