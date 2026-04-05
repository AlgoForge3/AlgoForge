import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useUserStore } from '../store/useUserStore';
import api from '../utils/api';
import { Loader2, Mail, Lock, User2, Code2, Eye, EyeOff } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export const Register = () => {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();
  const login    = useUserStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      login(data, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const [gLoading, setGLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setGLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/google', { token: credentialResponse.credential });
      login(data, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-up failed. Please try again.');
    } finally {
      setGLoading(false);
    }
  };

  const strengthLevel = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['transparent', '#f87171', '#fbbf24', '#34d399'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <div className="auth-bg-orb-1" />
      <div className="auth-bg-orb-2" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: '420px',
          background: 'rgba(14, 14, 26, 0.8)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(139, 92, 246, 0.18)',
          borderRadius: '20px',
          padding: '40px',
          position: 'relative', zIndex: 1,
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.05)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: '52px', height: '52px', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(99,102,241,0.2))',
              border: '1px solid rgba(124,58,237,0.4)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(124,58,237,0.2)',
            }}
          >
            <Code2 style={{ width: '24px', height: '24px', color: '#a78bfa' }} />
          </motion.div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Start for free</h1>
          <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Create your AlgoForge account today</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                color: '#fca5a5', fontSize: '0.83rem', padding: '10px 14px',
                borderRadius: '10px', marginBottom: '20px',
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google */}
        <div style={{ marginBottom: '20px' }}>
          {gLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
              Signing up with Google...
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in was cancelled or failed.')}
              theme="filled_black"
              size="large"
              width="100%"
              text="signup_with"
            />
          )}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-muted)' }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-muted)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '7px' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User2 style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'var(--text-subtle)' }} />
              <input type="text" required value={name} onChange={e => setName(e.target.value)}
                className="input-field" style={{ paddingLeft: '38px' }} placeholder="Harsh Sharma" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '7px' }}>Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'var(--text-subtle)' }} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" style={{ paddingLeft: '38px' }} placeholder="you@example.com" />
            </div>
          </div>

          {/* Password with strength bar */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '7px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'var(--text-subtle)' }} />
              <input
                type={showPw ? 'text' : 'password'} required minLength={6}
                value={password} onChange={e => setPassword(e.target.value)}
                className="input-field" style={{ paddingLeft: '38px', paddingRight: '40px' }}
                placeholder="Min 6 characters"
              />
              <button type="button" onClick={() => setShowPw(p => !p)} style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', padding: '4px',
              }}>
                {showPw ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
              </button>
            </div>
            {/* Strength indicator */}
            {password.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    flex: 1, height: '3px', borderRadius: '999px',
                    background: i <= strengthLevel ? strengthColors[strengthLevel] : 'var(--border-muted)',
                    transition: 'background 0.3s',
                  }} />
                ))}
                <span style={{ fontSize: '0.72rem', color: strengthColors[strengthLevel], fontWeight: 600, marginLeft: '6px' }}>
                  {strengthLabels[strengthLevel]}
                </span>
              </motion.div>
            )}
          </div>

          <motion.button
            type="submit" disabled={loading}
            className="btn-primary"
            whileHover={!loading ? { y: -1 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            style={{ marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : 'Create Account'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: '24px', marginBottom: 0 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
        </p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
