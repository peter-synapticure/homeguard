import { useState, useRef, useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { Home, LayoutGrid, Camera, Users, Shield, ClipboardList, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Clock, Eye, Wrench, Star, Phone, Mail, FileText, Upload, Plus, Calendar, DollarSign, ArrowUpRight, Zap, Droplets, Flame, Plug, UtensilsCrossed, TreePine, DoorOpen, ShieldAlert, Info, X, Loader } from "lucide-react";
import PdfPhoto from "./components/PdfPhoto";
import FileCabinet from "./components/FileCabinet";
import { lookupLifespan, getTypesForCategory, getBrandsForCategory } from "./lib/lifespanData";

// Color palette — no red anywhere
const CL = {
  critical: {main:"#2563eb",light:"#eff6ff",mid:"#dbeafe",border:"#bfdbfe",dark:"#1e40af",ring:"#3b82f6"},
  attention: {main:"#7c3aed",light:"#f5f3ff",mid:"#ede9fe",border:"#ddd6fe",dark:"#5b21b6",ring:"#8b5cf6"},
  monitor: {main:"#6b7280",light:"#f9fafb",mid:"#f3f4f6",border:"#e5e7eb",dark:"#374151",ring:"#9ca3af"},
  ok: {main:"#059669",light:"#ecfdf5",mid:"#d1fae5",border:"#a7f3d0",dark:"#065f46",ring:"#10b981"},
  warn: {main:"#1d4ed8",light:"#eff6ff",mid:"#dbeafe",border:"#bfdbfe",dark:"#1e3a8a",ring:"#3b82f6"},
};

const UU = {
  critical:{l:"Before Closing",c:CL.critical.main,bg:`linear-gradient(135deg,${CL.critical.light},${CL.critical.mid})`,border:CL.critical.border,icon:AlertTriangle,iconBg:CL.critical.mid},
  attention:{l:"Plan & Budget",c:CL.attention.main,bg:`linear-gradient(135deg,${CL.attention.light},${CL.attention.mid})`,border:CL.attention.border,icon:Clock,iconBg:CL.attention.mid},
  monitor:{l:"Monitor",c:CL.monitor.main,bg:`linear-gradient(135deg,${CL.monitor.light},${CL.monitor.mid})`,border:CL.monitor.border,icon:Eye,iconBg:CL.monitor.mid},
  ok:{l:"Good",c:CL.ok.main,bg:`linear-gradient(135deg,${CL.ok.light},${CL.ok.mid})`,border:CL.ok.border,icon:CheckCircle2,iconBg:CL.ok.mid},
};

const catIcons={"Roof/Exterior":Home,"HVAC":Flame,"Plumbing":Droplets,"Electrical":Zap,"Appliances":UtensilsCrossed,"Structure":Wrench,"Landscape":TreePine,"Interior":DoorOpen,"Safety":ShieldAlert,"Exterior":Home,"Windows":DoorOpen};
const CATS=["All","Roof/Exterior","HVAC","Plumbing","Electrical","Appliances","Structure","Landscape","Interior","Safety"];
const mn=d=>{try{return new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});}catch(e){return d||"";}};
const $=n=>"$"+Math.round(n).toLocaleString();

