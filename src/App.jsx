import { useState, useRef } from "react";
import { Home, LayoutGrid, Camera, Users, Shield, ClipboardList, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Clock, Eye, Wrench, Star, Phone, Mail, FileText, Upload, Plus, Calendar, DollarSign, ArrowUpRight, Zap, Droplets, Flame, Plug, UtensilsCrossed, TreePine, DoorOpen, ShieldAlert, Info, X } from "lucide-react";

const P = {
  address: "25780 N. St. Mary's Rd.",
  city: "Mettawa, IL 60048",
  built: 1986,
  inspected: "2025-03-31",
  inspector: "Ken D'Alexander",
  co: "Complete Property Inspections Inc.",
  email: "home-m3tt4w4@inbound.homeguard.app",
};

const OPTS = {
  c1: [
    {name:"Cedar Shake (like-for-like)",life:"25–40 yrs",cost:[35000,65000],pros:["Authentic look","Matches original build"],cons:["Highest cost","Requires ongoing maintenance","Fire risk without treatment"],note:"Costs vary heavily by region and roof complexity."},
    {name:"Architectural Asphalt Shingles",life:"20–30 yrs",cost:[18000,35000],pros:["Most affordable","Low maintenance","Wide color selection"],cons:["Shorter lifespan","Less distinctive appearance"],note:"Most common replacement choice nationally."},
    {name:"Metal Standing Seam",life:"40–70 yrs",cost:[30000,55000],pros:["Longest lifespan","Near-zero maintenance","Potential insurance discount"],cons:["Higher upfront cost","Noise in heavy rain","Fewer contractors available"],note:"Growing in popularity. Check with your insurer about discounts."},
    {name:"Synthetic Shake (DaVinci, Brava)",life:"30–50 yrs",cost:[28000,50000],pros:["Looks like real cedar","Class A fire rated","Lower maintenance than real wood"],cons:["Newer product, less long-term data","Mid-high cost"],note:"Relatively new category. Warranty terms vary by manufacturer."},
  ],
  c9: [
    {name:"Pressure-Treated Lumber",life:"15–25 yrs",cost:[2000,6000],pros:["Most affordable","Widely available","Easy to work with"],cons:["Requires sealing/staining","Can warp over time"],note:"Standard choice for structural repair."},
    {name:"Composite/Engineered Wood",life:"25–40 yrs",cost:[4000,10000],pros:["Rot resistant","Low maintenance","Longer lifespan"],cons:["Higher upfront cost","Heavier material"],note:"Good option if moisture was the original cause of rot."},
  ],
  c7: [
    {name:"Poured Concrete (replace in kind)",life:"25–40 yrs",cost:[8000,20000],pros:["Durable","Familiar to contractors"],cons:["Can crack again over time","Drainage must be corrected separately"],note:"Address grading/drainage first or new concrete will have the same issues."},
    {name:"Concrete Pavers",life:"25–50 yrs",cost:[12000,30000],pros:["Individual pavers replaceable","Better drainage","Premium look"],cons:["Higher cost","Can shift/settle without proper base"],note:"Allows for better water management around pool area."},
    {name:"Resurface/Mudjack Existing",life:"5–10 yrs",cost:[3000,8000],pros:["Lowest cost","Less disruption"],cons:["Temporary fix","Doesn't address underlying issues"],note:"Only worthwhile if settling is minor. Inspector noted significant cracking."},
  ],
  c8: [
    {name:"Regrading (soil work)",life:"10–20 yrs",cost:[2000,8000],pros:["Addresses root cause","Protects foundation"],cons:["May need to redo landscaping","Effectiveness depends on execution"],note:"Should be done before or alongside any patio/walkway work."},
    {name:"French Drain System",life:"15–30 yrs",cost:[4000,12000],pros:["Handles heavy water flow","Works with existing grade"],cons:["Invasive to install","Requires maintenance"],note:"Consider if regrading alone is insufficient."},
  ],
  c18: [
    {name:"Repair Existing Operator",life:"3–8 yrs additional",cost:[150,400],pros:["Cheapest option","Quick fix"],cons:["May fail again","No new warranty"],note:"Could be a sensor, logic board, or limit switch issue."},
    {name:"Replace Operator (belt-drive)",life:"10–15 yrs",cost:[300,600],pros:["Quieter than chain","New warranty","Modern safety features"],cons:["Moderate cost"],note:"Belt-drive recommended for attached garages."},
  ],
};

