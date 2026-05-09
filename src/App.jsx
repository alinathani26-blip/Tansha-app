import { useState, useRef, useEffect, useMemo } from "react";

// ── Soft, subtle colour system — easy on the eyes ──
const C={
  bg:"#F7F8FA",          // soft off-white background
  card:"#FFFFFF",        // clean white cards
  cb:"#E5E7EB",          // light grey borders
  acc:"#6366F1",         // muted indigo accent
  green:"#16A34A",       // calm green
  red:"#DC2626",         // soft red
  blue:"#2563EB",        // professional blue
  purple:"#7C3AED",      // gentle purple
  teal:"#0891B2",        // calm teal
  orange:"#EA580C",      // warm orange
  text:"#111827",        // near-black text
  muted:"#6B7280",       // medium grey
  dim:"#9CA3AF",         // light grey
  cardBg:"#F9FAFB",      // very subtle card tint
};
const RC={
  Owner:{bg:"#EEF2FF",text:"#4338CA",border:"#C7D2FE"},
  Manager:{bg:"#EFF6FF",text:"#1D4ED8",border:"#BFDBFE"},
  Sales:{bg:"#F0FDF4",text:"#15803D",border:"#BBF7D0"},
  Warehouse:{bg:"#F5F3FF",text:"#6D28D9",border:"#DDD6FE"},
};
const TODAY=new Date().toISOString().split("T")[0];
const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CM=new Date().getMonth();
const TEAM=["Ali Bhai (Owner)","Saud Bhai","Zaid Bhai","Saeed Bhai","Sufiyan Bhai","Asif Bhai","Noor Bhai","Tayyab Bhai","Prakash Bhai","Kaif Bhai","Jitu Bhai","Akash Bhai","Nafees Bhai","Faisal Bhai 2","Javed Bhai","Sabajit Bhai","Ashfaq Bhai"];
const fmt=n=>"₹"+Number(n).toLocaleString("en-IN",{maximumFractionDigits:0});
const INP={background:"#F9FAFB",border:`1px solid ${C.cb}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,width:"100%",outline:"none",boxSizing:"border-box"};
const LBL={color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:5,display:"block"};

// ── UI primitives ──
function Av({name,size=30,online}){
  const p=["#DC2626","#2563EB","#16A34A","#D97706","#7C3AED","#0891B2","#EA580C","#DB2777"];
  const c=p[name.charCodeAt(0)%p.length];
  const i=name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  return (<div style={{position:"relative",flexShrink:0,width:size,height:size,borderRadius:"50%",background:c+"15",border:`1.5px solid ${c}30`,display:"flex",alignItems:"center",justifyContent:"center",color:c,fontWeight:800,fontSize:size*.34}}>{i}{online!==undefined&&<div style={{position:"absolute",bottom:1,right:1,width:size*.25,height:size*.25,borderRadius:"50%",background:online?C.green:C.dim,border:`2px solid ${C.card}`}}/>}</div>);
}
function Bdg({label,color,bg,border}){return (<span style={{background:bg||"#F3F4F6",color:color||C.muted,border:`1px solid ${border||C.cb}`,borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>);}
function Pill({label,value,color}){return (<div style={{background:color+"22",border:`1px solid ${color}44`,borderRadius:8,padding:"4px 12px",display:"flex",alignItems:"center",gap:6}}><span style={{color,fontWeight:800,fontSize:14}}>{value}</span><span style={{color:C.muted,fontSize:11}}>{label}</span></div>);}
function Card({children,a,style={}}){return (<div style={{background:C.card,border:`1px solid ${a?a+"44":C.cb}`,borderRadius:12,padding:14,...style}}>{children}</div>);}
function SL({text,color=C.dim}){return (<div style={{color,fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:1.2,marginBottom:8,display:"flex",alignItems:"center",gap:5}}><span style={{width:5,height:5,borderRadius:"50%",background:color,display:"inline-block"}}/>{text}</div>;}
function Mod({onClose,title,sub,children}){
  return (<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",padding:20,border:`1px solid ${C.cb}`,animation:"sU .25s ease"}}>
      <style>{`@keyframes sU{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <div><div style={{color:C.text,fontWeight:800,fontSize:17}}>{title}</div>{sub&&<div style={{color:C.muted,fontSize:12,marginTop:2}}>{sub}</div>}</div>
        <button onClick={onClose} style={{background:C.cb,border:"none",color:C.muted,borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:16}}>✕</button>
      </div>
      {children}
    </div>
  </div>);
}

