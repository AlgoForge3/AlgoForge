import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, MessageCircle, Zap } from 'lucide-react'

export const GroupStudyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const fakeUsers = [
    { name: 'Arjun K.', avatar: '🧑‍💻', status: 'Solving Arrays' },
    { name: 'Priya S.', avatar: '👩‍💻', status: 'Solving Trees' },
    { name: 'Rohan M.', avatar: '🧑‍🎓', status: 'Solving DP' },
    { name: 'Sneha V.', avatar: '👩‍🎓', status: 'Solving Graphs' },
    { name: 'Aman G.', avatar: '🧑‍💻', status: 'Solving Strings' },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
            }}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', zIndex: 1000,
              width: '100%', maxWidth: '440px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '20px', padding: '32px',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
            }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '14px', right: '14px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-subtle)', padding: '4px',
              }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(83,221,252,0.15), rgba(204,151,255,0.15))',
                border: '1px solid rgba(83,221,252,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users style={{ width: '20px', height: '20px', color: 'var(--secondary)' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Group Study
                </h2>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Solve together, grow faster
                </p>
              </div>
            </div>

            {/* Online now */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              margin: '20px 0 16px', padding: '10px 14px',
              background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)',
              borderRadius: '10px',
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#34d399', boxShadow: '0 0 8px #34d399',
              }} />
              <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 600 }}>
                {Math.floor(Math.random() * 200) + 100}+ people solving now
              </span>
            </div>

            {/* User list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {fakeUsers.map((u, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.3rem' }}>{u.avatar}</span>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{u.status}</p>
                    </div>
                  </div>
                  <Zap style={{ width: '14px', height: '14px', color: 'var(--warning)' }} />
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: 'linear-gradient(135deg, var(--secondary-dim), var(--secondary))',
                color: '#0a1628', fontWeight: 800, fontSize: '0.9rem',
                fontFamily: "'Lexend', sans-serif",
                padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(83,221,252,0.2)',
              }}
            >
              <MessageCircle style={{ width: '16px', height: '16px' }} />
              Join Discussion
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
