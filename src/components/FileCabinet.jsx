import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Upload, Plus, ChevronRight, Folder, FolderOpen, Shield, Receipt, BookOpen, Home, File, Trash2, X, Loader, ExternalLink, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';

const CL = {
  main: '#7c3aed', dark: '#5b21b6', light: '#f5f3ff', mid: '#ede9fe', border: '#ddd6fe', ring: '#8b5cf6',
  ok: { main: '#059669', light: '#ecfdf5' },
  warn: { main: '#1d4ed8', light: '#eff6ff' },
};

const CATEGORIES = [
  { key: 'All', icon: Folder, color: '#64748b' },
  { key: 'Inspection Reports', icon: FileText, color: '#2563eb' },
  { key: 'Warranties', icon: Shield, color: CL.main },
  { key: 'Receipts', icon: Receipt, color: '#059669' },
  { key: 'Manuals', icon: BookOpen, color: '#d97706' },
  { key: 'Insurance', icon: Home, color: '#dc2626' },
  { key: 'Other', icon: File, color: '#64748b' },
];

const s = {
  card: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' },
};

export default function FileCabinet({ user, homeId, warranties }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('All');
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCat, setUploadCat] = useState('Other');
  const [uploadName, setUploadName] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    loadDocs();
  }, [homeId]);

  const loadDocs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('home_id', homeId)
      .order('created_at', { ascending: false });
    if (data) setDocs(data);
    setLoading(false);
  };

  const uploadFile = async (file) => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const fileId = crypto.randomUUID();
      const ext = file.name.split('.').pop() || 'pdf';
      const path = `${user.id}/${homeId}/docs/${fileId}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('reports')
        .upload(path, file, { contentType: file.type });

      if (upErr) throw new Error(upErr.message);

      const { error: dbErr } = await supabase.from('documents').insert({
        user_id: user.id,
        home_id: homeId,
        category: uploadCat,
        name: uploadName || file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
      });

      if (dbErr) throw new Error(dbErr.message);

      setShowUpload(false);
      setUploadName('');
      setUploadCat('Other');
      await loadDocs();
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const viewDoc = async (doc) => {
    const { data, error } = await supabase.storage
      .from('reports')
      .createSignedUrl(doc.file_path, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const deleteDoc = async (doc) => {
    if (!confirm('Delete "' + doc.name + '"?')) return;
    await supabase.from('documents').delete().eq('id', doc.id);
    await supabase.storage.from('reports').remove([doc.file_path]);
    setDocs(prev => prev.filter(d => d.id !== doc.id));
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (d) => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return ''; }
  };

  const filtered = catFilter === 'All' ? docs : docs.filter(d => d.category === catFilter);

  // Merge warranties into display (virtual "documents")
  const warrantyDocs = (warranties || []).map(w => ({
    id: 'w-' + w.id,
    isWarranty: true,
    name: w.prod,
    category: 'Warranties',
    provider: w.prov,
    coverage: w.cov,
    expires: w.exp,
    registered: w.reg,
  }));

  const showWarranties = catFilter === 'All' || catFilter === 'Warranties';

  const inp = { background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', color: '#0f172a', fontSize: 14, width: '100%', outline: 'none', boxSizing: 'border-box' };

  // Count by category
  const counts = {};
  docs.forEach(d => { counts[d.category] = (counts[d.category] || 0) + 1; });
  if (warranties?.length) counts['Warranties'] = (counts['Warranties'] || 0) + warranties.length;

  return (
    <div style={{ paddingTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>File Cabinet</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{docs.length} document{docs.length !== 1 ? 's' : ''}</div>
        </div>
        <div
          onClick={() => setShowUpload(!showUpload)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: CL.main, cursor: 'pointer', fontWeight: 600, padding: '8px 16px', background: CL.light, borderRadius: 12 }}
        >
          {showUpload ? <><X size={16}/>Cancel</> : <><Plus size={16}/>Add file</>}
        </div>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div style={{ ...s.card, marginTop: 12, marginBottom: 16, border: `1.5px solid ${CL.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Upload Document</div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Category</label>
            <select value={uploadCat} onChange={e => setUploadCat(e.target.value)} style={inp}>
              {CATEGORIES.filter(c => c.key !== 'All').map(c => (
                <option key={c.key} value={c.key}>{c.key}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Name (optional)</label>
            <input value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="e.g. Furnace warranty certificate" style={inp} />
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }} />
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              padding: 16, borderRadius: 14, textAlign: 'center', cursor: 'pointer',
              background: uploading ? '#f1f5f9' : `linear-gradient(135deg,${CL.main},${CL.dark})`,
              color: uploading ? '#94a3b8' : '#fff', fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {uploading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }}/>Uploading...</> : <><Upload size={16}/>Choose file</>}
          </div>
        </div>
      )}

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 16, marginBottom: 16, paddingBottom: 4 }}>
        {CATEGORIES.map(cat => {
          const active = catFilter === cat.key;
          const count = cat.key === 'All' ? docs.length + (warranties?.length || 0) : (counts[cat.key] || 0);
          return (
            <span
              key={cat.key}
              onClick={() => setCatFilter(cat.key)}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                fontWeight: active ? 700 : 500,
                background: active ? CL.main : '#fff',
                color: active ? '#fff' : '#64748b',
                border: active ? 'none' : '1px solid #e2e8f0',
                whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {cat.key}{count > 0 ? ` (${count})` : ''}
            </span>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', display: 'block' }} />
          Loading...
        </div>
      ) : (
        <>
          {/* Real documents */}
          {filtered.map(doc => {
            const catInfo = CATEGORIES.find(c => c.key === doc.category) || CATEGORIES[CATEGORIES.length - 1];
            const Icon = catInfo.icon;
            return (
              <div key={doc.id} style={{ ...s.card, marginBottom: 8, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 14, background: CL.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color={catInfo.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }} onClick={() => viewDoc(doc)}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>{doc.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      {doc.category}{doc.file_size ? ' · ' + formatSize(doc.file_size) : ''} · {formatDate(doc.created_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <div onClick={() => viewDoc(doc)} style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <ExternalLink size={16} color="#64748b" />
                    </div>
                    <div onClick={() => deleteDoc(doc)} style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Trash2 size={16} color="#94a3b8" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Warranty cards (virtual) */}
          {showWarranties && warrantyDocs.map(w => {
            const dTo = w.expires ? Math.round((new Date(w.expires) - new Date()) / 864e5) : 999;
            const ex = dTo < 0;
            const sn = dTo >= 0 && dTo <= 90;
            const statusColor = ex ? '#2563eb' : sn ? CL.main : CL.ok.main;
            const statusBg = ex ? '#eff6ff' : sn ? CL.light : CL.ok.light;
            const statusLabel = ex ? 'Expired' : sn ? 'Expiring soon' : 'Active';

            return (
              <div key={w.id} style={{ ...s.card, marginBottom: 8, padding: 0, overflow: 'hidden' }}>
                <div style={{ height: 3, background: statusColor }} />
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{w.name}</div>
                      {w.provider && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{w.provider}</div>}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color: statusColor, background: statusBg, whiteSpace: 'nowrap' }}>
                      {statusLabel}
                    </span>
                  </div>
                  {w.coverage && <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{w.coverage}</div>}
                  <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                    {w.expires && (
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} />Exp {formatDate(w.expires)}
                      </span>
                    )}
                    <span style={{ fontWeight: 600, color: w.registered ? CL.ok.main : '#1d4ed8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {w.registered ? <><CheckCircle2 size={12}/>Registered</> : <><AlertTriangle size={12}/>Not registered</>}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && warrantyDocs.length === 0 && (
            <div style={{ ...s.card, textAlign: 'center', padding: 48 }}>
              <Folder size={36} color="#cbd5e1" style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: 14, color: '#94a3b8' }}>No documents in this category</div>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>Tap "Add file" to upload</div>
            </div>
          )}

          {filtered.length === 0 && !showWarranties && (
            <div style={{ ...s.card, textAlign: 'center', padding: 48 }}>
              <Folder size={36} color="#cbd5e1" style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: 14, color: '#94a3b8' }}>No documents in this category</div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}