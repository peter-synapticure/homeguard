import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Shield, Plus, Home, ChevronRight, LogOut, X, Upload } from 'lucide-react'

const CL = { main: '#7c3aed', dark: '#5b21b6', light: '#f5f3ff', ring: '#8b5cf6' }
const s = {
  wrap: { fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif", background: 'linear-gradient(180deg,#f8fafc,#f1f5f9)', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' },
  page: { maxWidth: 480, margin: '0 auto', padding: '0 20px' },
  card: { background: '#fff', borderRadius: 18, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' },
}

export default function Dashboard() {
  const { user } = useOutletContext()
  const nav = useNavigate()
  const [homes, setHomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ address: '', city: '', state: '', zip: '', year_built: '' })

  const load = async () => {
    const { data } = await supabase.from('homes').select('*').order('created_at', { ascending: false })
    setHomes(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addHome = async () => {
    if (!form.address.trim()) return
    await supabase.from('homes').insert({
      user_id: user.id,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      year_built: form.year_built ? parseInt(form.year_built) : null,
    })
    setForm({ address: '', city: '', state: '', zip: '', year_built: '' })
    setShowAdd(false)
    load()
  }

  const logout = async () => { await supabase.auth.signOut(); nav('/login') }

  const inp = { background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 14, padding: '13px 16px', color: '#0f172a', fontSize: 15, width: '100%', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={s.wrap}>
      <div style={s.page}>
        <div style={{ paddingTop: 28, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg,${CL.main},${CL.dark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${CL.main}30` }}>
                <Shield size={17} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: CL.main, letterSpacing: '0.06em' }}>HOMEGUARD</span>
            </div>
            <div onClick={logout} style={{ padding: '8px 14px', borderRadius: 10, background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
              <LogOut size={15} />Sign out
            </div>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Your Homes</h1>
          <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>{user.email}</p>
        </div>

        <div onClick={() => setShowAdd(!showAdd)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16, border: `2px dashed ${CL.ring}`, color: CL.main, fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 20, background: CL.light, transition: 'all 0.2s' }}>
          {showAdd ? <><X size={18} />Cancel</> : <><Plus size={18} />Add a home</>}
        </div>

        {showAdd && (
          <div style={{ ...s.card, marginBottom: 20, border: `2px solid ${CL.ring}40` }}>
            <input placeholder="Street address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ ...inp, marginBottom: 10 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={inp} />
              <input placeholder="State" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} style={inp} />
              <input placeholder="ZIP" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} style={inp} />
            </div>
            <input placeholder="Year built" value={form.year_built} onChange={e => setForm({ ...form, year_built: e.target.value })} style={{ ...inp, marginBottom: 16 }} />
            <div onClick={addHome} style={{ width: '100%', padding: 14, background: `linear-gradient(135deg,${CL.main},${CL.dark})`, color: '#fff', borderRadius: 14, textAlign: 'center', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: `0 4px 14px ${CL.main}33` }}>Save home</div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#94a3b8', fontSize: 14 }}>Loading...</div>
        ) : homes.length === 0 ? (
          <div style={{ ...s.card, textAlign: 'center', padding: 48 }}>
            <Home size={36} color="#cbd5e1" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8' }}>No homes yet</div>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 4 }}>Add your first property above</div>
          </div>
        ) : (
          homes.map(h => (
            <div key={h.id} style={{ ...s.card, marginBottom: 10, padding: 0, overflow: 'hidden' }}>
              <div onClick={() => nav(`/home/${h.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 18, cursor: 'pointer' }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: CL.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Home size={22} color={CL.main} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{h.address}</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>{[h.city, h.state, h.zip].filter(Boolean).join(', ')}{h.year_built ? ` · Built ${h.year_built}` : ''}</div>
                </div>
                <ChevronRight size={18} color="#cbd5e1" />
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', display: 'flex' }}>
                <div
                  onClick={(e) => { e.stopPropagation(); nav(`/home/${h.id}/upload`) }}
                  style={{ flex: 1, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: CL.main, cursor: 'pointer', background: 'transparent', transition: 'background 0.15s' }}
                >
                  <Upload size={15} />Upload inspection report
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}