const CC = [
  {id:"c1",cat:"Roof/Exterior",name:"Cedar Shake Roof",loc:"Main roof",mfr:null,mod:null,ser:null,yr:"1986",conf:"est",age:39,cond:"poor",life:[25,40,32],rem:-7,cost:[35000,65000],notes:"Several areas worn with deterioration/dry-rot; warped/loose shakes.",defs:["Deterioration/dry-rot","Warped/loose shakes"],recs:["Have qualified roofer evaluate","Full replacement recommended"],mt:[{t:"Visual inspection",f:6,c:0,d:true,n:"2025-10-01"},{t:"Professional inspection",f:24,c:400,d:false,n:"2025-10-01"}],u:"critical",ph:[],fi:[]},
  {id:"c2",cat:"Plumbing",name:"Rheem Gas Water Heater",loc:"Basement utility",mfr:"Rheem",mod:"XG75T06ST76U0",ser:"Q322427664",yr:"2024",conf:"exact",age:0.6,cond:"poor",life:[8,15,11],rem:10.4,cost:[1800,3500],notes:"Unit was OFF at inspection; pilot light/gas ignition failed; hot water could not be validated. This is a brand-new unit that likely needs service, not replacement.",defs:["Non-functional at inspection","Could not validate hot water"],recs:["Validate operation BEFORE closing","Contact installer for warranty service"],mt:[{t:"Flush tank",f:12,c:0,d:true,n:"2025-08-01"},{t:"Test T&P valve",f:12,c:0,d:true,n:"2025-08-01"},{t:"Inspect anode rod",f:36,c:30,d:true,n:"2027-08-01"}],u:"critical",ph:[],fi:[]},
  {id:"c3",cat:"HVAC",name:"Carrier Gas Furnace",loc:"Basement utility",mfr:"Carrier",mod:"59MN7A120V24",ser:"3617A52548",yr:"2017",conf:"exact",age:7.5,cond:"functional",life:[15,25,18],rem:10.5,cost:[5500,9000],notes:"Worked when tested. Seasonal maintenance recommended.",defs:[],recs:["Seasonal HVAC maintenance"],mt:[{t:"Replace air filter",f:3,c:25,d:true,n:"2025-06-01"},{t:"Professional tune-up",f:12,c:175,d:false,n:"2025-09-15",s:"Fall"},{t:"Clean condensate drain",f:12,c:0,d:true,n:"2025-09-01"}],u:"monitor",ph:[],fi:[]},
  {id:"c4",cat:"HVAC",name:"Ducane Central AC",loc:"Exterior",mfr:"Ducane",mod:"4AC13L48P-10A",ser:"1922J14042",yr:"2022",conf:"exact",age:3,cond:"not tested",life:[12,20,15],rem:12,cost:[5500,9500],notes:"Not tested due to temperature. 4-ton unit; home may need dual units.",defs:["Not tested at inspection","Possible undersizing"],recs:["Request seller service records","HVAC contractor to evaluate sizing"],mt:[{t:"Replace air filter",f:3,c:25,d:true,n:"2025-06-01"},{t:"Professional tune-up",f:12,c:175,d:false,n:"2025-04-15",s:"Spring"},{t:"Clean condenser coils",f:12,c:0,d:true,n:"2025-05-01"}],u:"attention",ph:[],fi:[]},
  {id:"c5",cat:"Electrical",name:"Crouse-Hinds Main Panel",loc:"Utility area",mfr:"Crouse-Hinds",mod:null,ser:null,yr:null,conf:"unknown",age:null,cond:"fair",life:[25,50,40],rem:null,cost:[2000,4500],notes:"200A service. Multiple wiring issues.",defs:["Amateur wiring","Doubled breakers","Missing knockouts","Missing arc-fault breakers"],recs:["Electrician to evaluate and correct"],mt:[{t:"Visual inspection",f:12,c:0,d:true,n:"2025-09-01"}],u:"attention",ph:[],fi:[]},
  {id:"c6",cat:"Electrical",name:"Siemens Sub-Panel",loc:"Utility area",mfr:"Siemens",mod:null,ser:null,yr:null,conf:"unknown",age:null,cond:"fair",life:[25,50,40],rem:null,cost:[1500,3000],notes:"100A sub-panel; limited visibility.",defs:["Needs evaluation"],recs:["Evaluate with main panel"],mt:[],u:"attention",ph:[],fi:[]},
  {id:"c7",cat:"Landscape",name:"Pool Patio / Walkways",loc:"Pool area",mfr:null,mod:null,ser:null,yr:null,conf:"unknown",age:null,cond:"poor",life:[20,40,30],rem:null,cost:[8000,20000],notes:"Settled, cracked. Negative pitch toward foundation.",defs:["Cracked concrete","Negative drainage"],recs:["Concrete contractor to evaluate","Fix drainage"],mt:[],u:"attention",ph:[],fi:[]},
  {id:"c8",cat:"Landscape",name:"Grading / Drainage",loc:"Perimeter",mfr:null,mod:null,ser:null,yr:null,conf:"unknown",age:null,cond:"poor",life:null,rem:null,cost:[2000,8000],notes:"Grading pitched toward foundation.",defs:["Negative grading"],recs:["Regrade away from foundation"],mt:[{t:"Check after heavy rain",f:6,c:0,d:true,n:"2025-05-01"}],u:"attention",ph:[],fi:[]},
  {id:"c9",cat:"Structure",name:"Rear Porch Joists",loc:"Rear porch",mfr:null,mod:null,ser:null,yr:null,conf:"unknown",age:null,cond:"poor",life:null,rem:null,cost:[2000,6000],notes:"Rotted wood at rear porch.",defs:["Rotted wood joists"],recs:["Contractor to replace"],mt:[],u:"critical",ph:[],fi:[]},
  {id:"c10",cat:"Roof/Exterior",name:"Gutters & Downspouts",loc:"Perimeter",mfr:null,mod:null,ser:null,yr:null,conf:"unknown",age:null,cond:"fair",life:[15,30,20],rem:null,cost:[1500,4000],notes:"Full of debris.",defs:["Debris-filled"],recs:["Clean gutters","Check for rust after"],mt:[{t:"Clean gutters",f:6,c:150,d:true,n:"2025-05-01",s:"Spring"},{t:"Inspect for rust",f:12,c:0,d:true,n:"2025-05-15"}],u:"attention",ph:[],fi:[]},
  {id:"c11",cat:"Roof/Exterior",name:"Brick / Chimney Masonry",loc:"Exterior",mfr:null,mod:null,ser:null,yr:null,conf:"unknown",age:null,cond:"fair",life:[50,100,75],rem:null,cost:[3000,15000],notes:"Tuck-pointing needed; painted brick trapping moisture.",defs:["Needs tuck-pointing","Spalled brick","Peeling paint"],recs:["Masonry contractor to evaluate"],mt:[{t:"Inspect for cracks",f:12,c:0,d:true,n:"2025-10-01"}],u:"attention",ph:[],fi:[]},
  {id:"c12",cat:"Plumbing",name:"Sump Pumps",loc:"Basement",mfr:null,mod:null,ser:null,yr:null,conf:"unknown",age:null,cond:"functional",life:[5,15,10],rem:null,cost:[500,1500],notes:"All tested and working.",defs:[],recs:["Annual service"],mt:[{t:"Test pump",f:3,c:0,d:true,n:"2025-06-01"},{t:"Clean intake",f:6,c:0,d:true,n:"2025-09-01"}],u:"ok",ph:[],fi:[]},
  {id:"c13",cat:"Appliances",name:"Sub-Zero Refrigerator",loc:"Kitchen",mfr:"Sub-Zero",mod:null,ser:null,yr:null,conf:"unknown",age:null,cond:"functional",life:[13,25,19],rem:null,cost:[8000,15000],notes:"Functional. Annual service recommended.",defs:[],recs:["Sub-Zero certified maintenance"],mt:[{t:"Clean condenser coils",f:12,c:0,d:true,n:"2025-09-01"},{t:"Professional service",f:12,c:350,d:false,n:"2025-09-01"}],u:"ok",ph:[],fi:[]},
  {id:"c14",cat:"Appliances",name:"Gas Range / Cooktop",loc:"Kitchen",mfr:null,mod:null,ser:null,yr:null,conf:"unknown",age:null,cond:"fair",life:[13,20,16],rem:null,cost:[2000,6000],notes:"Abnormal burner noise at high.",defs:["Abnormal noise"],recs:["Evaluate burner orifices"],mt:[{t:"Clean burner grates",f:1,c:0,d:true,n:"2025-05-01"}],u:"attention",ph:[],fi:[]},
  {id:"c15",cat:"Appliances",name:"Washing Machine",loc:"Laundry",mfr:null,mod:null,ser:null,yr:null,conf:"unknown",age:null,cond:"fair",life:[8,14,11],rem:null,cost:[800,1500],notes:"Mildew on gasket; filter needs cleaning.",defs:["Mildew on gasket"],recs:["Clean gasket and filter"],mt:[{t:"Cleaning cycle",f:1,c:3,d:true,n:"2025-05-01"},{t:"Inspect hoses",f:6,c:0,d:true,n:"2025-09-01"}],u:"monitor",ph:[],fi:[]},
  {id:"c16",cat:"HVAC",name:"Radiant Floor Heat",loc:"2nd floor baths",mfr:null,mod:null,ser:null,yr:null,conf:"unknown",age:null,cond:"functional",life:[20,35,25],rem:null,cost:[2000,5000],notes:"Working per thermal imaging.",defs:[],recs:[],mt:[],u:"ok",ph:[],fi:[]},
  {id:"c17",cat:"Safety",name:"Fireplace Doors",loc:"Living areas",mfr:null,mod:null,ser:null,yr:null,conf:"unknown",age:null,cond:"fair",life:[15,30,20],rem:null,cost:[300,800],notes:"Some doors loose.",defs:["Loose doors"],recs:["Repair or replace"],mt:[],u:"monitor",ph:[],fi:[]},
  {id:"c18",cat:"Interior",name:"Garage Door Operator",loc:"Garage (left)",mfr:null,mod:null,ser:null,yr:null,conf:"unknown",age:null,cond:"poor",life:[10,15,12],rem:null,cost:[300,600],notes:"Must hold button to close.",defs:["Requires holding button"],recs:["Garage door service"],mt:[],u:"attention",ph:[],fi:[]},
  {id:"c19",cat:"Landscape",name:"Trees & Vegetation",loc:"Grounds",mfr:null,mod:null,ser:null,yr:null,conf:"unknown",age:null,cond:"functional",life:null,rem:null,cost:null,notes:"Document and photograph all plantings.",defs:[],recs:["Photograph major trees","Identify species"],mt:[{t:"Spring cleanup",f:12,c:500,d:true,n:"2025-04-15",s:"Spring"},{t:"Fall leaves",f:12,c:300,d:true,n:"2025-10-15",s:"Fall"},{t:"Arborist inspection",f:24,c:250,d:false,n:"2025-06-01"}],u:"ok",ph:[],fi:[]},
];

