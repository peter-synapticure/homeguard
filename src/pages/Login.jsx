import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Shield, ArrowRight, Loader, Eye, EyeOff } from 'lucide-react'

const CL = {
  main: '#7c3aed',
  dark: '#5b21b6',
  light: '#f5f3ff',
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [showPw, setShowPw] = useState(false)
  const nav = useNavigate()

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError(null)
    setInfo(null)

    if (isSignUp) {
      const { error: e } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (e) setError(e.message)
      else nav('/')
    } else {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (e) {
        setError(e.message === 'Invalid login credentials' ? 'Wrong email or password' : e.message)
      } else {
        nav('/')
      }
    }
  }

  const handleForgot = async () => {
    if (!email.trim()) { setError('Enter your email first'); return }
    setLoading(true)
    setError(null)
    setInfo(null)
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    setLoading(false)
    if (e) setError(e.message)
    else setInfo('Password reset link sent! Check your email.')
  }

  const inp = {
    background: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: 14,
    padding: '14px 16px',
    color: '#0f172a',
    fontSize: 16,
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border 0.2s',
  }

  return (
    <div style={{
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
      background: 'linear-gradient(180deg,#f8fafc,#f1f5f9)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      WebkitFontSmoothing: 'antialiased',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: `linear-gradient(135deg,${CL.main},${CL.dark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: `0 8px 24px ${CL.main}30`,
          }}>
            <Shield size={26} color="#fff" strokeWidth={2.5} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: CL.main, letterSpacing: '0.06em', marginBottom: 8 }}>HOMEGUARD</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {isSignUp ? 'Create account' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 8 }}>
            {isSignUp ? 'Sign up to start protecting your home' : 'Sign in to your account'}
          </p>
        </div>

        <div style={{
          background: '#fff', borderRadius: 18, padding: 28,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Email address</div>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={inp}
            />
          </div>

          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Password</div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder={isSignUp ? 'Create a password (6+ chars)' : 'Enter password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ ...inp, paddingRight: 48 }}
              />
              <div
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  cursor: 'pointer', color: '#94a3b8',
                }}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: '#2563eb', marginTop: 10, padding: '8px 12px', background: '#eff6ff', borderRadius: 10 }}>
              {error}
            </div>
          )}

          {info && (
            <div style={{ fontSize: 13, color: '#059669', marginTop: 10, padding: '8px 12px', background: '#ecfdf5', borderRadius: 10 }}>
              {info}
            </div>
          )}

          <div
            onClick={handleSubmit}
            style={{
              width: '100%', padding: 14, marginTop: 16,
              background: `linear-gradient(135deg,${CL.main},${CL.dark})`,
              color: '#fff', borderRadius: 14, textAlign: 'center',
              fontWeight: 600, fontSize: 15, cursor: 'pointer',
              boxShadow: `0 4px 14px ${CL.main}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.7 : 1, pointerEvents: loading ? 'none' : 'auto',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? (
              <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <><span>{isSignUp ? 'Create account' : 'Sign in'}</span><ArrowRight size={16} /></>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <span
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setInfo(null) }}
              style={{ fontSize: 13, color: CL.main, fontWeight: 600, cursor: 'pointer' }}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </span>
          </div>

          {!isSignUp && (
            <div
              onClick={handleForgot}
              style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}
            >
              Forgot password?
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}