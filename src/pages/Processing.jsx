import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Shield, ChevronLeft, Upload, FileText, CheckCircle2, AlertTriangle, Loader, ArrowRight, RotateCcw, Zap, Eye, LayoutGrid } from 'lucide-react'

const CL = { main: '#7c3aed', dark: '#5b21b6', light: '#f5f3ff', ring: '#8b5cf6', blue: '#2563eb', green: '#059669' }

const STEPS = [
  { key: 'UPLOADED', label: 'Uploaded', desc: 'PDF received', icon: Upload },
  { key: 'PROCESSING', label: 'Extracting', desc: 'AI reading your report...', icon: Zap },
  { key: 'EXTRACTED', label: 'Extracted', desc: 'Components identified', icon: FileText },
  { key: 'COMPLETE', label: 'Complete', desc: 'Ready to review', icon: CheckCircle2 },
]

export default function ProcessingPage() {
  const { homeId, reportId } = useParams()
  const { user } = useOutletContext()
  const nav = useNavigate()

  const [report, setReport] = useState(null)
  const [status, setStatus] = useState('UPLOADED')
  const [error, setError] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [itemCount, setItemCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data, error: e } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single()
      if (e || !data) { setError('Report not found'); return }
      setReport(data)
      setStatus(data.status)
      if (data.parsed_json?.items) setItemCount(data.parsed_json.items.length)
    }
    load()
  }, [reportId])

  useEffect(() => {
    if (!['PROCESSING', 'EXTRACTED'].includes(status)) return
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('reports')
        .select('status, error_msg, parsed_json')
        .eq('id', reportId)
        .single()
      if (data) {
        setStatus(data.status)
        if (data.parsed_json?.items) setItemCount(data.parsed_json.items.length)
        if (data.status === 'ERROR') setError(data.error_msg || 'Processing failed')
        if (['COMPLETE', 'ERROR'].includes(data.status)) clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [status, reportId])

  const startProcessing = async () => {
    setProcessing(true)
    setError(null)
    setStatus('PROCESSING')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await supabase.functions.invoke('process-report', {
        body: { reportId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.error) throw new Error(res.error.message)
      if (res.data?.error) throw new Error(res.data.error)
      if (res.data?.status === 'COMPLETE') {
        setStatus('COMPLETE')
        setItemCount(res.data.items || 0)
      }
    } catch (err) {
      setError(err.message)
      setStatus('ERROR')
    } finally {
      setProcessing(false)
    }
  }

  const retry = () => {
    setError(null)
    startProcessing()
  }

  const stepIndex = STEPS.findIndex(s => s.key === status)
  const isActive = ['PROCESSING', 'EXTRACTED'].includes(status)

  const st = {
    wrap: { fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif", background: 'linear-gradient(180deg,#f8fafc,#f1f5f9)', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' },
    page: { maxWidth: 480, margin: '0 auto', padding: '0 20px' },
    card: { background: '#fff', borderRadius: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' },
  }

  return (
    <div style={st.wrap}>
      <div style={st.page}>
        <div style={{ paddingTop: 20, marginBottom: 28 }}>
          <div onClick={() => nav(`/home/${homeId}/upload`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#64748b', cursor: 'pointer', fontWeight: 500, padding: '10px 0' }}>
            <ChevronLeft size={18} />Back
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg,${CL.main},${CL.dark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${CL.main}30` }}>
              <Shield size={17} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: CL.main, letterSpacing: '0.06em' }}>HOMEGUARD</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '14px 0 0', letterSpacing: '-0.02em' }}>
            {status === 'COMPLETE' ? 'Report Ready' : 'Processing Report'}
          </h1>
          {report && <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>{report.file_name}</p>}
        </div>

        <div style={{ ...st.card, padding: 24, marginBottom: 20 }}>
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const isDone = stepIndex > i || status === 'COMPLETE'
            const isCurrent = step.key === status || (status === 'COMPLETE' && i === STEPS.length - 1)
            const isPending = stepIndex < i && status !== 'COMPLETE'

            return (
              <div key={step.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 14,
                    background: isDone ? '#ecfdf5' : isCurrent ? CL.light : '#f8fafc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.3s',
                  }}>
                    {isDone ? (
                      <CheckCircle2 size={20} color={CL.green} />
                    ) : isCurrent && isActive ? (
                      <Loader size={20} color={CL.main} style={{ animation: 'spin 1.5s linear infinite' }} />
                    ) : (
                      <Icon size={20} color={isCurrent ? CL.main : '#cbd5e1'} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 600,
                      color: isDone || isCurrent ? '#0f172a' : '#94a3b8',
                    }}>{step.label}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{step.desc}</div>
                  </div>
                  {isDone && <span style={{ fontSize: 11, fontWeight: 600, color: CL.green }}>Done</span>}
                  {isCurrent && isActive && <span style={{ fontSize: 11, fontWeight: 600, color: CL.main, animation: 'pulse 1.5s ease-in-out infinite' }}>Working...</span>}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ marginLeft: 21, width: 1, height: 16, background: isDone ? '#a7f3d0' : '#e2e8f0', transition: 'background 0.3s' }} />
                )}
              </div>
            )
          })}
        </div>

        {status === 'UPLOADED' && !processing && (
          <div
            onClick={startProcessing}
            style={{
              ...st.card, padding: 18, textAlign: 'center', cursor: 'pointer',
              background: `linear-gradient(135deg,${CL.main},${CL.dark})`,
              color: '#fff', fontWeight: 600, fontSize: 16,
              boxShadow: `0 4px 14px ${CL.main}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              marginBottom: 20,
            }}
          >
            <Zap size={18} />Start AI Processing
          </div>
        )}

        {isActive && (
          <div style={{ ...st.card, padding: 20, textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              AI is reading your inspection report and extracting every component, issue, and recommendation. This typically takes 30–90 seconds.
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>
              You can leave this page — processing continues in the background
            </div>
          </div>
        )}

        {status === 'ERROR' && (
          <div style={{ ...st.card, padding: 20, marginBottom: 20, border: '1.5px solid #bfdbfe', background: '#eff6ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <AlertTriangle size={18} color={CL.blue} />
              <span style={{ fontSize: 15, fontWeight: 600, color: CL.blue }}>Processing failed</span>
            </div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
              {error || 'An unknown error occurred'}
            </div>
            <div
              onClick={retry}
              style={{
                padding: 14, borderRadius: 14,
                background: `linear-gradient(135deg,${CL.main},${CL.dark})`,
                color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: `0 4px 14px ${CL.main}33`,
              }}
            >
              <RotateCcw size={16} />Try again
            </div>
          </div>
        )}

        {status === 'COMPLETE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...st.card, padding: 24, textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, background: '#ecfdf5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <CheckCircle2 size={32} color={CL.green} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                Analysis Complete
              </div>
              <div style={{ fontSize: 14, color: '#64748b' }}>
                {itemCount} component{itemCount !== 1 ? 's' : ''} extracted from your report
              </div>
            </div>

            <div
              onClick={() => nav(`/home/${homeId}`)}
              style={{
                ...st.card, padding: 18, textAlign: 'center', cursor: 'pointer',
                background: `linear-gradient(135deg,${CL.main},${CL.dark})`,
                color: '#fff', fontWeight: 600, fontSize: 16,
                boxShadow: `0 4px 14px ${CL.main}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <LayoutGrid size={18} />View Your Home
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>
      </div>
    </div>
  )
}