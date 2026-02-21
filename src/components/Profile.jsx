import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, LogOut, Lock, ChevronLeft, Check, Loader, Eye, EyeOff } from 'lucide-react';

const CL = {
  main: '#7c3aed', dark: '#5b21b6', light: '#f5f3ff', border: '#ddd6fe',
};

const s = {
  card: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' },
};

export default function Profile({ user, onClose }) {
  const nav = useNavigate();
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const changePw = async () => {
    if (newPw.length < 6) { setError('Must be at least 6 characters'); return; }
    setSaving(true);
    setError(null);
    const { error: e } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);
    if (e) setError(e.message);
    else { setSaved(true); setNewPw(''); setTimeout(() => setSaved(false), 3000); }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    nav('/login');
  };

  const inp = {
    background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12,
    padding: '12px 14px', color: '#0f172a', fontSize: 14, width: '100%',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
      background: 'linear-gradient(180deg,#f8fafc,#f1f5f9)',
      minHeight: '100vh', WebkitFontSmoothing: 'antialiased',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ paddingTop: 20, marginBottom: 28 }}>
          <div onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#64748b', cursor: 'pointer', fontWeight: 500, padding: '10px 0' }}>
            <ChevronLeft size={18} />Back
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '14px 0 0', letterSpacing: '-0.02em' }}>Profile</h1>
        </div>

        {/* Account info */}
        <div style={{ ...s.card, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: CL.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={22} color={CL.main} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{user?.email}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Account</div>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div style={{ ...s.card, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Lock size={16} color={CL.main} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Change Password</span>
          </div>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="New password (6+ characters)"
              value={newPw}
              onChange={e => { setNewPw(e.target.value); setSaved(false); setError(null); }}
              onKeyDown={e => e.key === 'Enter' && changePw()}
              style={{ ...inp, paddingRight: 44 }}
            />
            <div onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94a3b8' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </div>
          </div>
          {error && <div style={{ fontSize: 13, color: '#2563eb', marginBottom: 10, padding: '6px 10px', background: '#eff6ff', borderRadius: 8 }}>{error}</div>}
          {saved && <div style={{ fontSize: 13, color: '#059669', marginBottom: 10, padding: '6px 10px', background: '#ecfdf5', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Check size={14} />Password updated</div>}
          <div
            onClick={changePw}
            style={{
              padding: 12, borderRadius: 12, textAlign: 'center', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              background: newPw.length >= 6 ? `linear-gradient(135deg,${CL.main},${CL.dark})` : '#f1f5f9',
              color: newPw.length >= 6 ? '#fff' : '#94a3b8',
              opacity: saving ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Update password'}
          </div>
        </div>

        {/* Sign out */}
        <div
          onClick={signOut}
          style={{
            ...s.card, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
            padding: 18,
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#ef4444' }}>Sign out</div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}