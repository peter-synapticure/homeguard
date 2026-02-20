import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Shield, Mail, ArrowRight, Loader } from 'lucide-react'

const CL = {
  main: '#7c3aed',
  dark: '#5b21b6',
  light: '#f5f3ff',
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const nav = useNavigate()

  const handleLogin = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    const { error: e } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (e) setError(e.message)
    else setSent(true)
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
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 8 }}>Sign in with a magic link — no password needed</p>
        </div>

        {sent ? (
          <div style={{
            background: '#fff', borderRadius: 18, padding: 32, textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
          }}>
            <Mail size={36} color={CL.main} style={{ margin: '0 auto 16px', display: 'block' }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Check your email</div>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              We sent a login link to<br /><strong style={{ color: '#0f172a' }}>{email}</strong>
            </div>
          </div>
        ) : (
          <div style={{
            background: '#fff', borderRadius: 18, padding: 28,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Email address</div>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={inp}
            />
            {error && <div style={{ fontSize: 13, color: '#2563eb', marginTop: 10 }}>{error}</div>}
            <div
              onClick={handleLogin}
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
              {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><span>Send magic link</span><ArrowRight size={16} /></>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