// ── Notifications ──
const NOTIFS=[
  {id:1,icon:"✅",title:"Task Due Today",body:"Follow up Hotel Leela — Kaif Bhai",time:"9:00 AM",read:false,color:C.blue},
  {id:2,icon:"⚠️",title:"Task Overdue",body:"Collect payment Grand Hyatt — 2 days overdue",time:"Yesterday",read:false,color:C.red},
  {id:3,icon:"💰",title:"Follow Up Due",body:"Ornate Glassware — ₹8,59,529 outstanding",time:"8:30 AM",read:false,color:C.orange},
  {id:4,icon:"✅",title:"Task Assigned to You",body:"Stock count Ukiyo Bhiwandi — by Saud Bhai",time:"Yesterday",read:false,color:C.blue},
  {id:5,icon:"📦",title:"Low Stock Alert",body:"Whisky Glass 300ml — only 25 CTN remaining",time:"Yesterday",read:true,color:C.purple},
  {id:6,icon:"💬",title:"New Message",body:"Saud Bhai: Grand Hyatt is rescheduling...",time:"10 mins ago",read:false,color:C.teal},
];
function NotifPanel({notifs,setNotifs,onClose}){
  const unread=notifs.filter(n=>!n.read).length;
  return (<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:600}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{position:"absolute",right:0,top:0,bottom:0,width:"min(320px,100%)",background:C.card,borderLeft:`1px solid ${C.cb}`,overflowY:"auto",animation:"sR .25s ease"}}>
      <style>{`@keyframes sR{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
      <div style={{padding:"16px",borderBottom:`1px solid ${C.cb}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.card}}>
        <div><div style={{color:C.text,fontWeight:800,fontSize:16}}>🔔 Notifications</div>{unread>0&&<div style={{color:C.muted,fontSize:12,marginTop:2}}>{unread} unread</div>}</div>
        <div style={{display:"flex",gap:8}}>
          {unread>0&&<button onClick={()=>setNotifs(p=>p.map(n=>({...n,read:true})))} style={{background:C.blue+"22",border:`1px solid ${C.blue}44`,color:C.blue,borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Mark all read</button>}
          <button onClick={onClose} style={{background:C.cb,border:"none",color:C.muted,borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:14}}>✕</button>
        </div>
      </div>
      <div style={{padding:12}}>{notifs.map(n=><div key={n.id} onClick={()=>setNotifs(p=>p.map(x=>x.id===n.id?{...x,read:true}:x))} style={{background:n.read?"transparent":n.color+"11",border:`1px solid ${n.read?C.cb:n.color+"33"}`,borderLeft:`3px solid ${n.read?C.dim:n.color}`,borderRadius:9,padding:"10px",marginBottom:7,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=n.color+"18"} onMouseLeave={e=>e.currentTarget.style.background=n.read?"transparent":n.color+"11"}>
        <div style={{display:"flex",gap:9}}>
          <div style={{width:34,height:34,borderRadius:9,background:n.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{n.icon}</div>
          <div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:n.read?C.muted:C.text,fontWeight:n.read?400:700,fontSize:12}}>{n.title}</span>{!n.read&&<span style={{width:7,height:7,borderRadius:"50%",background:n.color,display:"inline-block",flexShrink:0,marginTop:4}}/>}</div><div style={{color:C.muted,fontSize:11,marginTop:2}}>{n.body}</div><div style={{color:C.dim,fontSize:10,marginTop:3}}>{n.time}</div></div>
        </div>
      </div>)}</div>
    </div>
  </div>);
}

// ── Dashboard ──
function Dashboard({role,currentUser,onNav,notifs}){
  const unreadT=notifs.filter(n=>n.type==="task"&&!n.read).length;
  const stats=[{l:"Outstanding",v:"₹1.2 Cr",c:C.red,i:"💰",m:"payment"},{l:"Dispatches Today",v:"7",c:C.green,i:"🚚",m:"dispatch"},{l:"Pending Tasks",v:"12",c:C.blue,i:"✅",m:"tasks"},{l:"Low Stock",v:"3",c:C.purple,i:"📦",m:"stocks"},{l:"Apr Sales",v:"₹48L",c:C.teal,i:"📈",m:"sales"},{l:"Support Tickets",v:"3",c:C.orange,i:"🎫",m:"ops"}];
  const activity=[{i:"💰",t:"Naresh Steel Centre paid ₹86,499",time:"10m",c:C.green},{i:"✅",t:"Hotel Leela follow-up due — Kaif Bhai",time:"30m",c:C.blue},{i:"🚚",t:"Metro Hospitality — 10 CTN dispatched",time:"1h",c:C.teal},{i:"⚠️",t:"Whisky Glass 300ml — Low stock",time:"2h",c:C.orange},{i:"💬",t:"Saud Bhai mentioned you in Payments",time:"3h",c:C.purple},{i:"🎫",t:"New ticket — Radisson Blu damaged boxes",time:"4h",c:C.red}];
  const ACCESS={Owner:["payment","dispatch","tasks","stocks","sales","ops"],Manager:["payment","dispatch","tasks","stocks","sales","ops"],Sales:["tasks","sales","ops"],Warehouse:["dispatch","tasks","stocks","ops"]};
  return (<div>
    <div style={{background:`linear-gradient(135deg,#EEF2FF,#F0F9FF)`,border:`1px solid ${C.acc}33`,borderRadius:14,padding:"16px 18px",marginBottom:18}}>
      <div style={{color:C.text,fontWeight:800,fontSize:20,marginBottom:3}}>Good morning, {currentUser.split(" ")[0]}! 👋</div>
      <div style={{color:C.muted,fontSize:12}}>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
      <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
        <span style={{background:C.acc+"33",borderRadius:7,padding:"4px 10px",color:C.acc,fontSize:11,fontWeight:700}}>TANSHA HOSPITALITY</span>
        <span style={{background:C.green+"22",borderRadius:7,padding:"4px 10px",color:C.green,fontSize:11,fontWeight:700}}>17 Members</span>
        <span style={{background:RC[role].bg,borderRadius:7,padding:"4px 10px",color:RC[role].text,fontSize:11,fontWeight:700}}>{role}</span>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:18}}>
      {stats.filter(s=>ACCESS[role]?.includes(s.m)).map(s=><div key={s.l} onClick={()=>onNav(s.m)} style={{background:C.card,border:`1px solid ${s.c}33`,borderRadius:12,padding:"14px",cursor:"pointer",position:"relative",overflow:"hidden"}} onMouseEnter={e=>e.currentTarget.style.background=s.c+"11"} onMouseLeave={e=>e.currentTarget.style.background=C.card}>
        <div style={{position:"absolute",top:-8,right:-8,fontSize:44,opacity:.07}}>{s.i}</div>
        <div style={{fontSize:22,marginBottom:5}}>{s.i}</div>
        <div style={{color:s.c,fontWeight:800,fontSize:20}}>{s.v}</div>
        <div style={{color:C.muted,fontSize:11,fontWeight:600,marginTop:2}}>{s.l}</div>
      </div>)}
    </div>
    <Card><SL text="Recent Activity"/>
      {activity.map((a,i)=><div key={i} style={{display:"flex",gap:9,marginBottom:10}}><div style={{width:32,height:32,borderRadius:8,background:a.c+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{a.i}</div><div><div style={{color:C.text,fontSize:12}}>{a.t}</div><div style={{color:C.dim,fontSize:10,marginTop:1}}>{a.time} ago</div></div></div>)}
    </Card>
  </div>);
}

// ── Tasks ──
const TASKS0=[
  {id:1,title:"Follow up Hotel Leela — Quotation",to:"Kaif Bhai",by:"Ali Bhai (Owner)",due:"26 Apr",pri:"High",status:"Pending",type:"Follow Up",notes:"Check pricing"},
  {id:2,title:"Dispatch Ocean order to Kaizen",to:"Tayyab Bhai",by:"Ali Bhai (Owner)",due:"25 Apr",pri:"High",status:"In Progress",type:"Dispatch",notes:""},
  {id:3,title:"Stock count Ukiyo Bhiwandi",to:"Sufiyan Bhai",by:"Saud Bhai",due:"27 Apr",pri:"Medium",status:"Pending",type:"Stock Check",notes:""},
  {id:4,title:"Collect payment Grand Hyatt",to:"Kaif Bhai",by:"Ali Bhai (Owner)",due:"28 Apr",pri:"High",status:"Pending",type:"Collection",notes:"₹2,15,600 outstanding"},
  {id:5,title:"Purchase order Ocean restock",to:"Nafees Bhai",by:"Saud Bhai",due:"30 Apr",pri:"Medium",status:"Done",type:"Purchase",notes:""},
];
function Tasks({role,currentUser,setNotifs}){
  const [tasks,setTasks]=useState(TASKS0);
  const [filter,setFilter]=useState("All");
  const [sel,setSel]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [form,setForm]=useState({title:"",to:"",due:"",pri:"Medium",notes:""});
  const can=["Owner","Manager"].includes(role);
  const PC={High:C.red,Medium:C.acc,Low:C.green};
  const SC={Pending:C.acc,"In Progress":C.blue,Done:C.green};
  const cnt={Pending:tasks.filter(t=>t.status==="Pending").length,"In Progress":tasks.filter(t=>t.status==="In Progress").length,Done:tasks.filter(t=>t.status==="Done").length};
  const disp=filter==="All"?tasks:tasks.filter(t=>t.status===filter);
  function add(){if(!form.title||!form.to||!form.due)return;const t={...form,id:Date.now(),status:"Pending",by:currentUser,due:new Date(form.due).toLocaleDateString("en-IN",{day:"numeric",month:"short"})};setTasks(p=>[t,...p]);setNotifs(p=>[{id:Date.now(),icon:"✅",title:"Task Assigned",body:`${form.title} → ${form.to}`,time:"Just now",read:false,color:C.blue},...p]);setShowNew(false);setForm({title:"",to:"",due:"",pri:"Medium",notes:""});}
  function advance(id){setTasks(p=>p.map(t=>{if(t.id!==id)return t;const n=t.status==="Pending"?"In Progress":"Done";if(n==="Done")setNotifs(prev=>[{id:Date.now(),icon:"✅",title:"Task Done ✅",body:`${t.title}`,time:"Just now",read:false,color:C.green},...prev]);return{...t,status:n};}));if(sel?.id===id)setSel(p=>({...p,status:p.status==="Pending"?"In Progress":"Done"}));}
  return (<div>
    {showNew&&<Mod onClose={()=>setShowNew(false)} title="+ New Task" sub={`Assigning as ${currentUser}`}>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <div><label style={LBL}>Title *</label><input style={INP} placeholder="Task description" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
        <div><label style={LBL}>Assign To *</label><select style={{...INP,appearance:"none"}} value={form.to} onChange={e=>setForm({...form,to:e.target.value})}><option value="">Select...</option>{TEAM.map(m=><option key={m}>{m}</option>)}</select></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={LBL}>Deadline</label><input type="date" style={INP} value={form.due} onChange={e=>setForm({...form,due:e.target.value})}/></div><div><label style={LBL}>Priority</label><select style={{...INP,appearance:"none"}} value={form.pri} onChange={e=>setForm({...form,pri:e.target.value})}>{["High","Medium","Low"].map(p=><option key={p}>{p}</option>)}</select></div></div>
        <div><label style={LBL}>Notes</label><textarea style={{...INP,minHeight:50,resize:"vertical"}} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
        <button onClick={add} style={{background:C.blue,border:"none",color:"#fff",borderRadius:10,padding:13,fontWeight:800,cursor:"pointer"}}>Assign Task ✓</button>
      </div>
    </Mod>}
    {sel&&<Mod onClose={()=>setSel(null)} title={sel.title} sub={`${sel.type} · Due ${sel.due}`}>
      <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}><Bdg label={sel.pri} color={PC[sel.pri]} bg={PC[sel.pri]+"22"} border={PC[sel.pri]+"44"}/><Bdg label={sel.status} color={SC[sel.status]} bg={SC[sel.status]+"22"} border={SC[sel.status]+"44"}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:12}}>{[["By",sel.by],["To",sel.to],["Due",sel.due],["Type",sel.type]].map(([l,v])=><div key={l} style={{background:C.bg,borderRadius:8,padding:"8px 10px"}}><div style={{color:C.dim,fontSize:10,fontWeight:700,textTransform:"uppercase"}}>{l}</div><div style={{color:C.text,fontSize:13,fontWeight:600,marginTop:2}}>{v}</div></div>)}</div>
      {sel.notes&&<div style={{background:C.bg,borderRadius:8,padding:"10px",marginBottom:12}}><div style={{color:C.dim,fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Notes</div><div style={{color:C.text,fontSize:13}}>{sel.notes}</div></div>}
      <div style={{display:"flex",gap:5,marginBottom:14}}>{["Pending","In Progress","Done"].map((s,i)=>{const idx=["Pending","In Progress","Done"].indexOf(sel.status);const act=i<=idx;return<div key={s} style={{flex:1}}><div style={{height:3,borderRadius:2,background:act?(s==="Done"?C.green:C.blue):C.cb,marginBottom:3}}/><span style={{fontSize:9,color:act?(s==="Done"?C.green:C.blue):C.dim,fontWeight:600}}>{s}</span></div>;})}
      </div>
      {sel.status!=="Done"?<button onClick={()=>advance(sel.id)} style={{background:sel.status==="Pending"?C.blue:C.green,border:"none",color:"#fff",borderRadius:10,padding:13,fontWeight:800,cursor:"pointer",width:"100%"}}>{sel.status==="Pending"?"▶ In Progress":"✅ Mark Done"}</button>:<div style={{textAlign:"center",padding:12,background:C.green+"22",borderRadius:9,color:C.green,fontWeight:700}}>✅ Completed</div>}
    </Mod>}
    <div style={{display:"flex",gap:7,marginBottom:13,flexWrap:"wrap"}}><Pill label="Pending" value={cnt.Pending} color={C.acc}/><Pill label="In Progress" value={cnt["In Progress"]} color={C.blue}/><Pill label="Done" value={cnt.Done} color={C.green}/>{can&&<button onClick={()=>setShowNew(true)} style={{marginLeft:"auto",background:C.blue,border:"none",color:"#fff",borderRadius:7,padding:"6px 13px",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ New</button>}</div>
    <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>{["All","Pending","In Progress","Done"].map(s=><button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?C.blue+"33":"transparent",color:filter===s?C.blue:C.muted,border:`1px solid ${filter===s?C.blue+"55":C.cb}`,borderRadius:7,padding:"4px 11px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{s} ({s==="All"?tasks.length:cnt[s]||0})</button>)}</div>
    <div style={{display:"flex",flexDirection:"column",gap:7}}>{disp.map(t=><div key={t.id} onClick={()=>setSel(t)} style={{background:C.card,border:`1px solid ${C.cb}`,borderLeft:`3px solid ${PC[t.pri]}`,borderRadius:11,padding:"11px 13px",cursor:"pointer",display:"flex",gap:9,alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.background="#fff06"} onMouseLeave={e=>e.currentTarget.style.background=C.card}><span style={{width:7,height:7,borderRadius:"50%",background:PC[t.pri],flexShrink:0}}/><div style={{flex:1,minWidth:0}}><div style={{color:C.text,fontWeight:600,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.title}</div><div style={{color:C.muted,fontSize:11,marginTop:2}}>{t.type} · {t.due} · {t.to.split(" ")[0]}</div></div><Bdg label={t.status} color={SC[t.status]} bg={SC[t.status]+"22"} border={SC[t.status]+"44"}/><span style={{color:C.dim}}>›</span></div>)}</div>
  </div>);
}

// ── Dispatch ──
const LC={"Bhiwandi":C.purple,"Local Tansha":C.blue,"Local Kaizen":C.acc};
const DISP0={Bhiwandi:[{id:1,client:"Metro Hospitality",qty:10,unit:"Ctn",transport:"Rajesh",lr:true,status:"Dispatched",date:TODAY},{id:2,client:"Radisson Blu",qty:null,unit:"Ctn",transport:"Gujarat",lr:false,status:"Pending",date:TODAY},{id:3,client:"Novotel Mumbai",qty:null,unit:"Ctn",transport:"VRL",lr:false,status:"Pending",date:TODAY}],"Local Tansha":[{id:4,client:"Taj Hotels",qty:2,unit:"Ctn",transport:"Hand Delivery",lr:true,status:"Dispatched",date:TODAY},{id:5,client:"ITC Grand Central",qty:null,unit:"Ctn",transport:"Porter",lr:false,status:"Pending",date:TODAY}],"Local Kaizen":[{id:6,client:"Hyatt Regency",qty:null,unit:"Ctn",transport:"Munshi",lr:false,status:"Pending",date:TODAY}]};
function DCard({d,lc,onToggle,onLR,onEdit}){
  const isO=["Porter","Hand Delivery"].includes(d.transport);const qP=d.qty===null;
  return (<div style={{background:d.status==="Dispatched"?C.green+"0D":C.card,border:`1px solid ${d.status==="Dispatched"?C.green+"44":C.cb}`,borderRadius:11,padding:"11px 13px"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:7}}>
      <div style={{flex:1}}><div style={{color:d.status==="Dispatched"?C.muted:C.text,fontWeight:700,fontSize:13,textDecoration:d.status==="Dispatched"?"line-through":"none",marginBottom:5}}>{d.client}</div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
          <button onClick={()=>onEdit(d)} style={{background:qP?C.acc+"22":lc+"22",border:`1px solid ${qP?C.acc+"44":lc+"33"}`,borderRadius:5,padding:"2px 7px",cursor:"pointer",color:qP?C.acc:lc,fontSize:10,fontWeight:700}}>{qP?"+ Qty":`${d.qty} ${d.unit}`}</button>
          <span style={{color:isO?C.blue:C.muted,fontSize:11}}>{isO?"🚶":"🚛"} {d.transport}</span>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}}>
        <button onClick={()=>onToggle(d.id)} style={{background:d.status==="Dispatched"?C.green:C.acc,border:"none",color:"#fff",borderRadius:18,padding:"4px 11px",fontWeight:800,fontSize:10,cursor:"pointer"}}>{d.status==="Dispatched"?"✅ Done":"⏳ Pending"}</button>
        <button onClick={()=>onLR(d.id)} style={{background:d.lr?C.green+"22":C.cb,border:`1px solid ${d.lr?C.green+"55":C.dim}`,borderRadius:5,padding:"2px 7px",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}><div style={{width:10,height:10,borderRadius:2,background:d.lr?C.green:"transparent",border:`2px solid ${d.lr?C.green:C.dim}`,display:"flex",alignItems:"center",justifyContent:"center"}}>{d.lr&&<span style={{color:"#fff",fontSize:7,fontWeight:900}}>✓</span>}</div><span style={{color:d.lr?C.green:C.muted,fontSize:10,fontWeight:600}}>LR</span></button>
      </div>
    </div>
  </div>);
}
function Dispatch({role}){
  const [loc,setLoc]=useState("Bhiwandi");
  const [disps,setDisps]=useState(DISP0);
  const [editE,setEditE]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [form,setForm]=useState({client:"",transport:"Rajesh",date:TODAY});
  const lc=LC[loc];
  const all=disps[loc]||[];
  const pend=all.filter(d=>d.status==="Pending");
  const disp=all.filter(d=>d.status==="Dispatched");
  const TR=["Rajesh","Munshi","Tukaram","Gujarat","VRL","Thane Motor","New Super","Porter","Hand Delivery"];
  function tog(id){setDisps(p=>({...p,[loc]:p[loc].map(d=>d.id===id?{...d,status:d.status==="Pending"?"Dispatched":"Pending"}:d)}));}
  function togLR(id){setDisps(p=>({...p,[loc]:p[loc].map(d=>d.id===id?{...d,lr:!d.lr}:d)}));}
  function add(){if(!form.client.trim())return;setDisps(p=>({...p,[loc]:[...p[loc],{id:Date.now(),...form,qty:null,unit:"Ctn",lr:false,status:"Pending"}]}));setForm({client:"",transport:"Rajesh",date:TODAY});setShowNew(false);}
  function saveQty(id,qty,unit){setDisps(p=>({...p,[loc]:p[loc].map(d=>d.id===id?{...d,qty,unit}:d)}));setEditE(null);}
  return (<div>
    {editE&&<Mod onClose={()=>setEditE(null)} title={editE.client} sub="Add quantity">
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10,marginBottom:12}}>
        <div><label style={LBL}>Qty</label><input type="number" id="qv" style={INP} defaultValue={editE.qty||""}/></div>
        <div><label style={LBL}>Unit</label><select id="qu" style={{...INP,appearance:"none"}} defaultValue={editE.unit}><option>Ctn</option><option>Jota</option><option>Bag</option></select></div>
      </div>
      <button onClick={()=>saveQty(editE.id,parseInt(document.getElementById("qv").value)||0,document.getElementById("qu").value)} style={{background:lc,border:"none",color:"#fff",borderRadius:10,padding:13,fontWeight:800,cursor:"pointer",width:"100%"}}>Save ✓</button>
    </Mod>}
    {showNew&&<Mod onClose={()=>setShowNew(false)} title="+ New Dispatch" sub={loc}>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <div><label style={LBL}>Client *</label><input style={INP} placeholder="e.g. Taj Hotels" value={form.client} onChange={e=>setForm({...form,client:e.target.value})}/></div>
        <div><label style={LBL}>Transport</label><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{TR.map(t=><button key={t} onClick={()=>setForm({...form,transport:t})} style={{background:form.transport===t?C.green+"33":C.cb,color:form.transport===t?C.green:C.muted,border:`1px solid ${form.transport===t?C.green+"55":"transparent"}`,borderRadius:6,padding:"4px 9px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{t}</button>)}</div></div>
        <div><label style={LBL}>Date</label><input type="date" style={INP} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
        <button onClick={add} style={{background:lc,border:"none",color:"#fff",borderRadius:10,padding:13,fontWeight:800,cursor:"pointer"}}>Save — Add Qty Later ›</button>
      </div>
    </Mod>}
    <div style={{display:"flex",gap:5,marginBottom:14,background:C.card,borderRadius:11,padding:4}}>{["Bhiwandi","Local Tansha","Local Kaizen"].map(l=>{const lcc=LC[l];const act=loc===l;return<button key={l} onClick={()=>setLoc(l)} style={{flex:1,background:act?lcc+"33":"transparent",border:`1px solid ${act?lcc+"55":"transparent"}`,borderRadius:9,padding:"9px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><span style={{fontSize:13}}>{l==="Bhiwandi"?"🏭":l==="Local Tansha"?"🏬":"🏢"}</span><span style={{color:act?lcc:C.muted,fontSize:9,fontWeight:700,textAlign:"center"}}>{l}</span></button>;})}
    </div>
    <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}><Pill label="Dispatched" value={disp.length} color={C.green}/><Pill label="Pending" value={pend.length} color={C.acc}/>{all.filter(d=>!d.qty).length>0&&<Pill label="Qty Pending" value={all.filter(d=>!d.qty).length} color={C.red}/>}{["Owner","Manager","Warehouse"].includes(role)&&<button onClick={()=>setShowNew(true)} style={{marginLeft:"auto",background:lc,border:"none",color:"#fff",borderRadius:7,padding:"5px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ New</button>}</div>
    {pend.length>0&&<><SL text={`Pending (${pend.length})`} color={C.acc}/><div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>{pend.map(d=><DCard key={d.id} d={d} lc={lc} onToggle={tog} onLR={togLR} onEdit={setEditE}/>)}</div></>}
    {disp.length>0&&<><SL text={`Dispatched (${disp.length})`} color={C.green}/><div style={{display:"flex",flexDirection:"column",gap:7}}>{disp.map(d=><DCard key={d.id} d={d} lc={lc} onToggle={tog} onLR={togLR} onEdit={setEditE}/>)}</div></>}
  </div>);
}

// ── Stocks ──
const ST0={Ocean:[{id:1,code:"B01709",name:"ALOHA 09 OZ",mrp:682,cmrp:7140,k2d:132,k1f:0,k2f:468,re:50},{id:2,code:"P02808",name:"CONNECTION HI BALL",mrp:949,cmrp:7592,k2d:26,k1f:200,k2f:234,re:50},{id:3,code:"P02807",name:"CONNECTION D ROCK",mrp:949,cmrp:7592,k2d:16,k1f:0,k2f:550,re:50},{id:4,code:"B07711",name:"HANSA 11 OZ",mrp:571,cmrp:6852,k2d:0,k1f:171,k2f:491,re:50},{id:5,code:"WG300",name:"WHISKY GLASS 300ML",mrp:738,cmrp:5904,k2d:4,k1f:0,k2f:21,re:50},{id:6,code:"B21413",name:"ETHAN 13 (360 ML)",mrp:810,cmrp:6480,k2d:0,k1f:0,k2f:239,re:30}],Ukiyo:[{id:1,code:"UK-SS-01",name:"UKIYO SAKE SET",mrp:850,cmrp:10200,k2d:4,k1f:2,k2f:1,re:10},{id:2,code:"UK-TM-400",name:"UKIYO TUMBLER",mrp:380,cmrp:4560,k2d:24,k1f:0,k2f:0,re:20},{id:3,code:"UK-CK-08",name:"CHEF KNIFE 08\"",mrp:275,cmrp:3300,k2d:12,k1f:0,k2f:0,re:10},{id:4,code:"UK-SB-01",name:"STONE BOWL 8001",mrp:1260,cmrp:7560,k2d:6,k1f:0,k2f:0,re:5}]};
function Stocks(){
  const [tab,setTab]=useState("Ocean");
  const [search,setSearch]=useState("");
  const [stocks,setStocks]=useState(ST0);
  const [editIt,setEditIt]=useState(null);
  const items=stocks[tab].map(it=>{const tot=it.k2d+it.k1f+it.k2f;return{...it,tot,val:tot*it.cmrp,isZ:tot===0,isL:tot>0&&tot<=it.re};});
  const shown=search?items.filter(i=>i.name.toLowerCase().includes(search.toLowerCase())||i.code.toLowerCase().includes(search.toLowerCase())):items;
  const ac=tab==="Ocean"?C.blue:C.teal;
  const LKs=["k2d","k1f","k2f"];const LC2=[C.blue,C.purple,C.teal];
  return (<div>
    {editIt&&<Mod onClose={()=>setEditIt(null)} title={editIt.name} sub={editIt.code}>
      <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:12}}>{[["K2 Down","k2d",C.blue],["K1 1st Flr","k1f",C.purple],["K2 2nd Flr","k2f",C.teal]].map(([l,k,lc])=><div key={k} style={{background:"#F9FAFB",border:`1px solid ${lc}44`,borderRadius:9,padding:"9px 12px",display:"flex",alignItems:"center",gap:11}}><span style={{color:lc,fontWeight:700,fontSize:13,flex:1}}>{l}</span><div style={{display:"flex",gap:7,alignItems:"center"}}><button onClick={()=>setEditIt(p=>({...p,[k]:Math.max(0,(p[k]||0)-1)}))} style={{background:C.cb,border:"none",color:C.text,borderRadius:5,width:26,height:26,cursor:"pointer",fontSize:16}}>−</button><input type="number" min="0" value={editIt[k]} onChange={e=>setEditIt(p=>({...p,[k]:parseInt(e.target.value)||0}))} style={{...INP,width:55,padding:"4px 6px",textAlign:"center",borderColor:lc+"44"}}/><button onClick={()=>setEditIt(p=>({...p,[k]:(p[k]||0)+1}))} style={{background:lc,border:"none",color:"#fff",borderRadius:5,width:26,height:26,cursor:"pointer",fontSize:16}}>+</button></div></div>)}</div>
      <div style={{background:C.bg,borderRadius:7,padding:"7px 11px",marginBottom:12,display:"flex",justifyContent:"space-between"}}><span style={{color:C.muted,fontSize:13}}>Total: <b style={{color:C.text}}>{(editIt.k2d||0)+(editIt.k1f||0)+(editIt.k2f||0)} CTN</b></span><span style={{color:C.green,fontWeight:700}}>{fmt(((editIt.k2d||0)+(editIt.k1f||0)+(editIt.k2f||0))*editIt.cmrp)}</span></div>
      <button onClick={()=>{setStocks(p=>({...p,[tab]:p[tab].map(i=>i.id===editIt.id?{...i,...editIt}:i)}));setEditIt(null);}} style={{background:C.green,border:"none",color:"#fff",borderRadius:10,padding:12,fontWeight:800,cursor:"pointer",width:"100%"}}>Save ✓</button>
    </Mod>}
    <div style={{display:"flex",gap:5,marginBottom:12,background:C.card,borderRadius:11,padding:4}}>{["Ocean","Ukiyo"].map(t=><button key={t} onClick={()=>setTab(t)} style={{flex:1,background:tab===t?(t==="Ocean"?C.blue:C.teal)+"33":"transparent",border:`1px solid ${tab===t?(t==="Ocean"?C.blue:C.teal)+"55":"transparent"}`,borderRadius:9,padding:"9px 6px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><span style={{fontSize:16}}>{t==="Ocean"?"🥂":"🍽️"}</span><span style={{color:tab===t?(t==="Ocean"?C.blue:C.teal):C.muted,fontSize:11,fontWeight:700}}>{t}</span></button>)}</div>
    <div style={{display:"flex",gap:7,marginBottom:11,flexWrap:"wrap"}}><Pill label="CTN" value={items.reduce((s,i)=>s+i.tot,0)} color={ac}/><Pill label="Value" value={fmt(items.reduce((s,i)=>s+i.val,0))} color={C.green}/>{items.filter(i=>i.isL).length>0&&<Pill label="Low" value={items.filter(i=>i.isL).length} color={C.acc}/>}{items.filter(i=>i.isZ).length>0&&<Pill label="Zero" value={items.filter(i=>i.isZ).length} color={C.red}/>}</div>
    <input style={{...INP,marginBottom:11,padding:"7px 11px"}} placeholder="🔍 Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
    <div style={{overflowX:"auto",borderRadius:9,border:`1px solid ${C.cb}`}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:360}}>
      <thead><tr style={{background:C.card}}>{["Code","Item","K2D","K1F","K2F","Tot",""].map(h=><th key={h} style={{padding:"6px 7px",color:C.muted,fontWeight:700,textAlign:h==="Item"?"left":"center",borderBottom:`1px solid ${C.cb}`,fontSize:10}}>{h}</th>)}</tr></thead>
      <tbody>{shown.map((it,i)=><tr key={it.id} style={{background:it.isZ?C.red+"11":it.isL?C.acc+"11":i%2===0?C.card:"#F9FAFB",borderBottom:`1px solid ${C.cb}22`}}>
        <td style={{padding:"6px 7px",color:ac,fontFamily:"monospace",fontSize:10,fontWeight:700}}>{it.code}</td>
        <td style={{padding:"6px 7px",color:C.text,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.name}</td>
        {LKs.map((k,ki)=><td key={k} style={{padding:"5px 3px",textAlign:"center",color:it[k]>0?LC2[ki]:C.dim,fontWeight:it[k]>0?700:400}}>{it[k]||"—"}</td>)}
        <td style={{padding:"5px 3px",textAlign:"center",color:it.isZ?C.red:it.isL?C.acc:ac,fontWeight:800,fontSize:12}}>{it.tot}</td>
        <td style={{padding:"3px 5px",textAlign:"center"}}><button onClick={()=>setEditIt({...it})} style={{background:C.cb,border:"none",color:C.muted,borderRadius:4,width:20,height:20,cursor:"pointer",fontSize:10}}>✏</button></td>
      </tr>)}</tbody>
    </table></div>
  </div>);
}

// ── Quotation ──
const OP=[{n:"ALOHA 09 OZ",a:"B01709",p:595,g:18},{n:"CONNECTION HI BALL",a:"P02808",p:949,g:18},{n:"BANGKOK BLISS 745ML",a:"1LS01BD26E",p:2184,g:18},{n:"HANSA 11 OZ",a:"B07711",p:571,g:18},{n:"ETHAN 13 (360ML)",a:"B21413",p:810,g:18},{n:"IMPERIAL 16 OZ",a:"R00216",p:1185,g:18}];
const UP=[{n:"UKIYO SAKE SET",a:"UK-SS-01",p:850,g:18},{n:"STONE BOWL 8001",a:"BU-S-8001",p:1260,g:5},{n:"BAR CADDY PREMIUM",a:"UK-BC-PRM",p:268,g:18},{n:"BELIZE SOUP SPOON",a:"",p:1235,g:18},{n:"CHEF KNIFE 08\"",a:"UK-CK-08G",p:275,g:18}];
function Quotation(){
  const [team,setTeam]=useState("Ocean");const [client,setClient]=useState("");const [items,setItems]=useState([]);const [search,setSearch]=useState("");const [disc,setDisc]=useState(0);
  const [saved,setSaved]=useState([{id:1,q:"TH-Q101",client:"Taj Hotels",team:"Ocean",grand:143175,date:"20 Apr"},{id:2,q:"TH-Q102",client:"Hyatt",team:"Ukiyo",grand:87654,date:"22 Apr"}]);
  const prods=team==="Ocean"?OP:UP;const results=search.length>1?prods.filter(p=>p.n.toLowerCase().includes(search.toLowerCase())):[];
  const sub=items.reduce((s,i)=>s+i.qty*i.p,0);const gst=items.reduce((s,i)=>s+i.qty*i.p*(1-disc/100)*i.g/100,0);const grand=sub*(1-disc/100)+gst;
  return (<div>
    <div style={{display:"flex",gap:5,marginBottom:12,background:C.card,borderRadius:11,padding:4}}>{["Ocean","Ukiyo"].map(t=><button key={t} onClick={()=>{setTeam(t);setItems([]);}} style={{flex:1,background:team===t?(t==="Ocean"?C.blue:C.teal)+"33":"transparent",border:`1px solid ${team===t?(t==="Ocean"?C.blue:C.teal)+"55":"transparent"}`,borderRadius:9,padding:"9px 6px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><span style={{fontSize:16}}>{t==="Ocean"?"🥂":"🍽️"}</span><span style={{color:team===t?(t==="Ocean"?C.blue:C.teal):C.muted,fontSize:11,fontWeight:700}}>{t} Team</span></button>)}</div>
    <Card style={{marginBottom:11}}><label style={LBL}>Client Name</label><input style={INP} placeholder="e.g. Taj Hotels" value={client} onChange={e=>setClient(e.target.value)}/></Card>
    <Card style={{marginBottom:11}}>
      <div style={{color:C.dim,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>Search Products</div>
      <div style={{position:"relative"}}>
        <input style={INP} placeholder={`Search ${team} products...`} value={search} onChange={e=>setSearch(e.target.value)}/>
        {results.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:C.card,border:`1px solid ${C.cb}`,borderRadius:9,zIndex:10,maxHeight:180,overflowY:"auto",marginTop:3,boxShadow:"0 8px 22px #00000088"}}>
          {results.map((p,i)=><div key={i} onClick={()=>{setItems(prev=>[...prev,{id:Date.now(),n:p.n,a:p.a,qty:1,p:p.p,g:p.g}]);setSearch("");}} style={{padding:"9px 12px",cursor:"pointer",borderBottom:`1px solid ${C.cb}20`,display:"flex",justifyContent:"space-between"}} onMouseEnter={e=>e.currentTarget.style.background="#fff08"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div><div style={{color:C.text,fontSize:12,fontWeight:600}}>{p.n}</div>{p.a&&<div style={{color:C.muted,fontSize:10}}>{p.a}</div>}</div>
            <div style={{textAlign:"right"}}><div style={{color:C.green,fontWeight:700,fontSize:12}}>{fmt(p.p)}</div><div style={{color:C.dim,fontSize:9}}>GST {p.g}%</div></div>
          </div>)}
        </div>}
      </div>
    </Card>
    {items.length>0&&<><div style={{marginBottom:11}}>{items.map((it,i)=><div key={it.id} style={{background:C.card,border:`1px solid ${C.cb}`,borderRadius:9,padding:"9px 11px",marginBottom:5}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><div style={{color:C.text,fontWeight:600,fontSize:12}}>{it.n}</div><button onClick={()=>setItems(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:16}}>×</button></div><div style={{display:"flex",gap:7,alignItems:"center"}}><input type="number" min="1" value={it.qty} onChange={e=>setItems(p=>p.map((x,j)=>j===i?{...x,qty:Math.max(1,parseInt(e.target.value)||1)}:x))} style={{...INP,width:55,padding:"4px 7px",textAlign:"center"}}/><span style={{color:C.muted,fontSize:11}}>× {fmt(it.p)}</span><span style={{color:C.green,fontWeight:700,marginLeft:"auto"}}>{fmt(it.qty*it.p)}</span></div></div>)}</div>
    <Card style={{marginBottom:11}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}><span style={{color:C.muted}}>Subtotal</span><span style={{color:C.text,fontWeight:600}}>{fmt(sub)}</span></div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}><span style={{color:C.muted,fontSize:13}}>Discount %</span><input type="number" min="0" max="100" value={disc} onChange={e=>setDisc(Math.min(100,parseFloat(e.target.value)||0))} style={{...INP,width:65,padding:"4px 7px",textAlign:"center"}}/></div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}><span style={{color:C.muted}}>GST</span><span style={{color:C.text,fontWeight:600}}>{fmt(gst)}</span></div>
      <div style={{display:"flex",justifyContent:"space-between",borderTop:`1px solid ${C.cb}`,paddingTop:9}}><span style={{color:C.text,fontWeight:800,fontSize:15}}>Grand Total</span><span style={{color:C.green,fontWeight:800,fontSize:19}}>{fmt(grand)}</span></div>
    </Card>
    <div style={{display:"flex",gap:7,marginBottom:11}}><button style={{flex:1,background:"#25D36622",border:`1px solid #25D36644`,color:"#25D366",borderRadius:9,padding:11,fontWeight:700,cursor:"pointer"}}>📱 WhatsApp</button><button style={{flex:1,background:C.red+"22",border:`1px solid ${C.red}44`,color:C.red,borderRadius:9,padding:11,fontWeight:700,cursor:"pointer"}}>📄 PDF</button></div>
    <button onClick={()=>{if(client&&items.length){setSaved(p=>[{id:Date.now(),q:"TH-Q"+(200+p.length),client,team,grand,date:new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short"})},...p]);setClient("");setItems([]);setDisc(0);}}} style={{background:C.green,border:"none",color:"#fff",borderRadius:10,padding:13,fontWeight:800,cursor:"pointer",width:"100%",marginBottom:14}}>Save Quotation ✓</button></>}
    {saved.length>0&&<><SL text={`Saved (${saved.length})`}/><div style={{display:"flex",flexDirection:"column",gap:6}}>{saved.map(q=><div key={q.id} style={{background:C.card,border:`1px solid ${C.cb}`,borderRadius:9,padding:"11px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{display:"flex",gap:6,marginBottom:3}}><span style={{color:C.acc,fontFamily:"monospace",fontSize:11}}>{q.q}</span><Bdg label={q.team} color={q.team==="Ocean"?C.blue:C.teal} bg={(q.team==="Ocean"?C.blue:C.teal)+"22"} border={(q.team==="Ocean"?C.blue:C.teal)+"44"}/></div><div style={{color:C.text,fontWeight:600,fontSize:12}}>{q.client}</div><div style={{color:C.muted,fontSize:10}}>{q.date}</div></div><div style={{color:C.green,fontWeight:800,fontSize:14}}>{fmt(q.grand)}</div></div>)}</div></>}
  </div>);
}

// ── Sales ──
const SD0={Ocean:[{id:1,date:"2026-04-01",client:"Adams & Company",city:"Mumbai",invNo:"201",amount:80646},{id:2,date:"2026-04-01",client:"Anand Entp",city:"Mumbai",invNo:"202",amount:61005},{id:3,date:"2026-04-02",client:"Barsolution LLP",city:"Mumbai",invNo:"210",amount:22862},{id:4,date:"2026-04-03",client:"Indigo Metalware",city:"Mumbai",invNo:"215",amount:253121},{id:5,date:"2026-03-01",client:"Adams & Company",city:"Mumbai",invNo:"145",amount:62000},{id:6,date:"2026-02-05",client:"Anand Entp",city:"Mumbai",invNo:"118",amount:32000}],Ukiyo:[{id:1,date:"2026-04-01",client:"Sameer Hotel Supplies",city:"Goa",invNo:"155",amount:890000},{id:2,date:"2026-04-01",client:"Jaydeep Entp",city:"Pune",invNo:"160",amount:412000},{id:3,date:"2026-03-01",client:"Sameer Hotel Supplies",city:"Goa",invNo:"110",amount:539157},{id:4,date:"2026-02-01",client:"Balaji Traders Goa",city:"Goa",invNo:"60",amount:139537}]};
function Sales(){
  const [team,setTeam]=useState("Ocean");const [sales,setSales]=useState(SD0);const [view,setView]=useState("daily");const [showNew,setShowNew]=useState(false);const [editE,setEditE]=useState(null);
  const [form,setForm]=useState({date:TODAY,client:"",city:"",invNo:"",amount:""});
  const cur=sales[team];const total=cur.reduce((s,e)=>s+e.amount,0);const ac=team==="Ocean"?C.blue:C.teal;
  const grouped=cur.reduce((g,s)=>{if(!g[s.date])g[s.date]=[];g[s.date].push(s);return g;},{});
  const clientMap=useMemo(()=>{const map={};cur.forEach(s=>{const mi=new Date(s.date+"T00:00:00").getMonth();const k=s.client.toLowerCase();if(!map[k])map[k]={client:s.client,city:s.city,months:{}};if(!map[k].months[mi])map[k].months[mi]=0;map[k].months[mi]+=s.amount;});return Object.values(map);},[cur]);
  function addSale(){if(!form.client||!form.amount)return;setSales(p=>({...p,[team]:[{...form,id:Date.now(),amount:parseFloat(form.amount)},...p[team]]}));setForm({date:TODAY,client:"",city:"",invNo:"",amount:""});setShowNew(false);}
  return (<div>
    {showNew&&<Mod onClose={()=>setShowNew(false)} title="+ New Sale"><div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={LBL}>Date</label><input type="date" style={INP} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div><div><label style={LBL}>Invoice No</label><input style={INP} value={form.invNo} onChange={e=>setForm({...form,invNo:e.target.value})}/></div></div>
      <div><label style={LBL}>Client *</label><input style={INP} value={form.client} onChange={e=>setForm({...form,client:e.target.value})}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={LBL}>City</label><input style={INP} value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></div><div><label style={LBL}>Amount ₹</label><input type="number" style={INP} value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div></div>
      <button onClick={addSale} style={{background:ac,border:"none",color:"#fff",borderRadius:10,padding:13,fontWeight:800,cursor:"pointer"}}>Save ✓</button>
    </div></Mod>}
    {editE&&<Mod onClose={()=>setEditE(null)} title="✏️ Edit Entry" sub={editE.client}>
      <div style={{background:C.bg,borderRadius:7,padding:"7px 11px",marginBottom:11,display:"flex",gap:9,flexWrap:"wrap"}}><span style={{color:C.dim,fontSize:11}}>Original:</span><span style={{color:C.red,fontSize:11,fontWeight:700}}>{fmt(editE.amount)}</span></div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={LBL}>Date</label><input type="date" style={INP} value={editE.date} onChange={e=>setEditE(p=>({...p,date:e.target.value}))}/></div><div><label style={LBL}>Inv No</label><input style={INP} value={editE.invNo} onChange={e=>setEditE(p=>({...p,invNo:e.target.value}))}/></div></div>
        <div><label style={LBL}>Client</label><input style={INP} value={editE.client} onChange={e=>setEditE(p=>({...p,client:e.target.value}))}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={LBL}>City</label><input style={INP} value={editE.city} onChange={e=>setEditE(p=>({...p,city:e.target.value}))}/></div><div><label style={LBL}>Amount ₹</label><input type="number" style={INP} value={editE.amount} onChange={e=>setEditE(p=>({...p,amount:parseFloat(e.target.value)||0}))}/></div></div>
        <div style={{background:C.blue+"11",border:`1px solid ${C.blue}33`,borderRadius:7,padding:"7px 11px",fontSize:11,color:C.blue}}>ℹ️ Monthly report auto-updates when saved</div>
        <div style={{display:"flex",gap:7}}><button onClick={()=>{setSales(p=>({...p,[team]:p[team].filter(s=>s.id!==editE.id)}));setEditE(null);}} style={{flex:1,background:C.red+"22",border:`1px solid ${C.red}44`,color:C.red,borderRadius:7,padding:"9px",fontWeight:700,cursor:"pointer"}}>🗑</button><button onClick={()=>{setSales(p=>({...p,[team]:p[team].map(s=>s.id===editE.id?{...s,...editE}:s)}));setEditE(null);}} style={{flex:2,background:ac,border:"none",color:"#fff",borderRadius:7,padding:"9px",fontWeight:800,cursor:"pointer"}}>Save ✓</button></div>
      </div>
    </Mod>}
    <div style={{display:"flex",gap:5,marginBottom:12,background:C.card,borderRadius:11,padding:4}}>{["Ocean","Ukiyo"].map(t=><button key={t} onClick={()=>setTeam(t)} style={{flex:1,background:team===t?(t==="Ocean"?C.blue:C.teal)+"33":"transparent",border:`1px solid ${team===t?(t==="Ocean"?C.blue:C.teal)+"55":"transparent"}`,borderRadius:9,padding:"9px 6px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><span style={{fontSize:16}}>{t==="Ocean"?"🥂":"🍽️"}</span><span style={{color:team===t?(t==="Ocean"?C.blue:C.teal):C.muted,fontSize:11,fontWeight:700}}>{t}</span><span style={{color:team===t?(t==="Ocean"?C.blue:C.teal):C.dim,fontSize:10}}>{fmt(sales[t].reduce((s,e)=>s+e.amount,0))}</span></button>)}</div>
    <div style={{display:"flex",gap:5,marginBottom:12,background:C.card,borderRadius:11,padding:4}}>{[{id:"daily",i:"📅",l:"Daily Sales"},{id:"monthly",i:"📊",l:"Monthly Report"}].map(v=><button key={v.id} onClick={()=>setView(v.id)} style={{flex:1,background:view===v.id?ac+"33":"transparent",border:`1px solid ${view===v.id?ac+"55":"transparent"}`,borderRadius:9,padding:"8px 6px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><span style={{fontSize:14}}>{v.i}</span><span style={{color:view===v.id?ac:C.muted,fontSize:10,fontWeight:700}}>{v.l}</span></button>)}</div>
    {view==="daily"&&<><div style={{display:"flex",gap:7,marginBottom:11}}><Pill label="Total" value={fmt(total)} color={ac}/><button onClick={()=>setShowNew(true)} style={{marginLeft:"auto",background:ac,border:"none",color:"#fff",borderRadius:7,padding:"5px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ Add</button></div>
    {Object.entries(grouped).sort(([a],[b])=>b.localeCompare(a)).map(([date,entries])=><div key={date} style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",padding:"4px 9px",background:ac+"22",borderRadius:7,marginBottom:5,border:`1px solid ${ac}33`}}><span style={{color:ac,fontWeight:700,fontSize:11}}>{new Date(date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span><span style={{color:ac,fontWeight:800,fontSize:12}}>{fmt(entries.reduce((s,e)=>s+e.amount,0))}</span></div>
      <Card><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
        <thead><tr style={{background:C.cb+"55"}}>{["INV","CLIENT","CITY","AMOUNT",""].map(h=><th key={h} style={{padding:"4px 7px",textAlign:h==="AMOUNT"?"right":"left",color:C.muted,fontWeight:600,fontSize:9}}>{h}</th>)}</tr></thead>
        <tbody>{entries.map((e,i)=><tr key={e.id} style={{borderTop:i>0?`1px solid ${C.cb}22`:"none"}}><td style={{padding:"5px 7px",color:C.dim,fontFamily:"monospace",fontSize:10}}>{e.invNo}</td><td style={{padding:"5px 7px",color:C.text,fontWeight:500,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.client}</td><td style={{padding:"5px 5px",color:C.muted,fontSize:10}}>{e.city||"—"}</td><td style={{padding:"5px 7px",textAlign:"right",color:C.green,fontWeight:700}}>{fmt(e.amount)}</td><td style={{padding:"3px 4px",textAlign:"center"}}><button onClick={()=>setEditE({...e})} style={{background:C.cb,border:"none",color:C.muted,borderRadius:3,width:18,height:18,cursor:"pointer",fontSize:9}}>✏</button></td></tr>)}</tbody>
      </table></Card>
    </div>)}</>}
    {view==="monthly"&&<><div style={{display:"flex",gap:7,marginBottom:11,flexWrap:"wrap"}}><Pill label="Clients" value={clientMap.length} color={ac}/><Pill label="YTD" value={fmt(total)} color={C.green}/><div style={{display:"flex",gap:7,fontSize:10,color:C.dim,alignSelf:"center"}}><span>🟢 Bought</span><span>🟠 Skipped</span></div></div>
    <div style={{overflowX:"auto",borderRadius:9,border:`1px solid ${C.cb}`}}><table style={{borderCollapse:"collapse",fontSize:11,minWidth:400}}>
      <thead><tr><th style={{padding:"5px 9px",textAlign:"left",color:C.muted,fontWeight:700,fontSize:10,borderBottom:`1px solid ${C.cb}`,background:C.card,position:"sticky",left:0,zIndex:2,minWidth:110}}>CLIENT</th><th style={{padding:"5px 5px",textAlign:"left",color:C.muted,fontWeight:700,fontSize:10,borderBottom:`1px solid ${C.cb}`,background:C.card,position:"sticky",left:110,zIndex:2,minWidth:55}}>CITY</th>{MONTHS.slice(0,CM+1).map((m,i)=><th key={m} style={{padding:"4px 7px",textAlign:"center",color:i===CM?ac:C.muted,fontWeight:700,fontSize:10,borderBottom:`1px solid ${C.cb}`,background:i===CM?ac+"22":C.card,minWidth:60}}>{m}</th>)}<th style={{padding:"4px 7px",textAlign:"right",color:C.green,fontWeight:700,fontSize:10,borderBottom:`1px solid ${C.cb}`,background:C.card,minWidth:65}}>TOTAL</th></tr></thead>
      <tbody>{clientMap.map((c,ri)=>{const rt=Object.values(c.months).reduce((s,v)=>s+v,0);const rb=ri%2===0?C.card:"#F9FAFB";return<tr key={c.client} style={{borderBottom:`1px solid ${C.cb}22`}}><td style={{padding:"5px 9px",color:C.text,fontWeight:600,fontSize:10,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:110,position:"sticky",left:0,background:rb,zIndex:1}}>{c.client}</td><td style={{padding:"5px 5px",color:C.muted,fontSize:9,whiteSpace:"nowrap",position:"sticky",left:110,background:rb,zIndex:1}}>{c.city||"—"}</td>{MONTHS.slice(0,CM+1).map((_,mi)=>{const v=c.months[mi]||0;const hp=Object.keys(c.months).some(m=>parseInt(m)<mi);const ia=!v&&hp;return<td key={mi} style={{padding:"3px 2px",textAlign:"center",background:v>0?C.green+"22":ia?"#FB923C18":"transparent",minWidth:60}}>{v>0?<span style={{color:C.green,fontWeight:700,fontSize:10}}>{fmt(v)}</span>:ia?<span style={{color:"#FB923C",opacity:.7,fontSize:11}}>—</span>:null}</td>;})} <td style={{padding:"3px 7px",textAlign:"right",color:ac,fontWeight:700,fontSize:10}}>{fmt(rt)}</td></tr>;})}
      </tbody>
    </table></div></>}
  </div>);
}

// ── Payment ──
const PAY0=[{id:1,client:"Ornate Glassware",month:"Apr",totalBal:1333659,currBal:859529,assignee:"Saud Bhai",followUpDate:"2026-04-28",notes:"Hard client",status:"Pending"},{id:2,client:"Jaydeep Enterprises",month:"Apr",totalBal:891778,currBal:891778,assignee:"Accountant",followUpDate:"2026-04-27",notes:"",status:"Pending"},{id:3,client:"Janta Steel",month:"Jan",totalBal:632761,currBal:64562,assignee:"Saud Bhai",followUpDate:"2026-04-27",notes:"3.2 WA",status:"Pending"},{id:4,client:"M.M.F. Enterprises",month:"Feb",totalBal:445802,currBal:220513,assignee:"Saud Bhai",followUpDate:"2026-04-27",notes:"27.4 C not rec WA",status:"Pending"},{id:5,client:"F S Glassware Crockery",month:"Apr",totalBal:604485,currBal:0,notes:"ALL CLR",status:"Paid"},{id:6,client:"Indigo Metalware LLP",month:"Apr",totalBal:253121,currBal:0,notes:"pdc rec",status:"Paid"}];
const MC={Jan:C.blue,Feb:C.purple,Mar:C.teal,Apr:C.acc,May:C.green};
function Payment(){
  const [entries,setEntries]=useState(PAY0);const [am,setAm]=useState("All");const [sel,setSel]=useState(null);const [pa,setPa]=useState("");const [sp,setSp]=useState(false);const today=TODAY;
  const months=[...new Set(entries.map(e=>e.month))];const fil=am==="All"?entries:entries.filter(e=>e.month===am);
  const pend=fil.filter(e=>e.status==="Pending").sort((a,b)=>b.currBal-a.currBal);const paid=fil.filter(e=>e.status==="Paid");
  const tot=pend.reduce((s,e)=>s+e.currBal,0);const od=entries.filter(e=>e.status==="Pending"&&e.followUpDate&&e.followUpDate<=today).length;
  function recP(){const amt=parseFloat(pa)||0;if(amt<=0||!sel)return;const nb=Math.max(0,sel.currBal-amt);const u={...sel,currBal:nb,status:nb===0?"Paid":"Pending"};setEntries(p=>p.map(e=>e.id===sel.id?u:e));setSel(u);setPa("");}
  return (<div>
    {sel&&<Mod onClose={()=>setSel(null)} title={sel.client} sub={`${sel.month} Outstanding`}>
      <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}><Bdg label={sel.month} color={MC[sel.month]||C.acc} bg={(MC[sel.month]||C.acc)+"22"} border={(MC[sel.month]||C.acc)+"44"}/>{sel.assignee&&<Bdg label={sel.assignee} color={sel.assignee==="Saud Bhai"?C.purple:C.blue} bg={(sel.assignee==="Saud Bhai"?C.purple:C.blue)+"22"} border={(sel.assignee==="Saud Bhai"?C.purple:C.blue)+"44"}/>}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:12}}><div style={{background:"#F9FAFB",border:`1px solid ${C.cb}`,borderRadius:9,padding:"9px 11px"}}><div style={{color:C.dim,fontSize:10,fontWeight:700,textTransform:"uppercase"}}>Total</div><div style={{color:C.text,fontWeight:800,fontSize:15,marginTop:2}}>{fmt(sel.totalBal)}</div></div><div style={{background:sel.currBal===0?C.green+"22":C.red+"22",border:`1px solid ${sel.currBal===0?C.green:C.red}44`,borderRadius:9,padding:"9px 11px"}}><div style={{color:C.dim,fontSize:10,fontWeight:700,textTransform:"uppercase"}}>Current Balance</div><div style={{color:sel.currBal===0?C.green:C.red,fontWeight:800,fontSize:15,marginTop:2}}>{fmt(sel.currBal)}</div></div></div>
      {sel.status==="Pending"&&sel.currBal>0&&<><div style={{background:"#F9FAFB",border:`1px solid ${C.green}33`,borderRadius:11,padding:13,marginBottom:9}}><div style={{color:C.green,fontWeight:700,fontSize:13,marginBottom:7}}>💳 Record Payment</div><div style={{display:"flex",gap:7,marginBottom:7}}><input type="number" style={{...INP,flex:1}} placeholder="Amount..." value={pa} onChange={e=>setPa(e.target.value)}/><button onClick={recP} style={{background:C.green,border:"none",color:"#fff",borderRadius:7,padding:"0 13px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>Save ✓</button></div>{parseFloat(pa)>0&&<div style={{display:"flex",justifyContent:"space-between",background:C.card,borderRadius:5,padding:"5px 9px"}}><span style={{color:C.muted,fontSize:11}}>Balance after:</span><span style={{color:C.green,fontWeight:700}}>{fmt(Math.max(0,sel.currBal-parseFloat(pa)))}</span></div>}</div>
      <button onClick={()=>{const u={...sel,currBal:0,status:"Paid"};setEntries(p=>p.map(e=>e.id===sel.id?u:e));setSel(null);}} style={{background:C.green+"22",border:`1px solid ${C.green}44`,color:C.green,borderRadius:7,padding:"9px",fontWeight:700,cursor:"pointer",width:"100%",marginBottom:9}}>✅ Mark Fully Paid ({fmt(sel.currBal)})</button></>}
      {sel.notes&&<div style={{background:C.bg,borderRadius:7,padding:"8px 11px"}}><div style={{color:C.dim,fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>Notes</div><div style={{color:C.text,fontSize:12}}>{sel.notes}</div></div>}
    </Mod>}
    {od>0&&<div style={{background:C.orange+"22",border:`1px solid ${C.orange}44`,borderRadius:9,padding:"9px 13px",marginBottom:12,display:"flex",gap:9,alignItems:"center"}}><span style={{fontSize:16}}>⏰</span><div style={{color:C.orange,fontWeight:700,fontSize:12}}>{od} Follow-up{od>1?"s":""} Due / Overdue</div></div>}
    <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}><Pill label="Outstanding" value={fmt(tot)} color={C.red}/><Pill label="Saud Bhai" value={pend.filter(e=>e.assignee==="Saud Bhai").length} color={C.purple}/><Pill label="Cleared" value={paid.length} color={C.green}/></div>
    <div style={{overflowX:"auto",marginBottom:12,paddingBottom:3}}><div style={{display:"flex",gap:5,minWidth:"max-content"}}><button onClick={()=>setAm("All")} style={{background:am==="All"?C.teal+"33":"transparent",border:`1px solid ${am==="All"?C.teal+"55":C.cb}`,borderRadius:9,padding:"6px 13px",cursor:"pointer"}}><span style={{color:am==="All"?C.teal:C.muted,fontWeight:700,fontSize:11}}>All</span></button>{months.map(m=>{const mc=MC[m]||C.acc;const mp=entries.filter(e=>e.month===m&&e.status==="Pending");return<button key={m} onClick={()=>setAm(m)} style={{background:am===m?mc+"33":"transparent",border:`1px solid ${am===m?mc+"55":C.cb}`,borderRadius:9,padding:"6px 11px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span style={{color:am===m?mc:C.muted,fontWeight:700,fontSize:11}}>{m}</span><span style={{color:am===m?mc:C.dim,fontSize:9}}>{mp.length} · {fmt(mp.reduce((s,e)=>s+e.currBal,0))}</span></button>;})}
    </div></div>
    {am==="All"&&<div style={{marginBottom:14}}><SL text="Outstanding by Month"/>{months.map(m=>{const mc=MC[m]||C.acc;const mp=entries.filter(e=>e.month===m&&e.status==="Pending");const mt=mp.reduce((s,e)=>s+e.currBal,0);const ma=entries.filter(e=>e.month===m);const mc2=ma.filter(e=>e.status==="Paid").length;return<div key={m} onClick={()=>setAm(m)} style={{background:C.card,border:`1px solid ${mc}33`,borderRadius:11,padding:"11px 14px",marginBottom:7,cursor:"pointer",display:"flex",alignItems:"center",gap:11}} onMouseEnter={e=>e.currentTarget.style.background=mc+"0A"} onMouseLeave={e=>e.currentTarget.style.background=C.card}><div style={{width:36,height:36,borderRadius:9,background:mc+"22",border:`1px solid ${mc}44`,display:"flex",alignItems:"center",justifyContent:"center",color:mc,fontWeight:800,fontSize:13,flexShrink:0}}>{m}</div><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.text,fontWeight:700,fontSize:12}}>{m} Outstanding</span><span style={{color:C.red,fontWeight:800,fontSize:14}}>{fmt(mt)}</span></div><div style={{display:"flex",gap:9,marginTop:2}}><span style={{color:C.muted,fontSize:10}}>{mp.length} pending</span>{mc2>0&&<span style={{color:C.green,fontSize:10}}>✅ {mc2} cleared</span>}</div></div><span style={{color:C.dim,fontSize:16}}>›</span></div>;})}
    <div style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:11,padding:"11px 14px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:C.text,fontWeight:700}}>Grand Total</span><span style={{color:C.red,fontWeight:800,fontSize:16}}>{fmt(entries.filter(e=>e.status==="Pending").reduce((s,e)=>s+e.currBal,0))}</span></div><div style={{display:"flex",gap:11}}><span style={{color:C.muted,fontSize:10}}>{entries.filter(e=>e.status==="Pending").length} pending</span><span style={{color:C.green,fontSize:10}}>✅ {entries.filter(e=>e.status==="Paid").length} cleared</span></div></div></div>}
    {am!=="All"&&<><SL text={`${am} Outstanding (${pend.length}) — Highest First`} color={C.red}/><div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>{pend.map((e,i)=>{const isOD=e.followUpDate&&e.followUpDate<=today;const mc=MC[e.month]||C.acc;return<div key={e.id} onClick={()=>setSel(e)} style={{background:C.card,border:`1px solid ${isOD?C.orange+"55":C.cb}`,borderRadius:11,padding:"11px 13px",cursor:"pointer"}} onMouseEnter={ex=>ex.currentTarget.style.background="#fff06"} onMouseLeave={ex=>ex.currentTarget.style.background=C.card}><div style={{display:"flex",justifyContent:"space-between",gap:9}}><div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}><div style={{width:16,height:16,borderRadius:3,background:C.red+"22",display:"flex",alignItems:"center",justifyContent:"center",color:C.red,fontWeight:800,fontSize:9,flexShrink:0}}>{i+1}</div><div style={{color:C.text,fontWeight:700,fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.client}</div></div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}><Bdg label={e.month} color={mc} bg={mc+"22"} border={mc+"44"}/>{e.assignee&&<Bdg label={e.assignee} color={e.assignee==="Saud Bhai"?C.purple:C.blue} bg={(e.assignee==="Saud Bhai"?C.purple:C.blue)+"22"} border={(e.assignee==="Saud Bhai"?C.purple:C.blue)+"44"}/>}{isOD&&<Bdg label="⏰ Due" color={C.orange} bg={C.orange+"22"} border={C.orange+"44"}/>}{e.totalBal!==e.currBal&&<Bdg label="Part Paid" color={C.teal} bg={C.teal+"22"} border={C.teal+"44"}/>}</div>{e.notes&&<div style={{color:C.dim,fontSize:10,marginTop:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.notes}</div>}</div><div style={{textAlign:"right",flexShrink:0}}><div style={{color:C.red,fontWeight:800,fontSize:14}}>{fmt(e.currBal)}</div>{e.totalBal!==e.currBal&&<div style={{color:C.dim,fontSize:9}}>of {fmt(e.totalBal)}</div>}</div></div></div>;})}
    {!pend.length&&<div style={{textAlign:"center",padding:28,color:C.dim}}>No outstanding for {am} 🎉</div>}</div>
    <button onClick={()=>setSp(!sp)} style={{background:C.green+"22",border:`1px solid ${C.green}44`,color:C.green,borderRadius:9,padding:"9px",fontWeight:700,cursor:"pointer",width:"100%",marginBottom:7}}>✅ Cleared ({paid.length}) {sp?"▲":"▼"}</button>
    {sp&&<div style={{display:"flex",flexDirection:"column",gap:5}}>{paid.map(e=><div key={e.id} style={{background:C.green+"0A",border:`1px solid ${C.green}22`,borderRadius:9,padding:"9px 13px",display:"flex",justifyContent:"space-between"}}><div style={{color:C.muted,fontSize:11,textDecoration:"line-through"}}>{e.client} ({e.month})</div><span style={{color:C.green,fontWeight:700,fontSize:11}}>{fmt(e.totalBal)}</span></div>)}</div>}</>}
  </div>);
}

// ── Operations ──
const SUP0=[{id:1,client:"Radisson Blu",invNo:"TH-1038",reason:"2 boxes damaged — Connection Hi Ball 350ml",status:"Open",assignedTo:"Kaif Bhai",raisedBy:"Kaif Bhai",date:TODAY,notes:"Client sent photos"},{id:2,client:"Taj Hotels",invNo:"TH-1035",reason:"Short delivery — 10 CTN ordered, 8 received",status:"Replacement",assignedTo:"Tayyab Bhai",raisedBy:"Saud Bhai",date:"2026-04-25",notes:"Sending 2 CTN replacement"},{id:3,client:"ITC Grand Central",invNo:"TH-1025",reason:"3 pieces broken in transit",status:"Resolved",assignedTo:"Nafees Bhai",raisedBy:"Nafees Bhai",date:"2026-04-20",notes:"Replacement confirmed"}];
const NOTES0=[{id:1,title:"Bhiwandi Stock Shift Schedule",body:"Every Tuesday and Friday — K2 Down to K1 First Floor.",tag:"Stocks",pinned:true,date:TODAY,by:"Ali Bhai (Owner)"},{id:2,title:"Grand Hyatt Payment Policy",body:"45 day payment cycle. Do not dispatch new order until previous invoice cleared.",tag:"Payment",pinned:true,date:"2026-04-25",by:"Saud Bhai"},{id:3,title:"Khetwadi Rate Change",body:"From May 2026 Ibrahim Bhai rate for Khetwadi is ₹100 flat.",tag:"Dispatch",pinned:false,date:"2026-04-22",by:"Ali Bhai (Owner)"}];
const SC={Open:C.red,"Credit Note":C.orange,Replacement:C.blue,Resolved:C.green};
const TC={General:C.teal,Dispatch:C.green,Sales:C.blue,Payment:C.red,Stocks:C.purple,Attendance:C.orange};
function Operations({role,currentUser}){
  const [sub,setSub]=useState("att");
  const [att,setAtt]=useState(TEAM.map((n,i)=>({name:n,status:i<14?"Present":i===14?"Half Day":"Absent",inTime:i<14?"09:00":"",outTime:i<12?"18:00":""})));
  const [sup,setSup]=useState(SUP0);const [notes,setNotes]=useState(NOTES0);
  const [selTkt,setSelTkt]=useState(null);const [selNote,setSelNote]=useState(null);
  const [showNewT,setShowNewT]=useState(false);const [showNewN,setShowNewN]=useState(false);
  const [tf,setTf]=useState({date:TODAY,client:"",invNo:"",reason:"",status:"Open",assignedTo:currentUser,notes:""});
  const [nf,setNf]=useState({title:"",body:"",tag:"General",pinned:false});
  const [editId,setEditId]=useState(null);const can=["Owner","Manager"].includes(role);
  const SC2={Present:C.green,Absent:C.red,"Half Day":C.acc};
  const pr=att.filter(a=>a.status==="Present").length;const ab=att.filter(a=>a.status==="Absent").length;
  const SUBS=[{id:"att",i:"🗓️",l:"Attendance"},{id:"exp",i:"💸",l:"Expenses"},{id:"sup",i:"🎫",l:"Support",b:sup.filter(t=>t.status==="Open").length},{id:"nts",i:"📝",l:"Notes"},{id:"sht",i:"📊",l:"Sheets"}];
  return (<div>
    {showNewT&&<Mod onClose={()=>setShowNewT(false)} title="🎫 New Support Ticket" sub="Log a claim, damage or shortage">
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={LBL}>Date</label><input type="date" style={INP} value={tf.date} onChange={e=>setTf({...tf,date:e.target.value})}/></div><div><label style={LBL}>Invoice No</label><input style={INP} placeholder="TH-1038" value={tf.invNo} onChange={e=>setTf({...tf,invNo:e.target.value})}/></div></div>
        <div><label style={LBL}>Client *</label><input style={INP} value={tf.client} onChange={e=>setTf({...tf,client:e.target.value})}/></div>
        <div><label style={LBL}>Issue / Reason *</label><textarea style={{...INP,minHeight:65,resize:"vertical"}} value={tf.reason} onChange={e=>setTf({...tf,reason:e.target.value})}/></div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{["Open","Credit Note","Replacement","Resolved"].map(s=><button key={s} onClick={()=>setTf({...tf,status:s})} style={{flex:1,background:tf.status===s?SC[s]+"33":C.cb,color:tf.status===s?SC[s]:C.muted,border:`1px solid ${tf.status===s?SC[s]+"55":"transparent"}`,borderRadius:7,padding:"7px 4px",fontWeight:700,fontSize:10,cursor:"pointer"}}>{s}</button>)}</div>
        <div><label style={LBL}>Assign To</label><select style={{...INP,appearance:"none"}} value={tf.assignedTo} onChange={e=>setTf({...tf,assignedTo:e.target.value})}>{TEAM.map(m=><option key={m}>{m}</option>)}</select></div>
        <button onClick={()=>{if(tf.client&&tf.invNo&&tf.reason){setSup(p=>[{...tf,id:Date.now(),raisedBy:currentUser},...p]);setTf({date:TODAY,client:"",invNo:"",reason:"",status:"Open",assignedTo:currentUser,notes:""});setShowNewT(false);}}} style={{background:C.red,border:"none",color:"#fff",borderRadius:10,padding:13,fontWeight:800,cursor:"pointer"}}>Raise Ticket ✓</button>
      </div>
    </Mod>}
    {selTkt&&<Mod onClose={()=>setSelTkt(null)} title={selTkt.client} sub={`#${selTkt.invNo}`}>
      <div style={{background:C.bg,borderRadius:9,padding:"11px 13px",marginBottom:11}}><div style={{color:C.dim,fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:5}}>Issue</div><div style={{color:C.text,fontSize:12,lineHeight:1.5}}>{selTkt.reason}</div></div>
      <div style={{marginBottom:11}}><label style={LBL}>Update Status</label><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{["Open","Credit Note","Replacement","Resolved"].map(s=><button key={s} onClick={()=>{setSup(p=>p.map(t=>t.id===selTkt.id?{...t,status:s}:t));setSelTkt(p=>({...p,status:s}));}} style={{flex:1,background:selTkt.status===s?SC[s]+"33":C.cb,color:selTkt.status===s?SC[s]:C.muted,border:`1px solid ${selTkt.status===s?SC[s]+"55":"transparent"}`,borderRadius:7,padding:"7px 4px",fontWeight:700,fontSize:10,cursor:"pointer"}}>{s}</button>)}</div></div>
      {selTkt.notes&&<div style={{background:C.bg,borderRadius:7,padding:"7px 11px"}}><div style={{color:C.dim,fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>Notes</div><div style={{color:C.text,fontSize:12}}>{selTkt.notes}</div></div>}
    </Mod>}
    {showNewN&&<Mod onClose={()=>setShowNewN(false)} title="📝 New Note">
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div><label style={LBL}>Title *</label><input style={INP} value={nf.title} onChange={e=>setNf({...nf,title:e.target.value})}/></div>
        <div><label style={LBL}>Note *</label><textarea style={{...INP,minHeight:80,resize:"vertical",lineHeight:1.6}} value={nf.body} onChange={e=>setNf({...nf,body:e.target.value})}/></div>
        <div><label style={LBL}>Tag</label><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{Object.keys(TC).map(t=><button key={t} onClick={()=>setNf({...nf,tag:t})} style={{background:nf.tag===t?TC[t]+"33":C.cb,color:nf.tag===t?TC[t]:C.muted,border:`1px solid ${nf.tag===t?TC[t]+"55":"transparent"}`,borderRadius:6,padding:"4px 9px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{t}</button>)}</div></div>
        <button onClick={()=>setNf({...nf,pinned:!nf.pinned})} style={{background:nf.pinned?C.acc+"22":C.cb,border:`1px solid ${nf.pinned?C.acc+"44":C.dim}`,color:nf.pinned?C.acc:C.muted,borderRadius:7,padding:"8px",fontWeight:700,fontSize:11,cursor:"pointer"}}>📌 {nf.pinned?"Pinned":"Pin to Top"}</button>
        <button onClick={()=>{if(nf.title&&nf.body){setNotes(p=>[{...nf,id:Date.now(),date:TODAY,by:currentUser},...p]);setNf({title:"",body:"",tag:"General",pinned:false});setShowNewN(false);}}} style={{background:C.teal,border:"none",color:"#fff",borderRadius:10,padding:13,fontWeight:800,cursor:"pointer"}}>Save Note ✓</button>
      </div>
    </Mod>}
    {selNote&&<Mod onClose={()=>setSelNote(null)} title={selNote.title} sub={`${selNote.tag} · ${selNote.by.split(" ")[0]}`}>
      <div style={{background:C.bg,borderRadius:9,padding:"11px 13px",marginBottom:12,color:C.text,fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{selNote.body}</div>
      <div style={{display:"flex",gap:7}}>
        <button onClick={()=>{setNotes(p=>p.map(n=>n.id===selNote.id?{...n,pinned:!n.pinned}:n));setSelNote(p=>({...p,pinned:!p.pinned}));}} style={{flex:1,background:selNote.pinned?C.acc+"22":C.cb,border:`1px solid ${selNote.pinned?C.acc+"44":C.dim}`,color:selNote.pinned?C.acc:C.muted,borderRadius:7,padding:"9px",fontWeight:700,cursor:"pointer"}}>📌 {selNote.pinned?"Unpin":"Pin"}</button>
        {can&&<button onClick={()=>{setNotes(p=>p.filter(n=>n.id!==selNote.id));setSelNote(null);}} style={{background:C.red+"22",border:`1px solid ${C.red}44`,color:C.red,borderRadius:7,padding:"9px",fontWeight:700,cursor:"pointer"}}>🗑</button>}
      </div>
    </Mod>}

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:14}}>{SUBS.map(s=><button key={s.id} onClick={()=>setSub(s.id)} style={{background:sub===s.id?C.orange+"33":C.card,border:`1px solid ${sub===s.id?C.orange+"55":C.cb}`,borderRadius:11,padding:"10px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative"}}><span style={{fontSize:18}}>{s.i}</span><span style={{color:sub===s.id?C.orange:C.muted,fontSize:10,fontWeight:700}}>{s.l}</span>{s.b>0&&<div style={{position:"absolute",top:5,right:7,width:14,height:14,borderRadius:"50%",background:C.red,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:800}}>{s.b}</div>}</button>)}</div>

    {sub==="att"&&<div>
      <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}><Pill label="Present" value={pr} color={C.green}/><Pill label="Absent" value={ab} color={C.red}/>{can&&<button style={{marginLeft:"auto",background:C.green+"22",border:`1px solid ${C.green}44`,color:C.green,borderRadius:7,padding:"5px 11px",fontWeight:700,fontSize:11,cursor:"pointer"}}>📊 Salary Report</button>}</div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>{att.map(a=>{const isMe=a.name===currentUser,cE=isMe||can,ed=editId===a.name;const sc=SC2[a.status]||C.dim;return<div key={a.name} style={{background:C.card,border:`1px solid ${a.status==="Present"?C.green+"33":a.status==="Absent"?C.red+"33":C.acc+"33"}`,borderRadius:11,padding:"10px 13px"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <Av name={a.name} size={28}/>
          <div style={{flex:1,minWidth:0}}><div style={{color:C.text,fontWeight:600,fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.name}</div>{a.inTime&&<div style={{color:C.muted,fontSize:10,marginTop:1}}>In: {a.inTime}{a.outTime?` · Out: ${a.outTime}`:""}</div>}</div>
          {cE?<button onClick={()=>{const cy={Present:"Absent",Absent:"Half Day","Half Day":"Present"};setAtt(p=>p.map(r=>r.name===a.name?{...r,status:cy[r.status]||"Present"}:r));}} style={{background:sc+"22",border:`1px solid ${sc}44`,color:sc,borderRadius:18,padding:"3px 9px",fontWeight:700,fontSize:10,cursor:"pointer"}}>{a.status}</button>:<Bdg label={a.status} color={sc} bg={sc+"22"} border={sc+"44"}/>}
          {cE&&<button onClick={()=>setEditId(ed?null:a.name)} style={{background:ed?C.orange+"33":C.cb,border:`1px solid ${ed?C.orange+"55":"transparent"}`,color:ed?C.orange:C.muted,borderRadius:6,padding:"3px 7px",cursor:"pointer",fontSize:11}}>✏️</button>}
        </div>
        {ed&&<div style={{marginTop:7,borderTop:`1px solid ${C.cb}`,paddingTop:7,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
          <div><label style={{...LBL,fontSize:9,marginBottom:2}}>In Time</label><input type="time" value={a.inTime||""} onChange={e=>setAtt(p=>p.map(r=>r.name===a.name?{...r,inTime:e.target.value}:r))} style={{...INP,padding:"4px 6px",fontSize:11}}/></div>
          <div><label style={{...LBL,fontSize:9,marginBottom:2}}>Out Time</label><input type="time" value={a.outTime||""} onChange={e=>setAtt(p=>p.map(r=>r.name===a.name?{...r,outTime:e.target.value}:r))} style={{...INP,padding:"4px 6px",fontSize:11}}/></div>
          <div style={{display:"flex",alignItems:"flex-end"}}><button onClick={()=>setEditId(null)} style={{background:C.orange,border:"none",color:"#fff",borderRadius:6,padding:"6px",fontWeight:700,fontSize:11,cursor:"pointer",width:"100%"}}>✓ Done</button></div>
        </div>}
      </div>;})}
      </div>
    </div>}

    {sub==="exp"&&<div>
      <div style={{background:C.card,border:`1px solid ${C.cb}`,borderRadius:11,padding:"11px 13px",marginBottom:12}}>
        <div style={{color:C.dim,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:9}}>Today's Overview</div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:9}}>{[{l:"Maskan",v:700,c:C.purple},{l:"Ibrahim",v:260,c:C.blue},{l:"Bhiwandi",v:1650,c:C.green},{l:"Vijay Tempo",v:2400,c:C.red},{l:"General",v:3650,c:C.orange}].map(a=><Pill key={a.l} label={a.l} value={fmt(a.v)} color={a.c}/>)}</div>
        <div style={{display:"flex",justifyContent:"space-between",borderTop:`1px solid ${C.cb}`,paddingTop:8}}><span style={{color:C.muted,fontWeight:600,fontSize:12}}>Total Today</span><span style={{color:C.acc,fontWeight:800,fontSize:17}}>{fmt(8660)}</span></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>{[{e:"📦",n:"Maskan Bhai",c:C.purple},{e:"🚚",n:"Ibrahim Bhai",c:C.blue},{e:"🏭",n:"Bhiwandi",c:C.green},{e:"🚛",n:"Vijay Tempo",c:C.red},{e:"💸",n:"General",c:C.orange}].map(a=><div key={a.n} style={{background:C.card,border:`1px solid ${a.c}33`,borderRadius:9,padding:"11px 7px",textAlign:"center",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=a.c+"11"} onMouseLeave={e=>e.currentTarget.style.background=C.card}><div style={{fontSize:20,marginBottom:3}}>{a.e}</div><div style={{color:a.c,fontWeight:700,fontSize:9,lineHeight:1.2}}>{a.n}</div></div>)}</div>
    </div>}

    {sub==="sup"&&<div>
      <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}>{[["Open",C.red],["Credit Note",C.orange],["Replacement",C.blue],["Resolved",C.green]].map(([s,c])=><Pill key={s} label={s} value={sup.filter(t=>t.status===s).length} color={c}/>)}<button onClick={()=>setShowNewT(true)} style={{marginLeft:"auto",background:C.red,border:"none",color:"#fff",borderRadius:7,padding:"5px 12px",fontWeight:700,fontSize:11,cursor:"pointer"}}>+ New</button></div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>{sup.map(t=>{const sc=SC[t.status];return<div key={t.id} onClick={()=>setSelTkt(t)} style={{background:C.card,border:`1px solid ${sc}44`,borderLeft:`3px solid ${sc}`,borderRadius:11,padding:"11px 13px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=sc+"0A"} onMouseLeave={e=>e.currentTarget.style.background=C.card}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><div style={{display:"flex",gap:5,alignItems:"center"}}><span style={{color:C.text,fontWeight:700,fontSize:12}}>{t.client}</span><Bdg label={`#${t.invNo}`} color={C.acc} bg={C.acc+"22"} border={C.acc+"44"}/></div><span style={{background:sc+"22",color:sc,border:`1px solid ${sc}44`,borderRadius:5,padding:"1px 7px",fontSize:9,fontWeight:700}}>{t.status}</span></div><div style={{color:C.muted,fontSize:11,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",marginBottom:3}}>{t.reason}</div><div style={{display:"flex",gap:7}}><span style={{color:C.dim,fontSize:10}}>→ {t.assignedTo.split(" ")[0]}</span><span style={{color:C.dim,fontSize:10}}>{new Date(t.date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span></div>{t.notes&&<div style={{background:C.bg,borderRadius:5,padding:"4px 8px",marginTop:5,fontSize:10,color:C.muted,borderLeft:`2px solid ${sc}44`}}>{t.notes}</div>}</div>;})}
      </div>
    </div>}

    {sub==="nts"&&<div>
      <div style={{display:"flex",gap:7,marginBottom:12}}><Pill label="Total" value={notes.length} color={C.teal}/><Pill label="Pinned" value={notes.filter(n=>n.pinned).length} color={C.acc}/><button onClick={()=>setShowNewN(true)} style={{marginLeft:"auto",background:C.teal,border:"none",color:"#fff",borderRadius:7,padding:"5px 12px",fontWeight:700,fontSize:11,cursor:"pointer"}}>📝 New</button></div>
      {notes.filter(n=>n.pinned).length>0&&<><div style={{color:C.acc,fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:1.2,marginBottom:7}}>📌 Pinned</div><div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>{notes.filter(n=>n.pinned).map(n=>{const tc=TC[n.tag]||C.muted;return<div key={n.id} onClick={()=>setSelNote(n)} style={{background:C.acc+"0A",border:`1px solid ${C.acc}44`,borderRadius:11,padding:"12px 14px",cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{color:C.text,fontWeight:700,fontSize:13}}>{n.title}</span><span style={{fontSize:12}}>📌</span></div><div style={{color:C.muted,fontSize:11,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",marginBottom:5}}>{n.body}</div><div style={{display:"flex",gap:5}}><Bdg label={n.tag} color={tc} bg={tc+"22"} border={tc+"44"}/><span style={{color:C.dim,fontSize:10}}>{n.by.split(" ")[0]}</span></div></div>;})}
      </div></>}
      <div style={{display:"flex",flexDirection:"column",gap:7}}>{notes.filter(n=>!n.pinned).map(n=>{const tc=TC[n.tag]||C.muted;return<div key={n.id} onClick={()=>setSelNote(n)} style={{background:C.card,border:`1px solid ${C.cb}`,borderRadius:11,padding:"12px 14px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#fff05"} onMouseLeave={e=>e.currentTarget.style.background=C.card}><div style={{color:C.text,fontWeight:700,fontSize:12,marginBottom:4}}>{n.title}</div><div style={{color:C.muted,fontSize:11,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",marginBottom:5}}>{n.body}</div><div style={{display:"flex",gap:5,alignItems:"center"}}><Bdg label={n.tag} color={tc} bg={tc+"22"} border={tc+"44"}/><span style={{color:C.dim,fontSize:10}}>{n.by.split(" ")[0]} · {new Date(n.date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span></div></div>;})}
      </div>
    </div>}

    {sub==="sht"&&<div style={{textAlign:"center",padding:28}}>
      <div style={{fontSize:44,marginBottom:10}}>📊</div>
      <div style={{color:C.text,fontWeight:800,fontSize:17,marginBottom:7}}>Sheets</div>
      <div style={{color:C.muted,fontSize:12,lineHeight:1.6,marginBottom:16}}>Full spreadsheet editor with formulas, formatting, CSV upload and export — like Google Sheets, built right into the app.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>{[{i:"📝",t:"Create from Scratch"},{i:"📂",t:"Upload CSV/Excel"},{i:"=SUM",t:"Formula Support"},{i:"🎨",t:"Cell Formatting"}].map(f=><div key={f.t} style={{background:C.card,border:`1px solid ${C.teal}33`,borderRadius:9,padding:"11px 7px",textAlign:"center"}}><div style={{fontSize:18,marginBottom:3}}>{f.i}</div><div style={{color:C.text,fontWeight:600,fontSize:11}}>{f.t}</div></div>)}</div>
    </div>}
  </div>);
}

// ── Chat ──
const CHS=[{id:"gen",name:"Tansha General",icon:"🏢",color:C.acc,unread:2},{id:"ocean",name:"Ocean Team",icon:"🥂",color:C.blue,unread:0},{id:"pay",name:"Payments",icon:"💰",color:C.red,unread:1}];
const DMS=[{id:"dm-saud",name:"Saud Bhai",online:true,unread:1},{id:"dm-kaif",name:"Kaif Bhai",online:true,unread:0}];
const now=new Date();const tF=d=>new Date(d).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true});
const MSGS0={gen:[{id:1,sender:"Saud Bhai",text:"Good morning team! All April dispatches by 5 PM.",time:tF(new Date(now-3600000*3)),type:"text",reads:["Kaif Bhai"]},{id:2,sender:"Kaif Bhai",text:"Will follow up with Hotel Leela today.",time:tF(new Date(now-3600000*2)),type:"text",reads:["Saud Bhai"]},{id:3,sender:"Nafees Bhai",text:"Purchase order for Ocean restock done.",time:tF(new Date(now-1800000)),type:"task",taskText:"Purchase order — Ocean Glassware",taskStatus:"Done",reads:["Ali Bhai (Owner)"]},{id:4,sender:"Saeed Bhai",text:"Collected payment from Naresh Steel ✅",time:tF(new Date(now-900000)),type:"payment",amount:86499,client:"Naresh Steel Centre",reads:["Saud Bhai"]}],"dm-saud":[{id:1,sender:"Saud Bhai",text:"Ali Bhai, Grand Hyatt rescheduling again. Escalate?",time:tF(new Date(now-3600000)),type:"text",reads:[]},{id:2,sender:"Ali Bhai (Owner)",text:"Give them till Friday. If not paid, stop credit.",time:tF(new Date(now-1800000)),type:"text",reads:["Saud Bhai"]}]};
function CBubble({msg,isMe,onLong}){
  return (<div style={{display:"flex",flexDirection:isMe?"row-reverse":"row",alignItems:"flex-end",gap:7,marginBottom:9}}>
    {!isMe&&<Av name={msg.sender} size={24}/>}
    <div style={{maxWidth:"76%",display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start"}}>
      {!isMe&&<div style={{color:C.muted,fontSize:9,marginBottom:2,marginLeft:2,fontWeight:600}}>{msg.sender.split(" ")[0]}</div>}
      <div onContextMenu={e=>{e.preventDefault();onLong(msg);}} style={{background:isMe?C.blue:C.cardBg||"#F3F4F6",borderRadius:isMe?"14px 14px 3px 14px":"14px 14px 14px 3px",padding:msg.type!=="text"?"9px 11px":"7px 11px",border:`1px solid ${isMe?C.blue+"44":C.cb}`,cursor:"pointer"}}>
        {msg.type==="task"&&<div style={{marginBottom:5}}><div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}><span style={{fontSize:11}}>✅</span><span style={{color:C.green,fontSize:9,fontWeight:700,textTransform:"uppercase"}}>Task Update</span></div><div style={{color:C.text,fontSize:11,fontWeight:600}}>{msg.taskText}</div><div style={{background:C.green+"22",border:`1px solid ${C.green}44`,borderRadius:3,padding:"1px 6px",display:"inline-block",marginTop:3}}><span style={{color:C.green,fontSize:9,fontWeight:700}}>{msg.taskStatus}</span></div></div>}
        {msg.type==="payment"&&<div style={{marginBottom:5}}><div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}><span style={{fontSize:11}}>💰</span><span style={{color:C.green,fontSize:9,fontWeight:700,textTransform:"uppercase"}}>Payment Collected</span></div><div style={{color:C.text,fontSize:11,fontWeight:600}}>{msg.client}</div><div style={{color:C.green,fontWeight:800,fontSize:13,marginTop:1}}>{fmt(msg.amount)}</div></div>}
        <div style={{color:isMe?"#FFFFFF":C.text,fontSize:12,lineHeight:1.4}}>{msg.text}</div>
      </div>
      <div style={{display:"flex",gap:3,marginTop:2}}><span style={{color:C.dim,fontSize:8}}>{msg.time}</span>{isMe&&<span style={{color:msg.reads.length>0?C.blue:C.dim,fontSize:10}}>{msg.reads.length>0?"✓✓":"✓"}</span>}</div>
    </div>
  </div>);
}
function Chat({currentUser}){
  const [ach,setAch]=useState("gen");const [msgs,setMsgs]=useState(MSGS0);const [inp,setInp]=useState("");const [ss,setSs]=useState(true);const [lp,setLp]=useState(null);const [ct,setCt]=useState(null);const [ctf,setCtf]=useState({title:"",to:"",due:""});const eRef=useRef();
  useEffect(()=>{eRef.current?.scrollIntoView({behavior:"smooth"});},[ach,msgs]);
  function send(){if(!inp.trim())return;const m={id:Date.now(),sender:currentUser,text:inp.trim(),time:tF(new Date()),type:"text",reads:[]};setMsgs(p=>({...p,[ach]:[...(p[ach]||[]),m]}));setInp("");}
  const an=[...CHS,...DMS].find(c=>c.id===ach)?.name||"";const cm=msgs[ach]||[];const tu=[...CHS,...DMS].reduce((s,c)=>s+c.unread,0);
  return (<div style={{display:"flex",height:"calc(100vh - 130px)",overflow:"hidden",margin:"-16px",borderRadius:11,border:`1px solid ${C.cb}`,background:C.card}}>
    {ss&&<div style={{width:180,background:C.card,borderRight:`1px solid ${C.cb}`,display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto"}}>
      <div style={{padding:"9px 11px",borderBottom:`1px solid ${C.cb}`}}><input style={{...INP,padding:"5px 9px",fontSize:10}} placeholder="🔍 Search..."/></div>
      <div style={{padding:"7px 9px 3px"}}><div style={{color:C.dim,fontSize:8,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Channels</div>
        {CHS.map(ch=>{const act=ach===ch.id;return<button key={ch.id} onClick={()=>setAch(ch.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:6,background:act?C.acc+"22":"transparent",border:`1px solid ${act?C.acc+"44":"transparent"}`,borderRadius:6,padding:"6px 7px",cursor:"pointer",marginBottom:1,textAlign:"left"}}><span style={{fontSize:13}}>{ch.icon}</span><span style={{color:act?C.acc:C.text,fontWeight:act?700:500,fontSize:11,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ch.name}</span>{ch.unread>0&&<div style={{background:C.red,borderRadius:"50%",width:14,height:14,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:8,fontWeight:800,flexShrink:0}}>{ch.unread}</div>}</button>;})}
      </div>
      <div style={{padding:"7px 9px 3px"}}><div style={{color:C.dim,fontSize:8,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Direct Messages</div>
        {DMS.map(dm=>{const act=ach===dm.id;return<button key={dm.id} onClick={()=>setAch(dm.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:6,background:act?C.blue+"22":"transparent",border:`1px solid ${act?C.blue+"44":"transparent"}`,borderRadius:6,padding:"6px 7px",cursor:"pointer",marginBottom:1,textAlign:"left"}}><Av name={dm.name} size={20} online={dm.online}/><div style={{flex:1,minWidth:0}}><div style={{color:act?C.blue:C.text,fontWeight:act?700:500,fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dm.name.split(" ")[0]}</div><div style={{color:dm.online?C.green:C.dim,fontSize:8}}>{dm.online?"Online":"Offline"}</div></div>{dm.unread>0&&<div style={{background:C.red,borderRadius:"50%",width:13,height:13,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:8,fontWeight:800}}>{dm.unread}</div>}</button>;})}
      </div>
    </div>}
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{background:C.card,borderBottom:`1px solid ${C.cb}`,padding:"9px 13px",display:"flex",gap:9,alignItems:"center",flexShrink:0}}>
        <button onClick={()=>setSs(!ss)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:17}}>☰</button>
        <div style={{color:C.text,fontWeight:700,fontSize:13,flex:1}}>{an}</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"11px 13px"}}>
        {cm.length===0&&<div style={{textAlign:"center",padding:36,color:C.dim,fontSize:12}}>No messages yet</div>}
        {cm.map(m=><CBubble key={m.id} msg={m} isMe={m.sender===currentUser} onLong={setLp}/>)}
        <div ref={eRef}/>
      </div>
      <div style={{background:C.card,borderTop:`1px solid ${C.cb}`,boxShadow:'0 -1px 0 #E5E7EB',padding:"9px 13px",display:"flex",gap:7,flexShrink:0}}>
        <input style={{flex:1,background:"#F9FAFB",border:`1px solid ${C.cb}`,borderRadius:18,padding:"7px 13px",color:C.text,fontSize:12,outline:"none"}} placeholder={`Message ${an}...`} value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}/>
        <button onClick={send} style={{background:inp.trim()?C.blue:C.cb,border:"none",color:inp.trim()?"#fff":C.muted,borderRadius:"50%",width:33,height:33,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>➤</button>
      </div>
    </div>
    {lp&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:600}} onClick={()=>setLp(null)}>
      <div onClick={e=>e.stopPropagation()} style={{position:"absolute",bottom:0,left:0,right:0,background:C.card,borderRadius:"18px 18px 0 0",padding:18,maxWidth:500,margin:"0 auto"}}>
        <div style={{background:C.bg,borderRadius:8,padding:"8px 12px",marginBottom:12}}><div style={{color:C.muted,fontSize:10,marginBottom:2}}>{lp.sender}</div><div style={{color:C.text,fontSize:12}}>{lp.text}</div></div>
        {[{i:"↩️",l:"Reply"},{i:"✅",l:"Convert to Task",a:()=>{setCt(lp);setLp(null);}},{i:"📋",l:"Copy Message"},{i:"⭐",l:"Star"}].map(a=><button key={a.l} onClick={()=>{a.a?.();setLp(null);}} style={{width:"100%",display:"flex",gap:9,alignItems:"center",background:"none",border:"none",borderRadius:7,padding:"10px 7px",cursor:"pointer",color:C.text,fontSize:13,fontWeight:500}}><span style={{fontSize:16}}>{a.i}</span>{a.l}</button>)}
      </div>
    </div>}
    {ct&&<div style={{position:"fixed",inset:0,background:"#000B",zIndex:700,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:C.card,borderRadius:"18px 18px 0 0",width:"100%",maxWidth:500,padding:18,border:`1px solid ${C.cb}`}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{color:C.text,fontWeight:800,fontSize:15}}>✅ Create Task from Message</span><button onClick={()=>setCt(null)} style={{background:C.cb,border:"none",color:C.muted,borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:13}}>✕</button></div>
        <div style={{background:C.bg,borderRadius:7,padding:"7px 11px",marginBottom:11,color:C.muted,fontSize:11}}>{ct.text}</div>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          <div><label style={LBL}>Task Title</label><input style={INP} value={ctf.title||ct.text.slice(0,50)} onChange={e=>setCtf({...ctf,title:e.target.value})}/></div>
          <div><label style={LBL}>Assign To</label><select style={{...INP,appearance:"none"}} value={ctf.to} onChange={e=>setCtf({...ctf,to:e.target.value})}><option value="">Select...</option>{TEAM.map(m=><option key={m}>{m}</option>)}</select></div>
          <div><label style={LBL}>Due Date</label><input type="date" style={INP} value={ctf.due} onChange={e=>setCtf({...ctf,due:e.target.value})}/></div>
          <button onClick={()=>{alert(`Task created → ${ctf.to||"unassigned"}`);setCt(null);setCtf({title:"",to:"",due:""}); }} style={{background:C.blue,border:"none",color:"#fff",borderRadius:10,padding:13,fontWeight:800,cursor:"pointer"}}>Create Task ✓</button>
        </div>
      </div>
    </div>}
  </div>);
}

// ── Saeed Route ──
const SR=[{day:"Mon",f:"Weekly",c:"Hotel Hub",a:"Turbhe",jan:191573,feb:46691,mar:137494,apr:95000},{day:"Mon",f:"Weekly",c:"Viraj Hotelware",a:"Turbhe",jan:49935,feb:45764,mar:0,apr:0},{day:"Tue",f:"Weekly",c:"Bharat Steel",a:"Andheri",jan:126033,feb:44725,mar:57477,apr:88000},{day:"Tue",f:"15 Days",c:"Mugatlal & Bros",a:"Andheri",jan:121476,feb:1699,mar:0,apr:0},{day:"Wed",f:"Weekly",c:"Naresh Steel Centre",a:"Bhayander",jan:86499,feb:63930,mar:37011,apr:0},{day:"Thu",f:"Weekly",c:"Jain Metal",a:"Kalyan",jan:3639,feb:109651,mar:0,apr:75000},{day:"Fri",f:"Weekly",c:"RS Glassware",a:"Wadala",jan:0,feb:128578,mar:231613,apr:210000},{day:"Fri",f:"15 Days",c:"Barsolution LLP",a:"Sewri",jan:187289,feb:232812,mar:81911,apr:0}];
const DC2={Mon:C.blue,Tue:C.green,Wed:C.orange,Thu:C.purple,Fri:C.red};
function SaeedRoute(){
  const [df,setDf]=useState("All");const fil=df==="All"?SR:SR.filter(c=>c.day===df);const ytd=SR.reduce((s,c)=>s+c.jan+c.feb+c.mar+c.apr,0);
  return (<div>
    <div style={{background:`linear-gradient(135deg,${C.teal}22,${C.blue}11)`,border:`1px solid ${C.teal}44`,borderRadius:13,padding:"13px 15px",marginBottom:14,display:"flex",alignItems:"center",gap:11}}>
      <div style={{width:42,height:42,borderRadius:"50%",background:C.teal+"33",border:`2px solid ${C.teal}66`,display:"flex",alignItems:"center",justifyContent:"center",color:C.teal,fontWeight:800,fontSize:16,flexShrink:0}}>SB</div>
      <div style={{flex:1}}><div style={{color:C.text,fontWeight:800,fontSize:15}}>Saeed Bhai — Route Sheet</div><div style={{color:C.muted,fontSize:11,marginTop:1}}>Ukiyo Sales · 50 Clients · Mon–Fri</div></div>
      <div style={{textAlign:"right"}}><div style={{color:C.green,fontWeight:800,fontSize:14}}>{fmt(ytd)}</div><div style={{color:C.dim,fontSize:9}}>YTD 2026</div></div>
    </div>
    <div style={{display:"flex",gap:5,marginBottom:12,overflowX:"auto",paddingBottom:3}}>{["All","Mon","Tue","Wed","Thu","Fri"].map(d=>{const lc=d==="All"?C.teal:DC2[d];return<button key={d} onClick={()=>setDf(d)} style={{background:df===d?lc+"33":"transparent",color:df===d?lc:C.muted,border:`1px solid ${df===d?lc+"55":C.cb}`,borderRadius:7,padding:"4px 11px",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{d}</button>;})}
    </div>
    <div style={{overflowX:"auto",borderRadius:9,border:`1px solid ${C.cb}`}}><table style={{borderCollapse:"collapse",fontSize:11,minWidth:440}}>
      <thead><tr><th style={{padding:"6px 9px",textAlign:"left",color:C.muted,fontWeight:700,fontSize:9,borderBottom:`1px solid ${C.cb}`,background:C.card,position:"sticky",left:0,zIndex:2,minWidth:110}}>CLIENT</th><th style={{padding:"6px 5px",textAlign:"left",color:C.muted,fontWeight:700,fontSize:9,borderBottom:`1px solid ${C.cb}`,background:C.card,minWidth:55}}>AREA</th><th style={{padding:"5px 5px",textAlign:"center",color:C.muted,fontWeight:700,fontSize:9,borderBottom:`1px solid ${C.cb}`,background:C.card,minWidth:36}}>DAY</th>{["Jan","Feb","Mar","Apr"].map((m,i)=><th key={m} style={{padding:"4px 6px",textAlign:"center",color:i===3?C.teal:C.muted,fontWeight:700,fontSize:9,borderBottom:`1px solid ${C.cb}`,background:i===3?C.teal+"22":C.card,minWidth:62}}>{m}</th>)}<th style={{padding:"4px 6px",textAlign:"right",color:C.green,fontWeight:700,fontSize:9,borderBottom:`1px solid ${C.cb}`,background:C.card,minWidth:65}}>YTD</th></tr></thead>
      <tbody>{fil.map((c,ri)=>{const rt=c.jan+c.feb+c.mar+c.apr;const rb=ri%2===0?C.card:"#F9FAFB";const dc=DC2[c.day]||C.muted;return<tr key={c.c} style={{borderBottom:`1px solid ${C.cb}22`}}><td style={{padding:"5px 9px",color:C.text,fontWeight:600,fontSize:10,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:110,position:"sticky",left:0,background:rb,zIndex:1}}>{c.c}</td><td style={{padding:"5px 5px",color:C.muted,fontSize:9,whiteSpace:"nowrap"}}>{c.a}</td><td style={{padding:"4px 3px",textAlign:"center"}}><span style={{background:dc+"22",color:dc,border:`1px solid ${dc}44`,borderRadius:4,padding:"1px 5px",fontSize:8,fontWeight:700}}>{c.day}</span></td>{[c.jan,c.feb,c.mar,c.apr].map((v,mi)=>{const hp=mi>0&&[c.jan,c.feb,c.mar,c.apr].slice(0,mi).some(x=>x>0);const ia=!v&&hp;return<td key={mi} style={{padding:"3px 2px",textAlign:"center",background:v>0?C.green+"22":ia?"#FB923C15":"transparent",minWidth:62}}>{v>0?<span style={{color:C.green,fontWeight:700,fontSize:9}}>{fmt(v)}</span>:ia?<span style={{color:"#FB923C",opacity:.6,fontSize:10}}>—</span>:null}</td>;})} <td style={{padding:"3px 6px",textAlign:"right",color:rt>0?C.teal:C.dim,fontWeight:700,fontSize:10}}>{rt>0?fmt(rt):"—"}</td></tr>;})}
      </tbody>
    </table></div>
    <div style={{color:C.dim,fontSize:9,marginTop:5,textAlign:"center"}}>🟢 Ordered · 🟠 Skipped (follow up) · 🔄 Auto-synced from Ukiyo Sales</div>
  </div>);
}

// ── App Shell ──
const NAV=[{id:"home",i:"📊",l:"Home"},{id:"tasks",i:"✅",l:"Tasks"},{id:"dispatch",i:"🚚",l:"Dispatch"},{id:"quote",i:"📋",l:"Quote"},{id:"stocks",i:"📦",l:"Stocks"},{id:"sales",i:"📈",l:"Sales"},{id:"routes",i:"🗺️",l:"Routes"},{id:"payment",i:"💰",l:"Payments"},{id:"ops",i:"⚙️",l:"Ops"},{id:"chat",i:"💬",l:"Chat"}];
const RA={Owner:NAV.map(n=>n.id),Manager:NAV.map(n=>n.id),Sales:["home","tasks","quote","sales","chat"],Warehouse:["home","tasks","dispatch","stocks","ops","chat"]};
const UM={"Owner":"Ali Bhai (Owner)","Manager":"Saud Bhai","Sales":"Kaif Bhai","Warehouse":"Sufiyan Bhai"};
const TITLES={home:"Dashboard",tasks:"Tasks",dispatch:"Dispatch",quote:"Sales Quotation",stocks:"Bhiwandi Stocks",sales:"Sales",routes:"Saeed Bhai — Routes",payment:"Payment Collection",ops:"Operations",chat:"Team Chat"};

export default function App(){
  const [role,setRole]=useState("Owner");const [active,setActive]=useState("home");const [showN,setShowN]=useState(false);const [showNav,setShowNav]=useState(false);const [notifs,setNotifs]=useState(NOTIFS);
  const cu=UM[role];const unread=notifs.filter(n=>!n.read).length;const acc=RA[role];const bnav=NAV.filter(n=>acc.includes(n.id)).slice(0,5);
  function nav(m){if(acc.includes(m)){setActive(m);setShowNav(false);}}
  return (<div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:"#F7F8FA",minHeight:"100vh",color:C.text,maxWidth:480,margin:"0 auto",position:"relative",fontFamily:"'Inter','DM Sans','Segoe UI',sans-serif"}}>
    <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:${C.cb};border-radius:2px}`}</style>
    {showN&&<NotifPanel notifs={notifs} setNotifs={setNotifs} onClose={()=>setShowN(false)}/>}
    {showNav&&<div style={{position:"fixed",inset:0,background:"#000B",zIndex:400}} onClick={()=>setShowNav(false)}>
      <div onClick={e=>e.stopPropagation()} style={{position:"absolute",left:0,top:0,bottom:0,width:230,background:C.card,borderRight:`1px solid ${C.cb}`,overflowY:"auto",animation:"sL .25s ease"}}>
        <style>{`@keyframes sL{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
        <div style={{padding:"18px 15px 13px",borderBottom:`1px solid ${C.cb}`}}>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:11}}><Av name={cu} size={38}/><div><div style={{color:C.text,fontWeight:700,fontSize:13}}>{cu}</div><span style={{background:RC[role].bg,color:RC[role].text,border:`1px solid ${RC[role].border}`,borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:700}}>{role}</span></div></div>
          <div style={{color:C.dim,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Switch Role</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{["Owner","Manager","Sales","Warehouse"].map(r=><button key={r} onClick={()=>{setRole(r);setActive("home");setShowNav(false);}} style={{background:role===r?RC[r].bg:C.cb,color:role===r?RC[r].text:C.muted,border:`1px solid ${role===r?RC[r].border:"transparent"}`,borderRadius:5,padding:"3px 7px",fontSize:9,fontWeight:700,cursor:"pointer"}}>{r}</button>)}</div>
        </div>
        <div style={{padding:"9px 9px"}}>{NAV.filter(n=>acc.includes(n.id)).map(n=><button key={n.id} onClick={()=>nav(n.id)} style={{width:"100%",display:"flex",gap:9,alignItems:"center",background:active===n.id?C.acc+"22":"transparent",border:`1px solid ${active===n.id?C.acc+"44":"transparent"}`,borderRadius:7,padding:"9px 9px",cursor:"pointer",marginBottom:1,textAlign:"left"}}><span style={{fontSize:16}}>{n.i}</span><span style={{color:active===n.id?C.acc:C.text,fontWeight:active===n.id?700:500,fontSize:12}}>{TITLES[n.id]}</span></button>)}
        </div>
      </div>
    </div>}

    {/* Topbar */}
    <div style={{background:C.card,borderBottom:`1px solid ${C.cb}`,padding:"0 15px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <button onClick={()=>setShowNav(true)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:19,padding:0}}>☰</button>
        <div><span style={{color:C.acc,fontWeight:900,fontSize:15,letterSpacing:-.5}}>TANSHA</span><span style={{color:C.dim,fontSize:10,marginLeft:5}}>· {TITLES[active]}</span></div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <button onClick={()=>setShowN(true)} style={{background:"none",border:"none",cursor:"pointer",position:"relative",padding:3}}>
          <span style={{fontSize:19}}>🔔</span>
          {unread>0&&<div style={{position:"absolute",top:0,right:0,width:15,height:15,borderRadius:"50%",background:C.red,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:800}}>{unread}</div>}
        </button>
        <Av name={cu} size={28}/>
      </div>
    </div>

    {/* Content */}
    <div style={{padding:active==="chat"?0:15,paddingBottom:active==="chat"?0:75,minHeight:"calc(100vh - 52px - 56px)"}}>
      {active!=="chat"&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{margin:0,fontSize:17,fontWeight:800}}>{NAV.find(n=>n.id===active)?.i} {TITLES[active]}</h2>
        <span style={{background:RC[role].bg,color:RC[role].text,border:`1px solid ${RC[role].border}`,borderRadius:5,padding:"2px 9px",fontSize:9,fontWeight:700}}>{role}</span>
      </div>}
      {active==="home"&&<Dashboard role={role} currentUser={cu} onNav={nav} notifs={notifs}/>}
      {active==="tasks"&&<Tasks role={role} currentUser={cu} setNotifs={setNotifs}/>}
      {active==="dispatch"&&<Dispatch role={role}/>}
      {active==="quote"&&<Quotation/>}
      {active==="stocks"&&<Stocks/>}
      {active==="sales"&&<Sales/>}
      {active==="routes"&&<SaeedRoute/>}
      {active==="payment"&&<Payment/>}
      {active==="ops"&&<Operations role={role} currentUser={cu}/>}
      {active==="chat"&&<Chat currentUser={cu}/>}
    </div>

    {/* Bottom nav */}
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.card,borderTop:`1px solid ${C.cb}`,boxShadow:'0 -1px 0 #E5E7EB',display:"flex",zIndex:100}}>
      {bnav.map(n=>{const isA=active===n.id;return<button key={n.id} onClick={()=>nav(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"7px 3px",background:"transparent",border:"none",cursor:"pointer",position:"relative"}}>
        {isA&&<div style={{position:"absolute",top:0,left:"20%",right:"20%",height:2,background:C.acc,borderRadius:"0 0 2px 2px"}}/>}
        <span style={{fontSize:16}}>{n.i}</span>
        <span style={{fontSize:8,fontWeight:isA?700:400,color:isA?C.acc:C.muted}}>{n.l}</span>
        {n.id==="tasks"&&unread>0&&<div style={{position:"absolute",top:4,right:"16%",width:13,height:13,borderRadius:"50%",background:C.red,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:8,fontWeight:800}}>{unread}</div>}
      </button>;})}
      <button onClick={()=>setShowNav(true)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"7px 3px",background:"transparent",border:"none",cursor:"pointer"}}><span style={{fontSize:16}}>⋯</span><span style={{fontSize:8,color:C.muted}}>More</span></button>
    </div>
  </div>);
}
