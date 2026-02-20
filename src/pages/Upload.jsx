import { useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChevronLeft, Upload, FileText, CheckCircle2, AlertTriangle, Loader, X, Shield } from 'lucide-react'

const CL = { main: '#7c3aed', dark: '#5b21b6', light: '#f5f3ff', ring: '#8b5cf6', blue: '#2563eb' }

export default function UploadPage() {
  const { homeId } = useParams()
  const { user } = useOutletContext()
  const nav = useNavigate()
  const fileRef = useRef(null)

  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [reportId, setReportId] = useState(null)

  const MAX_SIZE = 50 * 1024 * 1024 // 50MB

  const handleFile = useCallback((f) => {
    setError(null)
    if (!f) return
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are accepted')
      return
    }
    if (f.size > MAX_SIZE) {
      setError('File must be under 50MB')
      return
    }
    setFile(f)
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    handleFile(f)
  }, [handleFile])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback(() => setDragOver(false), [])

  const removeFile = () => {
    setFile(null)
    setError(null)
  }

  const upload = async () => {
    if (!file || uploading) return
    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const fileId = crypto.randomUUID()
      const path = `${user.id}/${homeId}/${fileId}.pdf`

      // Simulate progress since supabase-js doesn't give upload progress
      const progressInterval = setInterval(() => {
        setProgress(p => {
          if (p >= 90) { clearInterval(progressInterval); return 90 }
          return p + Math.random() * 15
        })
      }, 200)

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('reports')
        .upload(path, file, { contentType: 'application/pdf' })

      clearInterval(progressInterval)

      if (uploadErr) throw new Error(uploadErr.message)

      setProgress(95)

      // Create report record
      const { data: report, error: dbErr } = await supabase
        .from('reports')
        .insert({
          home_id: homeId,
          user_id: user.id,
          file_path: path,
          file_name: file.name,
          file_size: file.size,
          status: 'UPLOADED',
        })
        .select()
        .single()

      if (dbErr) throw new Error(dbErr.message)

      setProgress(100)
      setReportId(report.id)
      setDone(true)

    } catch (err) {
      setError(err.message)
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const s = {
    wrap: { fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif", background: 'linear-gradient(180deg,#f8fafc,#f1f5f9)', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' },
    page: { maxWidth: 480, margin: '0 auto', padding: '0 20px' },
    card: { background: '#fff', borderRadius: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' },
  }

  return (
    <div style={s.wrap}>
      <div style={s.page}>
        {/* Header */}
        <div style={{ paddingTop: 20, marginBottom: 28 }}>
          <div onClick={() => nav(`/home/${homeId}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#64748b', cursor: 'pointer', fontWeight: 500, padding: '10px 0' }}>
            <ChevronLeft size={18} />Back
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg,${CL.main},${CL.dark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${CL.main}30` }}>
              <Shield size={17} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: CL.main, letterSpacing: '0.06em' }}>HOMEGUARD</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '14px 0 0', letterSpacing: '-0.02em' }}>Upload Report</h1>
          <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>Upload your home inspection PDF for AI analysis</p>
        </div>

        {/* Success State */}
        {done ? (
          <div style={{ ...s.card, padding: 36, textAlign: 'center', animation: 'hg-fadeUp 0.4s ease both' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={32} color="#059669" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Upload complete</div>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 6 }}>
              <strong>{file.name}</strong>
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28 }}>
              Your report is ready for processing
            </div>
            <div
              onClick={() => nav(`/home/${homeId}/report/${reportId}`)}
              style={{
                padding: 16, borderRadius: 14,
                background: `linear-gradient(135deg,${CL.main},${CL.dark})`,
                color: '#fff', fontWeight: 600, fontSize: 16, cursor: 'pointer',
                boxShadow: `0 4px 14px ${CL.main}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              Process with AI
            </div>
            <div
              onClick={() => { setDone(false); setFile(null); setProgress(0) }}
              style={{ fontSize: 14, color: '#94a3b8', marginTop: 16, cursor: 'pointer', fontWeight: 500 }}
            >
              Upload another
            </div>
          </div>
        ) : (
          <>
            {/* Drop Zone */}
            {!file ? (
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileRef.current?.click()}
                style={{
                  ...s.card,
                  padding: '48px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: `2px dashed ${dragOver ? CL.ring : '#e2e8f0'}`,
                  background: dragOver ? CL.light : '#fff',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files?.[0])}
                />
                <div style={{
                  width: 64, height: 64, borderRadius: 20,
                  background: dragOver ? CL.main : '#f8fafc',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  transition: 'all 0.2s',
                }}>
                  <Upload size={28} color={dragOver ? '#fff' : '#94a3b8'} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                  Drop your PDF here
                </div>
                <div style={{ fontSize: 14, color: '#94a3b8' }}>
                  or tap to browse
                </div>
                <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 12 }}>
                  PDF only · Max 50MB
                </div>
              </div>
            ) : (
              /* File Selected */
              <div style={{ ...s.card, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: uploading ? 20 : 0 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 16, background: CL.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={24} color={CL.main} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>{formatSize(file.size)}</div>
                  </div>
                  {!uploading && (
                    <div onClick={removeFile} style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <X size={18} color="#94a3b8" />
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {uploading && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Uploading...</span>
                      <span style={{ fontSize: 13, color: CL.main, fontWeight: 600 }}>{Math.round(progress)}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        background: `linear-gradient(90deg,${CL.main},${CL.ring})`,
                        width: `${progress}%`,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, background: '#eff6ff', marginTop: 12 }}>
                <AlertTriangle size={18} color={CL.blue} />
                <span style={{ fontSize: 14, color: CL.blue, fontWeight: 500 }}>{error}</span>
              </div>
            )}

            {/* Upload Button */}
            {file && !uploading && (
              <div
                onClick={upload}
                style={{
                  marginTop: 16, padding: 16, borderRadius: 14,
                  background: `linear-gradient(135deg,${CL.main},${CL.dark})`,
                  color: '#fff', fontWeight: 600, fontSize: 16, cursor: 'pointer',
                  boxShadow: `0 4px 14px ${CL.main}33`,
                  textAlign: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Upload size={18} />Upload report
              </div>
            )}

            {/* Uploading state */}
            {uploading && (
              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#94a3b8' }}>
                Please don't close this page
              </div>
            )}
          </>
        )}

        {/* Info */}
        <div style={{ marginTop: 28, padding: '18px 20px', borderRadius: 14, background: '#f8fafc' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>What happens next?</div>
          {[
            ['Upload', 'Your PDF is stored securely'],
            ['Extract', 'AI reads every component, issue, and recommendation'],
            ['Verify', 'A second AI checks for accuracy'],
            ['Review', 'You review and approve the results'],
          ].map(([t, d], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: done && i === 0 ? '#ecfdf5' : i === 0 && file ? CL.light : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: done && i === 0 ? '#059669' : i === 0 && file ? CL.main : '#94a3b8',
              }}>
                {done && i === 0 ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{t}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}