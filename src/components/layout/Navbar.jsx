import { useUserStore } from '../../store/useUserStore'
import { Link, useNavigate } from 'react-router-dom'
import { Code2, LogOut, User } from 'lucide-react'

export const Navbar = () => {
  const { user, userLevel, logout } = useUserStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60 transition-all">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Code2 className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            AlgoForge
          </span>
        </Link>
        <div className="flex-1" />
        <nav className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700 shadow-sm transition-all hover:bg-slate-800/70">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">{user.name}</span>
                <span className="text-slate-600 px-1">•</span>
                <span className="text-sm font-bold text-white tracking-wide">{user.currentLevel || userLevel}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-rose-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 font-medium px-2 py-1">Guest Mode</span>
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Log in</Link>
              <Link to="/register" className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-md transition-colors">Sign up</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
