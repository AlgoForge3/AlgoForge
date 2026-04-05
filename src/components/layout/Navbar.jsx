import { useUserStore } from '../../store/useUserStore'
import { Link, useNavigate } from 'react-router-dom'
import { Code2, LogOut, User, Compass } from 'lucide-react'

export const Navbar = () => {
  const { user, userLevel, isGuest, logout, setGuestMode, exitGuestMode } = useUserStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleGuestMode = () => {
    setGuestMode()
    navigate('/dashboard')
  }

  const handleExitGuest = () => {
    exitGuestMode()
    navigate('/login')
  }

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      width: '100%',
      borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
      background: 'rgba(8, 8, 15, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', height: '60px', padding: '0 20px' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Code2 style={{ width: '16px', height: '16px', color: 'white' }} />
          </div>
          <span className="shimmer-text" style={{ fontSize: '1.1rem', fontWeight: 700 }}>AlgoForge</span>
        </Link>

        <div style={{ flex: 1 }} />

        {/* Nav Actions */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            /* Logged-in User */
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                padding: '6px 14px', borderRadius: '999px',
              }}>
                <User style={{ width: '14px', height: '14px', color: '#a78bfa' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#e2e0ff' }}>{user.name}</span>
                <span style={{ color: 'rgba(139, 92, 246, 0.4)', padding: '0 4px' }}>•</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a78bfa' }}>{user.currentLevel || userLevel}</span>
              </div>
              <button onClick={handleLogout} title="Logout" style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '6px', borderRadius: '6px',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <LogOut style={{ width: '15px', height: '15px' }} />
              </button>
            </div>
          ) : isGuest ? (
            /* Guest Mode active */
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '0.75rem', color: '#a78bfa',
                background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                padding: '4px 10px', borderRadius: '999px', fontWeight: 500,
              }}>👁️ Guest View</span>
              <button onClick={handleExitGuest} className="btn-guest" style={{ fontSize: '0.78rem' }}>
                Sign In
              </button>
            </div>
          ) : (
            /* Not logged in */
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={handleGuestMode} className="btn-guest">
                <Compass style={{ width: '13px', height: '13px' }} />
                Explore as Guest
              </button>
              <Link to="/login" style={{
                fontSize: '0.85rem', fontWeight: 500,
                color: 'var(--text-muted)', textDecoration: 'none',
                padding: '7px 14px', borderRadius: '8px',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >Log in</Link>
              <Link to="/register" style={{
                fontSize: '0.85rem', fontWeight: 600,
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                color: 'white', textDecoration: 'none',
                padding: '7px 16px', borderRadius: '8px',
                transition: 'opacity 0.2s, transform 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
              >Sign up</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
