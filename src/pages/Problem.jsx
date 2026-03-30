import { useState, useRef } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Editor } from '@monaco-editor/react'
import { mockProblems } from '../utils/dummyData'
import {
  Play, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, AlertCircle,
  Clock, Tag, FileCode, RotateCcw,
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
          {problem.tags?.map(t => (
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
  const tc = problem.testCases?.[selCase]
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Case selector pills */}
      <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0">
        {problem.testCases?.map((_, i) => (
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
      </div>
    )
  }

  const { results } = testResults
  const allPassed   = results.every(r => r.passed)
  const passCount   = results.filter(r => r.passed).length

  const cur = results[selResult]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Overall status bar */}
      <div className={`mx-4 mt-2 mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold shrink-0 ${
        allPassed
          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
      }`}>
        {allPassed
          ? <CheckCircle className="w-3.5 h-3.5" />
          : <XCircle className="w-3.5 h-3.5" />}
        {allPassed
          ? `All ${results.length} test cases passed 🎉`
          : `${passCount} / ${results.length} test cases passed`}
      </div>

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
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const Problem = () => {
  const { id } = useParams()

  // State
  const [lang, setLang]               = useState('cpp')
  const [isRunning, setIsRunning]     = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [bottomTab, setBottomTab]     = useState('testcase')
  const [selCase, setSelCase]         = useState(0)
  const editorRef = useRef(null)

  const problem = mockProblems.find(p => p.id === parseInt(id))
  if (!problem) return <Navigate to="/dashboard" replace />

  const currentLang = LANGS.find(l => l.value === lang) || LANGS[0]
  const d = DIFFICULTY[problem.difficulty] || DIFFICULTY.Easy
  const problemIdx  = mockProblems.findIndex(p => p.id === parseInt(id))

  const handleEditorMount = (editor) => { editorRef.current = editor }

  const resetEditor = () => {
    if (editorRef.current) {
      editorRef.current.setValue(problem.starterCode[lang] || '')
    }
    setTestResults(null)
    setBottomTab('testcase')
  }

  const handleRunCode = async () => {
    if (lang === 'javascript') {
      setTestResults({ error: 'JavaScript execution is not yet supported.\nPlease switch to C++, Python 3, or Java.' })
      setBottomTab('result')
      return
    }

    setIsRunning(true)
    setTestResults(null)
    setBottomTab('result')

    const code = editorRef.current?.getValue() || (problem.starterCode[lang] ?? '')

    try {
      const res  = await fetch('http://localhost:5000/api/execute', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          language:  lang,
          code,
          problemId: problem.id,
        }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setTestResults({ error: data.error || 'Execution failed.' })
      } else {
        setTestResults({ results: data.results })
      }
    } catch {
      setTestResults({ error: 'Server Error: Could not connect to compiler.\nMake sure the backend is running on port 5000.' })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#1a1a1a] text-white select-none">

      {/* ── LEFT: Description panel ─────────────────────────────── */}
      <div className="w-[42%] min-w-[320px] max-w-[560px] flex flex-col border-r border-[#2d2d2d]">

        {/* Tab bar */}
        <div className="flex items-center bg-[#222] border-b border-[#2d2d2d] flex-shrink-0 px-1">
          <button className="px-4 py-2.5 text-xs font-medium border-b-2 border-amber-400 text-amber-400">
            Description
          </button>
          {/* Prev / Next arrows */}
          <div className="ml-auto flex items-center gap-0.5 pr-2">
            {mockProblems[problemIdx - 1] && (
              <a href={`/problem/${mockProblems[problemIdx - 1].id}`}
                 className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                 title="Previous problem">
                <ChevronLeft className="w-4 h-4" />
              </a>
            )}
            {mockProblems[problemIdx + 1] && (
              <a href={`/problem/${mockProblems[problemIdx + 1].id}`}
                 className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                 title="Next problem">
                <ChevronRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        <DescriptionPanel problem={problem} />
      </div>

      {/* ── RIGHT: Editor + Test panel ──────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── EDITOR TOP BAR ── */}
        <div className="h-11 flex items-center justify-between px-3 bg-[#1e1e1e] border-b border-[#2d2d2d] flex-shrink-0">
          {/* Left: language selector */}
          <div className="flex items-center gap-2">
            <select
              value={lang}
              onChange={e => { setLang(e.target.value); setTestResults(null) }}
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
          </div>

          {/* Right: Run button */}
          <button
            id="run-code-btn"
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-1.5 rounded-md transition-all shadow-md shadow-emerald-500/10 active:scale-95"
          >
            {isRunning
              ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Running…</>
              : <><Play className="w-3.5 h-3.5" fill="currentColor" />Run Code</>
            }
          </button>
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
            height="100%"
            theme="vs-dark"
            language={currentLang.monaco}
            value={problem.starterCode[lang] || ''}
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
        <div className="h-52 bg-[#1a1a1a] border-t border-[#2d2d2d] flex flex-col flex-shrink-0">

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
