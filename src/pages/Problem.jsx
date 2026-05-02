<<<<<<< HEAD
import { useState, useRef, useEffect } from 'react'
=======
import { useEffect, useState, useRef } from 'react'
>>>>>>> origin/main
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { Editor } from '@monaco-editor/react'
import { useUserStore } from '../store/useUserStore'
import api from '../utils/api'
import {
  Play, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, AlertCircle,
  Clock, Tag, FileCode, RotateCcw, Loader2, CloudUpload
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const DIFFICULTY = {
  Easy:   { text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  Medium: { text: 'text-amber-400',   bg: 'bg-amber-400/10'   },
  Hard:   { text: 'text-rose-400',    bg: 'bg-rose-400/10'    },
}

const LANGS = [
  { value: 'cpp',        label: 'C++',        monaco: 'cpp',        file: 'solution.cpp'  },
  { value: 'python',     label: 'Python 3',   monaco: 'python',     file: 'solution.py'   },
  { value: 'java',       label: 'Java',       monaco: 'java',       file: 'Solution.java' },
  { value: 'javascript', label: 'JavaScript', monaco: 'javascript', file: 'solution.js'   },
]

const DEFAULT_BOTTOM_PANEL_HEIGHT = 208
const MIN_BOTTOM_PANEL_HEIGHT = 160
const DEFAULT_LEFT_PANEL_WIDTH = 520
const MIN_LEFT_PANEL_WIDTH = 320
const DRAFT_STORAGE_PREFIX = 'algoforge:editor-draft:v1'

const getDraftStorageKey = (problemNumber, language) =>
  `${DRAFT_STORAGE_PREFIX}:${problemNumber}:${language}`

const readDraft = (problemNumber, language) => {
  try {
    return localStorage.getItem(getDraftStorageKey(problemNumber, language))
  } catch {
    return null
  }
}

const writeDraft = (problemNumber, language, code) => {
  try {
    localStorage.setItem(getDraftStorageKey(problemNumber, language), code)
  } catch {}
}

const clearDraft = (problemNumber, language) => {
  try {
    localStorage.removeItem(getDraftStorageKey(problemNumber, language))
  } catch {}
}

const getDraftStatusLabel = (draftState) => {
  switch (draftState) {
    case 'saving':
      return 'Saving locally...'
    case 'saved':
      return 'Saved locally'
    case 'restored':
      return 'Draft restored'
    default:
      return 'Starter code'
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Left panel: problem description */
function DescriptionPanel({ problem }) {
  const d = DIFFICULTY[problem.difficulty] || DIFFICULTY.Easy
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar text-sm">
      {/* Title + badge */}
      <div>
        <h1 className="text-base font-semibold text-white mb-2">{problem.title}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.text} ${d.bg}`}>
            {problem.difficulty}
          </span>
          {problem.topics?.map(t => (
            <span key={t} className="flex items-center gap-1 text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              <Tag className="w-2.5 h-2.5" />{t}
            </span>
          ))}
          <span className="ml-auto text-xs text-slate-600">✓ {problem.acceptance}</span>
        </div>
      </div>

      {/* Description */}
      <div className="text-slate-300 leading-relaxed space-y-3">
        {problem.description.split('\n\n').map((p, i) => (
          <p key={i} dangerouslySetInnerHTML={{
            __html: p
              .replace(/`([^`]+)`/g, '<code class="px-1 py-px bg-slate-700/70 rounded text-amber-300 font-mono text-xs">$1</code>')
              .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
              .replace(/\*([^*]+)\*/g, '<em class="text-slate-200">$1</em>')
              .replace(/\n/g, '<br/>')
          }} />
        ))}
      </div>

      {/* Examples */}
      <div className="space-y-3">
        {problem.examples?.map((ex, i) => (
          <div key={i} className="rounded-lg border border-slate-700/40 overflow-hidden bg-slate-800/30">
            <div className="px-3 py-1.5 bg-slate-800/60">
              <span className="text-xs font-semibold text-slate-400">Example {i + 1}</span>
            </div>
            <div className="px-3 py-3 font-mono text-xs space-y-1.5">
              <div><span className="text-slate-500">Input:&nbsp; </span><span className="text-slate-200">{ex.input}</span></div>
              <div><span className="text-slate-500">Output: </span><span className="text-slate-200">{ex.output}</span></div>
              {ex.explanation && (
                <div className="mt-2 text-xs font-sans text-slate-400 leading-relaxed">
                  <span className="text-slate-500">Explanation: </span>{ex.explanation}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Constraints */}
      {problem.constraints?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-300 mb-2">Constraints:</p>
          <ul className="space-y-1">
            {problem.constraints.map((c, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-400 font-mono">
                <span className="text-slate-600 shrink-0">•</span>
                <code className="text-slate-300">{c}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Bottom panel: Test Cases tab */
function TestCaseTab({ problem, selCase, setSelCase }) {
  // Build display data from examples since testCases are hidden server-side
  const displayCases = problem.examples?.map(ex => ({ display: `${ex.input}` })) || []
  const tc = displayCases[selCase]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Case selector pills */}
      <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0">
        {displayCases.map((_, i) => (
          <button
            key={i}
            onClick={() => setSelCase(i)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              selCase === i
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            Case {i + 1}
          </button>
        ))}
      </div>
      {/* Input display */}
      {tc && (
        <div className="px-4 pb-3 flex-1 overflow-y-auto">
          <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Input</p>
          <pre className="font-mono text-xs text-slate-300 bg-slate-800/50 rounded-lg px-3 py-2.5 whitespace-pre-wrap">
            {tc.display}
          </pre>
        </div>
      )}
    </div>
  )
}

/** Bottom panel: Test Result tab */
function TestResultTab({ testResults }) {
  const [selResult, setSelResult] = useState(0)
  const stdout = testResults?.stdout?.trim()
  const stderr = testResults?.stderr?.trim()
  const submissionSummary = testResults?.submissionSummary

  useEffect(() => {
    setSelResult(0)
  }, [testResults])

  if (!testResults) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2">
        <Clock className="w-5 h-5" />
        <p className="text-xs italic">Run your code to see test results.</p>
      </div>
    )
  }

  if (testResults.error) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Compilation / Runtime Error</span>
        </div>
        <pre className="font-mono text-xs text-rose-300 bg-rose-500/5 border border-rose-500/20 rounded-lg px-3 py-2.5 whitespace-pre-wrap leading-relaxed">
          {testResults.error}
        </pre>
        {stdout && (
          <div className="mt-4">
            <p className="text-xs text-slate-500 font-semibold mb-1">Stdout</p>
            <pre className="font-mono text-xs text-slate-200 bg-slate-800/60 rounded-lg px-3 py-2.5 whitespace-pre-wrap leading-relaxed">
              {stdout}
            </pre>
          </div>
        )}
      </div>
    )
  }

  const results = Array.isArray(testResults.results) ? testResults.results : []
  const publicPassed = submissionSummary ? submissionSummary.publicPassed : results.filter((result) => result.passed).length
  const publicTotal = submissionSummary ? submissionSummary.publicTotal : results.length
  const totalPassed = submissionSummary ? submissionSummary.overallPassed : publicPassed
  const totalCases = submissionSummary ? submissionSummary.overallTotal : publicTotal
  const allPassed = submissionSummary
    ? submissionSummary.overallStatus === 'Accepted'
    : publicPassed === publicTotal
  const verdictLabel = submissionSummary?.overallStatus || (allPassed ? 'Accepted' : 'Wrong Answer')
  const cur = results.length > 0 ? results[Math.min(selResult, results.length - 1)] : null

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Overall status bar */}
      <div className={`mx-4 mt-2 mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold shrink-0 ${
        allPassed
          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
      }`}>
        {verdictLabel} · {totalPassed} / {totalCases} testcases passed {allPassed
          ? <CheckCircle className="w-3.5 h-3.5" />
          : <XCircle className="w-3.5 h-3.5" />}
        {allPassed
          ? `All ${results.length} test cases passed 🎉`
          : `${passCount} / ${results.length} test cases passed`}
      </div>

      {submissionSummary && (
        <div className={`mx-4 mb-2 rounded-lg border px-3 py-2 text-xs shrink-0 ${
          submissionSummary.overallStatus === 'Accepted'
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
            : submissionSummary.hiddenError
              ? 'border-rose-500/20 bg-rose-500/10 text-rose-200'
              : 'border-amber-500/20 bg-amber-500/10 text-amber-200'
        }`}>
          <p className="font-semibold">Submit Check: {submissionSummary.overallStatus}</p>
          <p className="mt-1 text-slate-300">
            Standard: {submissionSummary.publicPassed}/{submissionSummary.publicTotal} • AI Hidden: {submissionSummary.hiddenPassed}/{submissionSummary.hiddenTotal} • Overall: {submissionSummary.overallPassed}/{submissionSummary.overallTotal}
          </p>
          <p className="mt-1 text-slate-400">{submissionSummary.note}</p>
          {submissionSummary.hiddenError && (
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-rose-500/20 bg-black/20 px-3 py-2 font-mono text-xs text-rose-100">
              {submissionSummary.hiddenError}
            </pre>
          )}
        </div>
      )}

      {/* Case pills */}
      <div className="flex items-center gap-2 px-4 py-1 shrink-0">
        {results.map((r, i) => (
          <button
            key={i}
            onClick={() => setSelResult(i)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              selResult === i
                ? r.passed
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {r.passed
              ? <CheckCircle className="w-3 h-3 text-emerald-400" />
              : <XCircle    className="w-3 h-3 text-rose-400"    />}
            Case {i + 1}
          </button>
        ))}
      </div>

      {/* Selected result detail */}
      {cur && (
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar">
          {[
            { label: 'Input',    value: typeof cur.input === 'object' && !Array.isArray(cur.input)
                ? Object.entries(cur.input).map(([k,v]) => `${k} = ${JSON.stringify(v)}`).join('\n')
                : JSON.stringify(cur.input) },
            { label: 'Expected', value: cur.expected },
            { label: 'Output',   value: cur.output ?? 'No output', isOut: true, passed: cur.passed },
          ].map(({ label, value, isOut, passed }) => (
            <div key={label}>
              <p className="text-xs text-slate-500 font-semibold mb-1">{label}</p>
              <pre className={`font-mono text-xs px-3 py-2 rounded-lg whitespace-pre-wrap ${
                isOut
                  ? passed
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  : 'bg-slate-800/60 text-slate-300'
              }`}>
                {value}
              </pre>
            </div>
          ))}
          {stdout && (
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">Stdout</p>
              <pre className="font-mono text-xs px-3 py-2 rounded-lg whitespace-pre-wrap bg-slate-800/60 text-slate-200">
                {stdout}
              </pre>
            </div>
          )}
          {stderr && (
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">Compiler Output</p>
              <pre className="font-mono text-xs px-3 py-2 rounded-lg whitespace-pre-wrap bg-amber-500/10 text-amber-200 border border-amber-500/20">
                {stderr}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const Problem = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useUserStore((state) => state.user)

  // State
  const [lang, setLang]               = useState('cpp')
  const [isRunning, setIsRunning]     = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [bottomTab, setBottomTab]     = useState('testcase')
  const [selCase, setSelCase]         = useState(0)
<<<<<<< HEAD
  const [editorValue, setEditorValue] = useState('')
  const [draftState, setDraftState] = useState('starter')
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_LEFT_PANEL_WIDTH)
  const [bottomPanelHeight, setBottomPanelHeight] = useState(DEFAULT_BOTTOM_PANEL_HEIGHT)
  const [isResizingSplit, setIsResizingSplit] = useState(false)
  const [isResizingPanel, setIsResizingPanel] = useState(false)
=======
  const [problem, setProblem]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [errorFetching, setErrorFetching] = useState(false)
>>>>>>> origin/main
  const editorRef = useRef(null)
  const editorValueRef = useRef('')
  const workspaceRef = useRef(null)
  const rightPaneRef = useRef(null)
  const isHydratingDraftRef = useRef(false)
  const executeActionRef = useRef(() => {})
  const resizeStateRef = useRef({
    startY: 0,
    startHeight: DEFAULT_BOTTOM_PANEL_HEIGHT,
  })
  const splitResizeStateRef = useRef({
    startX: 0,
    startWidth: DEFAULT_LEFT_PANEL_WIDTH,
  })

<<<<<<< HEAD
  // ── Fetch problem from API ──────────────────────────────────────────
  const [problem, setProblem]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [syncing, setSyncing]       = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [allProblems, setAllProblems] = useState([])

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true)
      setFetchError('')
      setSyncing(false)
      try {
        const [{ data: prob }, { data: all }] = await Promise.all([
          api.get(`/problems/${id}`),
          api.get('/problems'),
        ])
        setAllProblems(all)
=======
  useEffect(() => {
    api.get(`/problems/${id}`)
      .then(res => {
        setProblem(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setErrorFetching(true)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#1a1a1a] text-white">Loading Problem...</div>
  if (errorFetching || !problem) return <Navigate to="/dashboard" replace />

  const currentLang = LANGS.find(l => l.value === lang) || LANGS[0]
  const d = DIFFICULTY[problem.difficulty] || DIFFICULTY.Easy
>>>>>>> origin/main

        // If this is a skeleton problem, auto-fetch full data from LeetCode
        const isSkel = prob.isSkeleton ||
          prob.description === 'Content locked: Click to auto-fetch from LeetCode' ||
          (!prob.starterCode?.cpp && !prob.starterCode?.python && !prob.starterCode?.java && prob.functionName === 'Skeleton')

        if (isSkel && prob.titleSlug) {
          setSyncing(true)
          setLoading(false) // Show syncing UI instead of generic loading
          try {
            await api.post('/problems/leetcode/sync', { slugs: [prob.titleSlug] })
            // Refetch the now-complete problem
            const { data: fullProb } = await api.get(`/problems/${id}`)
            setProblem(fullProb)
          } catch (syncErr) {
            console.warn('Auto-sync failed:', syncErr)
            // Still show whatever we have
            setProblem(prob)
          } finally {
            setSyncing(false)
          }
        } else {
          setProblem(prob)
        }
      } catch (err) {
        console.error('Failed to fetch problem:', err)
        setFetchError(err.response?.data?.error || 'Failed to load problem.')
      } finally {
        setLoading(false)
      }
    }
    fetchProblem()
  }, [id])

  useEffect(() => {
    if (!problem) return

    isHydratingDraftRef.current = true
    const starterCode = problem.starterCode?.[lang] || ''
    const savedDraft = readDraft(problem.problemNumber, lang)
    const nextEditorValue = savedDraft ?? starterCode

    editorValueRef.current = nextEditorValue
    setEditorValue(nextEditorValue)
    setDraftState(savedDraft !== null ? 'restored' : 'starter')

    const timer = window.setTimeout(() => {
      isHydratingDraftRef.current = false
    }, 0)

    return () => window.clearTimeout(timer)
  }, [problem, lang])

  const persistDraft = (nextCode) => {
    if (!problem) return

    const starterCode = problem.starterCode?.[lang] || ''
    if (nextCode === starterCode) {
      clearDraft(problem.problemNumber, lang)
      setDraftState('starter')
      return
    }

    writeDraft(problem.problemNumber, lang, nextCode)
    setDraftState('saved')
  }

  const flushCurrentDraft = () => {
    if (!problem || isHydratingDraftRef.current) return

    const liveCode = editorRef.current?.getValue?.() ?? editorValueRef.current
    editorValueRef.current = liveCode
    persistDraft(liveCode)
  }

  const clampLeftPanelWidth = (nextWidth) => {
    const containerWidth = workspaceRef.current?.clientWidth || window.innerWidth
    const maxWidth = Math.max(MIN_LEFT_PANEL_WIDTH, containerWidth - 420)
    return Math.min(Math.max(nextWidth, MIN_LEFT_PANEL_WIDTH), maxWidth)
  }

  useEffect(() => {
    if (!problem) return

    const handleBeforeUnload = () => {
      flushCurrentDraft()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushCurrentDraft()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [problem, lang])

  useEffect(() => {
    executeActionRef.current = (action) => {
      if (!isRunning && !isSubmitting) {
        handleExecute(action)
      }
    }
  }, [isRunning, isSubmitting, lang, problem, user, editorValue])

  useEffect(() => {
    const clampSplitWidth = () => {
      setLeftPanelWidth((currentWidth) => clampLeftPanelWidth(currentWidth))
    }

    clampSplitWidth()
    window.addEventListener('resize', clampSplitWidth)
    return () => window.removeEventListener('resize', clampSplitWidth)
  }, [])

  useEffect(() => {
    const clampPanelHeight = () => {
      const containerHeight = rightPaneRef.current?.clientHeight || window.innerHeight
      const maxHeight = Math.max(MIN_BOTTOM_PANEL_HEIGHT, containerHeight - 220)
      setBottomPanelHeight((currentHeight) =>
        Math.min(Math.max(currentHeight, MIN_BOTTOM_PANEL_HEIGHT), maxHeight)
      )
    }

    clampPanelHeight()
    window.addEventListener('resize', clampPanelHeight)
    return () => window.removeEventListener('resize', clampPanelHeight)
  }, [])

  useEffect(() => {
    if (!isResizingPanel) return

    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect

    const handlePointerMove = (event) => {
      const deltaY = resizeStateRef.current.startY - event.clientY
      const containerHeight = rightPaneRef.current?.clientHeight || window.innerHeight
      const maxHeight = Math.max(MIN_BOTTOM_PANEL_HEIGHT, containerHeight - 220)
      const nextHeight = resizeStateRef.current.startHeight + deltaY

      setBottomPanelHeight(
        Math.min(Math.max(nextHeight, MIN_BOTTOM_PANEL_HEIGHT), maxHeight)
      )
    }

    const handlePointerUp = () => {
      setIsResizingPanel(false)
    }

    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isResizingPanel])

  useEffect(() => {
    if (!isResizingSplit) return

    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect

    const handlePointerMove = (event) => {
      const deltaX = event.clientX - splitResizeStateRef.current.startX
      const nextWidth = splitResizeStateRef.current.startWidth + deltaX
      setLeftPanelWidth(clampLeftPanelWidth(nextWidth))
    }

    const handlePointerUp = () => {
      setIsResizingSplit(false)
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isResizingSplit])

  const handleExecute = async (action = 'run') => {
    if (!user) {
      alert("Please login or register to execute code and track your progress.");
      navigate('/login');
      return;
    }

<<<<<<< HEAD
    if (lang === 'javascript') {
      setTestResults({ error: 'JavaScript execution is not yet supported.\nPlease switch to C++, Python 3, or Java.' })
      setBottomTab('result')
      return
    }

    flushCurrentDraft()

    if (action === 'run') setIsRunning(true)
    else setIsSubmitting(true)
    
=======
    setIsRunning(true)
>>>>>>> origin/main
    setTestResults(null)
    setBottomTab('result')

    const code = editorRef.current?.getValue?.() ?? editorValue ?? (problem?.starterCode?.[lang] ?? '')

    try {
      const { data } = await api.post('/execute', {
        language:  lang,
        code,
<<<<<<< HEAD
        problemId: problem?.problemNumber,
        action: action
=======
        problemId: problem.problemNumber,
>>>>>>> origin/main
      })

      if (data.error) {
        setTestResults({
          error: data.error,
          stdout: data.stdout,
          stderr: data.stderr,
        })
      } else {
        setTestResults({
          results: data.results,
          stdout: data.stdout,
          stderr: data.stderr,
          submissionSummary: data.submissionSummary || null,
        })
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Server Error: Could not connect to compiler.\nMake sure the backend is running on port 5000.';
      setTestResults({
        error: errorMsg,
        stdout: err.response?.data?.stdout || '',
        stderr: err.response?.data?.stderr || '',
      });
    } finally {
      if (action === 'run') setIsRunning(false)
      else setIsSubmitting(false)
    }
  }

  // Keyboard Shortcuts (Ctrl+' for Run, Ctrl+Enter for Submit)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "'" || e.code === 'Quote')) {
        e.preventDefault()
        if (!isRunning && !isSubmitting) handleExecute('run')
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter')
      ) {
        e.preventDefault()
        if (!isRunning && !isSubmitting) handleExecute('submit')
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRunning, isSubmitting, lang, problem, user])

  // Syncing from LeetCode state
  if (syncing) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-[#1a1a1a] text-slate-400 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <div className="text-center">
          <p className="text-sm font-semibold text-white mb-1">Fetching from LeetCode...</p>
          <p className="text-xs text-slate-500">Auto-syncing full problem data. This takes a few seconds.</p>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-[#1a1a1a] text-slate-400 gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading problem...</span>
      </div>
    )
  }

  // Error / not found
  if (fetchError || !problem) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-[#1a1a1a] text-center px-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">Problem Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{fetchError || `Problem #${id} doesn't exist.`}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>
    )
  }

  const currentLang = LANGS.find(l => l.value === lang) || LANGS[0]
  const d = DIFFICULTY[problem.difficulty] || DIFFICULTY.Easy

  // Find prev/next based on real problems list
  const problemIdx  = allProblems.findIndex(p => p.problemNumber === parseInt(id))
  const prevProblem = allProblems[problemIdx - 1]
  const nextProblem = allProblems[problemIdx + 1]

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor
    editorValueRef.current = editor.getValue()

    editor.onKeyDown((event) => {
      const browserEvent = event.browserEvent
      const isModifierPressed = browserEvent.ctrlKey || browserEvent.metaKey

      if (!isModifierPressed) return

      if (browserEvent.key === 'Enter' || browserEvent.code === 'Enter' || browserEvent.code === 'NumpadEnter') {
        browserEvent.preventDefault()
        browserEvent.stopPropagation()
        event.preventDefault()
        event.stopPropagation()
        executeActionRef.current('submit')
        return
      }

      if (browserEvent.key === "'" || browserEvent.code === 'Quote') {
        browserEvent.preventDefault()
        browserEvent.stopPropagation()
        event.preventDefault()
        event.stopPropagation()
        executeActionRef.current('run')
      }
    })

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => executeActionRef.current('submit')
    )

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Quote,
      () => executeActionRef.current('run')
    )
  }

  const handleEditorChange = (value) => {
    const nextCode = value ?? ''
    editorValueRef.current = nextCode
    setEditorValue(nextCode)

    if (!problem || isHydratingDraftRef.current) return
    persistDraft(nextCode)
  }

  const handlePanelResizeStart = (event) => {
    event.preventDefault()
    resizeStateRef.current = {
      startY: event.clientY,
      startHeight: bottomPanelHeight,
    }
    setIsResizingPanel(true)
  }

  const handleSplitResizeStart = (event) => {
    event.preventDefault()
    splitResizeStateRef.current = {
      startX: event.clientX,
      startWidth: leftPanelWidth,
    }
    setIsResizingSplit(true)
  }

  const resetEditor = () => {
    const starterCode = problem.starterCode?.[lang] || ''
    editorValueRef.current = starterCode
    setEditorValue(starterCode)
    persistDraft(starterCode)
    setTestResults(null)
    setBottomTab('testcase')
  }

  return (
    <div
      ref={workspaceRef}
      className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#1a1a1a] text-white select-none"
    >

      {/* ── LEFT: Description panel ─────────────────────────────── */}
      <div
        className="flex flex-col border-r border-[#2d2d2d]"
        style={{ width: `${leftPanelWidth}px`, minWidth: `${MIN_LEFT_PANEL_WIDTH}px` }}
      >

        {/* Tab bar */}
        <div className="flex items-center bg-[#222] border-b border-[#2d2d2d] flex-shrink-0 px-1">
          <button className="px-4 py-2.5 text-xs font-medium border-b-2 border-amber-400 text-amber-400">
            Description
          </button>
          {/* Prev / Next arrows */}
          <div className="ml-auto flex items-center gap-0.5 pr-2">
<<<<<<< HEAD
            {prevProblem && (
              <a href={`/problem/${prevProblem.problemNumber}`}
                 onClick={flushCurrentDraft}
=======
            {problem.problemNumber > 1 && (
              <a href={`/problem/${problem.problemNumber - 1}`}
>>>>>>> origin/main
                 className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                 title="Previous problem">
                <ChevronLeft className="w-4 h-4" />
              </a>
            )}
<<<<<<< HEAD
            {nextProblem && (
              <a href={`/problem/${nextProblem.problemNumber}`}
                 onClick={flushCurrentDraft}
                 className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                 title="Next problem">
                <ChevronRight className="w-4 h-4" />
              </a>
            )}
=======
            <a href={`/problem/${problem.problemNumber + 1}`}
               className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
               title="Next problem">
              <ChevronRight className="w-4 h-4" />
            </a>
>>>>>>> origin/main
          </div>
        </div>

        <DescriptionPanel problem={problem} />
      </div>

      {/* ── RIGHT: Editor + Test panel ──────────────────────────── */}
      <div
        onPointerDown={handleSplitResizeStart}
        onDoubleClick={() => setLeftPanelWidth(clampLeftPanelWidth(DEFAULT_LEFT_PANEL_WIDTH))}
        title="Drag to resize description panel"
        className={`group flex w-3 shrink-0 cursor-col-resize items-center justify-center transition-colors ${
          isResizingSplit ? 'bg-amber-400/10' : 'bg-[#161616] hover:bg-white/5'
        }`}
      >
        <div className={`h-12 w-1 rounded-full transition-colors ${
          isResizingSplit ? 'bg-amber-400/80' : 'bg-slate-600 group-hover:bg-slate-400'
        }`} />
      </div>

      <div ref={rightPaneRef} className="flex-1 flex flex-col overflow-hidden">

        {/* ── EDITOR TOP BAR ── */}
        <div className="h-11 flex items-center justify-between px-3 bg-[#1e1e1e] border-b border-[#2d2d2d] flex-shrink-0">
          {/* Left: language selector */}
          <div className="flex items-center gap-2">
            <select
              value={lang}
              onChange={e => {
                flushCurrentDraft()
                setLang(e.target.value)
                setTestResults(null)
              }}
              className="bg-[#2d2d2d] border border-[#3d3d3d] text-slate-200 text-xs font-medium rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 px-2.5 py-1.5 outline-none cursor-pointer hover:bg-[#333] transition-colors"
            >
              {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            {/* Reset button */}
            <button
              onClick={resetEditor}
              title="Reset to starter code"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className={`text-[11px] ${
              draftState === 'saving'
                ? 'text-amber-400'
                : draftState === 'saved'
                  ? 'text-emerald-400'
                  : 'text-slate-500'
            }`}>
              {getDraftStatusLabel(draftState)}
            </span>
          </div>

          {/* Right: Execution buttons */}
          <div className="flex items-center gap-2">
            <button
              id="run-code-btn"
              onClick={() => handleExecute('run')}
              disabled={isRunning || isSubmitting}
              title="Run Code (Ctrl + ')"
              className="flex items-center gap-1.5 bg-[#333] hover:bg-[#444] active:bg-[#222] disabled:bg-[#333] disabled:text-slate-500 disabled:cursor-not-allowed text-slate-200 text-xs font-semibold px-4 py-1.5 rounded-md transition-all active:scale-95"
            >
              {isRunning
                ? <><span className="w-3 h-3 border-2 border-slate-400/30 border-t-slate-300 rounded-full animate-spin" />Running…</>
                : <><Play className="w-3.5 h-3.5" fill="currentColor" />Run Code</>
              }
            </button>
            <button
              id="submit-code-btn"
              onClick={() => handleExecute('submit')}
              disabled={isRunning || isSubmitting}
              title="Submit Code (Ctrl + Enter)"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-1.5 rounded-md transition-all shadow-md shadow-emerald-500/10 active:scale-95"
            >
              {isSubmitting
                ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
                : <><CloudUpload className="w-3.5 h-3.5" fill="currentColor" />Submit</>
              }
            </button>
          </div>
        </div>

        {/* ── FILE TAB (LeetCode style) ── */}
        <div className="flex items-center bg-[#1e1e1e] border-b border-[#2d2d2d] flex-shrink-0">
          <div className="flex items-center gap-1.5 px-4 py-1.5 border-r border-[#2d2d2d] bg-[#1e1e1e]">
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-slate-300 font-mono">{currentLang.file}</span>
          </div>
        </div>

        {/* ── MONACO EDITOR ── */}
        <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          <Editor
            path={`${problem.problemNumber}-${lang}`}
            height="100%"
            theme="vs-dark"
            language={currentLang.monaco}
            value={editorValue}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            loading={
              <div className="flex items-center justify-center h-full text-slate-500 text-xs gap-2 bg-[#1e1e1e]">
                <span className="w-4 h-4 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
                Loading editor…
              </div>
            }
            options={{
              minimap:               { enabled: false },
              fontSize:              13,
              fontFamily:            "'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace",
              fontLigatures:         true,
              tabSize:               4,
              insertSpaces:          true,
              wordWrap:              'off',
              padding:               { top: 12, bottom: 12 },
              scrollBeyondLastLine:  false,
              smoothScrolling:       true,
              cursorBlinking:        'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight:   'gutter',
              lineNumbers:           'on',
              glyphMargin:           false,
              folding:               true,
              bracketPairColorization: { enabled: true },
              scrollbar: {
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
              },
            }}
          />
        </div>

        {/* ── BOTTOM PANEL: Testcase / Result ── */}
        <div
          className="bg-[#1a1a1a] border-t border-[#2d2d2d] flex flex-col flex-shrink-0"
          style={{ height: `${bottomPanelHeight}px` }}
        >
          <div
            onPointerDown={handlePanelResizeStart}
            onDoubleClick={() => setBottomPanelHeight(DEFAULT_BOTTOM_PANEL_HEIGHT)}
            title="Drag to resize result panel"
            className={`group flex h-3 cursor-row-resize items-center justify-center border-b border-[#2d2d2d] transition-colors ${
              isResizingPanel ? 'bg-amber-400/10' : 'bg-[#161616] hover:bg-white/5'
            }`}
          >
            <div className={`h-1 w-12 rounded-full transition-colors ${
              isResizingPanel ? 'bg-amber-400/80' : 'bg-slate-600 group-hover:bg-slate-400'
            }`} />
          </div>

          {/* Tab bar */}
          <div className="flex items-center border-b border-[#2d2d2d] bg-[#222] flex-shrink-0 px-1">
            {[
              { key: 'testcase', label: 'Testcase' },
              { key: 'result',   label: 'Test Result' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setBottomTab(tab.key)}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
                  bottomTab === tab.key
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
            {/* Running indicator */}
            {isRunning && (
              <div className="ml-auto pr-3 flex items-center gap-1.5 text-xs text-amber-400">
                <Clock className="w-3 h-3 animate-pulse" />
                <span>Executing… (Docker may pull image on first run)</span>
              </div>
            )}
          </div>

          {/* Tab content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {bottomTab === 'testcase'
              ? <TestCaseTab problem={problem} selCase={selCase} setSelCase={setSelCase} />
              : <TestResultTab testResults={testResults} />
            }
          </div>
        </div>
      </div>
    </div>
  )
}
