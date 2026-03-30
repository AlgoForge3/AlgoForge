import { Link } from 'react-router-dom'

export const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl mb-6 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
        Master DSA with AlgoForge
      </h1>
      <p className="text-lg text-slate-400 mb-10 max-w-2xl leading-relaxed">
        The Smart DSA Learning Platform to master Data Structures and Algorithms with interactive assessments, tailored paths, and real-time feedback.
      </p>
      
      <Link 
        to="/assessment"
        className="group relative inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-4 rounded-xl shadow-[0_0_30px_-5px_theme('colors.indigo.500')] transition-all hover:shadow-[0_0_40px_-5px_theme('colors.indigo.500')] hover:-translate-y-1 active:scale-95 overflow-hidden text-lg"
      >
        <span className="relative z-10">Take Diagnostic Test</span>
        <span className="relative z-10 transition-transform group-hover:translate-x-1" aria-hidden="true">&rarr;</span>
      </Link>
    </div>
  )
}