const s={
  wrap:{fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",background:"#f8fafc",color:"#0f172a",minHeight:"100vh",paddingBottom:90,WebkitFontSmoothing:"antialiased"},
  page:{maxWidth:480,margin:"0 auto",padding:"0 20px"},
  card:{background:"#fff",borderRadius:16,padding:20,boxShadow:"0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)"},
};

// Map DB item to UI format
function mapItem(item) {
  const mt = (item.maintenance || []).map(m => ({
    t: m.task,
    f: m.frequency_months || 12,
    c: m.estimated_cost || 0,
    d: m.diy || false,
    s: m.season || null,
    n: (() => { const d = new Date(); d.setMonth(d.getMonth() + (m.frequency_months || 12)); return d.toISOString().slice(0,10); })(),
  }));
  const age = item.year_installed ? (new Date().getFullYear() - parseInt(item.year_installed)) : null;
  const lifeMin = item.lifespan_min;
  const lifeMax = item.lifespan_max;
  const lifeAvg = lifeMin && lifeMax ? Math.round((lifeMin + lifeMax) / 2) : null;
  return {
    id: item.id,
    cat: item.category,
    name: item.name,
    loc: item.location,
    mfr: item.manufacturer,
    mod: item.model,
    ser: item.serial,
    yr: item.year_installed,
    conf: item.year_confidence || "unknown",
    age: age,
    cond: item.condition,
    life: lifeMin && lifeMax ? [lifeMin, lifeMax, lifeAvg] : null,
    rem: age !== null && lifeAvg ? lifeAvg - age : null,
    cost: item.cost_min && item.cost_max ? [item.cost_min, item.cost_max] : null,
    notes: item.notes,
    defs: item.deficiencies || [],
    recs: item.recommendations || [],
    mt: mt,
    u: item.urgency || "monitor",
    ph: [],
    fi: [],
  };
}

// Map DB warranty to UI format
function mapWarranty(w) {
  return {
    id: w.id,
    cid: w.item_id,
    prod: w.product,
    prov: w.provider,
    cov: w.coverage,
    start: null,
    exp: w.expires_at,
    reg: w.registered || false,
    note: w.notes || "",
  };
}

function Tag({type,small}){
  const u=UU[type]||UU.ok;const I=u.icon;
  return <span style={{fontSize:small?10:11,fontWeight:600,padding:small?"2px 8px":"4px 12px",borderRadius:20,color:u.c,background:u.iconBg,display:"inline-flex",alignItems:"center",gap:4,whiteSpace:"nowrap",letterSpacing:"0.01em"}}>
    <I size={small?10:12} strokeWidth={2.5}/>{u.l}
  </span>;
}

function ScoreRing({good,plan,crit,size=120}){
  const total=good+plan+crit;if(total===0)return null;const r=size/2-8;const circ=2*Math.PI*r;
  const g=good/total*circ,p=plan/total*circ,cr=crit/total*circ;
  const pct=Math.round(good/total*100);
  return(
    <div style={{position:"relative",width:size,height:size}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={8}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={CL.ok.ring} strokeWidth={8} strokeDasharray={`${g} ${circ}`} strokeLinecap="round"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={CL.attention.ring} strokeWidth={8} strokeDasharray={`${p} ${circ}`} strokeDashoffset={-g} strokeLinecap="round"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={CL.critical.ring} strokeWidth={8} strokeDasharray={`${cr} ${circ}`} strokeDashoffset={-(g+p)} strokeLinecap="round"/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:28,fontWeight:700,color:"#0f172a",lineHeight:1}}>{pct}</div>
        <div style={{fontSize:10,color:"#94a3b8",fontWeight:500,marginTop:2}}>Health</div>
      </div>
    </div>
  );
}

