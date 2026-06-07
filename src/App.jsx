import { useState, useRef, useEffect, useMemo } from "react";

const C={
  bg:"#F1F5F9",
  card:"#FFFFFF",
  cb:"#E2E8F0",
  acc:"#4F46E5",
  green:"#059669",
  red:"#DC2626",
  blue:"#1D4ED8",
  purple:"#7C3AED",
  teal:"#0E7490",
  orange:"#C2410C",
  text:"#0F172A",
  muted:"#64748B",
  dim:"#94A3B8",
  cardBg:"#F8FAFC",
  nav:"#0F172A",
  navHover:"#1E293B",
  sh:"0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.04)",
  sh2:"0 4px 12px rgba(0,0,0,0.08),0 2px 4px rgba(0,0,0,0.05)",
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
const INP={background:"#FFFFFF",border:`1.5px solid ${C.cb}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",transition:"border-color .15s"};
const LBL={color:C.muted,fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:5,display:"block"};

// ── UI primitives ──
function Av({name,size=30,online}){
  const p=["#DC2626","#2563EB","#16A34A","#D97706","#7C3AED","#0891B2","#EA580C","#DB2777"];
  const c=p[name.charCodeAt(0)%p.length];
  const i=name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  return (<div style={{position:"relative",flexShrink:0,width:size,height:size,borderRadius:"50%",background:c+"15",border:`1.5px solid ${c}30`,display:"flex",alignItems:"center",justifyContent:"center",color:c,fontWeight:800,fontSize:size*.34}}>{i}{online!==undefined&&<div style={{position:"absolute",bottom:1,right:1,width:size*.25,height:size*.25,borderRadius:"50%",background:online?C.green:C.dim,border:`2px solid ${C.card}`}}/>}</div>);
}
function Bdg({label,color,bg,border}){
  return (
    <span style={{background:bg||C.bg,color:color||C.muted,border:`1px solid ${border||C.cb}`,borderRadius:5,padding:"2px 9px",fontSize:10,fontWeight:600,whiteSpace:"nowrap",letterSpacing:.2}}>{label}</span>
  );
}
function Pill({label,value,color}){
  return (
    <div style={{background:color+"22",border:`1px solid ${color}44`,borderRadius:8,padding:"4px 12px",display:"flex",alignItems:"center",gap:6}}>
      <span style={{color,fontWeight:800,fontSize:14}}>{value}</span>
      <span style={{color:C.muted,fontSize:11}}>{label}</span>
    </div>
  );
}
function Card({children,a,style={}}){
  return (
    <div style={{background:C.card,border:`1px solid ${a?a+"33":C.cb}`,borderRadius:14,padding:16,boxShadow:C.sh,...style}}>{children}</div>
  );
}
function SL({text,color=C.muted}){
  return (
    <div style={{color,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10,paddingBottom:8,borderBottom:`1px solid ${C.cb}`,display:"flex",alignItems:"center",gap:6}}>
      <span style={{width:3,height:12,borderRadius:2,background:C.acc,display:"inline-block"}}/>
      {text}
    </div>
  );
}
function Mod({onClose,title,sub,children}){
  return (<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(2px)"}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:520,maxHeight:"92vh",overflowY:"auto",padding:22,boxShadow:C.sh2,animation:"sU .22s ease"}}>
      <style>{`@keyframes sU{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div style={{width:36,height:4,borderRadius:2,background:C.cb,margin:"0 auto 18px"}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
        <div><div style={{color:C.text,fontWeight:700,fontSize:17}}>{title}</div>{sub&&<div style={{color:C.muted,fontSize:12,marginTop:3}}>{sub}</div>}</div>
        <button onClick={onClose} style={{background:C.bg,border:`1px solid ${C.cb}`,color:C.muted,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
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
    <div style={{background:`linear-gradient(135deg,${C.nav} 0%,#1E293B 100%)`,borderRadius:16,padding:"20px 20px",marginBottom:18,boxShadow:C.sh2}}>
      <div style={{color:"#F1F5F9",fontWeight:700,fontSize:20,marginBottom:3}}>Good morning, {currentUser.split(" ")[0]}! 👋</div>
      <div style={{color:"#94A3B8",fontSize:12,marginBottom:12}}>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <span style={{background:"rgba(99,102,241,0.25)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:6,padding:"3px 10px",color:"#A5B4FC",fontSize:11,fontWeight:600}}>TANSHA HOSPITALITY</span>
        <span style={{background:"rgba(16,185,129,0.2)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:6,padding:"3px 10px",color:"#6EE7B7",fontSize:11,fontWeight:600}}>17 Members</span>
        <span style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,padding:"3px 10px",color:"#E2E8F0",fontSize:11,fontWeight:600}}>{role}</span>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
      {stats.filter(s=>ACCESS[role]?.includes(s.m)).map(s=><div key={s.l} onClick={()=>onNav(s.m)} style={{background:C.card,border:`1px solid ${C.cb}`,borderRadius:14,padding:"16px 14px",cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:C.sh,transition:"box-shadow .15s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow=C.sh2;e.currentTarget.style.borderColor=s.c+"55";}} onMouseLeave={e=>{e.currentTarget.style.boxShadow=C.sh;e.currentTarget.style.borderColor=C.cb;}}>
        <div style={{position:"absolute",top:-10,right:-10,fontSize:48,opacity:.05}}>{s.i}</div>
        <div style={{width:36,height:36,borderRadius:10,background:s.c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:10}}>{s.i}</div>
        <div style={{color:s.c,fontWeight:800,fontSize:22,lineHeight:1}}>{s.v}</div>
        <div style={{color:C.muted,fontSize:11,fontWeight:500,marginTop:4}}>{s.l}</div>
      </div>)}
    </div>
    <Card><SL text="Recent Activity"/>
      {activity.map((a,i)=><div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:i<activity.length-1?`1px solid ${C.bg}`:""}}><div style={{width:34,height:34,borderRadius:9,background:a.c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{a.i}</div><div style={{flex:1}}><div style={{color:C.text,fontSize:13,fontWeight:500}}>{a.t}</div><div style={{color:C.dim,fontSize:11,marginTop:2}}>{a.time} ago</div></div></div>)}
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
const OP=[
{n:"ALASKA BANANA SPLIT DISH",a:"P00116",p:1149,g:18},{n:"ALASKA ICE CREAM CUP 205 ML",a:"P00115",p:974,g:18},{n:"ALASKA SODA CUP 355 ML",a:"P00415",p:1928,g:18},{n:"ALASKA SUNDAE CUP 225 ML",a:"P00315",p:1169,g:18},
{n:"ALLURE BORDEAUX 620 ML",a:"032A22",p:2298,g:18},{n:"ALLURE SPARKLING 220 ML",a:"032F08",p:2064,g:18},{n:"ALLURE UNIVERSAL 435 ML",a:"032R15",p:2064,g:18},
{n:"ALOHA 09 280 ML",a:"B01709",p:682,g:18},{n:"ALOHA 12 360 ML",a:"B01712",p:721,g:18},
{n:"ASSURANCE BOWL 5.75\" (6 PCS)",a:"P00724",p:818,g:18},{n:"ASSURANCE BOWL 4.5\" (6 PCS)",a:"P00723",p:643,g:18},{n:"ASSURANCE BOWL 7\" (6 PCS)",a:"P00725",p:1266,g:18},
{n:"BANQUET WATER GOBLET 308 ML",a:"1500G11",p:1149,g:18},{n:"BAVARIA 16 455 ML",a:"B03616",p:740,g:18},
{n:"BELLY MUG 365 ML",a:"P04340",p:1500,g:18},{n:"BELLY PILSNER 410 ML",a:"B25414",p:1539,g:18},{n:"BELLY TUMBLER 355 ML",a:"B25412",p:799,g:18},
{n:"BERLINER BEER MUG 365 ML",a:"P00940",p:2084,g:18},
{n:"BISTRO CARAFE 290 ML",a:"V13610",p:1130,g:18},{n:"BISTRO CARAFE 610 ML",a:"V13621",p:1363,g:18},{n:"BISTRO CARAFE 940 ML",a:"V13633",p:2123,g:18},
{n:"BONDI DOUBLE ROCK 360 ML",a:"B25312",p:1110,g:18},{n:"BONDI HI BALL 380 ML",a:"B25313",p:1110,g:18},{n:"BONDI ROCK 280 ML",a:"B25310",p:1032,g:18},
{n:"CAFFE AMERICANO 355 ML",a:"P02440",p:1208,g:18},{n:"CAFFE CAPPUCCINO 195 ML",a:"P02441",p:1149,g:18},{n:"CAFFE ESPRESSO 70 ML",a:"P02442",p:877,g:18},{n:"CAFFE EXPRESSO SAUCER 4.75\"",a:"P02472",p:701,g:18},{n:"CAFFE LATTE 260 ML",a:"P02443",p:1208,g:18},{n:"CAFFE LATTE MODERNO 280 ML",a:"P02407",p:993,g:18},{n:"CAFFE SAUCER 5.75\"",a:"P02471",p:877,g:18},
{n:"CENTIQUE DOUBLE ROCK 345 ML",a:"P03161",p:974,g:18},{n:"CENTIQUE HI BALL 370 ML",a:"P03162",p:1149,g:18},{n:"CENTIQUE ROCK 245 ML",a:"P03160",p:838,g:18},
{n:"CENTRA HI BALL 300 ML",a:"P01961",p:799,g:18},{n:"CENTRA LONG DRINK 420 ML",a:"P01962",p:935,g:18},{n:"CENTRA LONG DRINK 495 ML",a:"P01963",p:1110,g:18},{n:"CENTRA ROCK 200 ML",a:"P01964",p:507,g:18},{n:"CENTRA ROCK 300 ML",a:"P01960",p:799,g:18},
{n:"CHARISMA LONG DRINK 415 ML",a:"B17115",p:896,g:18},{n:"CHARISMA ROCK 340 ML",a:"B17112",p:838,g:18},
{n:"CLASSIC BEER 420 ML",a:"1501B15",p:1344,g:18},{n:"CLASSIC BRANDY 255 ML",a:"1501X09",p:1149,g:18},{n:"CLASSIC BRANDY 340 ML",a:"1501X12",p:1266,g:18},{n:"CLASSIC COCKTAIL 140 ML",a:"1501C05",p:1227,g:18},{n:"CLASSIC COCKTAIL 95 ML",a:"1501C03",p:1227,g:18},{n:"CLASSIC FLUTE CHAMPAGNE 185 ML",a:"1501F07",p:1149,g:18},{n:"CLASSIC JUICE 310 ML",a:"1501J11",p:1266,g:18},{n:"CLASSIC LIQUEUR 30 ML",a:"1501L01",p:916,g:18},{n:"CLASSIC LIQUEUR 60 ML",a:"1501L02",p:1149,g:18},{n:"CLASSIC MARGARITA 200 ML",a:"1501M07",p:1266,g:18},{n:"CLASSIC RED WINE 230 ML",a:"1501R08",p:1149,g:18},{n:"CLASSIC SAUCER CHAMPAGNE 135 ML",a:"1501S05",p:1149,g:18},{n:"CLASSIC SAUCER CHAMPAGNE 200 ML",a:"1501S07",p:1149,g:18},{n:"CLASSIC SHERRY 130 ML",a:"1501P04",p:1149,g:18},{n:"CLASSIC WATER GOBLET 350 ML",a:"1501G12",p:1266,g:18},{n:"CLASSIC WHITE WINE 195 ML",a:"1501W07",p:1149,g:18},
{n:"COASTER 3.375\" (12 PCS)",a:"P00911",p:936,g:18},
{n:"CONICAL SUPER 285 ML",a:"B01010",p:604,g:18},{n:"CONICAL SUPER 425 ML",a:"B01015",p:662,g:18},{n:"CONICAL SUPER 620 ML",a:"B01022",p:857,g:18},
{n:"CONNEXION COCKTAIL 215 ML",a:"1527C07",p:2084,g:18},{n:"CONNEXION CONDIMENT BOWL 255 ML",a:"P02820",p:1091,g:18},{n:"CONNEXION COUPE 215 ML",a:"1527S07",p:2084,g:18},{n:"CONNEXION DOUBLE ROCK 350 ML",a:"1P02807",p:1071,g:18},{n:"CONNEXION GIN COCKTAILS 600 ML",a:"1527D21",p:2181,g:18},{n:"CONNEXION HI BALL 350 ML",a:"P02808",p:1071,g:18},{n:"CONNEXION LONG DRINK 430 ML",a:"P02809",p:1266,g:18},{n:"CONNEXION MIXING GLASS 625 ML",a:"P02810",p:2558,g:18},{n:"CONNEXION WHISKY ROCK 305 ML",a:"P02880",p:1149,g:18},
{n:"CRAFTSMAN STEMWARE 390 ML",a:"1529B14",p:1655,g:18},{n:"CRAFTSMAN TUMBLER 565 ML",a:"B23220",p:1247,g:18},
{n:"CUBA HURRICANE 450 ML",a:"1522H16",p:2395,g:18},{n:"CUBA POCO GRANDE 350 ML",a:"1522H12",p:1324,g:18},{n:"CUBA ROCK 270 ML",a:"J14209",p:760,g:18},
{n:"DELIGHT BANANA SPLIT DISH",a:"P02616",p:1305,g:18},{n:"DELIGHT ICE CREAM CUP 5.5\"",a:"P02615",p:1130,g:18},{n:"DELIGHT SUNDAE CUP 5.25 OZ",a:"P02617",p:1130,g:18},{n:"DELIGHT SUNDAE CUP 6.75\"",a:"P02618",p:1266,g:18},
{n:"DIAMOND BOWL 5\"",a:"P00123",p:701,g:18},{n:"DIAMOND BOWL 8\"",a:"P00124",p:1441,g:18},
{n:"DIVANO PITCHER 1660 ML",a:"V20558",p:860,g:18},
{n:"DUCHESS COCKTAIL 210 ML",a:"1503C07",p:1402,g:18},{n:"DUCHESS FLUTE CHAMPAGNE 165 ML",a:"1503F06",p:1461,g:18},{n:"DUCHESS RED WINE 255 ML",a:"1503R09",p:1461,g:18},{n:"DUCHESS WATER GOBLET 350 ML",a:"1503G12",p:1461,g:18},{n:"DUCHESS WHITE WINE 200 ML",a:"1503W07",p:1461,g:18},
{n:"ETHAN DOUBLE ROCK 360 ML",a:"B21413",p:896,g:18},{n:"ETHAN LONG DRINK 445 ML",a:"B21416",p:896,g:18},{n:"ETHAN ROCK 265 ML",a:"B21409",p:764,g:18},
{n:"FIN LINE HI BALL 280 ML",a:"B01210",p:565,g:18},{n:"FIN LINE HI BALL 355 ML",a:"B01213",p:643,g:18},{n:"FIN LINE JUICE 175 ML",a:"B01206",p:468,g:18},
{n:"FINE DRINK LONG DRINK 380 ML",a:"B01913",p:624,g:18},{n:"FINE DRINK LONG DRINK 485 ML",a:"B01916",p:624,g:18},
{n:"FYN DOUBLE ROCK 395 ML",a:"C24014",p:1208,g:18},{n:"FYN HI BALL 350 ML",a:"C24012",p:974,g:18},{n:"FYN LONG DRINK 460 ML",a:"C24016",p:1208,g:18},{n:"FYN ROCK 290 ML",a:"C24010",p:974,g:18},
{n:"GATSBY BLUE ROCK 350 ML",a:"4GB005A113O01",p:2240,g:18},{n:"GATSBY GREEN ROCK 350 ML",a:"4GB005A113O03",p:2240,g:18},{n:"GATSBY VIOLET ROCK 350 ML",a:"4GB005A113O02",p:2240,g:18},
{n:"HAIKU SHOT 60 ML (6 PCS)",a:"B17202",p:546,g:18},
{n:"HANSA LONG DRINK 375 ML",a:"B07713",p:721,g:18},{n:"HANSA ROCK 300 ML",a:"B07711",p:643,g:18},
{n:"HIGH BALL 245 ML",a:"B01408",p:487,g:18},
{n:"IMPERIAL 350 ML",a:"B13412",p:721,g:18},{n:"IMPERIAL 475 ML",a:"R00216",p:1344,g:18},{n:"IMPERIAL 545 ML",a:"R00219",p:1402,g:18},
{n:"IRIS HI BALL 370 ML",a:"C13013",p:1149,g:18},{n:"IRIS ROCK 320 ML",a:"C13011",p:1091,g:18},
{n:"IVORY HI BALL 370 ML",a:"B13013",p:760,g:18},{n:"IVORY HI BALL GOLD 370 ML",a:"B13013G",p:1095,g:18},{n:"IVORY HI BALL PLATINUM 370 ML",a:"B13013P",p:1095,g:18},{n:"IVORY LONG DRINK 460 ML",a:"B13016",p:818,g:18},{n:"IVORY ROCK 265 ML",a:"B13009",p:701,g:18},{n:"IVORY ROCK 320 ML",a:"B13011",p:760,g:18},{n:"IVORY ROCK GOLD 320 ML",a:"B13011G",p:1095,g:18},{n:"IVORY ROCK PLATINUM 320 ML",a:"B13011P",p:1095,g:18},
{n:"JUBILEE HI BALL 335 ML",a:"B22711",p:935,g:18},{n:"JUBILEE ROCK 340 ML",a:"B22712",p:877,g:18},
{n:"KENYA CAPPUCCINO CUP 245 ML",a:"P01641",p:1052,g:18},{n:"KENYA CAPPUCCINO SAUCER 6\"",a:"P01671",p:799,g:18},{n:"KENYA ESPRESSO CUP 65 ML",a:"P01642",p:799,g:18},{n:"KENYA ESPRESSO SAUCER 4.25\"",a:"P01672",p:662,g:18},{n:"KENYA IRISH COFFEE MUG 230 ML",a:"P01643",p:1578,g:18},{n:"KENYA MUG 320 ML",a:"P01640",p:1149,g:18},{n:"KENYA SLIM MUG 320 ML",a:"P01644",p:1558,g:18},
{n:"LEXINGTON COCKTAIL 205 ML",a:"1019C07",p:1539,g:18},{n:"LEXINGTON FLUTE CHAMPAGNE 185 ML",a:"1019F06",p:1539,g:18},{n:"LEXINGTON HI BALL 370 ML",a:"1C18513",p:1227,g:18},{n:"LEXINGTON RED WINE 315 ML",a:"1019R11",p:1539,g:18},{n:"LEXINGTON RED WINE 455 ML",a:"1019R16",p:1889,g:18},{n:"LEXINGTON ROCK 345 ML",a:"C18512",p:1208,g:18},{n:"LEXINGTON WATER GOBLET 370 ML",a:"1019G13",p:1539,g:18},{n:"LEXINGTON WHITE WINE 240 ML",a:"1019W08",p:1539,g:18},
{n:"LONG COOL 245 ML",a:"B00208",p:624,g:18},{n:"LONG COOL 315 ML",a:"B00210",p:643,g:18},
{n:"LUGANO BEER MUG 330 ML",a:"P00740",p:1500,g:18},{n:"LYRA JUICE 170 ML",a:"B07206",p:565,g:18},
{n:"MADISON BORDEAUX 600 ML",a:"1015A21",p:2103,g:18},{n:"MADISON BURGUNDY 650 ML",a:"1015D22",p:2103,g:18},{n:"MADISON COCKTAIL 285 ML",a:"1015C10",p:1850,g:18},{n:"MADISON COGNAC 650 ML",a:"1015N22",p:1889,g:18},{n:"MADISON FLUTE CHAMPAGNE 210 ML",a:"1015F07",p:1889,g:18},{n:"MADISON FLUTE CHAMPAGNE PLATINUM",a:"1015F07P",p:1995,g:18},{n:"MADISON HI BALL 390 ML",a:"C18414",p:1441,g:18},{n:"MADISON LIQUEUR 85 ML",a:"1015L03",p:1853,g:18},{n:"MADISON MARGARITA 345 ML",a:"1015M12",p:1967,g:18},{n:"MADISON RED WINE 425 ML",a:"1015R15",p:1889,g:18},{n:"MADISON RED WINE GOLD",a:"1015R15G",p:1995,g:18},{n:"MADISON RED WINE PLATINUM",a:"1015R15P",p:1995,g:18},{n:"MADISON ROCK 395 ML",a:"1C18413",p:1249,g:18},{n:"MADISON STRIPE FLUTE 210 ML",a:"1035F07",p:1967,g:18},{n:"MADISON STRIPE RED WINE 425 ML",a:"1035R15",p:1967,g:18},{n:"MADISON STRIPE WHITE WINE 350 ML",a:"1035W12",p:1967,g:18},{n:"MADISON WATER GOBLET 425 ML",a:"1015G15",p:1753,g:18},{n:"MADISON WHITE WINE 350 ML",a:"1015W12",p:1889,g:18},
{n:"MATTER FIX DOUBLE ROCK 350 ML",a:"P04261",p:1286,g:18},{n:"MATTER FLOW DOUBLE ROCK 350 ML",a:"P04262",p:1286,g:18},{n:"MATTER FRESH DOUBLE ROCK 350 ML",a:"P04263",p:1286,g:18},
{n:"METROPOLITAN 210 ML",a:"B21307",p:585,g:18},{n:"METROPOLITAN 330 ML",a:"B21312",p:740,g:18},{n:"METROPOLITAN 400 ML",a:"B21314",p:993,g:18},{n:"METROPOLITAN 410 ML",a:"B21315",p:1597,g:18},{n:"METROPOLITAN 655 ML",a:"B21323",p:1811,g:18},
{n:"MODULAR HI BALL 460 ML",a:"B24516",p:721,g:18},{n:"MODULAR LONG DRINK 630 ML",a:"B24522",p:896,g:18},
{n:"MUNICH BEER MUG 355 ML",a:"P00840",p:1500,g:18},{n:"MUNICH BEER MUG 640 ML",a:"P00843",p:2337,g:18},
{n:"NEW YORK 205 ML",a:"B07807",p:701,g:18},{n:"NEW YORK 320 ML",a:"B07811",p:701,g:18},{n:"NEW YORK HI BALL 340 ML",a:"B07812",p:701,g:18},
{n:"NOUVEAU MUG 200 ML",a:"P02040",p:993,g:18},{n:"NOUVEAU MUG 315 ML",a:"P02041",p:1188,g:18},
{n:"NOVA 300 ML",a:"B06511",p:662,g:18},
{n:"PATIO HI BALL 290 ML",a:"B18310",p:682,g:18},{n:"PATIO PITCHER 1265 ML",a:"V18344",p:775,g:18},
{n:"PILSNER 200 ML",a:"B00907",p:585,g:18},{n:"PILSNER 300 ML",a:"B00910",p:701,g:18},{n:"PILSNER 315 ML",a:"B05011",p:818,g:18},{n:"PILSNER 340 ML",a:"B00912",p:701,g:18},{n:"PILSNER 400 ML",a:"B00914",p:857,g:18},
{n:"PLAYBOY BEER MUG 357 ML",a:"P00140",p:1500,g:18},
{n:"PLAZA HI BALL 320 ML",a:"B11011",p:818,g:18},{n:"PLAZA LONG DRINK 405 ML",a:"B11014",p:877,g:18},{n:"PLAZA ROCK 195 ML",a:"B11007",p:701,g:18},{n:"PLAZA ROCK 295 ML",a:"B11010",p:818,g:18},{n:"PLAZA SHOT 55 ML (12 PCS)",a:"P00210",p:1364,g:18},
{n:"POP JAR 325 ML GLASS COVER",a:"B02511G",p:1091,g:18},{n:"POP JAR 325 ML WOOD COVER",a:"B02511W",p:1753,g:18},{n:"POP JAR 500 ML GLASS COVER",a:"B02517G",p:1324,g:18},{n:"POP JAR 500 ML WOOD COVER",a:"B02517W",p:1967,g:18},{n:"POP JAR 750 ML GLASS COVER",a:"B02526G",p:1539,g:18},{n:"POP JAR 750 ML WOOD COVER",a:"B02526W",p:2220,g:18},{n:"POP JAR 1000 ML GLASS COVER",a:"B02536G",p:1753,g:18},{n:"POP JAR 1000 ML WOOD COVER",a:"B02536W",p:2356,g:18},
{n:"PULSE DOUBLE ROCK 355 ML",a:"B24612",p:799,g:18},{n:"PULSE HI BALL 285 ML",a:"B24610",p:799,g:18},{n:"PULSE LONG DRINK 370 ML",a:"B24613",p:838,g:18},{n:"PULSE ROCK 235 ML",a:"B24608",p:799,g:18},
{n:"PYRAMID HI BALL 300 ML",a:"B02310",p:682,g:18},{n:"PYRAMID LONG DRINK 380 ML",a:"B02313",p:760,g:18},{n:"PYRAMID ROCK 260 ML",a:"B02309",p:585,g:18},{n:"PYRAMID ROCK 330 ML",a:"B02311",p:682,g:18},
{n:"REYA BOWL 5\" (6 PCS)",a:"P03420",p:779,g:18},{n:"REYA BOWL 8\" (6 PCS)",a:"P03421",p:1578,g:18},{n:"REYA COASTER 4\" (12 PCS)",a:"P03411",p:1130,g:18},{n:"REYA SALAD BOWL 10\" (3 PCS)",a:"P03422",p:1519,g:18},
{n:"RIO MUG 320 ML",a:"P02740",p:1091,g:18},
{n:"ROCK 245 ML",a:"B00209",p:624,g:18},{n:"ROCK 285 ML",a:"B00710",p:624,g:18},
{n:"ROYAL 355 ML",a:"R00312",p:1344,g:18},
{n:"SALSA COCKTAIL 210 ML",a:"1521C07",p:1675,g:18},{n:"SALSA FLUTE CHAMPAGNE 165 ML",a:"1521F06",p:1850,g:18},{n:"SALSA HI BALL 385 ML",a:"B19212",p:955,g:18},
{n:"SAN MARINO DOUBLE ROCK 385 ML",a:"B00414",p:877,g:18},{n:"SAN MARINO HI BALL 290 ML",a:"B00410",p:643,g:18},{n:"SAN MARINO HI BALL 350 ML",a:"B00412",p:701,g:18},{n:"SAN MARINO JUICE 175 ML",a:"B00406",p:585,g:18},{n:"SAN MARINO LONG DRINK 480 ML",a:"B00416",p:877,g:18},{n:"SAN MARINO ROCK 245 ML",a:"B00409",p:662,g:18},{n:"SAN MARINO ROCK 290-300 ML",a:"B00411",p:701,g:18},{n:"SAN MARINO SHOT 65 ML (12 PCS)",a:"P03010",p:1092,g:18},
{n:"SANTE BORDEAUX 595 ML",a:"1026A21",p:2103,g:18},{n:"SANTE BURGUNDY 635 ML",a:"1026D22",p:2103,g:18},{n:"SANTE FLUTE CHAMPAGNE 210 ML",a:"1026F07",p:1889,g:18},{n:"SANTE RED WINE 420 ML",a:"1026R15",p:1889,g:18},{n:"SANTE STEMLESS 455 ML",a:"1C24216",p:1324,g:18},{n:"SANTE WATER GOBLET 405 ML",a:"1026G14",p:1753,g:18},{n:"SANTE WHITE WINE 340 ML",a:"1026W12",p:1889,g:18},
{n:"SCIROCCO LONG DRINK 410 ML",a:"B17014",p:760,g:18},{n:"SCIROCCO ROCK 340 ML",a:"B17012",p:760,g:18},
{n:"SENSATION HI BALL 325 ML",a:"B21611",p:738,g:18},{n:"SENSATION LONG DRINK 390 ML",a:"B21614",p:766,g:18},{n:"SENSATION ROCK 285 ML",a:"B21610",p:738,g:18},
{n:"SOCIETY FLUTE CHAMPAGNE 190 ML",a:"523F07",p:1149,g:18},{n:"SOCIETY GOBLET 345 ML",a:"1523G12",p:1149,g:18},{n:"SOCIETY RED WINE 260 ML",a:"1523R09",p:1149,g:18},{n:"SOCIETY WHITE WINE 210 ML",a:"1523W07",p:1149,g:18},
{n:"SOLO SHOT 60 ML (12 PCS)",a:"P00110",p:1014,g:18},{n:"SONOMA SALAD BOWL 10\" (3 PCS)",a:"P01825",p:1519,g:18},
{n:"SPACE LEAF HI BALL 300 ML",a:"P03861",p:721,g:18},{n:"SPACE STRIPE HI BALL 300 ML",a:"P03862",p:721,g:18},{n:"SPACE WAVE HI BALL 300 ML",a:"P03863",p:721,g:18},
{n:"STACK 245 ML",a:"1B00109",p:507,g:18},{n:"STACK BOWL 4\" (10 CM)",a:"P00623",p:507,g:18},{n:"STACK BOWL 5\" (12.5 CM)",a:"P00624",p:721,g:18},{n:"STACK BOWL 6\"",a:"P00625",p:857,g:18},{n:"STACK NOIR COFFEE MUG 485 ML",a:"P00341",p:1344,g:18},{n:"STACK TEA CUP 200 ML",a:"1P00340",p:1052,g:18},{n:"STACK TEA SAUCER",a:"1P00271",p:760,g:18},
{n:"STUDIO 345 ML",a:"B16112",p:760,g:18},{n:"STUDIO 435 ML",a:"B16115",p:818,g:18},
{n:"SWEET BELL 235 ML",a:"B00808",p:662,g:18},{n:"SWEET BELL 345 ML",a:"B00812",p:662,g:18},
{n:"TANGO 255 ML",a:"B13309",p:721,g:18},{n:"TANGO 315 ML",a:"B13311",p:779,g:18},{n:"TANGO 350 ML",a:"B13312",p:818,g:18},{n:"TANGO 425 ML",a:"B13315",p:838,g:18},
{n:"TEMPO CARAFE 290 ML",a:"B13610",p:877,g:18},{n:"TEMPO CARAFE 610 ML",a:"B13621",p:1188,g:18},{n:"TEMPO CARAFE 970 ML",a:"B13634",p:2123,g:18},
{n:"TERRA PITCHER 1390 ML",a:"B24349H",p:1025,g:18},
{n:"THE PALETTE CHALICE 300 ML",a:"1533E11L",p:2181,g:18},{n:"THE PALETTE COUPE 205 ML",a:"1533S07",p:2298,g:18},{n:"THE PALETTE GIN COCKTAIL 540 ML",a:"1533D19",p:2395,g:18},{n:"THE PALETTE MARTINI 220 ML",a:"1533C07",p:2298,g:18},{n:"THE PALETTE NICK & NORA 190 ML",a:"1533K07",p:2181,g:18},
{n:"TIARA 270 ML",a:"B12009",p:721,g:18},{n:"TIARA 355 ML",a:"B12012",p:682,g:18},{n:"TIARA 365 ML",a:"B12013",p:799,g:18},{n:"TIARA 465 ML",a:"B12016",p:857,g:18},{n:"TIARA FOOTED 395 ML",a:"B17514",p:1422,g:18},
{n:"TOP DRINK 235 ML",a:"B00309",p:624,g:18},{n:"TOP DRINK 305 ML",a:"B00310",p:643,g:18},{n:"TOP DRINK 325 ML",a:"B00311",p:662,g:18},{n:"TOP DRINK 375 ML",a:"B00313",p:662,g:18},{n:"TOP DRINK 625 ML",a:"B00322",p:896,g:18},
{n:"TRAZE FTR DOUBLE ROCK 350 ML",a:"P03663",p:1500,g:18},{n:"TRAZE FTR HI BALL 350 ML",a:"P03666",p:1500,g:18},{n:"TRAZE PRE DOUBLE ROCK 350 ML",a:"P03662",p:1500,g:18},{n:"TRAZE PRE HI BALL 350 ML",a:"P03665",p:1500,g:18},{n:"TRAZE PST DOUBLE ROCK 350 ML",a:"P03661",p:1500,g:18},{n:"TRAZE PST HI BALL 350 ML",a:"P03664",p:1500,g:18},
{n:"TRINITY 305 ML",a:"B19811",p:896,g:18},{n:"TRINITY 380 ML",a:"B19813",p:974,g:18},
{n:"TULIP JAR 350 ML GLASS COVER",a:"B03912",p:1077,g:18},{n:"TULIP JAR 350 ML WOOD COVER",a:"B03912W",p:1706,g:18},{n:"TULIP JAR 510 ML GLASS COVER",a:"B03918",p:1314,g:18},{n:"TULIP JAR 510 ML WOOD COVER",a:"B03918W",p:1901,g:18},{n:"TULIP JAR 780 ML GLASS COVER",a:"B03927",p:1526,g:18},{n:"TULIP JAR 780 ML WOOD COVER",a:"B03927W",p:2152,g:18},
{n:"TWILIGHT BRONZE ROCK 370 ML",a:"4GB005A014C02",p:2700,g:18},{n:"TWILIGHT INDIGO ROCK 370 ML",a:"4GB005A014C01",p:2700,g:18},{n:"TWILIGHT PURPLE ROCK 370 ML",a:"4GB005A014C03",p:2700,g:18},
{n:"UNITY 255 ML",a:"B02109",p:624,g:18},{n:"UNITY 290 ML",a:"B02110",p:643,g:18},{n:"UNITY 370 ML",a:"B02113",p:701,g:18},
{n:"UNO SHOT 35 ML (12 PCS)",a:"P02910",p:974,g:18},
{n:"VERRINE DEEP BOWL 3\"",a:"P03721",p:916,g:18},{n:"VERRINE SHALLOW BOWL 3\"",a:"P03720",p:799,g:18},{n:"VERRINE SHOT 60 ML (12 PCS)",a:"3710",p:1364,g:18},
{n:"VICTORIA 295 ML",a:"B04410",p:662,g:18},
{n:"VINO RED WINE 470 ML",a:"1530R16",p:1286,g:18},{n:"VINO WATER GOBLET 395 ML",a:"1530G14",p:1286,g:18},{n:"VINO WHITE WINE 335 ML",a:"1530W12",p:1052,g:18},
{n:"VIVA FOOTED 420 ML",a:"B16315",p:1811,g:18},
];
const UP=[
{n:"ANTI SKID SERVICE TRAY (RECT 12x16in)",a:"",p:158,g:18},{n:"ANTI SKID SERVICE TRAY (RECT12x16in)BROWN",a:"",p:158,g:18},{n:"ANTI SKID TRAY (RD 14in) BLACK",a:"",p:120,g:18},
{n:"ANTI SKID TRAY (RD 16in) BLACK",a:"",p:175,g:18},{n:"ANTI SKID TRAY (RD 16in) BROWN",a:"",p:175,g:18},{n:"ANTI SKID TRAY (RD 18in) BROWN",a:"",p:268,g:18},
{n:"UKIYO A.SKID TRAY BLACK-OVAL 25in",a:"OVAL 25in",p:550,g:18},{n:"UKIYO A.SKID TRAY BLACK-OVAL 27in",a:"OVAL 27in",p:600,g:18},{n:"UKIYO A.SKID TRAY BLACK-OVAL 29in",a:"OVAL 29in",p:750,g:18},
{n:"UKIYO A.SKID TRAY BLACK-RD 11in",a:"RD 11in",p:120,g:18},{n:"UKIYO A.SKID TRAY BLACK-RD 14in",a:"RD 14in",p:130,g:18},{n:"UKIYO A.SKID TRAY BLACK-RD 16in",a:"RD 16in",p:210,g:18},
{n:"UKIYO A.SKID TRAY BLACK-RECT 12x16in",a:"RECT 12x16in",p:190,g:18},{n:"UKIYO A.SKID TRAY BLACK-RECT 14x18in",a:"RECT 14x18in",p:245,g:18},{n:"UKIYO A.SKID TRAY BLACK-RECT 15x20in",a:"RECT 15x20in",p:290,g:18},
{n:"UKIYO A.SKID TRAY BLACK-RECT 16x22in",a:"RECT 16x22in",p:380,g:18},{n:"UKIYO A.SKID TRAY BLACK-RECT 18x26in",a:"RECT 18x26in",p:478,g:18},{n:"UKIYO A.SKID TRAY BROWN-OVAL 25in",a:"OVAL 25inBR",p:550,g:18},
{n:"UKIYO A.SKID TRAY BROWN-OVAL 27in",a:"OVAL 27inBR",p:600,g:18},{n:"UKIYO A.SKID TRAY BROWN-OVAL 29in",a:"OVAL 29inBR",p:750,g:18},{n:"UKIYO A.SKID TRAY BROWN-RD 11in",a:"RD 11inBR",p:100,g:18},
{n:"UKIYO A.SKID TRAY BROWN-RD 14in",a:"RD 14inBR",p:110,g:18},{n:"UKIYO A.SKID TRAY BROWN-RD 16in",a:"RD 16inBR",p:150,g:18},{n:"UKIYO A.SKID TRAY BROWN-RECT 12x16in",a:"RECT 12x16inBR",p:150,g:18},
{n:"UKIYO A.SKID TRAY BROWN-RECT 15x20in",a:"RECT 15x20inBR",p:216,g:18},{n:"UKIYO A.SKID TRAY BROWN-RECT 16x22in",a:"RECT 16x22inBR",p:312,g:18},{n:"UKIYO A.SKID TRAY BROWN-RECT 18x26in",a:"RECT 18x26inBR",p:478,g:18},
{n:"UKIYO B.BASKET RD 30cm PRM",a:"RD 30cm PRM",p:335,g:18},{n:"UKIYO B.BASKET BLACK OVAL 25x19CM",a:"BL-.25x19CM",p:120,g:18},{n:"UKIYO B.BASKET BLACK RD 22CM",a:"BL-.22CM",p:120,g:18},
{n:"UKIYO B.BASKET BLACK RECT 25x19CM",a:"BL-25x19CM",p:120,g:18},{n:"UKIYO B.BASKET BLACK SQUARE 22CM",a:"BL-22CM",p:120,g:18},{n:"UKIYO B.BASKET BROWN OVAL BIG",a:"BR OVAL BIG",p:100,g:18},
{n:"UKIYO B.BASKET BROWN OVAL MED",a:"BR OVAL MED",p:90,g:18},{n:"UKIYO B.BASKET BROWN OVAL SMALL",a:"BR OVAL SMALL",p:80,g:18},{n:"UKIYO B.BASKET BROWN RECT 25x19CM",a:"BR-.25x19CM",p:120,g:18},
{n:"UKIYO B.BASKET BROWN RECT BIG",a:"BR RECT BIG",p:100,g:18},{n:"UKIYO B.BASKET BROWN RECT MED",a:"BR RECT MED",p:90,g:18},{n:"UKIYO B.BASKET BROWN RECT SMALL",a:"BR RECT SMALL",p:80,g:18},
{n:"UKIYO B.BASKET BROWN ROUND BIG",a:"BR RD BIG",p:100,g:18},{n:"UKIYO B.BASKET BROWN ROUND MED",a:"BR RD MED",p:90,g:18},{n:"UKIYO B.BASKET BROWN ROUND SMALL",a:"BR RD SMALL",p:80,g:18},
{n:"UKIYO B.BASKET BROWN SQUARE 22CM",a:"BR-.22CM",p:120,g:18},{n:"UKIYO B.BASKET BROWN SQUARE BIG",a:"BR SQ BIG",p:100,g:18},{n:"UKIYO B.BASKET BROWN SQUARE MED",a:"BR SQ MED",p:90,g:18},
{n:"UKIYO B.BASKET BROWN SQUARE SMALL",a:"BR SQ SMALL",p:80,g:18},{n:"UKIYO B.BASKET CREAM OVAL BIG",a:"CR OVAL BIG",p:100,g:18},{n:"UKIYO B.BASKET CREAM OVAL MED",a:"CR OVAL MED",p:90,g:18},
{n:"UKIYO B.BASKET CREAM OVAL SMALL",a:"CR OVAL SMALL",p:80,g:18},{n:"UKIYO B.BASKET CREAM RECT BIG",a:"CR RECT BIG",p:100,g:18},{n:"UKIYO B.BASKET CREAM RECT MED",a:"CR RECT MED",p:90,g:18},
{n:"UKIYO B.BASKET CREAM RECT SMALL",a:"CR RECT SMALL",p:80,g:18},{n:"UKIYO B.BASKET CREAM ROUND BIG",a:"CR RD BIG",p:100,g:18},{n:"UKIYO B.BASKET CREAM ROUND MED",a:"CR RD MED",p:90,g:18},
{n:"UKIYO B.BASKET CREAM ROUND SMALL",a:"CR RD SMALL",p:80,g:18},{n:"UKIYO B.BASKET CREAM SQUARE BIG",a:"CR SQ BIG",p:100,g:18},{n:"UKIYO B.BASKET CREAM SQUARE MED",a:"CR SQ MED",p:90,g:18},
{n:"UKIYO B.BASKET CREAM SQUARE SMALL",a:"CR SQ SMALL",p:80,g:18},{n:"UKIYO B.BASKET DUAL COLOUR OVAL BIG",a:"DC OVAL BIG",p:100,g:18},{n:"UKIYO B.BASKET DUAL COLOUR OVAL MED",a:"DC OVAL MED",p:90,g:18},
{n:"UKIYO B.BASKET DUAL COLOUR OVAL SMALL",a:"DC OVAL SMALL",p:80,g:18},{n:"UKIYO B.BASKET DUAL COLOUR RECT BIG",a:"DC RECT BIG",p:100,g:18},{n:"UKIYO B.BASKET DUAL COLOUR RECT MED",a:"DC RECT MED",p:90,g:18},
{n:"UKIYO B.BASKET DUAL COLOUR RECT SMALL",a:"DC RECT SMALL",p:80,g:18},{n:"UKIYO B.BASKET DUAL COLOUR ROUND BIG",a:"DC RD BIG",p:100,g:18},{n:"UKIYO B.BASKET DUAL COLOUR ROUND MED",a:"DC RD MED",p:90,g:18},
{n:"UKIYO B.BASKET DUAL COLOUR ROUND SMALL",a:"DC RD SMALL",p:80,g:18},{n:"UKIYO B.BASKET DUAL COLOUR SQUARE BIG",a:"DC SQ BIG",p:100,g:18},{n:"UKIYO B.BASKET DUAL COLOUR SQUARE MED",a:"DC SQ MED",p:90,g:18},
{n:"UKIYO B.BASKET DUAL COLOUR SQUARE SMALL",a:"DC SQ SMALL",p:80,g:18},{n:"UKIYO B.BASKET RD 25cm",a:"RD 25cm",p:170,g:18},{n:"UKIYO B.BASKET RD 30cm",a:"RD 30cm",p:210,g:18},
{n:"UKIYO B.BASKET RD 35cm",a:"RD 35cm",p:270,g:18},{n:"UKIYO B.BASKET RD 40cm",a:"RD 40cm",p:310,g:18},{n:"UKIYO B.BASKET RECT 30x20cm",a:"30x20cm",p:170,g:18},
{n:"UKIYO B.BASKET RECT 35x25cm",a:"35x25cm",p:210,g:18},{n:"UKIYO B.BASKET RECT 40x30cm",a:"40x30cm",p:270,g:18},{n:"UKIYO B.BASKET RECT 45x35cm",a:"45x35cm",p:310,g:18},
{n:"UKIYO CUTLERY HOLDER (BASKET) 2 SECTION",a:"2SECTION",p:180,g:18},{n:"UKIYO CUTLERY HOLDER (BASKET) 4 SECTION",a:"4SECTION",p:305,g:18},{n:"UKIYO CUTLERY TRAY (BASKET) 4 SECTION",a:"4.SECTION",p:275,g:18},
{n:"CARTINI 4666 TAILOR SCISSOR",a:"4666",p:303,g:18},{n:"CARTINI 4667 MULTIFUNCTIONAL KTC SCISSOR",a:"4667",p:203.83,g:18},{n:"CARTINI 4671 MULTI UTILITY 20SCISSORSSET",a:"4671",p:1566.76,g:18},
{n:"CARTINI 5947 COMFORT LARGE SCISSOR",a:"5947",p:82.64,g:18},{n:"CARTINI 5948 COMFORT SMALL SCISSOR",a:"5948",p:60.6,g:18},{n:"CARTINI 6262 OFFICE SCISSOR",a:"6262",p:206.59,g:18},
{n:"CARTINI 6264 SAFETY SCISSOR",a:"6264",p:110.18,g:18},{n:"CARTINI 6274 KIDS CRAFT SCISSOR-WHITE",a:"W 6274",p:49.58,g:18},{n:"CARTINI 6274 KIDS CRAFT SCISSOR-YELLOW",a:"Y 6274",p:49.58,g:18},
{n:"CARTINI 6376 SALON CUT - S SCISSOR",a:"6376",p:121.2,g:18},{n:"CARTINI 6377 SALON CUT - M SCISSOR",a:"6377",p:137.73,g:18},{n:"CARTINI 6378 SALON CUT - L SCISSOR",a:"6378",p:148.74,g:18},
{n:"CARTINI 6379 FASHION CUT SCISSOR",a:"6379",p:363.59,g:18},{n:"CARTINI 7122 CLASSIC CUT SCISSOR",a:"7122",p:206.59,g:18},{n:"CARTINI 7123 QUICK CUT SCISSOR",a:"7123",p:137.73,g:18},
{n:"CARTINI 7124 FINE CUT SCISSOR",a:"7124",p:82.64,g:18},{n:"CARTINI 7125 STYLISH CUT SCISSOR",a:"7125",p:140.48,g:18},{n:"CARTINI 7126 TRENDY CUT SCISSOR",a:"7126",p:88.14,g:18},
{n:"CARTINI 7127 LEAF CUTTING SCISSORS",a:"7127",p:214.85,g:18},{n:"CARTINI 7128 TRIM CUT SCISSOR",a:"7128",p:77.13,g:18},{n:"CARTINI 7129 NEAT CUT SCCISOR",a:"7129",p:104.67,g:18},
{n:"CARTINI 7130 TIP CUT SCISSOR",a:"7130",p:110.18,g:18},{n:"CARTINI 7131 ALL PURPOSE SCISSOR",a:"7131",p:115.69,g:18},{n:"CARTINI 7132 VERSATILE SCISSOR",a:"7132",p:93.65,g:18},
{n:"CARTINI 7133 EVERDAY SCISSOR",a:"7133",p:57.84,g:18},{n:"CARTINI 7134 PERSONAL SCISSOR",a:"7134",p:38.56,g:18},{n:"CARTINI 7135 LITTLE SCISSOR - GREEN",a:"7135 G",p:44.07,g:18},
{n:"CARTINI 7135 LITTLE SCISSOR - RED",a:"7135 R",p:44.07,g:18},{n:"CARTINI 7135 LITTLE SCISSOR - YELLOW",a:"7135 Y",p:44.07,g:18},{n:"CARTINI 2728 COOKS KNIFE SOFT GRIP",a:"2728",p:208.48,g:18},
{n:"CARTINI 3269 (JAR 24PC) PASTEL KNIFE",a:"3269 B PK PR",p:671.19,g:18},{n:"CARTINI 4531 COOKS CHEF KNIFE SOFT GRIP",a:"4531",p:236.45,g:18},{n:"CARTINI 4532 COOKS CLEAVER KNF SOFT GRIP",a:"4532",p:366.12,g:18},
{n:"CARTINI 4533 CLASSIC BREAD KNIFE (14)in",a:"4533",p:106.79,g:18},{n:"CARTINI 4534 CL BREAD KNF - LARGE (16)in",a:"4534",p:122.04,g:18},{n:"CARTINI 4535 CL BREAD KNIFE PLAIN (16)in",a:"4535",p:122.04,g:18},
{n:"CARTINI 4536 CL BREAD KNIFE LARGE (14)in",a:"4536",p:106.79,g:18},{n:"CARTINI 4537 UTILITY KNIFE SMALL SOFT GR",a:"4537",p:132.21,g:18},{n:"CARTINI 4538 UTLITY KNIFE LARGE SOFT GR",a:"4538",p:157.64,g:18},
{n:"CARTINI 4623 COOKS SALAD KNIFE SOFT GRIP",a:"4623",p:193.22,g:18},{n:"CARTINI 4642 CLASSIC CHEF KNIFE - RED",a:"4642",p:315.27,g:18},{n:"CARTINI 4643 CLASSIC CHEF KNIFE - BLUE",a:"4643",p:315.27,g:18},
{n:"CARTINI 4644 CLASSIC CHEF KNIFE - GREEN",a:"4644",p:315.27,g:18},{n:"CARTINI 4645 CLASSIC CHEF KNIFE SMALL-R",a:"4645",p:244.08,g:18},{n:"CARTINI 4646 CLASSIC CHEF KNIFE SMALL-BL",a:"4646",p:244.08,g:18},
{n:"CARTINI 4647 CLASSIC CHEF KNIFE SMALL-G",a:"4647",p:244.08,g:18},{n:"CARTINI 4648 CLASSIC CLEAVER KNIFE - RED",a:"4648",p:411.89,g:18},{n:"CARTINI 4649 CLASSIC CLEAVER KNIFE-GREEN",a:"4649",p:411.89,g:18},
{n:"CARTINI 4651 EASY CHOPPING KNIFE - BLACK",a:"4651",p:83.9,g:18},{n:"CARTINI 4652 FINE DICING KNIFE - BLACK",a:"4652",p:106.79,g:18},{n:"CARTINI 4653 PRECISION CARVING KNIFE - B",a:"4653",p:142.38,g:18},
{n:"CARTINI 4654 CLASSIC BREAD KNIFE",a:"4654",p:114.41,g:18},{n:"CARTINI 4655 UTILITY KNIFE SMALL",a:"4655",p:127.13,g:18},{n:"CARTINI 4656 UTILITY KNIFE - LARGE",a:"4656",p:152.55,g:18},
{n:"CARTINI 4657 CLASSIC CHEF KNIFE",a:"4657",p:315.27,g:18},{n:"CARTINI 4658 CLASSIC CLEAVER KNIFE",a:"4658",p:411.89,g:18},{n:"CARTINI 4659 CREATIVE PARING KNIFE",a:"4659",p:66.11,g:18},
{n:"CARTINI 4660 ULTRA EDGE KNIFE SET- BLUE",a:"4660-B",p:111.87,g:18},{n:"CARTINI 4660 ULTRA EDGE KNIFE SET- GREEN",a:"4660-G",p:111.87,g:18},{n:"CARTINI 4660 ULTRA EDGE KNIFE SET- RED",a:"4660-R",p:111.87,g:18},
{n:"CARTINI 4661 PREMIUM KITCHEN KNIVES SET",a:"4661",p:279.68,g:18},{n:"CARTINI 4662 CLASSIC KTCN KNIVES SET RED",a:"4662 R",p:188.15,g:18},{n:"CARTINI 4662 CLASSIC KTCN KNIVES SET-BLU",a:"4662 B",p:188.15,g:18},
{n:"CARTINI 4662 CLASSIC KTCN KNIVES SET-GRE",a:"4662 G",p:188.15,g:18},{n:"CARTINI 4663 EASY KNIFE-L(6PC)(R/G/Y)",a:"4663RGY",p:274.59,g:18},{n:"CARTINI 4668 STEAK KNIFE",a:"4668",p:76.28,g:18},
{n:"CARTINI 4669 CLASSIC BREAD KNIFE 16in",a:"4669",p:122.04,g:18},{n:"CARTINI 4672 SMART PEELER(6PC)(R/G/B)",a:"4672RGB",p:213.57,g:18},{n:"CARTINI 4682 SMART PEEL-SER(6PC)(R/G/B)",a:"4682RGB",p:228.83,g:18},
{n:"CARTINI 4683 CLASSIC CHEF KNIFE - SMALL",a:"4683",p:244.08,g:18},{n:"CARTINI 4684 CLASSIC CLEAVER KNIFE-SMALL",a:"4684",p:137.3,g:18},{n:"CARTINI 4685 4in STRAIGHT SPATULA",a:"4685",p:66.11,g:18},
{n:"CARTINI 4686 7in STRAIGHT SPATULA",a:"4686",p:104.24,g:18},{n:"CARTINI 4687 8.5in OFFSET SPATULA",a:"4687",p:147.47,g:18},{n:"CARTINI 4688 10in OFFSET SPATULA",a:"4688",p:160.18,g:18},
{n:"CARTINI 4760 U.PEELER (6PC SET)",a:"4760 PR B PK",p:306,g:18},{n:"CARTINI 4762 Y-SHAPED PEELER BLUE",a:"4762 BLUE",p:50.85,g:18},{n:"CARTINI 4762 Y-SHAPED PEELER PINK",a:"4762 PINK",p:50.85,g:18},
{n:"CARTINI 4762 Y-SHAPED PEELER PURPLE",a:"4762 PURPLE",p:50.85,g:18},{n:"CARTINI 6253 EASY CHOPPING KNIFE-GREEN",a:"6253",p:83.9,g:18},{n:"CARTINI 6254 EASY CHOPPING KNIFE-YELLOW",a:"6254",p:83.9,g:18},
{n:"CARTINI 6255 EASY CHOPPING KNIFE-RED",a:"6255",p:83.9,g:18},{n:"CARTINI 6256 EASY CHOPPING KNIFE-BLUE",a:"6256",p:83.9,g:18},{n:"CARTINI 6259 DRESSMAKING SCISSOR",a:"6259",p:208.49,g:18},
{n:"CARTINI 6265 CLASSIC DICING KNIFE - BLUE",a:"6265 B",p:63.56,g:18},{n:"CARTINI 6265 CLASSIC DICING KNIFE - RED",a:"6265 R",p:63.56,g:18},{n:"CARTINI 6265 CLASSIC DICING KNIFE -GREEN",a:"6265 G",p:63.56,g:18},
{n:"CARTINI 6266 CLASSIC PARING KNIFE - BLUE",a:"6266 B",p:43.22,g:18},{n:"CARTINI 6266 CLASSIC PARING KNIFE - RED",a:"6266 R",p:43.22,g:18},{n:"CARTINI 6266 CLASSIC PARING KNIFE-GREEN",a:"6266 G",p:43.22,g:18},
{n:"CARTINI 6267 CLASSIC VEG. KNIFE - BLUE",a:"6267 B",p:53.39,g:18},{n:"CARTINI 6267 CLASSIC VEG. KNIFE - GREEN",a:"6267 G",p:53.39,g:18},{n:"CARTINI 6267 CLASSIC VEG. KNIFE - RED",a:"6267 R",p:53.39,g:18},
{n:"CARTINI 6268 CLASSIC SLICING KNIFE - RED",a:"6268 R",p:53.39,g:18},{n:"CARTINI 6268 CLASSIC SLICING KNIFE -BLUE",a:"6268 B",p:53.39,g:18},{n:"CARTINI 6268 CLASSIC SLICING KNIFE-GREEN",a:"6268 G",p:53.39,g:18},
{n:"CARTINI 6269 CLASSIC TOMATO KNIFE - BLUE",a:"6269 B",p:53.39,g:18},{n:"CARTINI 6269 CLASSIC TOMATO KNIFE - RED",a:"6269 R",p:53.39,g:18},{n:"CARTINI 6269 CLASSIC TOMATO KNIFE -GREEN",a:"6269 G",p:53.39,g:18},
{n:"CARTINI 6270 FRUIT KNIFE",a:"6270",p:91.53,g:18},{n:"CARTINI 6272 EASY KNIFE(6PC)(R/G/Y)",a:"6272RGY",p:183.06,g:18},{n:"CARTINI 6273 HANDY KNIFE(6PC)(R/G/Y)",a:"6273RGY",p:183.06,g:18},
{n:"CARTINI 6275 HANDY KNIFE-L(6PC)(R/G/Y)",a:"6275RGY",p:274.59,g:18},{n:"CARTINI 6962 CL BREAD KNIFE 12inSERRATION",a:"6962",p:83.9,g:18},{n:"CARTINI 6963 CL BREAD KNIFE 12in",a:"6963",p:83.9,g:18},
{n:"CARTINI 6969 CL BREAD KNIFE 12inSERRATIO",a:"6969",p:83.9,g:18},{n:"CARTINI 6971 CL CHF KNIFE 10in - RED",a:"6971-RED",p:401.72,g:18},{n:"CARTINI 6972 CL CHF KNIFE 10in - BROWN",a:"6972-BR",p:401.72,g:18},
{n:"CARTINI 6973 CL CHF KNIFE 10in - GREEN",a:"6973-GR",p:401.72,g:18},{n:"CARTINI 6975 CHEESE KNIFE",a:"6975",p:122.03,g:18},{n:"CARTINI 7136 PERFECT PARING KNIFE",a:"7136",p:58.48,g:18},
{n:"CARTINI 7137 EASY CHOPPING KNIFE",a:"7137",p:83.9,g:18},{n:"CARTINI 7138 SWIFT CUTTING KNIFE",a:"7138",p:91.53,g:18},{n:"CARTINI 7139 FINE DICING KNIFE",a:"7139",p:106.79,g:18},
{n:"CARTINI 7140 RED SUPER SLICING KNIFE",a:"R 7140",p:106.79,g:18},{n:"CARTINI 7140 SUPER SLICING KNIFE",a:"7140",p:106.79,g:18},{n:"CARTINI 7141 PRECISION CARVING KNIFE",a:"7141",p:142.38,g:18},
{n:"CARTINI 7143 CREATIVE KITCHEN KNIVES",a:"7143",p:254.25,g:18},{n:"CARTINI 7144 HANDY KNIFE - GREEN",a:"7144 G",p:33.05,g:18},{n:"CARTINI 7144 HANDY KNIFE - RED",a:"7144 R",p:33.05,g:18},
{n:"CARTINI 7144 HANDY KNIFE - YELLOW",a:"7144 Y",p:33.05,g:18},{n:"CARTINI 7150 KITCHEN KNIFE SET",a:"7150",p:167.81,g:18},{n:"CARTINI 7151 EASY KNIFE - GREEN",a:"7151 G",p:33.05,g:18},
{n:"CARTINI 7151 EASY KNIFE - RED",a:"7151 R",p:33.05,g:18},{n:"CARTINI 7151 EASY KNIFE - YELLOW",a:"7151 Y",p:33.05,g:18},{n:"CARTINI 7152 FINE DICING KNIFE - GREEN",a:"7152",p:114.41,g:18},
{n:"CARTINI 7153 FINE DICING KNIFE - YELLOW",a:"7153",p:106.79,g:18},{n:"CARTINI 7154 FINE DICING KNIFE - RED",a:"7154",p:106.79,g:18},{n:"CARTINI 7155 FINE DICING KNIFE - BLUE",a:"7155",p:106.79,g:18},
{n:"CARTINI 7156 FINE DICING KNIFE - WHITE",a:"7156",p:106.79,g:18},{n:"CARTINI 7157 PRECISION CARVING KNIFE - G",a:"7157",p:142.38,g:18},{n:"CARTINI 7158 PRECISION CARVING KNIFE - Y",a:"7158",p:142.38,g:18},
{n:"CARTINI 7159 PRECISION CARVING KNIFE - R",a:"7159",p:142.38,g:18},{n:"CARTINI 7160 PRECISION CARVING KNIFE - B",a:"7160",p:142.38,g:18},{n:"CARTINI 7161 PRECISION CARVING KNIFE - W",a:"7161",p:142.38,g:18},
{n:"CARTINI CLASSIC CHEF KNIFE - WHITE",a:"CCK 34CM WHT",p:315.27,g:18},{n:"CARTINI CLASSIC CHEF KNIFE - YELLOW",a:"CCK 34CM YLW",p:315.27,g:18},{n:"CARTINI CLASSIC CHEF KNIFE SMALL-WHITE",a:"CCK 29CM WHT",p:244.08,g:18},
{n:"CARTINI CLASSIC CHEF KNIFE SMALL-YELLOW",a:"CCK 29CM YLW",p:244.08,g:18},{n:"DIMSUM-SQ-YELLOW  BDR (14.5 CM)",a:"",p:360,g:5},{n:"DIMSUM-SQ-YELLOW  BDR (16.5 CM)",a:"",p:410,g:5},
{n:"DIMSUM-SQ-YELLOW  BDR (19.7 CM)",a:"",p:470,g:5},{n:"DIMSUM-STEEL BDR (16 CM)",a:"",p:286,g:5},{n:"DIMSUM-STEEL BDR (18 CM)",a:"",p:340,g:5},
{n:"DIMSUM-STEEL BDR (19 CM)",a:"",p:374,g:5},{n:"DIMSUM-STEEL BDR (26 CM)",a:"",p:495,g:5},{n:"WC DIMSUM RD S.S. RIM 12.5CM",a:"DS RD SS 12.5",p:170,g:5},
{n:"WC DIMSUM RD S.S. RIM 14CM",a:"DS RD SS 14",p:180,g:5},{n:"WC DIMSUM RD S.S. RIM 16CM",a:"DS RD SS 16",p:206,g:5},{n:"WC DIMSUM RD S.S. RIM 18CM",a:"DS RD SS 18",p:215,g:5},
{n:"WC DIMSUM RD S.S. RIM 19CM",a:"DS RD SS 19",p:220,g:5},{n:"WC DIMSUM RD S.S. RIM 21.5CM",a:"DS RD SS 21.5",p:250,g:5},{n:"WC DIMSUM RD S.S. RIM 24CM",a:"DS RD SS 24",p:300,g:5},
{n:"WC DIMSUM RD S.S. RIM 25.5CM",a:"DS RD SS 25.5",p:320,g:5},{n:"WC DIMSUM RD S.S. RIM 29.5CM",a:"DS RD SS 29.5",p:340,g:5},{n:"WC DIMSUM RD YELLOW RIM 12CM",a:"DS RD YR 12",p:160,g:5},
{n:"WC DIMSUM RD YELLOW RIM 13CM",a:"DS RD YR 13",p:170,g:5},{n:"WC DIMSUM RD YELLOW RIM 14.5CM",a:"DS RD YR 14.5",p:175,g:5},{n:"WC DIMSUM RD YELLOW RIM 16.5CM",a:"DS RD YR 16.5",p:180,g:5},
{n:"WC DIMSUM RD YELLOW RIM 18CM",a:"DS RD YR 18",p:214,g:5},{n:"WC DIMSUM RD YELLOW RIM 20CM",a:"DS RD YR 20",p:200,g:5},{n:"WC DIMSUM RD YELLOW RIM 22CM",a:"DS RD YR 22",p:230,g:5},
{n:"WC DIMSUM RD YELLOW RIM 24CM",a:"DS RD YR 24",p:280,g:5},{n:"WC DIMSUM RD YELLOW RIM 25.5CM",a:"DS RD YR 25.5",p:315,g:5},{n:"WC DIMSUM RD YELLOW RIM 30CM",a:"DS RD YR 30",p:400,g:5},
{n:"WC DIMSUM SQ 09.5CM",a:"DS SQ 09.5",p:380,g:5},{n:"WC DIMSUM SQ 12CM",a:"DS SQ 12",p:400,g:5},{n:"WC DIMSUM SQ 14.5CM",a:"DS SQ 14.5",p:410,g:5},
{n:"WC DIMSUM SQ 16.5CM",a:"DS SQ 16.5",p:430,g:5},{n:"WC DIMSUM SQ 19.5CM",a:"DS SQ 19.5",p:480,g:5},{n:"WC DIMSUM SQ 22CM",a:"DS SQ 22",p:520,g:5},
{n:"WC DIMSUM SQ 24.5CM",a:"DS SQ 24.5",p:580,g:5},{n:"WC DIMSUM SQ 27CM",a:"DS SQ 27",p:700,g:5},{n:"WC DIMSUM SQ 30CM",a:"DS SQ 30",p:800,g:5},
{n:"WC DIMSUM SQ 32CM",a:"DS SQ 32",p:1000,g:5},{n:"WC DIMSUM SQ YELLOW RIM 14.5CM",a:"DS SQ YR 14.5",p:300,g:5},{n:"WC DIMSUM SQ YELLOW RIM 16.5CM",a:"DS SQ YR 16.5",p:350,g:5},
{n:"WC DIMSUM SQ YELLOW RIM 18CM",a:"DS SQ YR 18",p:350,g:5},{n:"WC DIMSUM SQ YELLOW RIM 20CM",a:"DS SQ YR 20",p:400,g:5},{n:"WC DIMSUM SQ YELLOW RIM 22CM",a:"DS SQ YR 22",p:460,g:5},
{n:"WC PIZZA BAT 20x30 CM",a:"20x30 CM",p:100,g:18},{n:"WC PIZZA BAT 22x32 CM",a:"22x32 CM",p:120,g:18},{n:"WC PIZZA BAT 24x35 CM",a:"24x35 CM",p:150,g:18},
{n:"WC PIZZA BAT 25x35 CM",a:"25x35 CM",p:180,g:18},{n:"WC PIZZA BAT 27x37 CM",a:"27x37 CM",p:200,g:18},{n:"WC PIZZA BAT 28x40 CM",a:"28x40 CM",p:220,g:18},
{n:"2 HEAD LAMP SS TOP & BOTTON HEATER",a:"",p:15600,g:18},{n:"BEER TOWER 1.5 LTR (SANJIAO)",a:"",p:1320,g:18},{n:"BEER TOWER 3 LTR (SANJIAO)",a:"",p:1548,g:18},
{n:"BULB - ELECTRIC FOOD WARMER",a:"",p:240,g:18},{n:"CAKE DISPLAY ROTARY BIG",a:"",p:53400,g:18},{n:"CEREAL DISP 3.5 LTR KOREAN SINGLE",a:"",p:3000,g:18},
{n:"CEREAL DISP. WOOD SINGLE  3.5LTR",a:"WD 3.5 LTR",p:8000,g:18},{n:"CHAFFING DISH RECT. 9 LTR",a:"",p:5000,g:5},{n:"CHAFFING DISH ROUND 6 LTR",a:"",p:4100,g:5},
{n:"COFFEE URN - PLAIN S.S. 13 LTR",a:"",p:4400,g:5},{n:"COFFEE URN - STRIPES GOLD 13 LTR",a:"13.LTR",p:5470,g:5},{n:"COFFEE URN - STRIPES R.GOLD 13 LTR",a:"13LTR",p:5470,g:5},
{n:"COFFEE URN W/NL LEGS ( 12 LTR )",a:"",p:4200,g:5},{n:"COFFEE URN W/NL LEGS ( 19 LTR )",a:"",p:7800,g:5},{n:"DESKTOP BOTTLE FRIDGE",a:"",p:27600,g:18},
{n:"DIGITAL CHAFER SQUARE R GOLD",a:"",p:9000,g:18},{n:"ELECTRIC 1-H LAMP WARMER W/O BULB (R.G)",a:"(R.GOLD)",p:5235,g:18},{n:"ELECTRIC 1-H LAMP WARMER W/O BULB (SS)",a:"(S.S)",p:4500,g:18},
{n:"ELECTRIC 4 SLICE TOASTER..",a:"",p:5100,g:18},{n:"ELECTRIC 6 SLICE TOASTER",a:"",p:6300,g:18},{n:"ELECTRIC BAIN MARIE 1/2 PAN",a:"",p:5220,g:18},
{n:"ELECTRIC BAIN MARIE 4 PAN",a:"",p:7920,g:18},{n:"ELECTRIC BUFFET SER/WARM 2 PAN (22XYAA)",a:"22XYAA",p:1178,g:5},{n:"ELECTRIC BUFFET SER/WARM 3 PAN (33ABXX)",a:"33ABXX",p:1488,g:5},
{n:"ELECTRIC BUFFET SER/WARM 3 PAN (33XYBB)",a:"33XYBB",p:1582,g:5},{n:"ELECTRIC CAKE TURN MACHINE",a:"",p:29400,g:18},{n:"ELECTRIC CHAFER RECT 1/3 PAN & PC LID",a:"",p:6000,g:18},
{n:"ELECTRIC CHOCO FOUNTAIN 5 TIER ( SS )",a:"",p:27000,g:18},{n:"ELECTRIC CHOCO MELTING MACHINE  2KG",a:"",p:3540,g:18},{n:"ELECTRIC COFFEE MAKER (ALUMINIUM)",a:"",p:1900,g:18},
{n:"ELECTRIC COLD JUICE DISP, DOB 15 LTR X 2",a:"",p:25200,g:18},{n:"ELECTRIC COLD JUICE DISP, SINGLE 15 LTR",a:"",p:19200,g:18},{n:"ELECTRIC COMM HOT PLATE",a:"",p:2100,g:18},
{n:"ELECTRIC CUP WARMER",a:"",p:11100,g:18},{n:"ELECTRIC DONUT WAFFLE MAKER",a:"",p:7800,g:18},{n:"ELECTRIC EGG WAFFLE MAKER",a:"",p:4020,g:18},
{n:"ELECTRIC FIBRE ICE CRUSHER - BLUE",a:"BLUE",p:2700,g:18},{n:"ELECTRIC FIBRE ICE CRUSHER - ORANGE",a:"ORANGE",p:2700,g:18},{n:"ELECTRIC FIBRE ICE CRUSHER - SILVER",a:"SILVER",p:2700,g:18},
{n:"ELECTRIC FOOD RH - 773",a:"",p:13200,g:18},{n:"ELECTRIC FRENCH WAFFLE MAKER",a:"",p:7800,g:18},{n:"ELECTRIC FRY DUMP",a:"",p:6300,g:18},
{n:"ELECTRIC GRIDDLE,  818",a:"",p:5100,g:18},{n:"ELECTRIC GRIDDLE,  818B",a:"",p:5700,g:18},{n:"ELECTRIC HONEY COMB WAFFLE MAKER",a:"",p:10200,g:18},
{n:"ELECTRIC JUICER CENTRIFUGAL ( GENERIC )",a:"",p:4800,g:18},{n:"ELECTRIC LOLY WAFFLE MAKER",a:"",p:7800,g:18},{n:"ELECTRIC MEAT MINCER - 22",a:"",p:18120,g:18},
{n:"ELECTRIC MILK BOILER, 10L W / 5L M",a:"",p:8160,g:18},{n:"ELECTRIC MILK SHAKE MACHINE ( DOUBLE )",a:"",p:7800,g:18},{n:"ELECTRIC MILK SHAKE MACHINE ( SINGLE )",a:"",p:3900,g:18},
{n:"ELECTRIC ORANGE JUICE CITRUS",a:"",p:5400,g:18},{n:"ELECTRIC PAN CAKE MACHINE ( 9 SLOT )",a:"",p:6600,g:18},{n:"ELECTRIC PIZZA OVEN 1 DECK 1 TRAY",a:"",p:16250,g:18},
{n:"ELECTRIC PIZZA OVEN SMALL 16x16",a:"",p:8625,g:18},{n:"ELECTRIC POP CORN MACHINE W GLASS",a:"",p:7800,g:18},{n:"ELECTRIC ROUND ROTARY WAFFLE MAKER",a:"",p:7800,g:18},
{n:"ELECTRIC SAUCE WARMER DOUBLE",a:"",p:8400,g:18},{n:"ELECTRIC SAUCE WARMER TRIPLE",a:"",p:11400,g:18},{n:"ELECTRIC SERIAL WAFFLE MAKER",a:"",p:10200,g:18},
{n:"ELECTRIC SQUARE WAFFLE MAKER ( 2 SLOT )",a:"",p:7800,g:18},{n:"ELECTRIC SQUARE WAFFLE MAKER ( 6 SLOT )",a:"",p:7800,g:18},{n:"ELECTRIC TWISTED POTATO CUTTER",a:"",p:7800,g:18},
{n:"ELECTRIC WAFFLE CONE MAKER",a:"",p:4020,g:18},{n:"ESPRESSO COFFEE MACHINE",a:"",p:47400,g:18},{n:"GAS COTTON CANDY MACHINE",a:"",p:7800,g:18},
{n:"GRILL PIZZA OVEN SMALL ( GEP - 01A )",a:"",p:6600,g:18},{n:"JUICE DISP. ELECTRIC/GLASS 9 LTR",a:"9 LTR",p:7800,g:18},{n:"JUICE DISP. THERMAL BLACK 12 LTR",a:"",p:1460,g:5},
{n:"JUICE DISP. THERMAL SILVER 12 LTR",a:"",p:1150,g:5},{n:"JUICE DISPENSER 3 TIER STACKABLE 11.8 L",a:"11.8 LTR",p:1770,g:18},{n:"PLANTARY FOOD MIXER B - 10",a:"",p:25200,g:18},
{n:"PLANTARY FOOD MIXER B - 20",a:"",p:30000,g:18},{n:"PLANTARY FOOD MIXER B - 30",a:"",p:37200,g:18},{n:"PLASTIC BEER TOWER  3 LTR",a:"",p:2010,g:18},
{n:"SOUP WARMER - BLACK (SILVER) 11 LTR",a:"BLK - 11LTR",p:3750,g:18},{n:"SOUP WARMER - BLACK 11 LTR",a:"",p:2600,g:18},{n:"SOUP WARMER - BLACK 13 LTR",a:"",p:3260,g:18},
{n:"SOUP WARMER - BLACK PREMIUM 13 LTR",a:"",p:4020,g:18},{n:"SOUP WARMER - HAMMERED GOLD 13 LTR",a:"13 LTR",p:5150,g:18},{n:"SOUP WARMER - HAMMERED R.GOLD 13 LTR",a:"13-LTR",p:5360,g:18},
{n:"SOUP WARMER - RED 11 LTR",a:"",p:2600,g:18},{n:"SOUP WARMER - S.S. 10 LTR",a:"",p:3420,g:18},{n:"SOUP WARMER - S.S. 13 LTR",a:"",p:5000,g:18},
{n:"SOUP WARMER - STRIPES R.GOLD 11 LTR",a:"11 LTR",p:5000,g:18},{n:"SOUP WARMER - STRIPES R.GOLD 13 LTR",a:"13 LTR.",p:5700,g:18},{n:"SOUP WARMER - STRIPES S.S. 11 LTR",a:"11LTR",p:4400,g:18},
{n:"SOUP WARMER - STRIPES S.S. 13 LTR",a:"13. LTR",p:4500,g:18},{n:"SOUP WARMER - YELLOW 11 LTR",a:"YLW - 11LTR",p:3750,g:18},{n:"TROLLEY CLEARANCE / SERVICE",a:"",p:5720,g:18},
{n:"TROLLEY DINING 3 TIER",a:"",p:7500,g:18},{n:"TROLLEY HOUSEKEEPING DOUBLE BAG",a:"BROWN:",p:10000,g:18},{n:"TROLLEY HOUSEKEEPING SINGLE BAG",a:"BROWN'",p:7100,g:18},
{n:"TROLLEY KITCHEN 3 TIER (S.S)",a:"S.S",p:4260,g:18},{n:"TROLLEY SS PLATFORM ( FOLDABALE )",a:"",p:6600,g:18},{n:"CEREAL DISPENSER SINGLE 4 LTR(24-25)",a:"",p:2560,g:18},
{n:"CHEFFO INDUCTION COOKERUNDERCOUNTER2000W",a:"CIUT2000WT",p:15517,g:18},{n:"CHEFFO WOK INDUCTION COOKER 3500 WT",a:"",p:15110,g:18},{n:"CHEFFO-INDUCTION COOKER TABLE TOP 3500 W",a:"CITT3500WT",p:18325,g:18},
{n:"COFFEE URN - S.S. 12 LTR",a:"",p:3500,g:18},{n:"ELECTRIC CONTACT GRILLER,  DOUBLE",a:"",p:10320,g:18},{n:"ELECTRIC CONTACT GRILLER,  JUMBO",a:"",p:5700,g:18},
{n:"ELECTRIC CONTACT GRILLER, SINGLE",a:"",p:5160,g:18},{n:"ELECTRIC D FRYER, D  10 LTR x 2",a:"",p:14280,g:18},{n:"ELECTRIC D FRYER, D  4 LTR X 2",a:"",p:3565,g:18},
{n:"ELECTRIC D FRYER, S  10 LTR",a:"",p:7140,g:18},{n:"INDUCTION COOKER TABLE TOP 3500W",a:"",p:11700,g:18},{n:"INDUCTION T T S.S P.BUTT 3500KW",a:"",p:7000,g:18},
{n:"INDUCTION T T S.S P.BUTT 5000KW",a:"",p:6950,g:18},{n:"INDUCTION TABLE TOP 2500kwTOUCH",a:"",p:3150,g:18},{n:"INDUCTION TABLE TOP FIBRE-KNOB 3500KW",a:"TT3500KW",p:5250,g:18},
{n:"INDUCTION TABLE TOP FIBRE-P.BUTT 3500KW",a:"TT 3500KW",p:5250,g:18},{n:"INDUCTION TABLE TOP S.S P.BUTT 3500KW",a:"TT,3500KW",p:5500,g:18},{n:"INDUCTION TABLE TOP S.S-FL P.BUTT 3500KW",a:"TT.3500KW",p:7000,g:18},
{n:"INDUCTION UNDER-COUNTER 2500KW",a:"UC 2500KW",p:9300,g:18},{n:"INDUCTION UNDER-COUNTER 3500KW",a:"UC 3500KW",p:8640,g:18},{n:"INDUCTION WOK FIBRE-P.BUTT+KADAI 3500KW",a:"WOK.3500KW",p:6500,g:18},
{n:"INDUCTION WOK S.S 3500KW",a:"",p:7000,g:18},{n:"INDUCTION WOK S.S-KNOB+KADAI 3500KW",a:"WOK 3500KW",p:9000,g:18},{n:"INDUCTION WOK S.S-KNOB+KADAI 5000KW",a:"WOK 5000KW",p:11600,g:18},
{n:"JUICE DISPENSER DOUBLE 3x2 LTR",a:"",p:4600,g:18},{n:"JUICE DISPENSER DOUBLE 8x2 LTR",a:"",p:2800,g:18},{n:"JUICE DISPENSER SINGLE 3 LTR",a:"",p:2300,g:18},
{n:"JUICE DISPENSER SINGLE 8 LTR",a:"",p:1425,g:18},{n:"PRIDA INDUCTION COOKER UNDER C SC 2000W",a:"",p:19302,g:18},{n:"PRIDA INDUCTION TABLETOP 3500KW",a:"PITT3500WT",p:22109,g:18},
{n:"SOUP WARMER - BLACK (METAL) 10 LTR",a:"",p:1850,g:18},{n:"WOK INDUCTION COOKER DLX WITH PAN",a:"",p:17800,g:18},{n:"BURGER PRESS SS-14x14CM",a:"",p:390,g:18},
{n:"CREAM WHIPPER 1000 ML",a:"CW 1000",p:1350,g:18},{n:"CREAM WHIPPER 500 ML",a:"CW 500",p:1150,g:18},{n:"CUTTING BOARD SCRAPER (BLUE)",a:"",p:450,g:18},
{n:"CUTTING BOARD SCRAPER (GREEN)",a:"",p:450,g:18},{n:"CUTTING BOARD SCRAPER (RED)",a:"",p:450,g:18},{n:"CUTTING BOARD SCRAPER (YELLOW)",a:"",p:450,g:18},
{n:"DIGITAL THERMOMETER",a:"",p:100,g:18},{n:"FISH SCALE SCRAPPER S.S.",a:"FS-PE9592",p:50,g:18},{n:"FRENCH FRIES CUTTER WOOD",a:"FFC",p:140,g:18},
{n:"FRENCH FRIES KNIFE WOOD",a:"FFK",p:155,g:18},{n:"FRENCH FRY CUTTER BLUE (YH-2006)",a:"B (YH-2006)",p:35,g:18},{n:"FRENCH FRY CUTTER GREEN (YH-2006)",a:"G (YH-2006)",p:35,g:18},
{n:"FRENCH FRY CUTTER ORANGE (YH-2006)",a:"O (YH-2006)",p:35,g:18},{n:"FRENCH FRY CUTTER WHITE (YH-2006)",a:"W (YH-2006)",p:35,g:18},{n:"FROTHER / WHISK (ELECTRIC)",a:"",p:175,g:18},
{n:"GARLIC / GINGER PRESS (S S)",a:"",p:214,g:18},{n:"GLASS CLEANING BRUSH",a:"",p:428,g:18},{n:"ICE CREAM SCOOP (UKIYO-16)",a:"UKIYO-16",p:240,g:5},
{n:"JULIENNE PEELER S.S",a:"",p:60,g:18},{n:"KNIFE SHARPNER (MANUAL)",a:"",p:48,g:18},{n:"MAGNETIC KNIFE BAR 48CM",a:"SUN 48CM",p:140,g:18},
{n:"MAGNETIC KNIFE BAR 54CM",a:"SUN 54CM",p:150,g:18},{n:"MANDOLINE DIAL SLICER",a:"",p:1700,g:18},{n:"MANUAL SS ICE CRUSHER",a:"",p:1380,g:18},
{n:"MUDDLER (S S)",a:"",p:52,g:18},{n:"MULTI GRATER CONE",a:"",p:120,g:5},{n:"MULTI GRATER RECT BLACK",a:"",p:120,g:5},
{n:"MULTI GRTR RECT BLK - WELLMES",a:"",p:204,g:18},{n:"NOODLE/PASTA CUTTER S.S.",a:"",p:90,g:18},{n:"NUT CRACKER AR",a:"",p:110,g:18},
{n:"PEPPER GRINDER (ELECTRIC)",a:"",p:490,g:18},{n:"PEPPER MILLER/CRUSHER 12in",a:"",p:562,g:5},{n:"PEPPER MILLER/CRUSHER 5in(WOOD)",a:"MLY-PY005",p:165,g:18},
{n:"PEPPER MILLER/CRUSHER 6in(WOOD)",a:"MLY-PY006",p:175,g:18},{n:"PIZZA CUTTER - 2.5in (S S)",a:"",p:104,g:18},{n:"PIZZA CUTTER 3.5in BLACK",a:"BLK-PE9686",p:95,g:18},
{n:"PIZZA CUTTER 3.5in BROWN",a:"BRN-PE9686",p:95,g:18},{n:"PIZZA CUTTER 3.5in GREY",a:"GRY-PE9686",p:95,g:18},{n:"PIZZA CUTTER 3.5in RED",a:"RED-PE9686",p:95,g:18},
{n:"PIZZA CUTTER 3.5in WHITE",a:"WHT-PE9686",p:95,g:18},{n:"PIZZA DOCKER 4.5inROLL CRM",a:"CRM HNDLE",p:90,g:18},{n:"PIZZA DOCKER 4.5inROLL GRN",a:"GRN HNDLE",p:90,g:18},
{n:"PIZZA DOCKER 4.5inROLL WHT",a:"WHT HNDLE",p:90,g:18},{n:"POTATO / EGG CUTTER",a:"",p:250,g:18},{n:"POTATO SLICER",a:"H001-PS",p:620,g:18},
{n:"ROSEWOOD BALLER - 1",a:"",p:390,g:5},{n:"ROSEWOOD BALLER - 2",a:"",p:390,g:5},{n:"ROSEWOOD BALLER - 3",a:"",p:390,g:5},
{n:"ROSEWOOD BALLER - 4",a:"",p:390,g:5},{n:"ROSEWOOD CAN OPENER",a:"",p:675,g:5},{n:"ROSEWOOD CITRUS PEELER",a:"",p:390,g:5},
{n:"ROSEWOOD FISH SCRAPPER",a:"",p:390,g:5},{n:"ROSEWOOD PEELER",a:"",p:390,g:5},{n:"SALT & PEPPER MILLER (2 PC SET) WOOD",a:"WOOD",p:582,g:5},
{n:"SHARPENING ROD - 08 INCH",a:"S R 08in",p:100,g:18},{n:"SHARPENING ROD - 10 INCH",a:"S R 10in",p:110,g:18},{n:"SHARPENING STONE - 06 INCH",a:"S S 06in",p:70,g:18},
{n:"SHARPENING STONE - 08 INCH",a:"S S 08in",p:80,g:18},{n:"SILICON BRUSH BLUE 24.5CM",a:"",p:30,g:18},{n:"SILICON BRUSH DARK GREEN",a:"D GREEN",p:24,g:18},
{n:"SILICON BRUSH DARK PINK",a:"D.PINK",p:24,g:18},{n:"SILICON BRUSH GREEN 24.5CM",a:"",p:30,g:18},{n:"SILICON BRUSH GRN-GREY HANDLE",a:"G.-GRY HND",p:70,g:18},
{n:"SILICON BRUSH ORANGE 24.5CM",a:"",p:30,g:18},{n:"SILICON SPATULA BLUE 27.5CM",a:"",p:30,g:18},{n:"SILICON SPATULA DARK PINK",a:"D PINK",p:24,g:18},
{n:"SILICON SPATULA GREEN 27.5CM",a:"",p:30,g:18},{n:"SILICON SPATULA GRN-GREY HANDLE",a:"G-GRY HND",p:70,g:18},{n:"SILICON SPATULA ORANGE 27.5CM",a:"",p:30,g:18},
{n:"SILICON SPATULA PNK-GREY HANDLE",a:"P-GRY HND",p:70,g:18},{n:"SUPER V SLICER-5 FUNCTION",a:"",p:1530,g:18},{n:"TIMER DIGITAL",a:"",p:560,g:18},
{n:"TIMER MECHANICAL",a:"",p:290,g:18},{n:"TONG 7 INCH (S.S)",a:"",p:45,g:18},{n:"TONG 9 INCH (S.S)",a:"",p:55,g:18},
{n:"TONG CLAW (BRONZE)",a:"",p:780,g:18},{n:"TONG PASTRY - SQ (9in R.GOLD)",a:"",p:120,g:18},{n:"TONG PASTRY (10in GOLD)",a:"",p:90,g:18},
{n:"TONG PASTRY (9in R.GOLD)",a:"",p:90,g:18},{n:"TONG SCISSOR (S.S)",a:"",p:260,g:18},{n:"TONG SHELL (9in R.GOLD)",a:"",p:90,g:18},
{n:"TONG SPGHETTY (9in R.GOLD)",a:"",p:90,g:18},{n:"UKIYO AP KNIFE WOODEN HANDLE",a:"",p:60,g:18},{n:"UKIYO BOTTLE OPENER - SMALL",a:"",p:25,g:18},
{n:"UKIYO BOTTLE OPENER (7 INCH)",a:"UKIYO-4",p:40,g:18},{n:"UKIYO BRUSH SIL BLACK",a:"BLK - S04",p:42,g:18},{n:"UKIYO BRUSH SIL+WD",a:"S+W - 010",p:60,g:18},
{n:"UKIYO CAN OPENER/TIN CUTTER",a:"UKIYO-13",p:290,g:18},{n:"UKIYO DUAL BLADE PEELER",a:"UKIYO-5",p:110,g:18},{n:"UKIYO FORK WOODEN HANDLE",a:"",p:60,g:18},
{n:"UKIYO GARLIC / GINGER PRESS",a:"UKIYO-8",p:230,g:18},{n:"UKIYO KITCHEN SCISSOR",a:"UKIYO-23",p:200,g:18},{n:"UKIYO KTCH SCISSOR + COVER",a:"UKIYO-3",p:80,g:18},
{n:"UKIYO LIME SQUEEZER GREEN",a:"UKIYO-27",p:180,g:18},{n:"UKIYO LIME SQUEEZER S.S.",a:"UKIYO-9",p:340,g:18},{n:"UKIYO LIME SQUEEZER YELLOW",a:"UKIYO-28",p:180,g:18},
{n:"UKIYO MEAT HAMMER BLK HNDLE",a:"UKIYO-10",p:230,g:18},{n:"UKIYO MEAT HAMMER SQ ALUM",a:"UKIYO-26",p:120,g:18},{n:"UKIYO MEAT HAMMER SQ MATE",a:"UKIYO-25",p:320,g:18},
{n:"UKIYO MEAT SHREDDER",a:"",p:128,g:18},{n:"UKIYO MUDDLER",a:"UKIYO-20",p:60,g:18},{n:"UKIYO MUDDLER BLACK - 10in",a:"",p:75,g:18},
{n:"UKIYO MUDDLER BLACK - 8in",a:"",p:42,g:18},{n:"UKIYO NUT CRACKER (BLK HNDLE)",a:"UKIYO-24",p:205,g:18},{n:"UKIYO NUT CRACKER (MATE)",a:"UKIYO-11",p:300,g:18},
{n:"UKIYO NUT CRACKER (S.S)",a:"UKIYO-1",p:195,g:18},{n:"UKIYO OPENER(MULTIPURPOSE)BLACK",a:"C-BLACK",p:25,g:18},{n:"UKIYO OPENER(MULTIPURPOSE)BROWN",a:"C-BROWN",p:35,g:18},
{n:"UKIYO PIZZA CTR 7.5CM MATE",a:"UKIYO-31",p:175,g:18},{n:"UKIYO PIZZA CTR 7CM BLK HNDL",a:"UKIYO-7",p:115,g:18},{n:"UKIYO PLASTIC PEELER",a:"",p:35,g:18},
{n:"UKIYO POTATO / EGG CUTTER",a:"UKIYO-12",p:280,g:18},{n:"UKIYO SILICON BRUSH BLUE",a:"SB BLUE",p:70,g:18},{n:"UKIYO SILICON BRUSH GREEN",a:"SB GREEN",p:70,g:18},
{n:"UKIYO SILICON BRUSH PINK",a:"SB PINK",p:70,g:18},{n:"UKIYO SILICON BRUSH PURPLE",a:"SB PURPLE",p:70,g:18},{n:"UKIYO SILICON SPATULA BLUE",a:"SS BLUE",p:70,g:18},
{n:"UKIYO SILICON SPATULA GREEN",a:"SS GREEN",p:70,g:18},{n:"UKIYO SILICON SPATULA PINK",a:"SS PINK",p:70,g:18},{n:"UKIYO SILICON SPATULA PURPLE",a:"SS PURPLE",p:70,g:18},
{n:"UKIYO SINGLE BLADE CURVE PEELER",a:"UKIYO-22",p:120,g:18},{n:"UKIYO SINGLE BLADE PEELER",a:"UKIYO-21",p:120,g:18},{n:"UKIYO SKIMMER SIL+SS",a:"S+S - B09",p:105,g:18},
{n:"UKIYO SOUP LADLE SIL+SS",a:"S+S - B01",p:105,g:18},{n:"UKIYO SOUP LADLE SIL+WD",a:"S+W - 001",p:60,g:18},{n:"UKIYO SPAGHETTI SER. SIL+SS",a:"S+S - B06",p:105,g:18},
{n:"UKIYO SPAGHETTI SER. SIL+WD",a:"S+W - 006",p:60,g:18},{n:"UKIYO SPATULA SIL+WD",a:"S+W - 009",p:60,g:18},{n:"UKIYO SPATULA-1 SIL BLACK",a:"BLK - S01",p:42,g:18},
{n:"UKIYO SPATULA-2 SIL BLACK",a:"BLK - S02",p:44,g:18},{n:"UKIYO SPATULA-3 SIL BLACK",a:"BLK - S03",p:54,g:18},{n:"UKIYO SPOON SER. SIL+SS",a:"S+S - B04",p:105,g:18},
{n:"UKIYO SPOON SER. SIL+WD",a:"S+W - 004",p:60,g:18},{n:"UKIYO SPOON SER. SLOT SIL+SS",a:"S+S - B05",p:105,g:18},{n:"UKIYO SPOON SER. SLOT SIL+WD",a:"S+W - 005",p:60,g:18},
{n:"UKIYO TONG SIL BLACK",a:"S+S - B08",p:105,g:18},{n:"UKIYO TONG SIL GREEN",a:"S+W - 008",p:105,g:18},{n:"UKIYO TURNER SIL+SS",a:"S+S - B02",p:105,g:18},
{n:"UKIYO TURNER SIL+WD",a:"S+W - 002",p:60,g:18},{n:"UKIYO TURNER SLOT BIG SIL+SS",a:"S+S - B10",p:105,g:18},{n:"UKIYO TURNER SLOT SIL+SS",a:"S+S - B03",p:105,g:18},
{n:"UKIYO TURNER SLOT SIL+WD",a:"S+W - 003",p:60,g:18},{n:"UKIYO VEG Y-PEELER",a:"UKIYO-30",p:140,g:18},{n:"UKIYO VEG Y-PEELER BLK HNDLE",a:"UKIYO-6",p:100,g:18},
{n:"UKIYO VEG Y-PEELER CURV HNDL",a:"UKIYO-29",p:115,g:18},{n:"UKIYO WHISK SIL+SS",a:"S+S - B07",p:56,g:18},{n:"UKIYO WHISK SIL+WD",a:"S+W - 007",p:50,g:18},
{n:"ELEGANCE TEA SPOON",a:"",p:532,g:18},{n:"FIESTA A P FORK (DESSERT FORK)",a:"",p:295,g:18},{n:"FIESTA A P KNIFE (DESSERT KNIFE)",a:"",p:608,g:18},
{n:"FIESTA A P SOUP SPOON (CANCEL)",a:"",p:687,g:18},{n:"FIESTA A P SPOON (DESSERT SPOON)",a:"",p:295,g:18},{n:"FIESTA BABY FORK",a:"",p:230,g:18},
{n:"FIESTA BABY SPOON",a:"",p:230,g:18},{n:"FIESTA COFFEE SPOON",a:"",p:170,g:18},{n:"FIESTA ICE CREAM SPOON",a:"",p:208,g:18},
{n:"FIESTA PARFAIT (SODA) SPOON",a:"",p:295,g:18},{n:"FIESTA SOUP SPOON",a:"",p:295,g:18},{n:"FIESTA TABLE S FORK",a:"",p:426,g:18},
{n:"FIESTA TABLE S SPOON",a:"",p:426,g:18},{n:"FIESTA TEA SPOON",a:"",p:208,g:18},{n:"JEWEL TEA SPOON",a:"",p:245,g:18},
{n:"LINEA A P FORK ( DESERT FORK)",a:"",p:295,g:18},{n:"LINEA A P SPOON (DESERT SPOON)",a:"",p:295,g:18},{n:"LINEA BABY SPOON",a:"",p:230,g:18},
{n:"LINEA SOUP SPOON",a:"",p:295,g:18},{n:"LINEA TEA SPOON",a:"",p:208,g:18},{n:"PALIO A P FORK (DESSERT FORK)",a:"",p:250,g:18},
{n:"PALIO A P KNIFE (DESSERT KNIFE)",a:"",p:500,g:18},{n:"PALIO A P SPOON (DESSERT SPOON)",a:"",p:250,g:18},{n:"PALIO BABY FORK",a:"",p:200,g:18},
{n:"PALIO BABY SPOON",a:"",p:200,g:18},{n:"PALIO COFFE SPOON",a:"",p:140,g:18},{n:"PALIO ICE CREAM SPOON",a:"",p:170,g:18},
{n:"PALIO SODA SPOON",a:"",p:250,g:18},{n:"PALIO SOUP SPOON",a:"",p:250,g:18},{n:"PALIO TABLE S FORK",a:"",p:350,g:18},
{n:"PALIO TABLE S SPOON",a:"",p:350,g:18},{n:"PALIO TEA SPOON",a:"",p:170,g:18},{n:"PARKER A P FORK (DESSERT FORK)",a:"",p:530,g:18},
{n:"PARKER A P KNIFE (DESSERT KNIFE)",a:"",p:1412,g:18},{n:"PARKER A P SPOON (DESSERT SPOON)",a:"",p:530,g:18},{n:"PARKER BABY FORK",a:"",p:424,g:18},
{n:"PARKER BABY SPOON",a:"",p:424,g:18},{n:"PARKER COFFEE SPOON",a:"",p:318,g:18},{n:"PARKER PARFAIT SPOON (SODA SPOON)",a:"",p:530,g:18},
{n:"PARKER SOUP SPOON",a:"",p:530,g:18},{n:"PARKER TABLE S FORK",a:"",p:795,g:18},{n:"PARKER TABLE S SPOON",a:"",p:795,g:18},
{n:"PARKER TEA FORK",a:"",p:371,g:18},{n:"PARKER TEA SPOON",a:"",p:371,g:18},{n:"PUNTO A P FORK (DESSERT FORK)",a:"",p:250,g:18},
{n:"PUNTO A P KNIFE (DESSERT KNIFE)",a:"",p:500,g:18},{n:"PUNTO A P SPOON (DESSERT SPOON)",a:"",p:250,g:18},{n:"PUNTO BABY FORK",a:"",p:200,g:18},
{n:"PUNTO BABY SPOON",a:"",p:200,g:18},{n:"PUNTO COFFEE SPOON",a:"",p:140,g:18},{n:"PUNTO ICECREAM SPOON",a:"",p:170,g:18},
{n:"PUNTO PARFAIT SPOON (SODA SPOON)",a:"",p:250,g:18},{n:"PUNTO SOUP SPOON",a:"",p:250,g:18},{n:"PUNTO TABLE S FORK",a:"",p:350,g:18},
{n:"PUNTO TABLE S SPOON",a:"",p:350,g:18},{n:"PUNTO TEA SPOON",a:"",p:170,g:18},{n:"QUEEN/SAFARI 1.6MM A P FORK (DSRT FORK)",a:"",p:250,g:18},
{n:"QUEEN/SAFARI 1.6MM A P KNIFE (DSRT KNIFE",a:"",p:500,g:18},{n:"QUEEN/SAFARI 1.6MM A P SPOON (DSRTSPOON)",a:"",p:250,g:18},{n:"QUEEN/SAFARI 1.6MM BABY FORK",a:"",p:200,g:18},
{n:"QUEEN/SAFARI 1.6MM BABY SPOON",a:"",p:200,g:18},{n:"QUEEN/SAFARI 1.6MM COFFEE SPOON",a:"",p:140,g:18},{n:"QUEEN/SAFARI 1.6MM PARFAIT SPOON (SODA)",a:"",p:250,g:18},
{n:"QUEEN/SAFARI 1.6MM SOUP SPOON",a:"",p:250,g:18},{n:"QUEEN/SAFARI 1.6MM TABLE S FORK",a:"",p:350,g:18},{n:"QUEEN/SAFARI 1.6MM TABLE S SPOON",a:"",p:350,g:18},
{n:"QUEEN/SAFARI 1.6MM TEA SPOON",a:"",p:170,g:18},{n:"SAFARI 2 MM A P FORK (DESSERT FORK)",a:"",p:250,g:18},{n:"SAFARI 2 MM A P KNIFE (DESSERT KNIFE)",a:"",p:500,g:18},
{n:"SAFARI 2 MM A P SPOON (DESSERT SPOON)",a:"",p:250,g:18},{n:"SAFARI 2 MM BABY FORK",a:"",p:200,g:18},{n:"SAFARI 2 MM BABY SPOON",a:"",p:200,g:18},
{n:"SAFARI 2 MM COFFEE SPOON",a:"",p:140,g:18},{n:"SAFARI 2 MM ICE CREAM SPOON",a:"",p:170,g:18},{n:"SAFARI 2 MM PARFAIT (SODA) SPOON",a:"",p:250,g:18},
{n:"SAFARI 2 MM SOUP SPOON",a:"",p:250,g:18},{n:"SAFARI 2 MM TABLE S FORK",a:"",p:350,g:18},{n:"SAFARI 2 MM TABLE S SPOON",a:"",p:350,g:18},
{n:"SAFARI 2 MM TEA SPOON",a:"",p:170,g:18},{n:"STANDARD MURPHY A P FORK (DESSERT FORK)",a:"",p:180,g:18},{n:"STANDARD MURPHY A P KNIFE (DSERT KNIFE)",a:"",p:370,g:18},
{n:"STANDARD MURPHY A P SPOON (DSERT SPOON)",a:"",p:180,g:18},{n:"STANDARD MURPHY BABY FORK",a:"",p:150,g:18},{n:"STANDARD MURPHY BABY SPOON",a:"",p:150,g:18},
{n:"STANDARD MURPHY COFFEE SPOON",a:"",p:100,g:18},{n:"STANDARD MURPHY ICE CREAM SPOON",a:"",p:110,g:18},{n:"STANDARD MURPHY PARFAIT (SODA) SPOON",a:"",p:180,g:18},
{n:"STANDARD MURPHY SOUP SPOON",a:"",p:180,g:18},{n:"STANDARD MURPHY SUGAR SPOON",a:"",p:150,g:18},{n:"STANDARD MURPHY TABLE S FORK",a:"",p:250,g:18},
{n:"STANDARD MURPHY TABLE S SPOON",a:"",p:250,g:18},{n:"STANDARD MURPHY TEA SPOON",a:"",p:110,g:18},{n:"STANDARD SAFARI A P FORK (DESERT FORK)",a:"",p:180,g:18},
{n:"STANDARD SAFARI A P KNIFE (DESERT KNIFE)",a:"",p:370,g:18},{n:"STANDARD SAFARI A P SPOON (DESERT SPOON)",a:"",p:180,g:18},{n:"STANDARD SAFARI BABY FORK",a:"",p:150,g:18},
{n:"STANDARD SAFARI BABY SPOON",a:"",p:150,g:18},{n:"STANDARD SAFARI COFFEE SPOON",a:"",p:100,g:18},{n:"STANDARD SAFARI ICE CREAM SPOON",a:"",p:110,g:18},
{n:"STANDARD SAFARI PARFAIT (SODA) SPOON",a:"",p:180,g:18},{n:"STANDARD SAFARI SOUP SPOON",a:"",p:180,g:18},{n:"STANDARD SAFARI TABLE S FORK",a:"",p:250,g:18},
{n:"STANDARD SAFARI TABLE S SPOON",a:"",p:250,g:18},{n:"STANDARD SAFARI TEA SPOON",a:"",p:110,g:18},{n:"PC GN PAN 1/1 065 MM",a:"N2112",p:362,g:18},
{n:"PC GN PAN 1/1 100MM",a:"N2114",p:450,g:18},{n:"PC GN PAN 1/1 150MM",a:"N2116",p:600,g:18},{n:"PC GN PAN 1/1 200MM",a:"N2118",p:740,g:18},
{n:"PC GN PAN 1/1 LID",a:"N2115",p:280,g:18},{n:"PC GN PAN 1/2 065MM",a:"N2122",p:190,g:18},{n:"PC GN PAN 1/2 100MM",a:"N2124",p:240,g:18},
{n:"PC GN PAN 1/2 150MM",a:"N2126",p:280,g:18},{n:"PC GN PAN 1/2 200MM",a:"N2128",p:360,g:18},{n:"PC GN PAN 1/2 LID",a:"N2129",p:140,g:18},
{n:"PC GN PAN 1/3 100MM",a:"N2134",p:160,g:18},{n:"PC GN PAN 1/3 150MM",a:"N2136",p:240,g:18},{n:"PC GN PAN 1/3 200MM",a:"N2138",p:290,g:18},
{n:"PC GN PAN 1/3 65 MM..",a:"",p:148,g:18},{n:"PC GN PAN 1/3 LID",a:"N2139",p:105,g:18},{n:"PC GN PAN 1/4 100MM",a:"N2144",p:125,g:18},
{n:"PC GN PAN 1/4 150MM",a:"N2146",p:160,g:18},{n:"PC GN PAN 1/4 LID",a:"N2147",p:75,g:18},{n:"PC GN PAN 1/6 065MM",a:"N2162",p:80,g:18},
{n:"PC GN PAN 1/6 100MM",a:"N2164",p:100,g:18},{n:"PC GN PAN 1/6 150MM",a:"N2166",p:120,g:18},{n:"PC GN PAN 1/6 LID",a:"N2167",p:60,g:18},
{n:"PC GN PAN 1/9 065MM",a:"N2192",p:60,g:18},{n:"PC GN PAN 1/9 100MM",a:"N2194",p:70,g:18},{n:"PC GN PAN 1/9 150MM",a:"N2196",p:94,g:18},
{n:"PC GN PAN 1/9 LID",a:"N2197",p:40,g:18},
{n:"SS GN PAN 1/1x020 MM",a:"",p:348,g:5},{n:"SS GN PAN 1/1x040 MM",a:"",p:369,g:5},{n:"SS GN PAN 1/1x065 MM",a:"",p:385,g:5},
{n:"SS GN PAN 1/1x100 MM",a:"",p:425,g:5},{n:"SS GN PAN 1/1x150 MM",a:"",p:540,g:5},{n:"SS GN PAN 1/1x200 MM",a:"",p:742,g:5},
{n:"SS GN PAN 1/2x020 MM",a:"",p:210,g:5},{n:"SS GN PAN 1/2x040 MM",a:"",p:217,g:5},{n:"SS GN PAN 1/2x065 MM",a:"",p:257,g:5},
{n:"SS GN PAN 1/2x100 MM",a:"",p:314,g:5},{n:"SS GN PAN 1/2x150 MM",a:"",p:378,g:5},{n:"SS GN PAN 1/2x200 MM",a:"",p:508,g:5},
{n:"SS GN PAN 1/3x065 MM",a:"",p:215,g:5},{n:"SS GN PAN 1/3x100 MM",a:"",p:257,g:5},{n:"SS GN PAN 1/3x150 MM",a:"",p:336,g:5},
{n:"SS GN PAN 1/3x200 MM",a:"",p:431,g:5},{n:"SS GN PAN 1/4x065 MM",a:"",p:192,g:5},{n:"SS GN PAN 1/4x100 MM",a:"",p:224,g:5},
{n:"SS GN PAN 1/4x150 MM",a:"",p:278,g:5},{n:"SS GN PAN 1/4x200 MM",a:"",p:368,g:5},{n:"SS GN PAN 1/6x065 MM",a:"",p:158,g:5},
{n:"SS GN PAN 1/6x100 MM",a:"",p:196,g:5},{n:"SS GN PAN 1/6x150 MM",a:"",p:252,g:5},{n:"SS GN PAN 1/6x200 MM",a:"",p:355,g:5},
{n:"SS GN PAN 1/9x065 MM",a:"",p:147,g:5},{n:"SS GN PAN 1/9x100 MM",a:"",p:174,g:5},{n:"SS GN PAN 1/9x150 MM",a:"",p:250,g:5},
{n:"SS GN PAN LID 1/1",a:"",p:285,g:5},{n:"SS GN PAN LID 1/2",a:"",p:185,g:5},{n:"SS GN PAN LID 1/3",a:"",p:118,g:5},
{n:"SS GN PAN LID 1/4",a:"",p:105,g:5},{n:"SS GN PAN LID 1/6",a:"",p:73,g:5},{n:"SS GN PAN LID 1/9",a:"",p:67,g:5},
{n:"OVEN GLOVES SILICON 30CM (BLUE)",a:"BLUE-1",p:195,g:18},{n:"OVEN GLOVES SILICON 30CM (L.GREY)",a:"L.GREY-1",p:195,g:18},{n:"OVEN GLOVES SILICON 30CM (PINK)",a:"PINK-1",p:195,g:18},
{n:"SILICON BRUSH COMBI GREEN 100131",a:"100131-G",p:125,g:18},{n:"SILICON BRUSH COMBI GREY 100131",a:"100131-GRY",p:125,g:18},{n:"SILICON BRUSH COMBI PINK 100131",a:"100131-P",p:125,g:18},
{n:"SILICON BRUSH PINK(PLASTIC HANDLE)ZN2202",a:"ZN2202",p:82,g:18},{n:"SILICON DOUGH MAT 11inx16.5in",a:"",p:180,g:18},{n:"SILICON GLOVES BIG - BLUE (1 PAIR)",a:"",p:120,g:18},
{n:"SILICON GLOVES BIG - GREY (1 PAIR)",a:"",p:120,g:18},{n:"SILICON GLOVES BIG - PINK (1 PAIR)",a:"",p:120,g:18},{n:"SILICON GLOVES SMALL - BLUE (1 PAIR)",a:"",p:100,g:18},
{n:"SILICON GLOVES SMALL - GREY (1 PAIR)",a:"",p:100,g:18},{n:"SILICON GLOVES SMALL - PINK (1 PAIR)",a:"",p:100,g:18},{n:"SILICON INSULATED GLOVES",a:"400150",p:152,g:18},
{n:"SILICON LADDLE - DARK GRAY (S-021)",a:"S-021-D.GRY",p:75,g:18},{n:"SILICON LADDLE - GREEN (S-021)",a:"S-021-G",p:75,g:18},{n:"SILICON LADDLE - PURPLE (S-021)",a:"S-021-P",p:75,g:18},
{n:"SILICON SPOON - GREEN (S-044)",a:"S-044-G",p:118,g:18},{n:"SILICON SPOON - GREY (S-044)",a:"S-044-GRY",p:118,g:18},{n:"SILICON SPOON - PINK (S-044)",a:"S-044-P",p:118,g:18},
{n:"SILICON SPOON - PURPLE (S-010)",a:"S-010-P",p:90,g:18},{n:"SILICON SPOON - RED (S-010)",a:"S-010-R",p:90,g:18},{n:"SILICON TURNER - GREEN (S-022)",a:"S-022-G",p:72,g:18},
{n:"SILICON TURNER - GREY (S-022)",a:"S-022-GRY",p:72,g:18},{n:"SILICON TURNER - PINK (S-022)",a:"S-022-PINK",p:72,g:18},{n:"TABLE MATT NO. 101 (6 Pc Pack)",a:"TM-101",p:30,g:18},
{n:"TABLE MATT NO. 102 (6 Pc Pack)",a:"TM-102",p:30,g:18},{n:"TABLE MATT NO. 103 (6 Pc Pack)",a:"TM-103",p:30,g:18},{n:"TABLE MATT NO. 104 (6 Pc Pack)",a:"TM-104",p:30,g:18},
{n:"TABLE MATT NO. 105 (6 Pc Pack)",a:"TM-105",p:30,g:18},{n:"TABLE MATT NO. 106 (6 Pc Pack)",a:"TM-106",p:30,g:18},{n:"TABLE MATT NO. 107 (6 Pc Pack)",a:"TM-107",p:30,g:18},
{n:"TABLE MATT NO. 108 (6 Pc Pack)",a:"TM-108",p:30,g:18},{n:"TABLE MATT NO. 109 (6 Pc Pack)",a:"TM-109",p:30,g:18},{n:"TABLE MATT NO. 110 (6 Pc Pack)",a:"TM-110",p:30,g:18},
{n:"TABLE MATT NO. 111 (6 Pc Pack)",a:"TM-111",p:30,g:18},{n:"TABLE MATT NO. 112 (6 Pc Pack)",a:"TM-112",p:30,g:18},{n:"TABLE MATT NO. 113 (6 Pc Pack)",a:"TM-113",p:30,g:18},
{n:"TABLE MATT NO. 114 (6 Pc Pack)",a:"TM-114",p:30,g:18},{n:"TABLE MATT NO. 115 (6 Pc Pack)",a:"TM-115",p:30,g:18},{n:"TABLE MATT NO. 116 (6 Pc Pack)",a:"TM-116",p:30,g:18},
{n:"TABLE MATT NO. 117 (6 Pc Pack)",a:"TM-117",p:30,g:18},{n:"TABLE MATT NO. 118 (6 Pc Pack)",a:"TM-118",p:30,g:18},{n:"TABLE MATT NO. 119 (6 Pc Pack)",a:"TM-119",p:30,g:18},
{n:"TABLE MATT NO. 120 (6 Pc Pack)",a:"TM-120",p:30,g:18},{n:"TABLE MATT NO. 121 (6 Pc Pack)",a:"TM-121",p:30,g:18},{n:"TABLE MATT NO. 122 (6 Pc Pack)",a:"TM-122",p:30,g:18},
{n:"UKIYO APPLE CORER (TX-17-4)",a:"TX-17-4",p:65,g:18},{n:"UKIYO BASTING SPOON (TX-51-7)",a:"TX-51-7",p:105,g:18},{n:"UKIYO BASTING SPOON PERFORATED (TX-51-8)",a:"TX-51-8",p:105,g:18},
{n:"UKIYO BOTTLE OPENER (TX-16)",a:"TX-16",p:70,g:18},{n:"UKIYO CAKE SERVER (TX-06)",a:"TX-06",p:75,g:18},{n:"UKIYO CAKE SERVER (TX-62)",a:"TX-62",p:85,g:18},
{n:"UKIYO CHEESE SLICER (TX-04)",a:"TX-04",p:90,g:18},{n:"UKIYO DOUGH CUTTER (TX-31)",a:"TX-31",p:80,g:18},{n:"UKIYO DOUGH CUTTER (TX-32)",a:"TX-32",p:80,g:18},
{n:"UKIYO DOUGH CUTTER (TX-33)",a:"TX-33",p:90,g:18},{n:"UKIYO EGG YOLK SEPRATOR (TX-11)",a:"TX-11",p:75,g:18},{n:"UKIYO FISH CLEANER (TX-18)",a:"TX-18",p:80,g:18},
{n:"UKIYO FISH CLEANER (TX-19)",a:"TX-19",p:70,g:18},{n:"UKIYO FISH CLEANER (TX-69)",a:"TX-69",p:80,g:18},{n:"UKIYO FRUIT BALLER (TX-12)",a:"TX-12",p:70,g:18},
{n:"UKIYO FRUIT CARVER (TX-71)",a:"TX-71",p:80,g:18},{n:"UKIYO FRUIT CARVER (TX-72)",a:"TX-72",p:80,g:18},{n:"UKIYO GARLIC PRESS (TX-42)",a:"TX-42",p:135,g:18},
{n:"UKIYO GRATER (TX-39-1)",a:"TX-39-1",p:75,g:18},{n:"UKIYO GRATER (TX-40-3)",a:"TX-40-3",p:90,g:18},{n:"UKIYO GRATER (TX-41-3)",a:"TX-41-3",p:90,g:18},
{n:"UKIYO GRATER (TX-41-4)",a:"TX-41-4",p:90,g:18},{n:"UKIYO GRATER (TX-46-1)",a:"TX-46-1",p:120,g:18},{n:"UKIYO GRATER (TX-46-2)",a:"TX-46-2",p:120,g:18},
{n:"UKIYO GRATER (TX-55)",a:"TX-55",p:85,g:18},{n:"UKIYO ICE CREAM SCOOPER (TX-44)",a:"TX-44",p:60,g:18},{n:"UKIYO MEAT FORK (TX-51-6)",a:"TX-51-6",p:90,g:18},
{n:"UKIYO RICE SERVER (TX-51-9)",a:"TX-51-9",p:90,g:18},{n:"UKIYO SKIMMER NO.1 (TX-54-12)",a:"TX-54-12",p:100,g:18},{n:"UKIYO SKIMMER NO.2 (TX-54-14)",a:"TX-54-14",p:105,g:18},
{n:"UKIYO SKIMMER NO.3 (TX-54-16)",a:"TX-54-16",p:110,g:18},{n:"UKIYO SKIMMER NO.4 (TX-54-18)",a:"TX-54-18",p:115,g:18},{n:"UKIYO SKIMMER NO.5 (TX-54-20)",a:"TX-54-20",p:120,g:18},
{n:"UKIYO SPAGHETI SERVER (TX-51-5)",a:"TX-51-5",p:105,g:18},{n:"UKIYO SPATULA (TX-52-1)",a:"TX-52-1",p:90,g:18},{n:"UKIYO SPATULA (TX-52-2)",a:"TX-52-2",p:95,g:18},
{n:"UKIYO SPATULA (TX-52-3)",a:"TX-52-3",p:100,g:18},{n:"UKIYO SPATULA (TX-53-1)",a:"TX-53-1",p:90,g:18},{n:"UKIYO SPATULA (TX-53-2)",a:"TX-53-2",p:100,g:18},
{n:"UKIYO SPATULA (TX-53-3)",a:"TX-53-3",p:105,g:18},{n:"UKIYO TEA STRAINER (TX-43-1)",a:"TX-43-1",p:105,g:18},{n:"UKIYO TEA STRAINER (TX-43-2)",a:"TX-43-2",p:130,g:18},
{n:"UKIYO TURNER (TX-07)",a:"TX-07",p:75,g:18},{n:"UKIYO VEGETABLE PEELER (TX-21)",a:"TX-21",p:60,g:18},{n:"UKIYO VEGETABLE PEELER (TX-24)",a:"TX-24",p:75,g:18},
{n:"UKIYO VEGETABLE PEELER (TX-25)",a:"TX-25",p:70,g:18},{n:"UKIYO VEGETABLE PEELER (TX-26)",a:"TX-26",p:85,g:18},{n:"UKIYO VEGETABLE PEELER (TX-28)",a:"TX-28",p:90,g:18},
{n:"UKIYO WHISK (TX-38-1)",a:"TX-38-1",p:70,g:18},{n:"UKIYO WHISK (TX-38-2)",a:"TX-38-2",p:75,g:18},{n:"UKIYO WHISK (TX-38-3)",a:"TX-38-3",p:80,g:18},
{n:"UKIYO WHISK (TX-91)",a:"TX-91",p:80,g:18},{n:"UKIYO WHISK (TX-92)",a:"TX-92",p:80,g:18},{n:"LADLE/DABBU 12.5CM WOODEN HANDLE",a:"",p:340,g:18},
{n:"LADLE/DABBU 15CM WOODEN HANDLE",a:"",p:370,g:18},{n:"UKIYO BOWL SS - 18CM / 7INCH",a:"",p:90,g:5},{n:"UKIYO BOWL SS - 20CM / 8INCH",a:"",p:110,g:5},
{n:"UKIYO BOWL SS - 22CM / 8.6INCH",a:"",p:135,g:5},{n:"UKIYO BOWL SS - 25CM / 10INCH",a:"",p:190,g:5},{n:"UKIYO BOWL SS - 27CM / 10.5INCH",a:"",p:220,g:5},
{n:"UKIYO JHARA ECO WIRE NO.20",a:"ECO NO.20",p:100,g:18},{n:"UKIYO JHARA ECO WIRE NO.22",a:"ECO NO.22",p:116,g:18},{n:"UKIYO JHARA ECO WIRE NO.24",a:"ECO NO.24",p:130,g:18},
{n:"UKIYO JHARA ECO WIRE NO.26",a:"ECO NO.26",p:147,g:18},{n:"UKIYO JHARA ECO WIRE NO.28",a:"ECO NO.28",p:162,g:18},{n:"UKIYO JHARA ECO WIRE NO.30",a:"ECO NO.30",p:178,g:18},
{n:"UKIYO JHARA ECO WIRE NO.32",a:"ECO NO.32",p:194,g:18},{n:"UKIYO JHARA NET/JALI 26CM",a:"",p:270,g:18},{n:"UKIYO JHARA NET/JALI 28CM",a:"",p:300,g:18},
{n:"UKIYO JHARA NET/JALI 30CM",a:"",p:320,g:18},{n:"UKIYO JHARA PRM WIRE NO.26",a:"PRM NO.26",p:270,g:18},{n:"UKIYO JHARA PRM WIRE NO.28",a:"PRM NO.28",p:292,g:18},
{n:"UKIYO JHARA PRM WIRE NO.30",a:"PRM NO.30",p:314,g:18},{n:"UKIYO JHARA PRM WIRE NO.32",a:"PRM NO.32",p:340,g:18},{n:"UKIYO LADLE/DABBU S.S. 10.5CM",a:"10.5 CM",p:209,g:18},
{n:"UKIYO LADLE/DABBU S.S. 11.5CM",a:"11.5 CM",p:226,g:18},{n:"UKIYO LADLE/DABBU S.S. 12.5CM",a:"12.5 CM",p:246,g:18},{n:"UKIYO LADLE/DABBU S.S. 13.5CM",a:"13.5CM",p:268,g:18},
{n:"UKIYO LADLE/DABBU S.S. 15.5CM",a:"15.5 CM",p:344,g:18},{n:"UKIYO LADLE/DABBU S.S. 15CM",a:"15 CM",p:294,g:18},{n:"UKIYO LADLE/DABBU S.S. 17CM",a:"17 CM",p:402,g:18},
{n:"UKIYO LADLE/DABBU S.S. 7.5CM",a:"7.5 CM",p:155,g:18},{n:"UKIYO LADLE/DABBU S.S. 8.5CM",a:"8.5 CM",p:162,g:18},{n:"UKIYO LADLE/DABBU S.S. 9.5CM",a:"9.5 CM",p:170,g:18},
{n:"UKIYO STRAINER 25CM S.S. HANDLE",a:"",p:690,g:18},{n:"UKIYO STRAINER 27CM S.S. HANDLE",a:"",p:730,g:18},{n:"UKIYO TURNER S.S. (10CM)",a:"10 CM",p:164,g:18},
{n:"UKIYO TURNER S.S. (11CM)",a:"11 CM",p:214,g:18},{n:"UKIYO TURNER S.S. (12CM)",a:"12 CM",p:246,g:18},{n:"UKIYO TURNER S.S. (13.5CM)",a:"13.5 CM",p:292,g:18},
{n:"UKIYO WOK / KADAI BLACK 40CM",a:"W/K-40CM",p:520,g:5},{n:"UKIYO WOK / KADAI BLACK 45CM",a:"W/K-45CM",p:560,g:5},{n:"UKIYO WOK BLACK WD HANDLE 32CM",a:"BLACK-32CM",p:490,g:5},
{n:"UKIYO WOK BLACK WD HANDLE 34CM",a:"BLACK-34CM",p:520,g:5},{n:"UKIYO WOK BLACK WD HANDLE 36CM",a:"BLACK-36CM",p:560,g:5},{n:"UKIYO WOK BLACK WD HANDLE 38CM",a:"BLACK-38CM",p:610,g:5},
{n:"UKIYO WOK BLACK WD HANDLE 40CM",a:"BLACK-40CM",p:650,g:5},{n:"UKIYO WOK BLACK WD HANDLE 42CM",a:"BLACK-42CM",p:720,g:5},{n:"UKIYO WOK RUBBER HANDLE 32CM",a:"",p:284,g:5},
{n:"UKIYO WOK RUBBER HANDLE 34CM",a:"",p:294,g:5},{n:"UKIYO WOK RUBBER HANDLE 36CM",a:"",p:316,g:5},{n:"UKIYO WOK RUBBER HANDLE 38CM",a:"",p:346,g:5},
{n:"UKIYO WOK RUBBER HANDLE 40CM",a:"",p:390,g:5},{n:"UKIYO WOK WOOD HANDLE 34CM APRX",a:"",p:215,g:5},{n:"UKIYO WOK WOOD HANDLE 36CM APRX",a:"",p:225,g:5},
{n:"UKIYO WOK WOOD HANDLE 38CM APRX",a:"",p:230,g:5},{n:"UKIYO WOK WOOD HANDLE 40CM APRX",a:"",p:260,g:5},
];
function Quotation(){
  const [team,setTeam]=useState("Ocean");const [client,setClient]=useState("");const [items,setItems]=useState([]);const [search,setSearch]=useState("");const [disc,setDisc]=useState(0);
  const [editingId,setEditingId]=useState(null);const [qSearch,setQSearch]=useState("");
  const [saved,setSaved]=useState(()=>{try{const s=localStorage.getItem("tansha_quotes");return s?JSON.parse(s):[{id:1,q:"TH-Q101",client:"Taj Hotels",team:"Ocean",grand:143175,date:"20 Apr",items:[],disc:0},{id:2,q:"TH-Q102",client:"Hyatt",team:"Ukiyo",grand:87654,date:"22 Apr",items:[],disc:0}];}catch{return [];}});
  useEffect(()=>{try{localStorage.setItem("tansha_quotes",JSON.stringify(saved));}catch{}},[saved]);
  const prods=team==="Ocean"?OP:UP;const results=search.length>1?prods.filter(p=>p.n.toLowerCase().includes(search.toLowerCase())||p.a.toLowerCase().includes(search.toLowerCase())):[];
  const sub=items.reduce((s,i)=>s+i.qty*i.p,0);const gst=items.reduce((s,i)=>s+i.qty*i.p*(1-disc/100)*i.g/100,0);const grand=sub*(1-disc/100)+gst;
  const qNo=editingId?saved.find(s=>s.id===editingId)?.q:"TH-Q"+(200+saved.length+1);
  function loadForEdit(q){setTeam(q.team);setClient(q.client);setItems((q.items||[]).map(i=>({...i})));setDisc(q.disc||0);setEditingId(q.id);window.scrollTo(0,0);}
  function cancelEdit(){setEditingId(null);setClient("");setItems([]);setDisc(0);setSearch("");}
  function findByNumber(){const q=saved.find(s=>s.q.toLowerCase()===qSearch.trim().toLowerCase());if(q){loadForEdit(q);setQSearch("");}else alert(`Quote "${qSearch}" not found`);}
  function saveQuotation(){
    if(!client||!items.length)return;
    const entry={id:editingId||Date.now(),q:qNo,client,team,grand,date:new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short"}),items:items.map(i=>({...i})),disc};
    if(editingId){setSaved(p=>p.map(s=>s.id===editingId?entry:s));setEditingId(null);}
    else setSaved(p=>[entry,...p]);
    setClient("");setItems([]);setDisc(0);setSearch("");
  }
  const fmtN=n=>Number(n).toLocaleString("en-IN",{maximumFractionDigits:0});
  function generatePDF(){
    if(!client||!items.length)return;
    const date=new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});
    const rows=items.map(it=>`<tr><td>${it.n}</td><td style="color:#64748B">${it.a}</td><td style="text-align:center">${it.qty}</td><td style="text-align:right">₹${fmtN(it.p)}</td><td style="text-align:right;font-weight:600">₹${fmtN(it.qty*it.p)}</td></tr>`).join("");
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${qNo}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;padding:32px;color:#0F172A;font-size:13px}.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #4F46E5}.co{font-size:22px;font-weight:800;color:#4F46E5;letter-spacing:-.5px}.cosub{color:#64748B;font-size:11px;margin-top:4px}.qno{font-size:20px;font-weight:700;text-align:right}.qdate{color:#64748B;font-size:11px;margin-top:4px;text-align:right}.to{margin-bottom:20px;padding:14px 16px;background:#F8FAFC;border-radius:8px;border-left:3px solid #4F46E5}.tolbl{color:#64748B;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}.toname{font-size:16px;font-weight:700}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#0F172A;color:#fff;padding:9px 10px;text-align:left;font-size:11px;font-weight:600;letter-spacing:.3px}td{padding:8px 10px;border-bottom:1px solid #F1F5F9;font-size:12px}tr:hover td{background:#F8FAFC}.totals{margin-left:auto;width:260px;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden}.totals td{padding:8px 14px;border-bottom:1px solid #F1F5F9}.grand td{background:#0F172A;color:#fff;font-weight:800;font-size:15px;border-bottom:none}.footer{margin-top:28px;text-align:center;color:#94A3B8;font-size:11px;border-top:1px solid #E2E8F0;padding-top:14px}@media print{body{padding:16px}}</style></head><body><div class="hdr"><div><div class="co">TANSHA HOSPITALITY</div><div class="cosub">Mumbai &nbsp;|&nbsp; Ocean Division</div></div><div><div class="qno">${qNo}</div><div class="qdate">Date: ${date}</div></div></div><div class="to"><div class="tolbl">Quotation For</div><div class="toname">${client}</div></div><table><thead><tr><th>Product</th><th>Code</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table><table class="totals"><tbody><tr><td>Subtotal</td><td style="text-align:right">₹${fmtN(sub)}</td></tr>${disc>0?`<tr><td>Discount (${disc}%)</td><td style="text-align:right;color:#DC2626">−₹${fmtN(sub*disc/100)}</td></tr>`:""}<tr><td>GST @18%</td><td style="text-align:right">₹${fmtN(gst)}</td></tr></tbody><tfoot><tr class="grand"><td>Grand Total</td><td style="text-align:right">₹${fmtN(grand)}</td></tr></tfoot></table><div class="footer">Thank you for your business &nbsp;·&nbsp; Tansha Hospitality &nbsp;·&nbsp; Mumbai</div><script>window.onload=()=>window.print();<\/script></body></html>`;
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener";
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),15000);
  }
  return (<div>
    {editingId&&<div style={{background:C.orange+"18",border:`1px solid ${C.orange}44`,borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{color:C.orange,fontWeight:700,fontSize:13}}>✏️ Editing {qNo}</div><div style={{color:C.muted,fontSize:11,marginTop:1}}>Make changes then save to update</div></div><button onClick={cancelEdit} style={{background:C.orange+"22",border:`1px solid ${C.orange}44`,color:C.orange,borderRadius:7,padding:"4px 11px",fontWeight:700,cursor:"pointer",fontSize:12}}>Cancel</button></div>}
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
    <button onClick={generatePDF} style={{background:C.blue,border:"none",color:"#fff",borderRadius:10,padding:13,fontWeight:700,cursor:"pointer",width:"100%",marginBottom:11,fontSize:14}}>📄 Export PDF</button>
    <button onClick={saveQuotation} style={{background:editingId?C.orange:C.green,border:"none",color:"#fff",borderRadius:10,padding:13,fontWeight:800,cursor:"pointer",width:"100%",marginBottom:14}}>{editingId?"Update Quotation ✓":"Save Quotation ✓"}</button></>}
    {saved.length>0&&<>
      <SL text={`Saved Quotations (${saved.length})`}/>
      <Card style={{marginBottom:11}}>
        <label style={LBL}>Find by Quote Number</label>
        <div style={{display:"flex",gap:7}}>
          <input style={{...INP,flex:1}} placeholder="e.g. TH-Q101" value={qSearch} onChange={e=>setQSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&findByNumber()}/>
          <button onClick={findByNumber} style={{background:C.acc,border:"none",color:"#fff",borderRadius:8,padding:"0 16px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>Load</button>
        </div>
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>{saved.map(q=><div key={q.id} style={{background:editingId===q.id?C.orange+"0D":C.card,border:`1px solid ${editingId===q.id?C.orange+"55":C.cb}`,borderRadius:11,padding:"11px 13px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",gap:6,marginBottom:4,flexWrap:"wrap"}}>
              <span style={{color:C.acc,fontFamily:"monospace",fontSize:11,fontWeight:700}}>{q.q}</span>
              <Bdg label={q.team} color={q.team==="Ocean"?C.blue:C.teal} bg={(q.team==="Ocean"?C.blue:C.teal)+"18"} border={(q.team==="Ocean"?C.blue:C.teal)+"33"}/>
              {q.disc>0&&<Bdg label={`${q.disc}% off`} color={C.orange} bg={C.orange+"18"} border={C.orange+"33"}/>}
            </div>
            <div style={{color:C.text,fontWeight:600,fontSize:13}}>{q.client}</div>
            <div style={{color:C.muted,fontSize:11,marginTop:2}}>{q.date}{q.items?.length>0&&` · ${q.items.length} item${q.items.length!==1?"s":""}`}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
            <div style={{color:C.green,fontWeight:800,fontSize:14}}>{fmt(q.grand)}</div>
            <button onClick={()=>loadForEdit(q)} style={{background:C.acc+"18",border:`1px solid ${C.acc}33`,color:C.acc,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>✏️ Edit</button>
          </div>
        </div>
      </div>)}
      </div>
    </>}
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
  const [isDesktop,setIsDesktop]=useState(typeof window!=="undefined"&&window.innerWidth>=768);
  useEffect(()=>{const h=()=>setIsDesktop(window.innerWidth>=768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  const cu=UM[role];const unread=notifs.filter(n=>!n.read).length;const acc=RA[role];const bnav=NAV.filter(n=>acc.includes(n.id)).slice(0,5);
  function nav(m){if(acc.includes(m)){setActive(m);setShowNav(false);}}
  const SW=220;
  return (<div style={{fontFamily:"'Inter','DM Sans','Segoe UI',sans-serif",background:"#F7F8FA",minHeight:"100vh",color:C.text,position:"relative"}}>
    <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:${C.cb};border-radius:2px}`}</style>
    {showN&&<NotifPanel notifs={notifs} setNotifs={setNotifs} onClose={()=>setShowN(false)}/>}
    {showNav&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:400,backdropFilter:"blur(2px)"}} onClick={()=>setShowNav(false)}>
      <div onClick={e=>e.stopPropagation()} style={{position:"absolute",left:0,top:0,bottom:0,width:240,background:C.nav,overflowY:"auto",animation:"sL .22s ease"}}>
        <style>{`@keyframes sL{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
        <div style={{padding:"20px 16px 14px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{color:"#fff",fontWeight:800,fontSize:17,letterSpacing:-.3,marginBottom:14}}>TANSHA <span style={{color:"#6366F1",fontWeight:400,fontSize:12}}>Hospitality</span></div>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}><Av name={cu} size={36}/><div><div style={{color:"#F1F5F9",fontWeight:600,fontSize:12}}>{cu}</div><span style={{background:"rgba(99,102,241,0.25)",color:"#A5B4FC",border:"1px solid rgba(99,102,241,0.3)",borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:700}}>{role}</span></div></div>
          <div style={{color:"#475569",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Switch Role</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{["Owner","Manager","Sales","Warehouse"].map(r=><button key={r} onClick={()=>{setRole(r);setActive("home");setShowNav(false);}} style={{background:role===r?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.06)",color:role===r?"#A5B4FC":"#64748B",border:`1px solid ${role===r?"rgba(99,102,241,0.4)":"transparent"}`,borderRadius:5,padding:"3px 8px",fontSize:9,fontWeight:700,cursor:"pointer"}}>{r}</button>)}</div>
        </div>
        <div style={{padding:"10px 10px"}}>{NAV.filter(n=>acc.includes(n.id)).map(n=><button key={n.id} onClick={()=>nav(n.id)} style={{width:"100%",display:"flex",gap:10,alignItems:"center",background:active===n.id?"rgba(99,102,241,0.18)":"transparent",border:"none",borderRadius:8,padding:"9px 10px",cursor:"pointer",marginBottom:1,textAlign:"left"}}><span style={{fontSize:16}}>{n.i}</span><span style={{color:active===n.id?"#A5B4FC":"#94A3B8",fontWeight:active===n.id?600:400,fontSize:13}}>{TITLES[n.id]}</span></button>)}
        </div>
      </div>
    </div>}

    {/* Desktop sidebar */}
    {isDesktop&&<div style={{position:"fixed",left:0,top:0,bottom:0,width:SW,background:C.nav,overflowY:"auto",zIndex:200}}>
      <div style={{padding:"20px 16px 14px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{color:"#fff",fontWeight:800,fontSize:18,letterSpacing:-.5,marginBottom:16}}>TANSHA <span style={{color:"#6366F1",fontWeight:400,fontSize:12}}>Hospitality</span></div>
        <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}><Av name={cu} size={36}/><div><div style={{color:"#F1F5F9",fontWeight:600,fontSize:12}}>{cu}</div><span style={{background:"rgba(99,102,241,0.25)",color:"#A5B4FC",border:"1px solid rgba(99,102,241,0.3)",borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:700}}>{role}</span></div></div>
        <div style={{color:"#475569",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Switch Role</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{["Owner","Manager","Sales","Warehouse"].map(r=><button key={r} onClick={()=>{setRole(r);setActive("home");}} style={{background:role===r?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.06)",color:role===r?"#A5B4FC":"#64748B",border:`1px solid ${role===r?"rgba(99,102,241,0.4)":"transparent"}`,borderRadius:5,padding:"3px 8px",fontSize:9,fontWeight:700,cursor:"pointer"}}>{r}</button>)}</div>
      </div>
      <div style={{padding:"10px 10px"}}>{NAV.filter(n=>acc.includes(n.id)).map(n=><button key={n.id} onClick={()=>nav(n.id)} style={{width:"100%",display:"flex",gap:10,alignItems:"center",background:active===n.id?"rgba(99,102,241,0.18)":"transparent",border:"none",borderRadius:8,padding:"9px 10px",cursor:"pointer",marginBottom:1,textAlign:"left",transition:"background .12s"}} onMouseEnter={e=>{if(active!==n.id)e.currentTarget.style.background="rgba(255,255,255,0.05)";}} onMouseLeave={e=>{if(active!==n.id)e.currentTarget.style.background="transparent";}}><span style={{fontSize:16}}>{n.i}</span><span style={{color:active===n.id?"#A5B4FC":"#94A3B8",fontWeight:active===n.id?600:400,fontSize:13}}>{TITLES[n.id]}</span>{n.id==="tasks"&&unread>0&&<span style={{marginLeft:"auto",background:C.red,color:"#fff",borderRadius:"50%",width:17,height:17,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800}}>{unread}</span>}</button>)}</div>
    </div>}

    {/* Topbar */}
    <div style={{background:C.card,borderBottom:`1px solid ${C.cb}`,padding:"0 18px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 0 #E2E8F0",marginLeft:isDesktop?SW:0}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {!isDesktop&&<button onClick={()=>setShowNav(true)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18,padding:"0 4px 0 0",lineHeight:1}}>☰</button>}
        <div>
          {!isDesktop&&<span style={{color:C.acc,fontWeight:800,fontSize:15,letterSpacing:-.3}}>TANSHA </span>}
          <span style={{color:C.muted,fontSize:13,fontWeight:500}}>{isDesktop?"":""}{TITLES[active]}</span>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>setShowN(true)} style={{background:C.bg,border:`1px solid ${C.cb}`,cursor:"pointer",position:"relative",padding:"6px 8px",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:16}}>🔔</span>
          {unread>0&&<div style={{position:"absolute",top:3,right:3,width:14,height:14,borderRadius:"50%",background:C.red,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:8,fontWeight:800}}>{unread}</div>}
        </button>
        <Av name={cu} size={30}/>
      </div>
    </div>

    {/* Content */}
    <div style={{padding:active==="chat"?0:15,paddingBottom:active==="chat"?0:isDesktop?15:75,minHeight:"calc(100vh - 52px - 56px)",marginLeft:isDesktop?SW:0,maxWidth:isDesktop?"none":480,margin:isDesktop?`0 0 0 ${SW}px`:"0 auto"}}>
      {active!=="chat"&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div>
          <h2 style={{margin:0,fontSize:18,fontWeight:700,color:C.text}}>{TITLES[active]}</h2>
        </div>
        <span style={{background:RC[role].bg,color:RC[role].text,border:`1px solid ${RC[role].border}`,borderRadius:6,padding:"3px 10px",fontSize:10,fontWeight:600}}>{role}</span>
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
    {!isDesktop&&<div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(255,255,255,0.97)",borderTop:`1px solid ${C.cb}`,boxShadow:"0 -4px 16px rgba(0,0,0,0.06)",display:"flex",zIndex:100,backdropFilter:"blur(8px)"}}>
      {bnav.map(n=>{const isA=active===n.id;return<button key={n.id} onClick={()=>nav(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"9px 3px 7px",background:"transparent",border:"none",cursor:"pointer",position:"relative"}}>
        {isA&&<div style={{position:"absolute",top:0,left:"25%",right:"25%",height:2,background:C.acc,borderRadius:"0 0 3px 3px"}}/>}
        <span style={{fontSize:17}}>{n.i}</span>
        <span style={{fontSize:9,fontWeight:isA?700:400,color:isA?C.acc:C.dim}}>{n.l}</span>
        {n.id==="tasks"&&unread>0&&<div style={{position:"absolute",top:5,right:"18%",width:14,height:14,borderRadius:"50%",background:C.red,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:8,fontWeight:800}}>{unread}</div>}
      </button>;})}
      <button onClick={()=>setShowNav(true)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"9px 3px 7px",background:"transparent",border:"none",cursor:"pointer"}}><span style={{fontSize:17}}>⋯</span><span style={{fontSize:9,color:C.dim}}>More</span></button>
    </div>}
  </div>);
}
