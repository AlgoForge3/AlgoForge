import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import { assessmentQuestions } from '../utils/dummyData'

export const Assessment = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  
  const setUserLevel = useUserStore((state) => state.setUserLevel)
  const navigate = useNavigate()

  const handleNext = () => {
    if (selectedOption === assessmentQuestions[currentStep - 1].correctAnswer) {
      setScore((prev) => prev + 1)
    }
    
    setCurrentStep((prev) => prev + 1)
    setSelectedOption(null)
  }

  const handleFinish = () => {
    // If score > 1, Intermediate, else Beginner
    const level = score > 1 ? "Intermediate" : "Beginner"
    setUserLevel(level)
    navigate('/dashboard')
  }

  // Step 0: Introduction
  if (currentStep === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-6">
          Let's determine your DSA Level
        </h1>
        <p className="text-lg text-slate-400 mb-8 max-w-xl">
          Take a quick diagnostic test to help us personalize your learning path and recommend the right problems for you.
        </p>
        <button
          onClick={() => setCurrentStep(1)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          Start Assessment
        </button>
      </div>
    )
  }

  // Final Step: Results
  if (currentStep > assessmentQuestions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-bold text-white mb-2">Assessment Complete!</h1>
          <p className="text-xl text-blue-400 font-bold mb-6">
            Your Score: {score} / {assessmentQuestions.length}
          </p>
          <div className="bg-slate-800/50 rounded-xl p-4 mb-8">
            <p className="text-slate-400 text-sm mb-1">Recommended Rank:</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              {score > 1 ? "Intermediate" : "Beginner"}
            </p>
          </div>
          <button
            onClick={handleFinish}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-8 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Step 1-N: Questions
  const question = assessmentQuestions[currentStep - 1]

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 flex justify-between items-center text-sm font-medium text-slate-400">
        <span>Question {currentStep} of {assessmentQuestions.length}</span>
        <span>Score: {score}</span>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-8">{question.question}</h2>
        
        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedOption(option)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedOption === option
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border flex flex-shrink-0 items-center justify-center transition-colors ${
                  selectedOption === option ? 'border-blue-500 bg-blue-500' : 'border-slate-500'
                }`}>
                  {selectedOption === option && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                {option}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={handleNext}
            disabled={!selectedOption}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium px-8 py-3 rounded-xl transition-all active:scale-95"
          >
            {currentStep === assessmentQuestions.length ? 'See Results' : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  )
}
