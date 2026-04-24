import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'
import api from '../utils/api'
import {
  Loader2, Brain, Zap, Target, TrendingUp,
  CheckCircle, XCircle, ArrowRight, Sparkles,
} from 'lucide-react'

// ── Difficulty styles ──────────────────────────────────────────────────────────
const DIFF_STYLE = {
  Easy:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)', label: 'Easy',   icon: Zap },
  Medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  label: 'Medium', icon: Target },
  Hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', label: 'Hard',   icon: TrendingUp },
}

const LEVEL_STYLE = {
  Novice:       { color: '#94a3b8', gradient: 'from-slate-400 to-gray-500' },
  Beginner:     { color: '#34d399', gradient: 'from-emerald-400 to-green-500' },
  Intermediate: { color: '#fbbf24', gradient: 'from-amber-400 to-yellow-500' },
  Advanced:     { color: '#a78bfa', gradient: 'from-violet-400 to-purple-500' },
  Expert:       { color: '#f472b6', gradient: 'from-pink-400 to-rose-500' },
}

// ── Progress dots ──────────────────────────────────────────────────────────────
const ProgressDots = ({ total, current, answers }) => (
  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
    {Array.from({ length: total }).map((_, i) => {
      const answered = answers[i]
      const isCurrent = i === current
      let bg = 'rgba(255,255,255,0.1)'
      let border = 'rgba(255,255,255,0.15)'
      let scale = 1

      if (answered) {
        bg = answered.correct ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'
        border = answered.correct ? 'rgba(52,211,153,0.6)' : 'rgba(248,113,113,0.6)'
      }
      if (isCurrent) {
        bg = 'rgba(139,92,246,0.3)'
        border = 'rgba(139,92,246,0.7)'
        scale = 1.3
      }

      return (
        <motion.div
          key={i}
          animate={{ scale }}
          style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: bg, border: `2px solid ${border}`,
            transition: 'all 0.3s',
          }}
        />
      )
    })}
  </div>
)