const WW = [
  {id:"w1",cid:"c2",prod:"Rheem Water Heater",prov:"Rheem",cov:"6-year tank and parts",start:"2024-08-01",exp:"2030-08-01",reg:false,note:"Must register for full coverage."},
  {id:"w2",cid:"c3",prod:"Carrier Furnace",prov:"Carrier",cov:"10-year parts limited",start:"2017-09-01",exp:"2027-09-01",reg:true,note:"Use authorized dealer."},
  {id:"w3",cid:"c4",prod:"Ducane Central AC",prov:"Ducane",cov:"10-year parts limited",start:"2022-01-01",exp:"2032-01-01",reg:false,note:"Register within 90 days."},
];

const VV = [
  {id:"v1",name:"Lake County Roofing",cats:["Roof/Exterior"],ph:"(847) 555-0101",r:4.8,rv:127,note:""},
  {id:"v2",name:"North Shore HVAC",cats:["HVAC"],ph:"(847) 555-0202",r:4.7,rv:94,note:""},
  {id:"v3",name:"Mettawa Electric",cats:["Electrical"],ph:"(847) 555-0303",r:4.6,rv:63,note:""},
  {id:"v4",name:"Reliable Plumbing",cats:["Plumbing"],ph:"(847) 555-0404",r:4.5,rv:211,note:""},
  {id:"v5",name:"Libertyville Masonry",cats:["Structure"],ph:"(847) 555-0505",r:4.9,rv:48,note:""},
  {id:"v6",name:"Green Thumb Landscaping",cats:["Landscape"],ph:"(847) 555-0606",r:4.4,rv:156,note:""},
  {id:"v7",name:"Sub-Zero Wolf Repair",cats:["Appliances"],ph:"(847) 555-0707",r:4.8,rv:35,note:"Factory authorized"},
];