function WorkLogPanel({log,setLog,comps}){
  const [on,setOn]=useState(false);
  const [nj,setNj]=useState({date:"",cid:"",type:"maintenance",desc:"",cost:""});
  const save=()=>{if(!nj.desc.trim())return;setLog(p=>[...p,{id:"j"+Date.now(),date:nj.date,cid:nj.cid,type:nj.type,desc:nj.desc,cost:nj.cost?parseFloat(nj.cost):null}]);setNj({date:"",cid:"",type:"maintenance",desc:"",cost:""});setOn(false);};
  const inp={background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"12px 14px",color:"#0f172a",fontSize:14,width:"100%",outline:"none",boxSizing:"border-box",transition:"border 0.2s"};
  return(
    <div style={{paddingTop:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><div style={{fontSize:18,fontWeight:700,color:"#0f172a"}}>Work Log</div><div style={{fontSize:13,color:"#94a3b8",marginTop:2}}>{log.length} record{log.length!==1?"s":""}</div></div>
        <div onClick={()=>setOn(!on)} style={{display:"flex",alignItems:"center",gap:6,fontSize:14,color:CL.attention.main,cursor:"pointer",fontWeight:600,padding:"8px 16px",background:CL.attention.light,borderRadius:12}}>{on?<><X size={16}/>Cancel</>:<><Plus size={16}/>Log work</>}</div>
      </div>
      {on&&<div style={{...s.card,marginBottom:20,border:`1.5px solid ${CL.attention.border}`}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <input type="date" value={nj.date} onChange={e=>setNj({...nj,date:e.target.value})} style={inp}/>
          <select value={nj.cid} onChange={e=>setNj({...nj,cid:e.target.value})} style={inp}><option value="">Component...</option>{comps.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
        <input placeholder="What was done?" value={nj.desc} onChange={e=>setNj({...nj,desc:e.target.value})} style={{...inp,marginBottom:10}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <select value={nj.type} onChange={e=>setNj({...nj,type:e.target.value})} style={inp}><option value="maintenance">Maintenance</option><option value="repair">Repair</option><option value="replacement">Replacement</option></select>
          <input placeholder="Cost ($)" type="number" value={nj.cost} onChange={e=>setNj({...nj,cost:e.target.value})} style={inp}/>
        </div>
        <div onClick={save} style={{width:"100%",padding:"12px",background:`linear-gradient(135deg,${CL.attention.main},${CL.attention.dark})`,color:"#fff",borderRadius:12,textAlign:"center",fontWeight:600,fontSize:14,cursor:"pointer"}}>Save Entry</div>
      </div>}
      {[...log].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(j=>{const comp=comps.find(x=>x.id===j.cid);return(
        <div key={j.id} style={{...s.card,marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",padding:16}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:12,background:CL.attention.light,display:"flex",alignItems:"center",justifyContent:"center"}}><Wrench size={18} color={CL.attention.main}/></div>
            <div><div style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>{j.desc}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{comp?comp.name:"Unknown"}{j.date?" · "+mn(j.date):""}</div></div>
          </div>
          {j.cost!==null&&<div style={{fontSize:16,fontWeight:700,color:"#0f172a"}}>{$(j.cost)}</div>}
        </div>
      );})}
      {log.length===0&&<div style={{textAlign:"center",color:"#cbd5e1",padding:64,fontSize:14}}>No work logged yet</div>}
    </div>
  );
}

function BottomNav({tab,setTab}){
  const items=[
    {i:Home,l:"Home",t:0},{i:LayoutGrid,l:"Items",t:1},{i:Camera,l:"Photos",t:2},
    {i:Users,l:"Vendors",t:3},{i:FileText,l:"Files",t:4},{i:ClipboardList,l:"Log",t:5}
  ];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(255,255,255,0.92)",backdropFilter:"blur(20px) saturate(180%)",WebkitBackdropFilter:"blur(20px) saturate(180%)",borderTop:"1px solid rgba(0,0,0,0.06)",zIndex:100,padding:"6px 0 env(safe-area-inset-bottom, 8px)"}}>
      <div style={{display:"flex",justifyContent:"space-around",maxWidth:480,margin:"0 auto"}}>
        {items.map(({i:I,l,t})=>{
          const a=tab===t;
          return <div key={t} onClick={()=>setTab(t)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"6px 0",cursor:"pointer",minWidth:56}}>
            <div style={{width:32,height:32,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:a?CL.attention.main:"transparent",transition:"all 0.2s"}}><I size={18} color={a?"#fff":"#94a3b8"} strokeWidth={a?2.5:1.8}/></div>
            <span style={{fontSize:10,fontWeight:a?600:500,color:a?CL.attention.main:"#94a3b8",transition:"color 0.2s"}}>{l}</span>
          </div>;
        })}
      </div>
    </div>
  );
}

function EditableInfo({ comp, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    manufacturer: comp.mfr || "",
    model: comp.mod || "",
    serial: comp.ser || "",
    year_installed: comp.yr || "",
    lifespan_min: comp.life?.[0] || "",
    lifespan_max: comp.life?.[1] || "",
  });

  const inp = { background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", color: "#0f172a", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" };
  const knownBrands = getBrandsForCategory(comp.cat);
  const knownTypes = getTypesForCategory(comp.cat);

  const handleBrandChange = (val) => {
    setForm(f => {
      const updated = { ...f, manufacturer: val };
      // Auto-lookup lifespan if we have brand
      if (val) {
        const lookup = lookupLifespan(comp.cat, val, null);
        if (lookup && (!f.lifespan_min || !f.lifespan_max)) {
          updated.lifespan_min = lookup.range[0];
          updated.lifespan_max = lookup.range[1];
        }
      }
      return updated;
    });
  };

  const save = async () => {
    const updates = {
      manufacturer: form.manufacturer || null,
      model: form.model || null,
      serial: form.serial || null,
      year_installed: form.year_installed || null,
      lifespan_min: form.lifespan_min ? parseInt(form.lifespan_min) : null,
      lifespan_max: form.lifespan_max ? parseInt(form.lifespan_max) : null,
    };
    await onSave(comp.id, updates);
    setEditing(false);
  };

  // Auto-suggest lifespan from reference
  const suggestedLife = lookupLifespan(comp.cat, form.manufacturer || comp.mfr, null);

  if (!editing) {
    const fields = [
      [comp.mfr, "Manufacturer"],
      [comp.mod, "Model"],
      [comp.ser, "Serial"],
      [comp.yr ? (comp.yr + (comp.conf === "est" ? " (est)" : "")) : null, "Installed"],
      [comp.age !== null ? (Math.round(comp.age) + "y") : null, "Age"],
      [comp.cond, "Condition"],
      [comp.life ? (comp.life[0] + "–" + comp.life[1] + " yrs") : null, "Lifespan"],
    ];
    const hasEmpty = !comp.mfr || !comp.mod || !comp.ser || !comp.life;

    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Details</span>
          <div onClick={() => setEditing(true)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: CL.attention.main, cursor: "pointer", fontWeight: 600 }}>
            <Plus size={14} />Edit
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 8 }}>
          {fields.filter(([v]) => v).map(([v, l], i) => (
            <div key={i} style={{ ...s.card, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{l}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6, color: "#0f172a", textTransform: l === "Condition" ? "capitalize" : "none" }}>{v}</div>
            </div>
          ))}
          {hasEmpty && (
            <div onClick={() => setEditing(true)} style={{ ...s.card, padding: "14px 16px", border: "1.5px dashed #e2e8f0", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 70 }}>
              <Plus size={16} color="#94a3b8" />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, fontWeight: 500 }}>Add info</div>
            </div>
          )}
        </div>
        {!comp.life && suggestedLife && (
          <div style={{ marginTop: 8, padding: "10px 14px", background: CL.attention.light, borderRadius: 10, fontSize: 12, color: CL.attention.dark, display: "flex", alignItems: "center", gap: 6 }}>
            <Info size={14} color={CL.attention.main} />
            Typical lifespan for {suggestedLife.source}: {suggestedLife.range[0]}–{suggestedLife.range[1]} years
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ ...s.card, marginBottom: 24, border: `1.5px solid ${CL.attention.border}` }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Edit Details</div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Manufacturer</label>
        <input
          list="brands-list"
          value={form.manufacturer}
          onChange={e => handleBrandChange(e.target.value)}
          placeholder="e.g. Carrier, Rheem, Sub-Zero"
          style={inp}
        />
        <datalist id="brands-list">
          {knownBrands.map(b => <option key={b} value={b} />)}
        </datalist>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Model</label>
          <input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="Model #" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Serial</label>
          <input value={form.serial} onChange={e => setForm({ ...form, serial: e.target.value })} placeholder="Serial #" style={inp} />
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Year Installed</label>
        <input value={form.year_installed} onChange={e => setForm({ ...form, year_installed: e.target.value })} placeholder="e.g. 2018" style={inp} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 6 }}>
        <div>
          <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Lifespan Min (yrs)</label>
          <input type="number" value={form.lifespan_min} onChange={e => setForm({ ...form, lifespan_min: e.target.value })} placeholder="—" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Lifespan Max (yrs)</label>
          <input type="number" value={form.lifespan_max} onChange={e => setForm({ ...form, lifespan_max: e.target.value })} placeholder="—" style={inp} />
        </div>
      </div>

      {suggestedLife && (
        <div
          onClick={() => setForm(f => ({ ...f, lifespan_min: suggestedLife.range[0], lifespan_max: suggestedLife.range[1] }))}
          style={{ marginBottom: 16, padding: "8px 12px", background: CL.attention.light, borderRadius: 8, fontSize: 12, color: CL.attention.main, cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}
        >
          <Info size={12} /> Use reference: {suggestedLife.source} ({suggestedLife.range[0]}–{suggestedLife.range[1]} yrs)
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <div onClick={() => setEditing(false)} style={{ flex: 1, padding: 12, borderRadius: 12, textAlign: "center", fontWeight: 600, fontSize: 14, cursor: "pointer", background: "#f1f5f9", color: "#64748b" }}>Cancel</div>
        <div onClick={save} style={{ flex: 1, padding: 12, borderRadius: 12, textAlign: "center", fontWeight: 600, fontSize: 14, cursor: "pointer", background: `linear-gradient(135deg,${CL.attention.main},${CL.attention.dark})`, color: "#fff" }}>Save</div>
      </div>
    </div>
  );
}

export default function App(){
  const { homeId } = useParams();
  const { user } = useOutletContext();
  const [tab,setTab]=useState(0);
  const [comps,setComps]=useState([]);
  const [warranties,setWarranties]=useState([]);
  const [log,setLog]=useState([]);
  const [home,setHome]=useState(null);
  const [report,setReport]=useState(null);
  const [loading,setLoading]=useState(true);
  const [photoMap,setPhotoMap]=useState([]);
  const [pdfPath,setPdfPath]=useState(null);
  const [sel,setSel]=useState(null);
  const [catF,setCatF]=useState("All");
  const [urgF,setUrgF]=useState("all");
  const pRef=useRef(null);
  const fRef=useRef(null);

  // Fetch data from Supabase
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Get home
      const { data: homeData } = await supabase
        .from('homes').select('*').eq('id', homeId).single();
      if (homeData) setHome(homeData);

      // Get latest report
      const { data: reportData } = await supabase
        .from('reports').select('*').eq('home_id', homeId)
        .eq('status', 'COMPLETE').order('created_at', { ascending: false }).limit(1).single();
      if (reportData) {
        setReport(reportData);
        if (reportData.parsed_json?.photo_map) setPhotoMap(reportData.parsed_json.photo_map);
        if (reportData.file_path) setPdfPath(reportData.file_path);
      }

      // Get items
      const { data: itemsData } = await supabase
        .from('items').select('*').eq('home_id', homeId);
      if (itemsData) setComps(itemsData.map(mapItem));

      // Get warranties
      const { data: warData } = await supabase
        .from('warranties').select('*').eq('user_id', user.id);
      if (warData) setWarranties(warData.map(mapWarranty));

      // Get actions (work log)
      const { data: actData } = await supabase
        .from('actions').select('*').eq('user_id', user.id);
      if (actData) setLog(actData.map(a => ({
        id: a.id, date: a.completed_at, cid: a.item_id,
        type: a.type, desc: a.description, cost: a.cost,
      })));

      setLoading(false);
    };
    if (homeId) load();
  }, [homeId, user.id]);

  // Save edits to an item
  const saveItem = async (itemId, updates) => {
    const { error } = await supabase.from('items').update(updates).eq('id', itemId);
    if (!error) {
      setComps(prev => prev.map(c => {
        if (c.id !== itemId) return c;
        return {
          ...c,
          mfr: updates.manufacturer ?? c.mfr,
          mod: updates.model ?? c.mod,
          ser: updates.serial ?? c.ser,
          yr: updates.year_installed ?? c.yr,
          life: updates.lifespan_min && updates.lifespan_max
            ? [updates.lifespan_min, updates.lifespan_max, Math.round((updates.lifespan_min + updates.lifespan_max) / 2)]
            : c.life,
          age: updates.year_installed ? (new Date().getFullYear() - parseInt(updates.year_installed)) : c.age,
        };
      }));
    }
  };

  const P = home ? {
    address: home.address || "Your Home",
    city: [home.city, home.state, home.zip].filter(Boolean).join(", "),
    built: home.year_built,
    inspected: report?.inspected_at,
    inspector: report?.inspector,
    co: report?.company,
    email: `home-${homeId.slice(0,8)}@inbound.homeguard.app`,
  } : { address: "Loading...", city: "", built: null, inspected: null, inspector: null, co: null, email: "" };

  const addPh=(cid,fl)=>{if(!fl||!cid)return;const a=Array.from(fl).map(f=>({name:f.name,url:URL.createObjectURL(f),sz:(f.size/1024|0)+"KB"}));setComps(p=>p.map(c=>c.id===cid?{...c,ph:[...c.ph,...a]}:c));};
  const addFi=(cid,fl)=>{if(!fl||!cid)return;const a=Array.from(fl).map(f=>({name:f.name,sz:(f.size/1024|0)+"KB"}));setComps(p=>p.map(c=>c.id===cid?{...c,fi:[...c.fi,...a]}:c));};

  const live=sel?comps.find(x=>x.id===sel.id):null;
  const crits=comps.filter(c=>c.u==="critical");
  const goodCt=comps.filter(c=>c.u==="ok"||c.u==="monitor").length;
  const planCt=comps.filter(c=>c.u==="attention").length;
  const critCt=crits.length;
  const annual=comps.flatMap(c=>c.mt||[]).reduce((s,t)=>s+(t.c||0)*(12/(t.f||12)),0);
  const tasks=comps.flatMap(c=>(c.mt||[]).filter(t=>t.n).map(t=>({...t,comp:c.name,cat:c.cat}))).sort((a,b)=>(a.n||"").localeCompare(b.n||"")).slice(0,6);
  const today=new Date();
  const dTo=d=>{try{return Math.round((new Date(d)-today)/864e5);}catch(e){return 999;}};
  const filtered=comps.filter(c=>(catF==="All"||c.cat===catF)&&(urgF==="all"||c.u===urgF));
  const allPh=comps.flatMap(c=>(c.ph||[]).map(p=>({...p,comp:c.name,cid:c.id})));

  if (loading) {
    return (
      <div style={{...s.wrap, display:"flex", alignItems:"center", justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <Loader size={28} color={CL.attention.main} style={{animation:"spin 1s linear infinite", margin:"0 auto 12px", display:"block"}}/>
          <div style={{fontSize:14,color:"#94a3b8"}}>Loading home data...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // ── Detail ──
  if(live){
    const c=live;const u=UU[c.u]||UU.ok;const cl=CL[c.u]||CL.ok;const CI=catIcons[c.cat]||Home;
    return(
      <div style={s.wrap}>
        <div style={s.page}>
          <div style={{paddingTop:20,marginBottom:24}}>
            <div onClick={()=>setSel(null)} style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:14,color:"#64748b",cursor:"pointer",fontWeight:500,padding:"8px 0"}}><ChevronLeft size={18}/>Back</div>
          </div>
          <div style={{display:"flex",alignItems:"start",gap:16,marginBottom:24}}>
            <div style={{width:52,height:52,borderRadius:16,background:u.iconBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><CI size={24} color={u.c}/></div>
            <div style={{flex:1,minWidth:0}}>
              <h2 style={{fontSize:22,fontWeight:700,margin:0,color:"#0f172a",lineHeight:1.2}}>{c.name}</h2>
              <div style={{fontSize:13,color:"#94a3b8",marginTop:4}}>{c.cat} · {c.loc}</div>
              <div style={{marginTop:8}}><Tag type={c.u}/></div>
            </div>
          </div>

          <EditableInfo comp={c} onSave={saveItem} />

          {c.notes&&<div style={{...s.card,marginBottom:16,borderLeft:`3px solid ${cl.main}`}}>
            <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Inspector Notes</div>
            <div style={{fontSize:14,color:"#475569",lineHeight:1.7}}>{c.notes}</div>
          </div>}

          {c.defs.length>0&&<div style={{...s.card,marginBottom:16,background:cl.light,border:`1px solid ${cl.border}`}}>
            <div style={{fontSize:13,fontWeight:700,color:cl.main,marginBottom:10,display:"flex",alignItems:"center",gap:6}}><AlertTriangle size={14}/>Issues Found</div>
            {c.defs.map((d,i)=><div key={i} style={{fontSize:14,color:cl.dark,padding:"4px 0",display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:5,height:5,borderRadius:3,background:cl.main,flexShrink:0}}/>{d}
            </div>)}
          </div>}

          {c.recs.length>0&&<div style={{...s.card,marginBottom:16,background:CL.attention.light,border:`1px solid ${CL.attention.border}`}}>
            <div style={{fontSize:13,fontWeight:700,color:CL.attention.main,marginBottom:10,display:"flex",alignItems:"center",gap:6}}><ArrowUpRight size={14}/>Recommendations</div>
            {c.recs.map((r,i)=><div key={i} style={{fontSize:14,color:CL.attention.dark,padding:"4px 0",display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:5,height:5,borderRadius:3,background:CL.attention.main,flexShrink:0}}/>{r}
            </div>)}
          </div>}

          {c.cost&&(c.cond==="poor"||c.u==="critical"||c.u==="attention")&&(
            <div style={{...s.card,marginBottom:24,background:cl.light,border:`1.5px solid ${cl.border}`}}>
              <div style={{fontSize:12,fontWeight:600,color:cl.main,marginBottom:6}}>Estimated Replacement</div>
              <div style={{fontSize:26,fontWeight:700,color:"#0f172a"}}>{$(c.cost[0])} – {$(c.cost[1])}</div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>National avg. Get local quotes.</div>
            </div>
          )}

          {c.mt.length>0&&<div style={{marginBottom:24}}>
            <div style={{fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:14}}>Maintenance Schedule</div>
            {c.mt.map((m,i)=>(
              <div key={i} style={{...s.card,marginBottom:8,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:36,height:36,borderRadius:10,background:m.d?CL.ok.light:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {m.d?<Wrench size={16} color={CL.ok.main}/>:<Calendar size={16} color="#94a3b8"/>}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:500,color:"#0f172a"}}>{m.t}{m.s?" ("+m.s+")":""}</div>
                    <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Every {m.f}mo{m.d?" · DIY":""}</div>
                  </div>
                </div>
                {m.c>0&&<div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>${m.c}</div>}
              </div>
            ))}
          </div>}

          <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <span style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>Photos</span>
              <div onClick={()=>pRef.current?.click()} style={{display:"flex",alignItems:"center",gap:4,fontSize:13,color:CL.attention.main,cursor:"pointer",fontWeight:600}}><Plus size={16}/>Add</div>
            </div>
            <input ref={pRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>addPh(c.id,e.target.files)}/>
            {(() => {
              const matchingPhotos = photoMap.filter(p => p.item_name === c.name);
              const hasUploaded = c.ph.length > 0;
              const hasPdfPhotos = matchingPhotos.length > 0 && pdfPath;
              if (!hasUploaded && !hasPdfPhotos) {
                return <div style={{...s.card,textAlign:"center",padding:32,color:"#cbd5e1"}}><Camera size={28} style={{margin:"0 auto 8px",display:"block"}}/><div style={{fontSize:13}}>No photos yet</div></div>;
              }
              return (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {hasPdfPhotos && matchingPhotos.map((p,i) => (
                    <PdfPhoto key={"pdf-"+i} filePath={pdfPath} page={p.page} description={p.description} />
                  ))}
                  {hasUploaded && <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{c.ph.map((p,i)=><div key={i} style={{aspectRatio:"1",borderRadius:12,overflow:"hidden",background:"#f1f5f9"}}><img src={p.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>)}</div>}
                </div>
              );
            })()}
          </div>

          <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <span style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>Files</span>
              <div onClick={()=>fRef.current?.click()} style={{display:"flex",alignItems:"center",gap:4,fontSize:13,color:CL.attention.main,cursor:"pointer",fontWeight:600}}><Upload size={16}/>Upload</div>
            </div>
            <input ref={fRef} type="file" accept=".pdf,.doc,.docx,.txt" multiple style={{display:"none"}} onChange={e=>addFi(c.id,e.target.files)}/>
            {c.fi.length>0?c.fi.map((f,i)=><div key={i} style={{...s.card,marginBottom:8,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}><FileText size={18} color={CL.attention.main}/><span style={{fontSize:14,color:"#0f172a",fontWeight:500}}>{f.name}</span></div>
              <span style={{color:"#94a3b8",fontSize:12}}>{f.sz}</span>
            </div>)
            :<div style={{...s.card,textAlign:"center",padding:32,color:"#cbd5e1"}}><FileText size={28} style={{margin:"0 auto 8px",display:"block"}}/><div style={{fontSize:13}}>No files yet</div></div>}
          </div>
        </div>
        <BottomNav tab={1} setTab={t=>{setSel(null);setTab(t);}}/>
      </div>
    );
  }

  // ── Main ──
  return(
    <div style={s.wrap}>
      <div style={s.page}>
        <div style={{paddingTop:24,marginBottom:28}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{width:32,height:32,borderRadius:10,background:`linear-gradient(135deg,${CL.attention.main},${CL.attention.dark})`,display:"flex",alignItems:"center",justifyContent:"center"}}><Shield size={16} color="#fff" strokeWidth={2.5}/></div>
            <span style={{fontSize:13,fontWeight:700,color:CL.attention.main,letterSpacing:"0.04em"}}>HOMEGUARD</span>
          </div>
          <h1 style={{fontSize:26,fontWeight:700,margin:0,letterSpacing:"-0.02em",color:"#0f172a",lineHeight:1.2}}>{P.address}</h1>
          <div style={{fontSize:13,color:"#94a3b8",marginTop:6,fontWeight:500}}>
            {P.city}{P.built ? ` · Built ${P.built}` : ""}{P.inspected ? ` · Inspected ${mn(P.inspected)}` : ""}
          </div>
        </div>

        {tab===0&&<div style={{display:"flex",flexDirection:"column",gap:20}}>
          {comps.length === 0 ? (
            <div style={{...s.card, textAlign:"center", padding:48}}>
              <LayoutGrid size={36} color="#cbd5e1" style={{margin:"0 auto 12px", display:"block"}}/>
              <div style={{fontSize:16, fontWeight:600, color:"#94a3b8"}}>No components yet</div>
              <div style={{fontSize:13, color:"#cbd5e1", marginTop:6}}>Upload an inspection report to get started</div>
            </div>
          ) : (<>
          <div style={{...s.card,display:"flex",alignItems:"center",gap:20,padding:24}}>
            <ScoreRing good={goodCt} plan={planCt} crit={critCt}/>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:700,color:"#0f172a",marginBottom:12}}>Property Health</div>
              {[[goodCt,"Good",CL.ok.ring],[planCt,"Plan & Budget",CL.attention.ring],[critCt,"Before Closing",CL.critical.ring]].map(([n,l,c],i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <div style={{width:8,height:8,borderRadius:4,background:c}}/>
                  <span style={{fontSize:13,color:"#64748b",flex:1}}>{l}</span>
                  <span style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{n}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{...s.card,padding:18}}>
              <div style={{width:36,height:36,borderRadius:10,background:CL.attention.light,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}><DollarSign size={18} color={CL.attention.main}/></div>
              <div style={{fontSize:10,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>Annual Maint.</div>
              <div style={{fontSize:24,fontWeight:700,marginTop:4,color:"#0f172a"}}>{$(annual)}</div>
            </div>
            <div style={{...s.card,padding:18}}>
              <div style={{width:36,height:36,borderRadius:10,background:CL.ok.light,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}><LayoutGrid size={18} color={CL.ok.main}/></div>
              <div style={{fontSize:10,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>Components</div>
              <div style={{fontSize:24,fontWeight:700,marginTop:4,color:"#0f172a"}}>{comps.length}</div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{comps.filter(c=>c.defs.length>0).length} with issues</div>
            </div>
          </div>

          {crits.length>0&&<div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <AlertTriangle size={16} color={CL.critical.main}/>
              <span style={{fontSize:16,fontWeight:700,color:CL.critical.main}}>Address Before Closing</span>
            </div>
            {crits.map(c=>{const CI=catIcons[c.cat]||Home;return(
              <div key={c.id} onClick={()=>setSel(c)} style={{...s.card,cursor:"pointer",marginBottom:10,padding:0,overflow:"hidden"}}>
                <div style={{height:3,background:`linear-gradient(90deg,${CL.critical.main},${CL.critical.ring})`}}/>
                <div style={{padding:"16px 18px",display:"flex",alignItems:"start",gap:14}}>
                  <div style={{width:44,height:44,borderRadius:14,background:CL.critical.mid,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><CI size={20} color={CL.critical.main}/></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>{c.name}</div>
                    <div style={{fontSize:13,color:"#64748b",marginTop:3}}>{c.recs[0]||c.notes}</div>
                    {c.cost&&<div style={{fontSize:15,fontWeight:700,color:CL.critical.main,marginTop:10}}>{$(c.cost[0])} – {$(c.cost[1])}</div>}
                  </div>
                  <ChevronRight size={18} color="#cbd5e1" style={{flexShrink:0,marginTop:2}}/>
                </div>
              </div>
            );})}
          </div>}

          {tasks.length>0&&<div>
            <div style={{fontSize:16,fontWeight:700,color:"#0f172a",marginBottom:14}}>Upcoming Maintenance</div>
            {tasks.map((t,i)=>{const CI=catIcons[t.cat]||Wrench;return(
              <div key={i} style={{...s.card,marginBottom:8,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:12,background:t.d?CL.ok.light:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><CI size={18} color={t.d?CL.ok.main:"#94a3b8"}/></div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>{t.t}</div>
                  <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{t.comp}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  {t.n&&<div style={{fontSize:12,fontWeight:600,color:"#64748b"}}>{mn(t.n)}</div>}
                  {t.d&&<div style={{fontSize:10,fontWeight:600,color:CL.ok.main,marginTop:2}}>DIY</div>}
                </div>
              </div>
            );})}
          </div>}
          </>)}
        </div>}

        {tab===1&&<div style={{paddingTop:4}}>
          <div style={{fontSize:18,fontWeight:700,color:"#0f172a",marginBottom:16}}>Components</div>
          <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:10,paddingBottom:4}}>
            {CATS.map(c=>{const a=catF===c;return <span key={c} onClick={()=>setCatF(c)} style={{padding:"7px 16px",borderRadius:20,fontSize:12,cursor:"pointer",fontWeight:a?700:500,background:a?CL.attention.main:"#fff",color:a?"#fff":"#64748b",boxShadow:a?"none":"0 1px 2px rgba(0,0,0,0.04)",whiteSpace:"nowrap",transition:"all 0.2s",border:a?"none":"1px solid #e2e8f0"}}>{c}</span>;})}
          </div>
          <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:20,paddingBottom:4}}>
            {[["all","All"],["critical","Before Closing"],["attention","Plan & Budget"],["monitor","Monitor"],["ok","Good"]].map(([k,l])=>{
              const a=urgF===k;const cl=k!=="all"?CL[k]:null;
              return <span key={k} onClick={()=>setUrgF(k)} style={{padding:"7px 14px",borderRadius:20,fontSize:12,cursor:"pointer",fontWeight:a?600:500,background:a?(cl?cl.light:"#f1f5f9"):"#fff",color:a?(cl?cl.main:"#0f172a"):"#94a3b8",border:`1px solid ${a?(cl?cl.border:"#e2e8f0"):"#e2e8f0"}`,whiteSpace:"nowrap",transition:"all 0.2s"}}>{l}</span>;
            })}
          </div>
          {filtered.map(c=>{const u=UU[c.u]||UU.ok;const CI=catIcons[c.cat]||Home;return(
            <div key={c.id} onClick={()=>setSel(c)} style={{...s.card,marginBottom:8,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
              <div style={{width:42,height:42,borderRadius:14,background:u.iconBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><CI size={18} color={u.c}/></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>{c.name}</div>
                <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{c.loc}{c.mfr?" · "+c.mfr:""}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                {c.cost&&(c.u==="critical"||c.u==="attention")&&<div style={{fontSize:12,fontWeight:600,color:"#0f172a"}}>{$(c.cost[0])}–{$(c.cost[1])}</div>}
                {c.defs.length>0&&<div style={{fontSize:11,fontWeight:600,color:CL.warn.main,marginTop:2}}>{c.defs.length} issue{c.defs.length>1?"s":""}</div>}
              </div>
              <ChevronRight size={16} color="#cbd5e1"/>
            </div>
          );})}
          {filtered.length===0&&<div style={{textAlign:"center",color:"#cbd5e1",padding:64,fontSize:14}}>No matching components</div>}
        </div>}

        {tab===2&&<div style={{paddingTop:4}}>
          <div style={{fontSize:18,fontWeight:700,color:"#0f172a",marginBottom:6}}>Photos</div>
          <div style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>{allPh.length} photo{allPh.length!==1?"s":""}</div>
          {allPh.length>0?(
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {allPh.map((p,i)=>(
                <div key={i} style={{borderRadius:14,overflow:"hidden",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
                  <div style={{aspectRatio:"1"}}><img src={p.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
                  <div style={{padding:"8px 10px"}}><div style={{fontSize:11,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div><div style={{fontSize:10,color:"#94a3b8"}}>{p.comp}</div></div>
                </div>
              ))}
            </div>
          ):(
            <div style={{...s.card,textAlign:"center",padding:64}}><Camera size={36} color="#cbd5e1" style={{margin:"0 auto 12px",display:"block"}}/><div style={{fontSize:14,color:"#94a3b8",fontWeight:500}}>No photos yet</div><div style={{fontSize:12,color:"#cbd5e1",marginTop:4}}>Add from component pages</div></div>
          )}
        </div>}

        {tab===3&&<div style={{paddingTop:4}}>
          <div style={{fontSize:18,fontWeight:700,color:"#0f172a",marginBottom:6}}>Vendors</div>
          <div style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>Coming soon — local professionals for your home</div>
          <div style={{...s.card,textAlign:"center",padding:48}}>
            <Users size={36} color="#cbd5e1" style={{margin:"0 auto 12px", display:"block"}}/>
            <div style={{fontSize:14, color:"#94a3b8"}}>Vendor recommendations will be generated based on your location and needs</div>
          </div>
        </div>}

        {tab===4&&<FileCabinet user={user} homeId={homeId} warranties={warranties} />}

        {tab===5&&<WorkLogPanel log={log} setLog={setLog} comps={comps}/>}
      </div>
      <BottomNav tab={tab} setTab={t=>{setSel(null);setTab(t);}}/>
    </div>
  );
}