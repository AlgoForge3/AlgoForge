import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Bookmark, BookmarkCheck, ArrowRight, ExternalLink } from 'lucide-react'
import { useBookmarkStore } from '../store/useBookmarkStore'

const diffStyle = (d) => {
  if (d === 'Easy') return { color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' }
  if (d === 'Medium') return { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' }
  return { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' }
}

const TOPIC_ICONS = {
  'Arrays': '📊', 'Strings': '🔤', 'Linked Lists': '🔗', 'Stacks & Queues': '📚',
  'Binary Search': '🔍', 'Recursion & Backtracking': '🔄', 'Trees': '🌳',
  'Graphs': '🕸️', 'Dynamic Programming': '💡', 'Heaps & Priority Queues': '⛰️',
  'Greedy': '🎯', 'Math & Bit Manipulation': '🔢', 'Advanced DS': '🧩', 'Other': '📦',
}

const TOPIC_COLORS = {
  'Arrays': '#34d399', 'Strings': '#60a5fa', 'Linked Lists': '#a78bfa',
  'Stacks & Queues': '#fbbf24', 'Binary Search': '#f472b6', 'Recursion & Backtracking': '#fb923c',
  'Trees': '#4ade80', 'Graphs': '#38bdf8', 'Dynamic Programming': '#e879f9',
  'Heaps & Priority Queues': '#facc15', 'Greedy': '#fb7185', 'Math & Bit Manipulation': '#2dd4bf',
  'Advanced DS': '#818cf8', 'Other': '#94a3b8',
}

export const TopicSection = ({ topic, problems, solvedSet, onSolve, isGuest }) => {
  const [open, setOpen] = useState(false)
  const { bookmarks, toggle } = useBookmarkStore()
  const color = TOPIC_COLORS[topic] || '#a78bfa'
  const icon = TOPIC_ICONS[topic] || '📦'
  const solvedCount = problems.filter(p => solvedSet.has(p.problemNumber || p._id)).length

  return (
    <div style={{ marginBottom: '6px' }}>
      {/* Accordion Header */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.995 }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', cursor: 'pointer',
          background: open ? `linear-gradient(135deg, ${color}08, ${color}04)` : 'rgba(19,19,31,0.5)',
          border: `1px solid ${open ? color + '30' : 'var(--border)'}`,
          borderRadius: open ? '14px 14px 0 0' : '14px',
          color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700,
          transition: 'all 0.25s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.2rem' }}>{icon}</span>
          <span style={{ fontFamily: "'Lexend', sans-serif" }}>{topic}</span>
          <span style={{
            fontSize: '0.72rem', fontWeight: 600, color, padding: '3px 10px',
            background: color + '12', border: `1px solid ${color}25`, borderRadius: '999px',
          }}>
            {solvedCount} / {problems.length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Mini progress bar */}
          <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${problems.length > 0 ? (solvedCount / problems.length) * 100 : 0}%`,
              height: '100%', borderRadius: '999px', background: color,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown style={{ width: '18px', height: '18px', color: 'var(--text-subtle)' }} />
          </motion.div>
        </div>
      </motion.button>

      {/* Accordion Body — Problem Table */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              background: 'rgba(14,14,26,0.6)',
              border: `1px solid ${color}20`, borderTop: 'none',
              borderRadius: '0 0 14px 14px',
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '50px 1fr 90px 70px 44px',
                padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-subtle)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                <span>#</span>
                <span>Problem</span>
                <span style={{ textAlign: 'center' }}>Level</span>
                <span style={{ textAlign: 'center' }}>Practice</span>
                <span style={{ textAlign: 'center' }}>Save</span>
              </div>

              {/* Rows */}
              {problems.map((p, i) => {
                const ds = diffStyle(p.difficulty)
                const isSaved = bookmarks.includes(p.problemNumber)
                const isSolved = solvedSet.has(p.problemNumber || p._id)
                return (
                  <motion.div
                    key={p._id || p.problemNumber}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={{
                      display: 'grid', gridTemplateColumns: '50px 1fr 90px 70px 44px',
                      alignItems: 'center', padding: '12px 20px',
                      borderBottom: i < problems.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `${color}08`}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Number + Solved indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isSolved ? (
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '10px', color: '#000', fontWeight: 800 }}>✓</span>
                        </div>
                      ) : (
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--border)' }} />
                      )}
                    </div>

                    {/* Title + topics */}
                    <div style={{ minWidth: 0 }}>
                      <span
                        onClick={() => onSolve(p.problemNumber)}
                        style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.target.style.color = color}
                        onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}
                      >
                        {p.problemNumber}. {p.title}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                        {p.topics?.slice(0, 3).map(t => (
                          <span key={t} style={{
                            fontSize: '0.65rem', color: 'var(--text-subtle)',
                            background: 'rgba(255,255,255,0.04)', padding: '1px 6px', borderRadius: '4px',
                          }}>{t}</span>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                        color: ds.color, background: ds.bg, border: `1px solid ${ds.border}`,
                        padding: '3px 10px', borderRadius: '6px',
                      }}>{p.difficulty}</span>
                    </div>

                    {/* Practice link */}
                    <div style={{ textAlign: 'center' }}>
                      <motion.button
                        onClick={() => onSolve(p.problemNumber)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          background: `${color}15`, border: `1px solid ${color}30`,
                          borderRadius: '8px', padding: '5px 8px', cursor: 'pointer',
                          color, display: 'inline-flex', alignItems: 'center',
                        }}
                      >
                        <ExternalLink style={{ width: '14px', height: '14px' }} />
                      </motion.button>
                    </div>

                    {/* Bookmark */}
                    <div style={{ textAlign: 'center' }}>
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); toggle(p.problemNumber) }}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                          color: isSaved ? '#fbbf24' : 'var(--text-subtle)',
                        }}
                      >
                        {isSaved
                          ? <BookmarkCheck style={{ width: '16px', height: '16px' }} />
                          : <Bookmark style={{ width: '16px', height: '16px' }} />
                        }
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
