import { useState, useRef } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Editor } from '@monaco-editor/react'
import { mockProblems } from '../utils/dummyData'
import { Play } from 'lucide-react'

export const Problem = () => {
  const { id } = useParams()
  const [language, setLanguage] = useState('cpp')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [output, setOutput] = useState('')
  const editorRef = useRef(null)

  // Find the problem based on ID from URL
  const problem = mockProblems.find((p) => p.id === parseInt(id))

  // If problem is not found, redirect to dashboard
  if (!problem) {
    return <Navigate to="/dashboard" replace />
  }

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
  }

  // Handle running code against the local docker backend API
  const handleRunCode = async () => {
    setIsSubmitting(true)
    setOutput('Compiling code...\nRunning against local compiler agent...')
    
    const editorValue = editorRef.current ? editorRef.current.getValue() : (problem.starterCode[language] || '# Write your code here')

    try {
      const response = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: language, code: editorValue, problemId: problem.id })
      })
      const data = await response.json()
      
      if (!response.ok) {
        setOutput(`Error: ${data.error || 'Execution failed'}`)
      } else {
        setOutput(data.output || 'Successfully executed with no console output.')
      }
    } catch (err) {
      setOutput('Server Error: Could not connect to compiler')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] max-w-[1600px] mx-auto overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
      
      {/* Left Panel: Problem Description (40%) */}
      <div className="lg:w-[40%] h-full flex flex-col bg-slate-950 p-6 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-extrabold text-white leading-tight">{problem.title}</h1>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${
            problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
            problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
            'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {problem.difficulty}
          </span>
        </div>
        
        <div className="prose prose-invert prose-indigo max-w-none prose-p:leading-relaxed prose-p:text-slate-300">
          {problem.description.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Right Panel: Code Editor & Output (60%) */}
      <div className="lg:w-[60%] h-full flex flex-col bg-slate-900 border-l border-slate-800 min-h-[500px]">
        {/* Editor Toolbar */}
        <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 flex-shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-400">Language:</span>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-800 border-none text-slate-200 text-sm font-medium rounded-lg focus:ring-2 focus:ring-indigo-500 block px-3 py-1.5 outline-none transition-shadow cursor-pointer hover:bg-slate-700"
            >
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>
          
          <button
            onClick={handleRunCode}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2 rounded-lg transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <Play className={`w-4 h-4 ${isSubmitting ? 'animate-pulse' : ''}`} fill="currentColor" />
            {isSubmitting ? 'Running...' : 'Run Code'}
          </button>
        </div>

        {/* Monaco Editor Container */}
        <div className="flex-grow relative overflow-hidden bg-[#1e1e1e]">
          {/* A tiny subtle loading placeholder before editor mounts could go here */}
          <Editor
            height="100%"
            theme="vs-dark"
            language={language}
            value={problem.starterCode[language] || '# Write your code here'}
            onMount={handleEditorDidMount}
            loading={<div className="flex items-center justify-center h-full text-slate-500">Loading IDE...</div>}
            options={{
              minimap: { enabled: false },
              fontSize: 15,
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              tabSize: 4,
              insertSpaces: true,
              wordWrap: 'on',
              padding: { top: 20 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              renderLineHighlight: 'all',
            }}
          />
        </div>

        {/* Output Window */}
        <div className="h-56 bg-slate-950 border-t border-slate-800 flex-shrink-0 flex flex-col transition-all">
          <div className="px-5 py-2.5 border-b border-slate-800/50 bg-slate-900/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-600 inline-block"></span>
              Console Output
            </h3>
            {isSubmitting && <span className="text-xs text-indigo-400 animate-pulse font-medium">Executing...</span>}
          </div>
          <div className="flex-1 p-5 font-mono text-sm overflow-y-auto custom-scrollbar">
            {output ? (
              <pre className={`whitespace-pre-wrap leading-relaxed ${output.includes('Error') ? 'text-rose-400 font-semibold' : 'text-emerald-300'}`}>
                {output}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-2">
                <p className="italic font-sans">Run your code to view the output here.</p>
                <div className="text-xs text-slate-700 font-mono text-center">Standard out / standard error will appear in this panel.</div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