// ── Main Component ────────────────────────────────────────────────────────────
export const Assessment = () => {
  const navigate = useNavigate()
  const { user, setUserLevel, setAssessmentCompleted, isGuest } = useUserStore()

  // ── State ──
  const [phase, setPhase]                 = useState('intro')  // intro | loading | question | feedback | result
  const [question, setQuestion]           = useState(null)
  const [selectedOption, setSelectedOption] = useState(null)
  const [submitting, setSubmitting]       = useState(false)
  const [saving, setSaving]               = useState(false)
  const [answers, setAnswers]             = useState([])        // { correct, difficulty }
  const [feedback, setFeedback]           = useState(null)       // { correct, correctAnswer }
  const [result, setResult]               = useState(null)
  const [error, setError]                 = useState('')

  // ── Start Assessment ──────────────────────────────────────────────────
  const handleStart = async () => {
    // Guest mode — use local fallback
    if (!user || isGuest) {
      setUserLevel('Beginner')
      navigate('/dashboard')
      return
    }

    setPhase('loading')
    setError('')
    try {
      const { data } = await api.post('/assessment/start')
      setQuestion(data.question)
      setAnswers([])
      setPhase('question')
    } catch (err) {
      console.error('Start failed:', err)
      setError(err.response?.data?.error || 'Failed to start assessment. Is the backend running?')
      setPhase('intro')
    }
  }

  // ── Submit Answer ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedOption || submitting) return

    setSubmitting(true)
    try {
      const { data } = await api.post('/assessment/answer', {
        questionId: question._id,
        selectedAnswer: selectedOption,
      })

      // Show feedback for 1.5s
      setFeedback(data.lastAnswer)
      setPhase('feedback')

      const newAnswer = {
        correct: data.lastAnswer.correct,
        difficulty: question.difficulty,
      }
      const updatedAnswers = [...answers, newAnswer]
      setAnswers(updatedAnswers)

      setTimeout(() => {
        if (data.finished) {
          // Assessment complete!
          setResult(data.result)
          setPhase('result')
        } else {
          // Next question
          setQuestion(data.nextQuestion)
          setSelectedOption(null)
          setPhase('question')
        }
      }, 1500)
    } catch (err) {
      console.error('Answer submit failed:', err)
      setError(err.response?.data?.error || 'Failed to submit answer.')
      setPhase('question')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Finish → Dashboard ────────────────────────────────────────────────
  const handleFinish = async () => {
    if (result) {
      setAssessmentCompleted(result.finalLevel, result.score)
    }
    navigate('/dashboard')
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INTRO SCREEN
  // ═══════════════════════════════════════════════════════════════════════
  if (phase === 'intro') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 4rem)', padding: '20px', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '72px', height: '72px', borderRadius: '20px', marginBottom: '24px',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(99,102,241,0.15))',
            border: '1px solid rgba(124,58,237,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(124,58,237,0.2)',
          }}
        >
          <Brain style={{ width: '32px', height: '32px', color: '#a78bfa' }} />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent"
          style={{ marginBottom: '12px' }}
        >
          Adaptive Skill Assessment
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '480px', lineHeight: 1.7, marginBottom: '12px' }}
        >
          This test adapts to your skill level in real-time. Answer correctly and the questions get harder. Answer wrong and they stay at your level.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ display: 'flex', gap: '20px', marginBottom: '32px', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {['Easy', 'Medium', 'Hard'].map(d => {
            const s = DIFF_STYLE[d]
            const Icon = s.icon
            return (
              <div key={d} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: s.bg, border: `1px solid ${s.border}`,
                padding: '6px 14px', borderRadius: '999px',
              }}>
                <Icon style={{ width: '13px', height: '13px', color: s.color }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: s.color }}>{d}</span>
              </div>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{
            display: 'flex', gap: '24px', marginBottom: '32px',
            padding: '16px 24px', borderRadius: '14px',
            background: 'rgba(19,19,31,0.6)', border: '1px solid var(--border)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>5</span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Questions</p>
          </div>
          <div style={{ width: '1px', background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>~2</span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Minutes</p>
          </div>
          <div style={{ width: '1px', background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>🎯</span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Adaptive</p>
          </div>
        </motion.div>

        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            color: '#fca5a5', fontSize: '0.85rem', padding: '10px 16px',
            borderRadius: '10px', marginBottom: '16px', maxWidth: '420px',
          }}>
            {error}
          </div>
        )}

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -2, boxShadow: '0 12px 32px rgba(124,58,237,0.4)' }}
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
            color: 'white', fontWeight: 700, fontSize: '1rem',
            padding: '14px 36px', borderRadius: '14px', border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          <Sparkles style={{ width: '18px', height: '18px' }} />
          Begin Assessment
        </motion.button>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════════════════════
  if (phase === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 4rem)', gap: '12px', color: 'var(--text-muted)' }}>
        <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem' }}>Preparing your assessment...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FEEDBACK (correct/wrong flash — 1.5s)
  // ═══════════════════════════════════════════════════════════════════════
  if (phase === 'feedback' && feedback) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 4rem)', padding: '20px' }}>
        <ProgressDots total={5} current={answers.length} answers={answers} />

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            marginTop: '40px', textAlign: 'center',
            padding: '40px',
            borderRadius: '20px',
            background: feedback.correct
              ? 'rgba(52,211,153,0.06)'
              : 'rgba(248,113,113,0.06)',
            border: `1px solid ${feedback.correct ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
          >
            {feedback.correct ? (
              <CheckCircle style={{ width: '56px', height: '56px', color: '#34d399', marginBottom: '16px' }} />
            ) : (
              <XCircle style={{ width: '56px', height: '56px', color: '#f87171', marginBottom: '16px' }} />
            )}
          </motion.div>

          <h2 style={{
            fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px',
            color: feedback.correct ? '#34d399' : '#f87171',
          }}>
            {feedback.correct ? 'Correct!' : 'Incorrect'}
          </h2>

          {!feedback.correct && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Correct answer: <strong style={{ color: '#34d399' }}>{feedback.correctAnswer}</strong>
            </p>
          )}

          <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '16px' }}>
            {answers.length < 5 ? 'Loading next question...' : 'Calculating your result...'}
          </p>
        </motion.div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // QUESTION SCREEN
  // ═══════════════════════════════════════════════════════════════════════
  if (phase === 'question' && question) {
    const ds = DIFF_STYLE[question.difficulty] || DIFF_STYLE.Medium
    const DiffIcon = ds.icon

    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Progress */}
        <div style={{ marginBottom: '24px' }}>
          <ProgressDots total={5} current={answers.length} answers={answers} />
        </div>

        {/* Question card */}
        <motion.div
          key={question._id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'rgba(19,19,31,0.8)',
            border: '1px solid var(--border)',
            borderRadius: '18px',
            padding: '28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          {/* Header: question number + difficulty badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Question {question.qNumber} of {question.totalQuestions}
            </span>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: ds.bg, border: `1px solid ${ds.border}`,
                padding: '4px 12px', borderRadius: '999px',
              }}
            >
              <DiffIcon style={{ width: '12px', height: '12px', color: ds.color }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ds.color }}>{ds.label}</span>
            </motion.div>
          </div>

          {/* Topic tag */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{
              fontSize: '0.7rem', color: 'var(--text-subtle)',
              background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: '6px',
              fontWeight: 500,
            }}>
              {question.topic}
            </span>
          </div>

          {/* Question text */}
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '24px' }}>
            {question.question}
          </h2>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {question.options.map((option, idx) => {
              const isSelected = selectedOption === option
              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedOption(option)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '14px 16px', borderRadius: '12px',
                    background: isSelected ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    fontSize: '0.9rem', fontWeight: isSelected ? 600 : 400,
                    boxShadow: isSelected ? '0 0 20px rgba(124,58,237,0.08)' : 'none',
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${isSelected ? '#a78bfa' : 'rgba(255,255,255,0.15)'}`,
                    background: isSelected ? '#7c3aed' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                  </div>
                  {option}
                </motion.button>
              )
            })}
          </div>

          {/* Submit button */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <motion.button
              whileHover={selectedOption ? { y: -2 } : {}}
              whileTap={selectedOption ? { scale: 0.97 } : {}}
              onClick={handleSubmit}
              disabled={!selectedOption || submitting}
              style={{
                background: selectedOption ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255,255,255,0.05)',
                color: selectedOption ? 'white' : 'rgba(255,255,255,0.3)',
                fontWeight: 700, fontSize: '0.9rem',
                padding: '12px 28px', borderRadius: '12px', border: 'none',
                cursor: selectedOption ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: selectedOption ? '0 8px 24px rgba(124,58,237,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                  Checking...
                </>
              ) : (
                <>
                  Submit <ArrowRight style={{ width: '14px', height: '14px' }} />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            color: '#fca5a5', fontSize: '0.83rem', padding: '10px 14px',
            borderRadius: '10px', marginTop: '16px',
          }}>
            {error}
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RESULT SCREEN
  // ═══════════════════════════════════════════════════════════════════════
  if (phase === 'result' && result) {
    const ls = LEVEL_STYLE[result.finalLevel] || LEVEL_STYLE.Beginner

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 4rem)', padding: '20px' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '100%', maxWidth: '460px',
            background: 'rgba(19,19,31,0.8)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '36px',
            textAlign: 'center',
            boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 20px',
              background: `rgba(${result.finalLevel === 'Advanced' ? '139,92,246' : result.finalLevel === 'Intermediate' ? '251,191,36' : '52,211,153'},0.15)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Sparkles style={{ width: '28px', height: '28px', color: ls.color }} />
          </motion.div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Assessment Complete!
          </h1>

          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a78bfa', marginBottom: '24px' }}>
            Score: {result.score} / {result.totalQuestions}
          </p>

          {/* Level badge */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
            borderRadius: '14px', padding: '20px', marginBottom: '24px',
          }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Your Level:</p>
            <h2 className={`text-3xl font-extrabold bg-gradient-to-r ${ls.gradient} bg-clip-text text-transparent`}>
              {result.finalLevel}
            </h2>
          </div>

          {/* Breakdown */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', justifyContent: 'center' }}>
            {['Easy', 'Medium', 'Hard'].map(d => {
              const b = result.breakdown[d] || { correct: 0, total: 0 }
              const ds = DIFF_STYLE[d]
              if (b.total === 0) return null
              return (
                <motion.div
                  key={d}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '10px',
                    background: ds.bg, border: `1px solid ${ds.border}`,
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: ds.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</span>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {b.correct}/{b.total}
                  </p>
                </motion.div>
              )
            })}
          </div>

          {/* Difficulty path visualization */}
          {result.difficultyHistory && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '8px' }}>Difficulty Path:</p>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                {result.difficultyHistory.map((d, i) => {
                  const ds = DIFF_STYLE[d]
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {i > 0 && <span style={{ color: 'var(--text-subtle)', fontSize: '0.7rem' }}>→</span>}
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700, color: ds.color,
                        background: ds.bg, padding: '2px 8px', borderRadius: '4px',
                      }}>
                        {d[0]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ y: -2, boxShadow: '0 12px 32px rgba(124,58,237,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleFinish}
            disabled={saving}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              color: 'white', fontWeight: 700, fontSize: '0.9rem',
              padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            Go to Dashboard <ArrowRight style={{ width: '14px', height: '14px' }} />
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // Fallback
  return null
}