const LL = [{id:"j1",date:"2024-08-01",cid:"c2",type:"replacement",desc:"New 75-gal Rheem water heater installed",cost:null}];

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

const catIcons={"Roof/Exterior":Home,"HVAC":Flame,"Plumbing":Droplets,"Electrical":Zap,"Appliances":UtensilsCrossed,"Structure":Wrench,"Landscape":TreePine,"Interior":DoorOpen,"Safety":ShieldAlert};
const CATS=["All","Roof/Exterior","HVAC","Plumbing","Electrical","Appliances","Structure","Landscape","Interior","Safety"];
const mn=d=>new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
const $=n=>"$"+Math.round(n).toLocaleString();

const s={
  wrap:{fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",background:"#f8fafc",color:"#0f172a",minHeight:"100vh",paddingBottom:90,WebkitFontSmoothing:"antialiased"},
  page:{maxWidth:480,margin:"0 auto",padding:"0 20px"},
  card:{background:"#fff",borderRadius:16,padding:20,boxShadow:"0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)"},
};

function Tag({type,small}){
  const u=UU[type]||UU.ok;const I=u.icon;
  return <span style={{fontSize:small?10:11,fontWeight:600,padding:small?"2px 8px":"4px 12px",borderRadius:20,color:u.c,background:u.iconBg,display:"inline-flex",alignItems:"center",gap:4,whiteSpace:"nowrap",letterSpacing:"0.01em"}}>
    <I size={small?10:12} strokeWidth={2.5}/>{u.l}
  </span>;
}

function ScoreRing({good,plan,crit,size=120}){
  const total=good+plan+crit;const r=size/2-8;const circ=2*Math.PI*r;
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

function ReplacementOptions({compId}){
  const opts=OPTS[compId];const [open,setOpen]=useState(null);
  if(!opts)return null;
  return(
    <div style={{marginBottom:24}}>
      <div style={{fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:4}}>Replacement Options</div>
      <div style={{fontSize:12,color:"#94a3b8",marginBottom:16}}>National averages — get local quotes for accuracy</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {opts.map((o,i)=>{
          const isO=open===i;
          return(
            <div key={i} onClick={()=>setOpen(isO?null:i)} style={{...s.card,padding:0,overflow:"hidden",border:isO?`1.5px solid ${CL.attention.main}`:"1.5px solid transparent",cursor:"pointer",transition:"all 0.2s"}}>
              <div style={{padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>{o.name}</div>
                  <div style={{fontSize:12,color:"#94a3b8",marginTop:3}}>Life: {o.life}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:16}}>
                  <div style={{fontSize:16,fontWeight:700,color:"#0f172a"}}>{$(o.cost[0])}<span style={{color:"#94a3b8",fontWeight:400}}> – </span>{$(o.cost[1])}</div>
                </div>
              </div>
              {isO&&<div style={{padding:"0 18px 18px",borderTop:"1px solid #f1f5f9"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:16}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:CL.ok.main,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Pros</div>
                    {o.pros.map((p,j)=><div key={j} style={{fontSize:13,color:"#475569",padding:"3px 0",display:"flex",alignItems:"center",gap:6}}><CheckCircle2 size={12} color={CL.ok.ring}/>{p}</div>)}
                  </div>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:CL.warn.main,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Cons</div>
                    {o.cons.map((c,j)=><div key={j} style={{fontSize:13,color:"#475569",padding:"3px 0",display:"flex",alignItems:"center",gap:6}}><X size={12} color={CL.warn.ring}/>{c}</div>)}
                  </div>
                </div>
                {o.note&&<div style={{fontSize:12,color:"#94a3b8",marginTop:14,padding:"10px 12px",background:"#f8fafc",borderRadius:10,lineHeight:1.5}}><Info size={12} style={{display:"inline",verticalAlign:"-2px",marginRight:4}}/>{o.note}</div>}
              </div>}
            </div>
          );
        })}
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
    {i:Users,l:"Vendors",t:3},{i:Shield,l:"Warranties",t:4},{i:ClipboardList,l:"Log",t:5}
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

export default function App(){
  const [tab,setTab]=useState(0);
  const [comps,setComps]=useState(CC);
  const [vendors]=useState(VV);
  const [log,setLog]=useState(LL);
  const [sel,setSel]=useState(null);
  const [catF,setCatF]=useState("All");
  const [urgF,setUrgF]=useState("all");
  const pRef=useRef(null);
  const fRef=useRef(null);

  const addPh=(cid,fl)=>{if(!fl||!cid)return;const a=Array.from(fl).map(f=>({name:f.name,url:URL.createObjectURL(f),sz:(f.size/1024|0)+"KB"}));setComps(p=>p.map(c=>c.id===cid?{...c,ph:[...c.ph,...a]}:c));};
  const addFi=(cid,fl)=>{if(!fl||!cid)return;const a=Array.from(fl).map(f=>({name:f.name,sz:(f.size/1024|0)+"KB"}));setComps(p=>p.map(c=>c.id===cid?{...c,fi:[...c.fi,...a]}:c));};

  const live=sel?comps.find(x=>x.id===sel.id):null;
  const crits=comps.filter(c=>c.u==="critical");
  const goodCt=comps.filter(c=>c.u==="ok"||c.u==="monitor").length;
  const planCt=comps.filter(c=>c.u==="attention").length;
  const critCt=crits.length;
  const annual=comps.flatMap(c=>c.mt||[]).reduce((s,t)=>s+(t.c||0)*(12/(t.f||12)),0);
  const tasks=comps.flatMap(c=>(c.mt||[]).filter(t=>t.n).map(t=>({...t,comp:c.name,cat:c.cat}))).sort((a,b)=>a.n.localeCompare(b.n)).slice(0,6);
  const today=new Date();
  const dTo=d=>Math.round((new Date(d)-today)/864e5);
  const filtered=comps.filter(c=>(catF==="All"||c.cat===catF)&&(urgF==="all"||c.u===urgF));
  const allPh=comps.flatMap(c=>c.ph.map(p=>({...p,comp:c.name,cid:c.id})));

  // ── Detail ──
  if(live){
    const c=live;const u=UU[c.u]||UU.ok;const cl=CL[c.u]||CL.ok;const hasOpts=OPTS[c.id];const CI=catIcons[c.cat]||Home;
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

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,marginBottom:24}}>
            {[[c.mfr,"Manufacturer"],[c.mod,"Model"],[c.ser,"Serial"],[c.yr?(c.yr+(c.conf==="est"?" (est)":"")):null,"Installed"],[c.age!==null?(Math.round(c.age)+"y"):null,"Age"],[c.cond,"Condition"],[c.life?(c.life[0]+"–"+c.life[1]+" yrs"):null,"Lifespan"]].filter(([v])=>v).map(([v,l],i)=>(
              <div key={i} style={{...s.card,padding:"14px 16px"}}>
                <div style={{fontSize:10,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>{l}</div>
                <div style={{fontSize:14,fontWeight:600,marginTop:6,color:"#0f172a",textTransform:l==="Condition"?"capitalize":"none"}}>{v}</div>
              </div>
            ))}
          </div>

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

          <ReplacementOptions compId={c.id}/>

          {!hasOpts&&c.cost&&(c.cond==="poor"||c.u==="critical")&&(
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
            {c.ph.length>0?<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{c.ph.map((p,i)=><div key={i} style={{aspectRatio:"1",borderRadius:12,overflow:"hidden",background:"#f1f5f9"}}><img src={p.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>)}</div>
            :<div style={{...s.card,textAlign:"center",padding:32,color:"#cbd5e1"}}><Camera size={28} style={{margin:"0 auto 8px",display:"block"}}/><div style={{fontSize:13}}>No photos yet</div></div>}
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
          <div style={{fontSize:13,color:"#94a3b8",marginTop:6,fontWeight:500}}>{P.city} · Built {P.built} · Inspected {mn(P.inspected)}</div>
        </div>

        {tab===0&&<div style={{display:"flex",flexDirection:"column",gap:20}}>
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
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10}}>
                      {c.cost&&<div style={{fontSize:15,fontWeight:700,color:CL.critical.main}}>{$(c.cost[0])} – {$(c.cost[1])}</div>}
                      {OPTS[c.id]&&<span style={{fontSize:11,fontWeight:600,color:CL.attention.main,background:CL.attention.light,padding:"3px 10px",borderRadius:20}}>{OPTS[c.id].length} options</span>}
                    </div>
                  </div>
                  <ChevronRight size={18} color="#cbd5e1" style={{flexShrink:0,marginTop:2}}/>
                </div>
              </div>
            );})}
          </div>}

          <div>
            <div style={{fontSize:16,fontWeight:700,color:"#0f172a",marginBottom:14}}>Upcoming Maintenance</div>
            {tasks.map((t,i)=>{const CI=catIcons[t.cat]||Wrench;return(
              <div key={i} style={{...s.card,marginBottom:8,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:12,background:t.d?CL.ok.light:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><CI size={18} color={t.d?CL.ok.main:"#94a3b8"}/></div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>{t.t}</div>
                  <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{t.comp}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#64748b"}}>{mn(t.n)}</div>
                  {t.d&&<div style={{fontSize:10,fontWeight:600,color:CL.ok.main,marginTop:2}}>DIY</div>}
                </div>
              </div>
            );})}
          </div>
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
          <div style={{fontSize:18,fontWeight:700,color:"#0f172a",marginBottom:6}}>Recommended Vendors</div>
          <div style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>Local professionals for your home</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {vendors.map(v=>{const CI=catIcons[v.cats[0]]||Wrench;return(
              <div key={v.id} style={{...s.card,padding:18}}>
                <div style={{display:"flex",alignItems:"start",gap:14}}>
                  <div style={{width:44,height:44,borderRadius:14,background:CL.attention.light,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><CI size={20} color={CL.attention.main}/></div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
                      <div style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>{v.name}</div>
                      <div style={{display:"flex",alignItems:"center",gap:4}}><Star size={13} color="#f59e0b" fill="#f59e0b"/><span style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{v.r}</span><span style={{fontSize:11,color:"#94a3b8"}}>({v.rv})</span></div>
                    </div>
                    <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{v.cats.join(" · ")}</div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,fontSize:13,color:CL.attention.main,fontWeight:500}}><Phone size={14}/>{v.ph}</div>
                    {v.note&&<div style={{fontSize:12,color:"#64748b",marginTop:6,padding:"6px 10px",background:"#f8fafc",borderRadius:8}}>{v.note}</div>}
                  </div>
                </div>
              </div>
            );})}
          </div>
        </div>}

        {tab===4&&<div style={{paddingTop:4}}>
          <div style={{fontSize:18,fontWeight:700,color:"#0f172a",marginBottom:6}}>Warranties</div>
          <div style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>Track and manage coverage</div>
          <div style={{...s.card,marginBottom:20,background:`linear-gradient(135deg,${CL.attention.main},${CL.attention.dark})`,padding:20}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><Mail size={16} color="rgba(255,255,255,0.7)"/><span style={{fontSize:12,color:"rgba(255,255,255,0.7)",fontWeight:500}}>Forward warranty emails to</span></div>
            <div style={{fontSize:16,fontWeight:700,color:"#fff",wordBreak:"break-all"}}>{P.email}</div>
          </div>
          {WW.map(w=>{
            const d=dTo(w.exp);const ex=d<0;const sn=d>=0&&d<=90;
            const ty=ex?"critical":sn?"attention":"ok";const cl=CL[ty]||CL.ok;
            return(
              <div key={w.id} style={{...s.card,marginBottom:10,padding:0,overflow:"hidden"}}>
                <div style={{height:3,background:cl.main}}/>
                <div style={{padding:"16px 18px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:8}}>
                    <div><div style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>{w.prod}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{w.prov}</div></div>
                    <Tag type={ty} small/>
                  </div>
                  <div style={{fontSize:13,color:"#64748b",marginBottom:10}}>{w.cov}</div>
                  <div style={{display:"flex",gap:12,fontSize:12}}>
                    <span style={{color:"#64748b",display:"flex",alignItems:"center",gap:4}}><Calendar size={12}/>Exp {mn(w.exp)}</span>
                    <span style={{fontWeight:600,color:w.reg?CL.ok.main:CL.warn.main,display:"flex",alignItems:"center",gap:4}}>{w.reg?<CheckCircle2 size={12}/>:<AlertTriangle size={12}/>}{w.reg?"Registered":"Not registered"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>}

        {tab===5&&<WorkLogPanel log={log} setLog={setLog} comps={comps}/>}
      </div>
      <BottomNav tab={tab} setTab={t=>{setSel(null);setTab(t);}}/>
    </div>
  );
}