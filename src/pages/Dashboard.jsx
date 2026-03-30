import { Navigate, Link } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import { mockProblems } from '../utils/dummyData'

export const Dashboard = () => {
  const userLevel = useUserStore((state) => state.userLevel)

  // Redirect to assessment if no level is determined
  if (!userLevel) {
    return <Navigate to="/assessment" replace />
  }

  // Recommendation engine logic based on userLevel
  const getRecommendation = () => {
    let targetDifficulty = 'Easy'
    if (userLevel === 'Intermediate') targetDifficulty = 'Medium'
    if (userLevel === 'Advanced') targetDifficulty = 'Hard'

    // Find the first problem matching the difficulty rule
    return mockProblems.find((p) => p.difficulty === targetDifficulty) || mockProblems[0]
  }

  const recommendedProblem = getRecommendation()

  return (
    <div className="max-w-6xl mx-auto py-8 p-4">
      {/* Welcome Section */}
      <div className="mb-10 p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <svg className="w-48 h-48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20zM17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6z"/>
          </svg>
        </div>
        
        <h1 className="text-4xl font-extrabold text-white mb-4 relative z-10">Welcome Back, Learner!</h1>
        <div className="flex items-center gap-3 relative z-10">
          <span className="text-slate-400 font-medium">Current Level:</span>
          <span className="px-5 py-1.5 rounded-full text-sm font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {userLevel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Topics */}
        <div className="lg:col-span-2 space-y-8">
          {/* Progress Stats */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6">Your Progress</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                <p className="text-slate-400 text-sm font-medium mb-1">Problems Solved</p>
                <p className="text-4xl font-extrabold text-white">12</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                <p className="text-slate-400 text-sm font-medium mb-1">Current Streak</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-extrabold text-orange-400">5</p>
                  <span className="text-slate-400 font-medium">days</span>
                </div>
              </div>
            </div>
          </section>

          {/* Topic Mastery */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
             <h2 className="text-xl font-bold text-white mb-6">Topic Mastery</h2>
             <div className="space-y-6">
               <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-slate-300">Arrays</span>
                    <span className="text-blue-400 font-bold">80%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: '80%' }}></div>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-slate-300">Strings</span>
                    <span className="text-blue-400 font-bold">40%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: '40%' }}></div>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-slate-300">Trees</span>
                    <span className="text-slate-500 font-bold">0%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5">
                    <div className="bg-slate-700 h-2.5 rounded-full" style={{ width: '0%' }}></div>
                  </div>
               </div>
             </div>
          </section>
        </div>

        {/* Right Column: Recommendation Engine */}
        <div className="lg:col-span-1">
          <section className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-6 shadow-[0_0_30px_-15px_theme('colors.indigo.500')] sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">🎯</span>
              <h2 className="text-xl font-bold text-white">Up Next For You</h2>
            </div>
            
            <p className="text-indigo-200/80 text-sm mb-6 leading-relaxed">
              Based on your <strong className="text-indigo-300 font-semibold">{userLevel}</strong> rank, we recommend tackling this problem to build your skills.
            </p>

            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-5 mb-6 hover:border-indigo-500/50 transition-colors group">
              <div className="flex justify-between items-start mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${
                  recommendedProblem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                  recommendedProblem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {recommendedProblem.difficulty}
                </span>
                <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
                  {recommendedProblem.topic}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                {recommendedProblem.title}
              </h3>
            </div>

            <Link 
              to={`/problem/${recommendedProblem.id}`}
              className="w-full block text-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-xl shadow-indigo-600/20 hover:-translate-y-0.5 active:scale-95"
            >
              Solve Now
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
