import { useState, useRef, useEffect, useMemo } from "react";
import { initMessaging, requestNotificationPermission, registerDeviceToken, sendPush } from "./firebase";
import { useFirestoreState } from "./useFirestoreState";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  "Ali Bhai (Owner)":{label:"Owner",bg:"#EEF2FF",text:"#4338CA",border:"#C7D2FE"},
  "Saud Bhai":{label:"Manager",bg:"#EFF6FF",text:"#1D4ED8",border:"#BFDBFE"},
};
const RC_DEF={label:"Staff",bg:"#F0FDF4",text:"#15803D",border:"#BBF7D0"};
const MANAGERS=["Ali Bhai (Owner)","Saud Bhai"];
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
  const ACCESS_ALL=["payment","dispatch","tasks","stocks","sales","ops"];
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
      {stats.filter(s=>ACCESS_ALL.includes(s.m)).map(s=><div key={s.l} onClick={()=>onNav(s.m)} style={{background:C.card,border:`1px solid ${C.cb}`,borderRadius:14,padding:"16px 14px",cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:C.sh,transition:"box-shadow .15s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow=C.sh2;e.currentTarget.style.borderColor=s.c+"55";}} onMouseLeave={e=>{e.currentTarget.style.boxShadow=C.sh;e.currentTarget.style.borderColor=C.cb;}}>
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
  {id:1,title:"Follow up Hotel Leela — Quotation",to:"Kaif Bhai",by:"Ali Bhai (Owner)",due:"26 Apr",pri:"High",status:"Pending",type:"Follow Up",notes:"Check pricing",audio:null,replies:[],loop:[]},
  {id:2,title:"Dispatch Ocean order to Kaizen",to:"Tayyab Bhai",by:"Ali Bhai (Owner)",due:"25 Apr",pri:"High",status:"In Progress",type:"Dispatch",notes:"",audio:null,replies:[],loop:[]},
  {id:3,title:"Stock count Ukiyo Bhiwandi",to:"Sufiyan Bhai",by:"Saud Bhai",due:"27 Apr",pri:"Medium",status:"Pending",type:"Stock Check",notes:"",audio:null,replies:[],loop:[]},
  {id:4,title:"Collect payment Grand Hyatt",to:"Kaif Bhai",by:"Ali Bhai (Owner)",due:"28 Apr",pri:"High",status:"Pending",type:"Collection",notes:"₹2,15,600 outstanding",audio:null,replies:[],loop:[]},
  {id:5,title:"Purchase order Ocean restock",to:"Nafees Bhai",by:"Saud Bhai",due:"30 Apr",pri:"Medium",status:"Done",type:"Purchase",notes:"",audio:null,replies:[],loop:[]},
];
function VoiceRecorder({onSave,compact=false}){
  const [rec,setRec]=useState(false);const [url,setUrl]=useState(null);const [secs,setSecs]=useState(0);
  const mr=useRef(null);const ch=useRef([]);const tmr=useRef(null);
  async function start(){
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mRec=new MediaRecorder(stream);mr.current=mRec;ch.current=[];
      mRec.ondataavailable=e=>{if(e.data.size>0)ch.current.push(e.data);};
      mRec.onstop=()=>{
        const blob=new Blob(ch.current,{type:mRec.mimeType||"audio/webm"});
        const reader=new FileReader();
        reader.onloadend=()=>{setUrl(reader.result);onSave(reader.result);};
        reader.readAsDataURL(blob);stream.getTracks().forEach(t=>t.stop());
      };
      mRec.start();setRec(true);setSecs(0);
      tmr.current=setInterval(()=>setSecs(s=>s+1),1000);
    }catch(e){alert("Microphone access denied. Please allow mic in browser settings.");}
  }
  function stop(){if(mr.current)mr.current.stop();setRec(false);clearInterval(tmr.current);}
  function clear(){setUrl(null);setSecs(0);onSave(null);}
  const fmtS=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  if(url)return(<div style={{background:"#EEF2FF",border:"1px solid #C7D2FE",borderRadius:9,padding:"8px 10px",display:"flex",alignItems:"center",gap:8}}><span>🎤</span><audio src={url} controls style={{flex:1,height:28}}/><button onClick={clear} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:16,padding:2,lineHeight:1}}>✕</button></div>);
  return(<button onClick={rec?stop:start} style={{background:rec?"#FEE2E2":"#EEF2FF",border:`1.5px solid ${rec?"#FECACA":"#C7D2FE"}`,color:rec?C.red:C.acc,borderRadius:9,padding:compact?"6px 14px":"10px 14px",fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:7,width:compact?"auto":"100%",justifyContent:"center"}}><span style={{width:8,height:8,borderRadius:"50%",background:rec?C.red:C.acc,display:"inline-block"}}/>{rec?`⏹ Stop · ${fmtS(secs)}`:"🎤 Record Voice Note"}</button>);
}
function LoopPicker({loop,onToggle,exclude,open,setOpen}){
  const avail=TEAM.filter(m=>m!==exclude);
  return(<div style={{position:"relative"}}>
    <button type="button" onClick={()=>setOpen(o=>!o)} style={{...INP,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",background:(loop||[]).length>0?"#EEF2FF":C.card,borderColor:(loop||[]).length>0?"#C7D2FE":C.cb,color:(loop||[]).length>0?C.acc:C.muted}}>
      <span style={{fontSize:12}}>{(loop||[]).length>0?`${(loop||[]).length} in loop — ${(loop||[]).map(n=>n.split(" ")[0]).join(", ")}`:"Add people to loop…"}</span>
      <span style={{fontSize:10,flexShrink:0,marginLeft:6}}>{open?"▲":"▼"}</span>
    </button>
    {open&&<div style={{position:"absolute",top:"calc(100% + 3px)",left:0,right:0,zIndex:9999,background:C.card,border:`1.5px solid ${C.acc}55`,borderRadius:9,boxShadow:C.sh2,maxHeight:190,overflowY:"auto"}}>
      {avail.map(m=>{const on=(loop||[]).includes(m);return(
        <div key={m} onClick={()=>onToggle(m)} style={{padding:"7px 11px",display:"flex",alignItems:"center",gap:9,cursor:"pointer",background:on?"#EEF2FF":"transparent"}}
          onMouseEnter={e=>e.currentTarget.style.background=on?"#E0E7FF":"#F8F9FF"}
          onMouseLeave={e=>e.currentTarget.style.background=on?"#EEF2FF":"transparent"}>
          <div style={{width:15,height:15,borderRadius:4,border:`2px solid ${on?C.acc:C.dim}`,background:on?C.acc:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {on&&<span style={{color:"#fff",fontSize:8,fontWeight:900,lineHeight:1}}>✓</span>}
          </div>
          <Av name={m} size={22}/>
          <span style={{color:on?C.acc:C.text,fontSize:12,fontWeight:on?700:400}}>{m}</span>
        </div>
      );})}
    </div>}
  </div>);
}
const REMIND_OPTS=[["none","No reminder"],["15","15 minutes before"],["30","30 minutes before"],["60","1 hour before"],["180","3 hours before"],["1440","1 day before"]];
function fmtDue(due){
  if(!due)return"";
  if(due.includes("T")){
    const d=new Date(due);
    if(!isNaN(d.getTime()))return d.toLocaleString("en-IN",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit",hour12:true});
  }
  return due;
}
function Tasks({role,currentUser,setNotifs}){
  const [tasks,setTasks]=useFirestoreState("tasks",TASKS0);
  const [filter,setFilter]=useState("All");
  const [sel,setSel]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [editForm,setEditForm]=useState(null);
  const [showDel,setShowDel]=useState(false);
  const [form,setForm]=useState({title:"",to:"",due:"",pri:"Medium",notes:"",audio:null,loop:[],reminder:"none"});
  const [replyText,setReplyText]=useState("");const [replyAudio,setReplyAudio]=useState(null);const [showReply,setShowReply]=useState(false);
  const [loopOpen,setLoopOpen]=useState(false);const [editLoopOpen,setEditLoopOpen]=useState(false);
  const can=MANAGERS.includes(currentUser);
  const PC={High:C.red,Medium:C.acc,Low:C.green};
  const SC={Pending:C.acc,"In Progress":C.blue,Done:C.green};
  const vis=can?tasks:tasks.filter(t=>t.to===currentUser||t.by===currentUser||(t.loop||[]).includes(currentUser));
  const cnt={Pending:vis.filter(t=>t.status==="Pending").length,"In Progress":vis.filter(t=>t.status==="In Progress").length,Done:vis.filter(t=>t.status==="Done").length};
  const disp=filter==="All"?vis:vis.filter(t=>t.status===filter);
  const [toast,setToast]=useState(null);const toastTmr=useRef(null);
  function pushNotif(icon,title,body,color){
    setNotifs(p=>[{id:Date.now(),icon,title,body,time:"Just now",read:false,color},...p]);
    if(toastTmr.current)clearTimeout(toastTmr.current);
    setToast({icon,text:title+(body?` — ${body}`:""),color});
    toastTmr.current=setTimeout(()=>setToast(null),3500);
  }
  function notify(persons,title,body){
    const targets=[...new Set(persons)].filter(p=>p&&p!==currentUser);
    if(targets.length)sendPush(targets,title,body);
  }
  function add(){if(!form.title||!form.to||!form.due)return;const t={...form,id:Date.now(),status:"Pending",by:currentUser,replies:[],reminded:false};setTasks(p=>[t,...p]);pushNotif("📋","Task Assigned",`${form.title} → ${form.to}`,C.blue);notify([form.to,...(form.loop||[])],"New Task Assigned",`${form.title} — due ${fmtDue(t.due)}`);setShowNew(false);setLoopOpen(false);setForm({title:"",to:"",due:"",pri:"Medium",notes:"",audio:null,loop:[],reminder:"none"});}
  function advance(id){const tsk=tasks.find(t=>t.id===id);if(!tsk||tsk.status==="Done")return;const n=tsk.status==="Pending"?"In Progress":"Done";setTasks(p=>p.map(t=>t.id===id?{...t,status:n}:t));pushNotif(n==="Done"?"✅":"▶️",n==="Done"?"Task Completed":"Task In Progress",tsk.title,n==="Done"?C.green:C.blue);notify([tsk.by,tsk.to,...(tsk.loop||[])],n==="Done"?"Task Completed":"Task In Progress",tsk.title);if(sel?.id===id)setSel(p=>({...p,status:n}));}
  function addReply(){if(!replyText.trim()&&!replyAudio)return;const r={id:Date.now(),by:currentUser,time:"Just now",text:replyText.trim(),audio:replyAudio};setTasks(p=>p.map(t=>t.id===sel.id?{...t,replies:[...(t.replies||[]),r]}:t));setSel(p=>({...p,replies:[...(p.replies||[]),r]}));pushNotif("💬","Update Sent",sel.title,C.teal);notify([sel.by,sel.to,...(sel.loop||[])],"Task Update",`${currentUser}: ${replyText.trim()||"sent a voice note"}`);setReplyText("");setReplyAudio(null);setShowReply(false);}
  function openSel(t){setSel(t);setShowReply(false);setReplyText("");setReplyAudio(null);setShowDel(false);}
  function delTask(id){setTasks(p=>p.filter(t=>t.id!==id));setSel(null);setShowDel(false);}
  function startEdit(){setEditForm({...sel});setEditLoopOpen(false);}
  function saveEdit(){if(!editForm.title||!editForm.to)return;const updated={...editForm,reminded:false};setTasks(p=>p.map(t=>t.id===editForm.id?updated:t));setSel(updated);pushNotif("✏️","Task Updated",editForm.title,C.acc);notify([editForm.to,editForm.by,...(editForm.loop||[])],"Task Updated",editForm.title);setEditForm(null);}
  function togLoop(name,isEd){if(isEd){setEditForm(p=>({...p,loop:(p.loop||[]).includes(name)?(p.loop||[]).filter(n=>n!==name):[...(p.loop||[]),name]}));}else{setForm(p=>({...p,loop:(p.loop||[]).includes(name)?(p.loop||[]).filter(n=>n!==name):[...(p.loop||[]),name]}));}}
  useEffect(()=>{
    const check=()=>{
      const now=Date.now();
      tasks.forEach(t=>{
        if(t.status==="Done"||!t.due||!t.due.includes("T")||!t.reminder||t.reminder==="none"||t.reminded)return;
        const dueTime=new Date(t.due).getTime();
        if(isNaN(dueTime))return;
        const remindAt=dueTime-Number(t.reminder)*60000;
        if(now>=remindAt&&now<dueTime){
          pushNotif("⏰","Task Reminder",`${t.title} — due ${fmtDue(t.due)}`,C.orange);
          notify([t.to,t.by,...(t.loop||[])],"Task Reminder",`${t.title} — due ${fmtDue(t.due)}`);
          setTasks(p=>p.map(x=>x.id===t.id?{...x,reminded:true}:x));
        }
      });
    };
    check();
    const iv=setInterval(check,60000);
    return ()=>clearInterval(iv);
  },[tasks]);
  return (<div>
    {toast&&<div style={{position:"fixed",top:0,left:0,right:0,zIndex:9999,background:toast.color,color:"#fff",padding:"14px 18px",fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:10,boxShadow:"0 4px 20px rgba(0,0,0,0.3)",animation:"tDn .28s ease"}}><style>{`@keyframes tDn{from{transform:translateY(-100%)}to{transform:translateY(0)}}`}</style><span style={{fontSize:18,flexShrink:0}}>{toast.icon}</span><span style={{flex:1,lineHeight:1.3,fontSize:13}}>{toast.text}</span><button onClick={()=>setToast(null)} style={{background:"rgba(255,255,255,0.22)",border:"none",color:"#fff",borderRadius:6,width:26,height:26,cursor:"pointer",fontSize:14,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>}
    {showNew&&<Mod onClose={()=>{setShowNew(false);setLoopOpen(false);}} title="+ New Task" sub={`Assigning as ${currentUser}`}>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <div><label style={LBL}>Title *</label><input style={INP} placeholder="Task description" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
        <div><label style={LBL}>Assign To *</label><select style={{...INP,appearance:"none"}} value={form.to} onChange={e=>setForm({...form,to:e.target.value})}><option value="">Select...</option>{TEAM.map(m=><option key={m}>{m}</option>)}</select></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={LBL}>Due Date & Time</label><input type="datetime-local" style={INP} value={form.due} onChange={e=>setForm({...form,due:e.target.value})}/></div><div><label style={LBL}>Priority</label><select style={{...INP,appearance:"none"}} value={form.pri} onChange={e=>setForm({...form,pri:e.target.value})}>{["High","Medium","Low"].map(p=><option key={p}>{p}</option>)}</select></div></div>
        <div><label style={LBL}>Reminder</label><select style={{...INP,appearance:"none"}} value={form.reminder} onChange={e=>setForm({...form,reminder:e.target.value})}>{REMIND_OPTS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
        <div><label style={LBL}>Notes</label><textarea style={{...INP,minHeight:50,resize:"vertical"}} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
        <div><label style={LBL}>Keep in Loop <span style={{color:C.dim,fontWeight:400}}>(they see all updates)</span></label><LoopPicker loop={form.loop||[]} onToggle={n=>togLoop(n,false)} exclude={form.to} open={loopOpen} setOpen={setLoopOpen}/></div>
        <div><label style={LBL}>Voice Note <span style={{color:C.dim,fontWeight:400}}>(optional)</span></label><VoiceRecorder onSave={a=>setForm(f=>({...f,audio:a}))}/></div>
        <button onClick={add} style={{background:C.blue,border:"none",color:"#fff",borderRadius:10,padding:13,fontWeight:800,cursor:"pointer"}}>Assign Task ✓</button>
      </div>
    </Mod>}
    {editForm&&<Mod onClose={()=>setEditForm(null)} title="Edit Task" sub={editForm.title}>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <div><label style={LBL}>Title *</label><input style={INP} value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))}/></div>
        <div><label style={LBL}>Assign To *</label><select style={{...INP,appearance:"none"}} value={editForm.to} onChange={e=>setEditForm(f=>({...f,to:e.target.value}))}><option value="">Select...</option>{TEAM.map(m=><option key={m}>{m}</option>)}</select></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={LBL}>Priority</label><select style={{...INP,appearance:"none"}} value={editForm.pri} onChange={e=>setEditForm(f=>({...f,pri:e.target.value}))}>{["High","Medium","Low"].map(p=><option key={p}>{p}</option>)}</select></div><div><label style={LBL}>Status</label><select style={{...INP,appearance:"none"}} value={editForm.status} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))}>{["Pending","In Progress","Done"].map(s=><option key={s}>{s}</option>)}</select></div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={LBL}>Due Date & Time</label><input type="datetime-local" style={INP} value={editForm.due&&editForm.due.includes("T")?editForm.due:""} onChange={e=>setEditForm(f=>({...f,due:e.target.value}))}/></div><div><label style={LBL}>Reminder</label><select style={{...INP,appearance:"none"}} value={editForm.reminder||"none"} onChange={e=>setEditForm(f=>({...f,reminder:e.target.value}))}>{REMIND_OPTS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div></div>
        <div><label style={LBL}>Notes</label><textarea style={{...INP,minHeight:50,resize:"vertical"}} value={editForm.notes} onChange={e=>setEditForm(f=>({...f,notes:e.target.value}))}/></div>
        <div><label style={LBL}>Keep in Loop</label><LoopPicker loop={editForm.loop||[]} onToggle={n=>togLoop(n,true)} exclude={editForm.to} open={editLoopOpen} setOpen={setEditLoopOpen}/></div>
        <div style={{display:"flex",gap:8}}><button onClick={()=>setEditForm(null)} style={{flex:1,background:C.bg,border:`1px solid ${C.cb}`,color:C.muted,borderRadius:10,padding:12,fontWeight:700,cursor:"pointer"}}>Cancel</button><button onClick={saveEdit} style={{flex:2,background:C.green,border:"none",color:"#fff",borderRadius:10,padding:12,fontWeight:800,cursor:"pointer"}}>Save Changes ✓</button></div>
      </div>
    </Mod>}
    {sel&&!editForm&&<Mod onClose={()=>{setSel(null);setShowDel(false);}} title={sel.title} sub={`${sel.type} · Due ${fmtDue(sel.due)}`}>
      <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        <Bdg label={sel.pri} color={PC[sel.pri]} bg={PC[sel.pri]+"22"} border={PC[sel.pri]+"44"}/>
        <Bdg label={sel.status} color={SC[sel.status]} bg={SC[sel.status]+"22"} border={SC[sel.status]+"44"}/>
        {(can||sel.by===currentUser)&&<div style={{marginLeft:"auto",display:"flex",gap:5}}>
          <button onClick={startEdit} style={{background:"#EEF2FF",border:"1px solid #C7D2FE",color:C.acc,borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>✏ Edit</button>
          <button onClick={()=>setShowDel(true)} style={{background:"#FEE2E2",border:"1px solid #FECACA",color:C.red,borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>🗑</button>
        </div>}
      </div>
      {showDel&&<div style={{background:"#FFF7F7",border:"1.5px solid #FECACA",borderRadius:10,padding:12,marginBottom:12}}>
        <div style={{color:C.red,fontWeight:700,fontSize:13,marginBottom:5}}>Delete this task?</div>
        <div style={{color:C.muted,fontSize:12,marginBottom:9}}>This cannot be undone.</div>
        <div style={{display:"flex",gap:8}}><button onClick={()=>setShowDel(false)} style={{flex:1,background:C.bg,border:`1px solid ${C.cb}`,color:C.muted,borderRadius:8,padding:"8px 0",fontWeight:700,cursor:"pointer",fontSize:12}}>Cancel</button><button onClick={()=>delTask(sel.id)} style={{flex:1,background:C.red,border:"none",color:"#fff",borderRadius:8,padding:"8px 0",fontWeight:800,cursor:"pointer",fontSize:12}}>Yes, Delete</button></div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:12}}>{[["By",sel.by],["To",sel.to],["Due",fmtDue(sel.due)],["Type",sel.type],...(sel.reminder&&sel.reminder!=="none"?[["Reminder",REMIND_OPTS.find(([v])=>v===sel.reminder)?.[1]||sel.reminder]]:[])].map(([l,v])=><div key={l} style={{background:C.bg,borderRadius:8,padding:"8px 10px"}}><div style={{color:C.dim,fontSize:10,fontWeight:700,textTransform:"uppercase"}}>{l}</div><div style={{color:C.text,fontSize:13,fontWeight:600,marginTop:2}}>{v}</div></div>)}</div>
      {(sel.loop||[]).length>0&&<div style={{background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:8,padding:"9px 11px",marginBottom:12}}>
        <div style={{color:"#6D28D9",fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:7}}>🔄 In Loop ({(sel.loop||[]).length})</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{(sel.loop||[]).map(n=><div key={n} style={{display:"flex",alignItems:"center",gap:5,background:"#EDE9FE",borderRadius:20,padding:"3px 9px 3px 5px"}}><Av name={n} size={20}/><span style={{color:"#5B21B6",fontSize:11,fontWeight:600}}>{n.split(" ")[0]}</span></div>)}</div>
      </div>}
      {sel.notes&&<div style={{background:C.bg,borderRadius:8,padding:"10px",marginBottom:12}}><div style={{color:C.dim,fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Notes</div><div style={{color:C.text,fontSize:13}}>{sel.notes}</div></div>}
      {sel.audio&&<div style={{background:"#EEF2FF",border:"1px solid #C7D2FE",borderRadius:9,padding:"10px 12px",marginBottom:12}}><div style={{color:"#4338CA",fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>🎤 Voice Note · {sel.by.split(" ")[0]}</div><audio src={sel.audio} controls style={{width:"100%",height:32}}/></div>}
      <div style={{display:"flex",gap:5,marginBottom:14}}>{["Pending","In Progress","Done"].map((s,i)=>{const idx=["Pending","In Progress","Done"].indexOf(sel.status);const act=i<=idx;return<div key={s} style={{flex:1}}><div style={{height:3,borderRadius:2,background:act?(s==="Done"?C.green:C.blue):C.cb,marginBottom:3}}/><span style={{fontSize:9,color:act?(s==="Done"?C.green:C.blue):C.dim,fontWeight:600}}>{s}</span></div>;})}
      </div>
      {(sel.replies||[]).length>0&&<div style={{marginBottom:12}}><div style={{color:C.dim,fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:7}}>Updates ({(sel.replies||[]).length})</div>{(sel.replies||[]).map(r=><div key={r.id} style={{background:"#F8FAFF",border:"1px solid #E0E7FF",borderRadius:9,padding:"9px 11px",marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:C.acc,fontSize:11,fontWeight:700}}>↩ {r.by.split(" ")[0]}</span><span style={{color:C.dim,fontSize:10}}>{r.time}</span></div>{r.text&&<div style={{color:C.text,fontSize:12,marginBottom:r.audio?5:0}}>{r.text}</div>}{r.audio&&<audio src={r.audio} controls style={{width:"100%",height:28}}/>}</div>)}</div>}
      {showReply&&<div style={{background:"#EEF2FF",border:"1.5px solid #C7D2FE",borderRadius:10,padding:12,marginBottom:10}}>
        <div style={{color:"#4338CA",fontSize:11,fontWeight:700,marginBottom:8}}>Add Update</div>
        <textarea style={{...INP,minHeight:40,resize:"none",fontSize:12,marginBottom:8}} placeholder="Type a message (optional)..." value={replyText} onChange={e=>setReplyText(e.target.value)}/>
        <VoiceRecorder onSave={setReplyAudio}/>
        {(replyText.trim()||replyAudio)&&<button onClick={addReply} style={{background:C.blue,border:"none",color:"#fff",borderRadius:8,padding:"10px 0",fontWeight:700,fontSize:12,cursor:"pointer",width:"100%",marginTop:8}}>Send Update ↑</button>}
      </div>}
      <div style={{display:"flex",gap:8,marginTop:2}}>
        <button onClick={()=>{setShowReply(p=>!p);if(showReply){setReplyText("");setReplyAudio(null);}}} style={{flex:showReply?0:1,background:showReply?"#FEE2E2":"#EEF2FF",border:`1.5px solid ${showReply?"#FECACA":"#C7D2FE"}`,color:showReply?C.red:C.acc,borderRadius:10,padding:"11px 14px",fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>{showReply?"✕ Cancel":"🎤 Reply"}</button>
        {sel.status!=="Done"?<button onClick={()=>advance(sel.id)} style={{flex:2,background:sel.status==="Pending"?C.blue:C.green,border:"none",color:"#fff",borderRadius:10,padding:11,fontWeight:800,cursor:"pointer",fontSize:12}}>{sel.status==="Pending"?"▶ In Progress":"✅ Mark Done"}</button>:<div style={{flex:2,textAlign:"center",padding:11,background:C.green+"22",borderRadius:9,color:C.green,fontWeight:700,fontSize:12}}>✅ Completed</div>}
      </div>
    </Mod>}
    <div style={{display:"flex",gap:7,marginBottom:13,flexWrap:"wrap"}}><Pill label="Pending" value={cnt.Pending} color={C.acc}/><Pill label="In Progress" value={cnt["In Progress"]} color={C.blue}/><Pill label="Done" value={cnt.Done} color={C.green}/>{can&&<button onClick={()=>setShowNew(true)} style={{marginLeft:"auto",background:C.blue,border:"none",color:"#fff",borderRadius:7,padding:"6px 13px",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ New</button>}</div>
    <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>{["All","Pending","In Progress","Done"].map(s=><button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?C.blue+"33":"transparent",color:filter===s?C.blue:C.muted,border:`1px solid ${filter===s?C.blue+"55":C.cb}`,borderRadius:7,padding:"4px 11px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{s} ({s==="All"?vis.length:cnt[s]||0})</button>)}</div>
    <div style={{display:"flex",flexDirection:"column",gap:7}}>{disp.map(t=><div key={t.id} onClick={()=>openSel(t)} style={{background:C.card,border:`1px solid ${C.cb}`,borderLeft:`3px solid ${PC[t.pri]}`,borderRadius:11,padding:"11px 13px",cursor:"pointer",display:"flex",gap:9,alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.background="#F8F9FF"} onMouseLeave={e=>e.currentTarget.style.background=C.card}><span style={{width:7,height:7,borderRadius:"50%",background:PC[t.pri],flexShrink:0}}/><div style={{flex:1,minWidth:0}}><div style={{color:C.text,fontWeight:600,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.title}</div><div style={{color:C.muted,fontSize:11,marginTop:2}}>{t.type} · {fmtDue(t.due)} · {t.to.split(" ")[0]}{t.audio?" 🎤":""}{(t.loop||[]).length>0?` 🔄${(t.loop||[]).length}`:""}{(t.replies||[]).length>0?` · ${(t.replies||[]).length} reply`:""}</div></div><Bdg label={t.status} color={SC[t.status]} bg={SC[t.status]+"22"} border={SC[t.status]+"44"}/><span style={{color:C.dim}}>›</span></div>)}</div>
  </div>);
}

// ── Dispatch ──
const LC={"Bhiwandi":C.purple,"Local Tansha":C.blue,"Local Kaizen":C.acc};
const DSC={Pending:C.acc,Ready:C.orange,"On Hold":C.red,Dispatched:C.green};
const DISP0={Bhiwandi:[{id:1,client:"Metro Hospitality",qty:10,unit:"Ctn",transport:"Rajesh",lr:true,status:"Dispatched",date:TODAY,photo:null,audio:null,holdNote:""},{id:2,client:"Radisson Blu",qty:null,unit:"Ctn",transport:"Gujarat",lr:false,status:"Pending",date:TODAY,photo:null,audio:null,holdNote:""},{id:3,client:"Novotel Mumbai",qty:null,unit:"Ctn",transport:"VRL",lr:false,status:"Pending",date:TODAY,photo:null,audio:null,holdNote:""}],"Local Tansha":[{id:4,client:"Taj Hotels",qty:2,unit:"Ctn",transport:"Hand Delivery",lr:true,status:"Dispatched",date:TODAY,photo:null,audio:null,holdNote:""},{id:5,client:"ITC Grand Central",qty:null,unit:"Ctn",transport:"Porter",lr:false,status:"Pending",date:TODAY,photo:null,audio:null,holdNote:""}],"Local Kaizen":[{id:6,client:"Hyatt Regency",qty:null,unit:"Ctn",transport:"Munshi",lr:false,status:"Pending",date:TODAY,photo:null,audio:null,holdNote:""}]};
function DCard({d,lc,onOpen}){
  const isO=["Porter","Hand Delivery"].includes(d.transport);const sc=DSC[d.status]||C.acc;
  return (<div onClick={()=>onOpen(d)} style={{background:d.status==="Dispatched"?C.green+"0D":d.status==="On Hold"?C.red+"08":d.status==="Ready"?C.orange+"08":C.card,border:`1px solid ${d.status==="Dispatched"?C.green+"33":d.status==="On Hold"?C.red+"33":d.status==="Ready"?C.orange+"33":C.cb}`,borderLeft:`3px solid ${sc}`,borderRadius:11,padding:"11px 13px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.opacity=".85"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
    <div style={{display:"flex",justifyContent:"space-between",gap:7,alignItems:"center"}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:d.status==="Dispatched"?C.muted:C.text,fontWeight:700,fontSize:13,textDecoration:d.status==="Dispatched"?"line-through":"none",marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.client}</div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {d.qty?<span style={{background:lc+"22",color:lc,borderRadius:5,padding:"1px 7px",fontSize:10,fontWeight:700,border:`1px solid ${lc}33`}}>{d.qty} {d.unit}</span>:<span style={{background:C.red+"18",color:C.red,borderRadius:5,padding:"1px 7px",fontSize:10,fontWeight:700,border:`1px solid ${C.red}33`}}>No Qty</span>}
          <span style={{color:isO?C.blue:C.muted,fontSize:11}}>{isO?"🚶":"🚛"} {d.transport}</span>
          {d.photo&&<span style={{fontSize:11}}>📎</span>}
          {d.audio&&<span style={{fontSize:11}}>🎤</span>}
          {d.lr&&<span style={{background:C.green+"22",color:C.green,border:`1px solid ${C.green}44`,borderRadius:4,padding:"1px 6px",fontSize:9,fontWeight:700}}>LR ✓</span>}
        </div>
        {d.status==="On Hold"&&d.holdNote&&<div style={{color:C.red,fontSize:10,marginTop:3,fontStyle:"italic"}}>🔒 {d.holdNote}</div>}
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
        <Bdg label={d.status} color={sc} bg={sc+"22"} border={sc+"44"}/>
        <span style={{color:C.dim,fontSize:12}}>›</span>
      </div>
    </div>
  </div>);
}
function Dispatch({role}){
  const [loc,setLoc]=useState("Bhiwandi");
  const [disps,setDisps]=useFirestoreState("dispatch",DISP0);
  const [sel,setSel]=useState(null);
  const [editForm,setEditForm]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [showDel,setShowDel]=useState(false);
  const [showHold,setShowHold]=useState(false);
  const [showLR,setShowLR]=useState(false);
  const [holdInput,setHoldInput]=useState("");
  const [qtyInp,setQtyInp]=useState("");
  const [qtyUnit,setQtyUnit]=useState("Ctn");
  const [form,setForm]=useState({client:"",transport:"Rajesh",date:TODAY});
  const [dispDate,setDispDate]=useState("");
  const lc=LC[loc];
  const allLoc=disps[loc]||[];
  const all=dispDate?allLoc.filter(d=>d.date===dispDate):allLoc;
  const ready=all.filter(d=>d.status==="Ready");
  const held=all.filter(d=>d.status==="On Hold");
  const pend=all.filter(d=>d.status==="Pending");
  const disp=all.filter(d=>d.status==="Dispatched");
  const pendingLR=disp.filter(d=>!d.lr);
  const allPendingLR=["Bhiwandi","Local Tansha","Local Kaizen"].reduce((s,l)=>s+(disps[l]||[]).filter(d=>!d.lr&&d.status==="Dispatched").length,0);
  const TR=["Rajesh","Munshi","Tukaram","Gujarat","VRL","Thane Motor","New Super","Porter","Hand Delivery"];
  function upd(id,changes){setDisps(p=>({...p,[loc]:p[loc].map(d=>d.id===id?{...d,...changes}:d)}));setSel(p=>p&&p.id===id?{...p,...changes}:p);}
  function add(){if(!form.client.trim())return;setDisps(p=>({...p,[loc]:[...p[loc],{id:Date.now(),...form,qty:null,unit:"Ctn",lr:false,status:"Pending",photo:null,audio:null,holdNote:""}]}));setForm({client:"",transport:"Rajesh",date:TODAY});setShowNew(false);}
  function openD(d){setSel(d);setShowDel(false);setShowHold(false);setHoldInput("");setQtyInp(d.qty?String(d.qty):"");setQtyUnit(d.unit||"Ctn");}
  function saveQty(){const q=parseInt(qtyInp);if(!q)return;upd(sel.id,{qty:q,unit:qtyUnit,status:"Ready"});}
  function deleteD(){setDisps(p=>({...p,[loc]:p[loc].filter(d=>d.id!==sel.id)}));setSel(null);setShowDel(false);}
  function setHold(){upd(sel.id,{status:"On Hold",holdNote:holdInput.trim()||"On Hold"});setShowHold(false);setHoldInput("");}
  function unhold(){upd(sel.id,{status:sel.qty?"Ready":"Pending",holdNote:""});}
  function saveEdit(){upd(editForm.id,editForm);setEditForm(null);}
  function exportDispatchPDF(){
    const doc=new jsPDF();
    const rows=arr=>arr.map(d=>[d.client,d.qty?`${d.qty} ${d.unit}`:"—",d.transport,d.date,d.lr?"Y":"—"]);
    const head=[["Client","Qty","Transport","Date","LR"]];
    doc.setFontSize(14);doc.text("Tansha Hospitality — Dispatch Sheet",14,15);
    doc.setFontSize(10);doc.setTextColor(120);doc.text(`${loc} · Generated ${new Date().toLocaleString("en-IN")}`,14,21);
    let y=27;
    const section=(title,arr)=>{
      if(!arr.length)return;
      doc.setFontSize(11);doc.setTextColor(30);doc.text(`${title} (${arr.length})`,14,y);
      autoTable(doc,{head,body:rows(arr),startY:y+2,styles:{fontSize:9},headStyles:{fillColor:[230,230,230],textColor:30}});
      y=doc.lastAutoTable.finalY+8;
    };
    section("Ready to Dispatch (CTN)",ready);
    section("Not Ready / Pending",pend);
    section("On Hold",held);
    section("Dispatched / Done",disp);
    doc.setFontSize(11);doc.setTextColor(217,119,6);
    doc.text(`Pending LR (${pendingLR.length}): ${pendingLR.length?pendingLR.map(d=>d.client).join(", "):"None — all LRs received"}`,14,y,{maxWidth:180});
    doc.save(`Dispatch_${loc.replace(/\s+/g,"_")}_${TODAY}.pdf`);
  }
  return (<div>
    {/* Detail Modal */}
    {sel&&!editForm&&<Mod onClose={()=>{setSel(null);setShowDel(false);setShowHold(false);}} title={sel.client} sub={`${sel.transport} · ${sel.date}`}>
      <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        <Bdg label={sel.status} color={DSC[sel.status]} bg={DSC[sel.status]+"22"} border={DSC[sel.status]+"44"}/>
        {sel.lr&&<Bdg label="LR ✓" color={C.green} bg={C.green+"22"} border={C.green+"44"}/>}
        <div style={{marginLeft:"auto",display:"flex",gap:5}}>
          <button onClick={()=>{setEditForm({...sel});}} style={{background:"#EEF2FF",border:"1px solid #C7D2FE",color:C.acc,borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>✏ Edit</button>
          <button onClick={()=>setShowDel(true)} style={{background:"#FEE2E2",border:"1px solid #FECACA",color:C.red,borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>🗑</button>
        </div>
      </div>
      {showDel&&<div style={{background:"#FFF7F7",border:"1.5px solid #FECACA",borderRadius:10,padding:12,marginBottom:12}}><div style={{color:C.red,fontWeight:700,fontSize:13,marginBottom:5}}>Delete this entry?</div><div style={{color:C.muted,fontSize:12,marginBottom:9}}>This cannot be undone.</div><div style={{display:"flex",gap:8}}><button onClick={()=>setShowDel(false)} style={{flex:1,background:C.bg,border:`1px solid ${C.cb}`,color:C.muted,borderRadius:8,padding:"8px 0",fontWeight:700,cursor:"pointer",fontSize:12}}>Cancel</button><button onClick={deleteD} style={{flex:1,background:C.red,border:"none",color:"#fff",borderRadius:8,padding:"8px 0",fontWeight:800,cursor:"pointer",fontSize:12}}>Yes, Delete</button></div></div>}
      {/* Qty */}
      <div style={{marginBottom:12}}>
        <label style={LBL}>Quantity {sel.status==="Ready"&&<span style={{color:C.orange,fontWeight:700}}>— Ready ✓</span>}</label>
        {sel.status==="Dispatched"?<div style={{background:C.bg,borderRadius:8,padding:"8px 12px",color:C.text,fontWeight:700}}>{sel.qty} {sel.unit}</div>:<div style={{display:"grid",gridTemplateColumns:"2fr 1fr auto",gap:8}}><input type="number" style={INP} placeholder="Enter qty…" value={qtyInp} onChange={e=>setQtyInp(e.target.value)}/><select style={{...INP,appearance:"none"}} value={qtyUnit} onChange={e=>setQtyUnit(e.target.value)}><option>Ctn</option><option>Jota</option><option>Bag</option></select><button onClick={saveQty} style={{background:C.green,border:"none",color:"#fff",borderRadius:8,padding:"0 14px",fontWeight:800,cursor:"pointer",fontSize:14}}>✓</button></div>}
      </div>
      {/* LR Toggle */}
      <button onClick={()=>upd(sel.id,{lr:!sel.lr})} style={{width:"100%",background:sel.lr?C.green+"22":C.bg,border:`1.5px solid ${sel.lr?C.green+"55":C.cb}`,color:sel.lr?C.green:C.muted,borderRadius:9,padding:"9px 12px",fontWeight:700,fontSize:12,cursor:"pointer",marginBottom:12,textAlign:"left"}}>{sel.lr?"✅ LR Received — tap to undo":"☐ LR Pending — tap to confirm receipt"}</button>
      {/* Quotation Photo */}
      <div style={{marginBottom:12}}>
        <label style={LBL}>Quotation Photo</label>
        {sel.photo?<div style={{position:"relative"}}><img src={sel.photo} alt="quotation" style={{width:"100%",borderRadius:9,maxHeight:200,objectFit:"cover",display:"block"}}/><button onClick={()=>upd(sel.id,{photo:null})} style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,0.55)",border:"none",color:"#fff",borderRadius:"50%",width:26,height:26,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>:<label style={{display:"flex",alignItems:"center",gap:9,background:"#F8F9FF",border:`1.5px dashed ${C.acc}55`,borderRadius:9,padding:"12px 14px",cursor:"pointer",color:C.acc,fontWeight:700,fontSize:12}}>📎 Upload Quotation Photo<input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onloadend=()=>upd(sel.id,{photo:r.result});r.readAsDataURL(f);e.target.value="";}}/></label>}
      </div>
      {/* Voice Memo */}
      <div style={{marginBottom:12}}>
        <label style={LBL}>Voice Memo</label>
        {sel.audio?<div style={{background:"#EEF2FF",border:"1px solid #C7D2FE",borderRadius:9,padding:"8px 10px",display:"flex",alignItems:"center",gap:8}}><span>🎤</span><audio src={sel.audio} controls style={{flex:1,height:28}}/><button onClick={()=>upd(sel.id,{audio:null})} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:16,padding:2}}>✕</button></div>:<VoiceRecorder onSave={a=>upd(sel.id,{audio:a})}/>}
      </div>
      {/* Hold reason input */}
      {showHold&&<div style={{background:"#FFF7F7",border:"1.5px solid #FECACA",borderRadius:10,padding:12,marginBottom:10}}>
        <div style={{color:C.red,fontWeight:700,fontSize:12,marginBottom:7}}>Reason for Hold</div>
        <textarea style={{...INP,minHeight:50,resize:"none",fontSize:12,marginBottom:8}} placeholder="e.g. Payment pending, Address issue…" value={holdInput} onChange={e=>setHoldInput(e.target.value)}/>
        <button onClick={setHold} style={{background:C.red,border:"none",color:"#fff",borderRadius:8,padding:"9px 0",fontWeight:700,fontSize:12,cursor:"pointer",width:"100%"}}>Confirm Hold 🔒</button>
      </div>}
      {/* Action buttons */}
      <div style={{display:"flex",gap:8,marginTop:4}}>
        {sel.status==="On Hold"?<button onClick={unhold} style={{flex:1,background:C.green+"22",border:`1.5px solid ${C.green}55`,color:C.green,borderRadius:10,padding:11,fontWeight:700,fontSize:12,cursor:"pointer"}}>🔓 Release Hold</button>:<button onClick={()=>{setShowHold(p=>!p);if(showHold)setHoldInput("");}} style={{flex:1,background:showHold?"#FEE2E2":"#FFF7F7",border:`1.5px solid ${showHold?"#FECACA":"#FED7AA"}`,color:showHold?C.red:C.orange,borderRadius:10,padding:11,fontWeight:700,fontSize:12,cursor:"pointer"}}>{showHold?"✕ Cancel":"🔒 Hold"}</button>}
        {sel.status==="Ready"&&<button onClick={()=>upd(sel.id,{status:"Dispatched"})} style={{flex:2,background:C.green,border:"none",color:"#fff",borderRadius:10,padding:11,fontWeight:800,cursor:"pointer",fontSize:12}}>🚚 Mark Dispatched</button>}
        {sel.status==="Dispatched"&&<div style={{flex:2,textAlign:"center",padding:11,background:C.green+"22",borderRadius:9,color:C.green,fontWeight:700,fontSize:12}}>✅ Dispatched</div>}
        {(sel.status==="Pending")&&<div style={{flex:2,textAlign:"center",padding:11,background:C.bg,borderRadius:9,color:C.muted,fontSize:11}}>Add qty above → auto Ready</div>}
      </div>
    </Mod>}
    {/* Edit Modal */}
    {editForm&&<Mod onClose={()=>setEditForm(null)} title="Edit Dispatch" sub={editForm.client}>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <div><label style={LBL}>Client</label><input style={INP} value={editForm.client} onChange={e=>setEditForm(f=>({...f,client:e.target.value}))}/></div>
        <div><label style={LBL}>Transport</label><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{TR.map(t=><button key={t} type="button" onClick={()=>setEditForm(f=>({...f,transport:t}))} style={{background:editForm.transport===t?C.green+"33":C.cb,color:editForm.transport===t?C.green:C.muted,border:`1px solid ${editForm.transport===t?C.green+"55":"transparent"}`,borderRadius:6,padding:"4px 9px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{t}</button>)}</div></div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10}}><div><label style={LBL}>Qty</label><input type="number" style={INP} value={editForm.qty||""} onChange={e=>setEditForm(f=>({...f,qty:parseInt(e.target.value)||null}))}/></div><div><label style={LBL}>Unit</label><select style={{...INP,appearance:"none"}} value={editForm.unit} onChange={e=>setEditForm(f=>({...f,unit:e.target.value}))}><option>Ctn</option><option>Jota</option><option>Bag</option></select></div></div>
        <div><label style={LBL}>Date</label><input type="date" style={INP} value={editForm.date} onChange={e=>setEditForm(f=>({...f,date:e.target.value}))}/></div>
        <div><label style={LBL}>Status</label><select style={{...INP,appearance:"none"}} value={editForm.status} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))}>{["Pending","Ready","On Hold","Dispatched"].map(s=><option key={s}>{s}</option>)}</select></div>
        <div style={{display:"flex",gap:8}}><button onClick={()=>setEditForm(null)} style={{flex:1,background:C.bg,border:`1px solid ${C.cb}`,color:C.muted,borderRadius:10,padding:12,fontWeight:700,cursor:"pointer"}}>Cancel</button><button onClick={saveEdit} style={{flex:2,background:lc,border:"none",color:"#fff",borderRadius:10,padding:12,fontWeight:800,cursor:"pointer"}}>Save Changes ✓</button></div>
      </div>
    </Mod>}
    {/* New Dispatch Modal */}
    {showNew&&<Mod onClose={()=>setShowNew(false)} title="+ New Dispatch" sub={loc}>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <div><label style={LBL}>Client *</label><input style={INP} placeholder="e.g. Taj Hotels" value={form.client} onChange={e=>setForm({...form,client:e.target.value})}/></div>
        <div><label style={LBL}>Transport</label><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{TR.map(t=><button key={t} type="button" onClick={()=>setForm({...form,transport:t})} style={{background:form.transport===t?C.green+"33":C.cb,color:form.transport===t?C.green:C.muted,border:`1px solid ${form.transport===t?C.green+"55":"transparent"}`,borderRadius:6,padding:"4px 9px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{t}</button>)}</div></div>
        <div><label style={LBL}>Date</label><input type="date" style={INP} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
        <button onClick={add} style={{background:lc,border:"none",color:"#fff",borderRadius:10,padding:13,fontWeight:800,cursor:"pointer"}}>Save — Add Qty Later ›</button>
      </div>
    </Mod>}
    <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
      <label style={{...LBL,marginBottom:0}}>📅 Date</label>
      <input type="date" style={{...INP,maxWidth:170}} value={dispDate} onChange={e=>setDispDate(e.target.value)}/>
      {dispDate&&<button onClick={()=>setDispDate("")} style={{background:C.bg,border:`1px solid ${C.cb}`,color:C.muted,borderRadius:8,padding:"0 14px",height:38,fontWeight:700,cursor:"pointer",fontSize:12}}>Clear</button>}
    </div>
    <div style={{display:"flex",gap:5,marginBottom:14,background:C.card,borderRadius:11,padding:4}}>{["Bhiwandi","Local Tansha","Local Kaizen"].map(l=>{const lcc=LC[l];const act=loc===l;return<button key={l} onClick={()=>setLoc(l)} style={{flex:1,background:act?lcc+"33":"transparent",border:`1px solid ${act?lcc+"55":"transparent"}`,borderRadius:9,padding:"9px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><span style={{fontSize:13}}>{l==="Bhiwandi"?"🏭":l==="Local Tansha"?"🏬":"🏢"}</span><span style={{color:act?lcc:C.muted,fontSize:9,fontWeight:700,textAlign:"center"}}>{l}</span></button>;})}
    </div>
    {showLR&&<LRSummary disps={disps} setDisps={setDisps} onClose={()=>setShowLR(false)}/>}
    <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}><Pill label="Ready" value={ready.length} color={C.orange}/><Pill label="Dispatched" value={disp.length} color={C.green}/><Pill label="Pending" value={pend.length} color={C.acc}/>{held.length>0&&<Pill label="On Hold" value={held.length} color={C.red}/>}{allPendingLR>0&&<Pill label="Pending LR" value={allPendingLR} color={C.orange}/>}
      <div style={{marginLeft:"auto",display:"flex",gap:6}}>
        <button onClick={()=>setShowLR(true)} style={{background:C.bg,border:`1px solid ${C.cb}`,color:C.muted,borderRadius:7,padding:"5px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>📋 Pending LR</button>
        <button onClick={exportDispatchPDF} style={{background:C.bg,border:`1px solid ${C.cb}`,color:C.muted,borderRadius:7,padding:"5px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>📄 PDF</button>
        <button onClick={()=>setShowNew(true)} style={{background:lc,border:"none",color:"#fff",borderRadius:7,padding:"5px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ New</button>
      </div>
    </div>
    {ready.length>0&&<><SL text={`Ready to Dispatch (${ready.length})`} color={C.orange}/><div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>{ready.map(d=><DCard key={d.id} d={d} lc={lc} onOpen={openD}/>)}</div></>}
    {held.length>0&&<><SL text={`On Hold (${held.length})`} color={C.red}/><div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>{held.map(d=><DCard key={d.id} d={d} lc={lc} onOpen={openD}/>)}</div></>}
    {pend.length>0&&<><SL text={`Pending (${pend.length})`} color={C.acc}/><div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>{pend.map(d=><DCard key={d.id} d={d} lc={lc} onOpen={openD}/>)}</div></>}
    {disp.length>0&&<><SL text={`Dispatched (${disp.length})`} color={C.green}/><div style={{display:"flex",flexDirection:"column",gap:7}}>{disp.map(d=><DCard key={d.id} d={d} lc={lc} onOpen={openD}/>)}</div></>}
  </div>);
}

function LRSummary({disps,setDisps,onClose}){
  const [date,setDate]=useState("");
  const locs=["Bhiwandi","Local Tansha","Local Kaizen"];
  function markLR(loc,id){setDisps(p=>({...p,[loc]:p[loc].map(d=>d.id===id?{...d,lr:true}:d)}));}
  const groups=locs.map(loc=>({loc,items:(disps[loc]||[]).filter(d=>d.status==="Dispatched"&&!d.lr&&(!date||d.date===date))}));
  const total=groups.reduce((s,g)=>s+g.items.length,0);
  return (<Mod onClose={onClose} title="Pending LR Summary" sub="Across all sections">
    <div style={{marginBottom:14}}>
      <label style={LBL}>Filter by Date</label>
      <div style={{display:"flex",gap:8}}>
        <input type="date" style={INP} value={date} onChange={e=>setDate(e.target.value)}/>
        {date&&<button onClick={()=>setDate("")} style={{background:C.bg,border:`1px solid ${C.cb}`,color:C.muted,borderRadius:8,padding:"0 14px",fontWeight:700,cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>
    </div>
    {total===0&&<div style={{textAlign:"center",padding:"20px 0",color:C.muted,fontSize:13}}>✅ No pending LRs{date?" for this date":""}.</div>}
    {groups.filter(g=>g.items.length>0).map(g=><div key={g.loc} style={{marginBottom:14}}>
      <SL text={`${g.loc} (${g.items.length})`} color={LC[g.loc]}/>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>{g.items.map(d=><div key={d.id} style={{background:C.card,border:`1px solid ${C.cb}`,borderRadius:9,padding:"9px 12px",display:"flex",alignItems:"center",gap:9}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:C.text,fontWeight:700,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.client}</div>
          <div style={{color:C.muted,fontSize:11,marginTop:2}}>{d.qty?`${d.qty} ${d.unit}`:"No Qty"} · {d.transport} · {d.date}</div>
        </div>
        <button onClick={()=>markLR(g.loc,d.id)} style={{background:C.green+"22",border:`1px solid ${C.green}44`,color:C.green,borderRadius:8,padding:"7px 11px",fontWeight:700,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>✅ Mark LR</button>
      </div>)}</div>
    </div>)}
  </Mod>);
}

// ── Stocks ──
const ST0={Ocean:[{id:1,code:"B01709",name:"ALOHA 09 OZ (280 ML)",mrp:682,cmrp:7140,k2d:91,k1f:0,k2f:468,re:20,boxCtn:12,cont:""},{id:2,code:"B01712",name:"ALOHA 12 OZ (360 ML)",mrp:629,cmrp:7548,k2d:0,k1f:0,k2f:372,re:20,boxCtn:12,cont:""},{id:3,code:"B25313",name:"BONDI HI BALL 380 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:6,cont:"100"},{id:4,code:"B25312",name:"BONDI DOUBLE ROCK 360 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:6,cont:"100"},{id:5,code:"B25310",name:"BONDI ROCK 280 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:6,cont:"100"},{id:6,code:"B03616",name:"BAWARIA 16 OZ ( 455 ML )",mrp:738,cmrp:4428,k2d:0,k1f:0,k2f:0,re:20,boxCtn:6,cont:"50"},{id:7,code:"B25414",name:"BELLY PILSNER 410 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:4,cont:"50"},{id:8,code:"B25412",name:"BELLY TUMBLER 355 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:5,re:20,boxCtn:8,cont:"50"},{id:9,code:"J14209",name:"CUBA 09 (270 ML)",mrp:637,cmrp:7644,k2d:0,k1f:0,k2f:27,re:20,boxCtn:12,cont:""},{id:10,code:"B01010",name:"CONICAL S 10 (285ML)",mrp:571,cmrp:6852,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:""},{id:11,code:"B01015",name:"CONICAL S 15 (425ML)",mrp:607,cmrp:7284,k2d:32,k1f:0,k2f:25,re:20,boxCtn:12,cont:""},{id:12,code:"B01022",name:"CONICAL S 22 (620ML)",mrp:772,cmrp:6176,k2d:56,k1f:56,k2f:1,re:20,boxCtn:8,cont:""},{id:13,code:"P02808",name:"CONNECTION HI BALL ( 350 ML )",mrp:949,cmrp:7592,k2d:0,k1f:166,k2f:230,re:20,boxCtn:8,cont:""},{id:14,code:"P02809",name:"CONNECTION LONG DRINK ( 430 ML )",mrp:1138,cmrp:6828,k2d:0,k1f:426,k2f:54,re:20,boxCtn:6,cont:""},{id:15,code:"P02807",name:"CONNECTION D ROCK ( 350 ML )",mrp:949,cmrp:7592,k2d:0,k1f:0,k2f:499,re:20,boxCtn:8,cont:""},{id:16,code:"P02810",name:"CONNECTION MIXING 625B ML (2 PCS)",mrp:2298,cmrp:13788,k2d:43,k1f:38,k2f:138,re:20,boxCtn:6,cont:""},{id:17,code:"P02880",name:"CONNECTION WHISKY ROCK ( 305ML )",mrp:1011,cmrp:4044,k2d:0,k1f:0,k2f:0,re:20,boxCtn:4,cont:"25"},{id:18,code:"P01960",name:"CENTRA 60 ROCK ( 300 ML )",mrp:697,cmrp:5576,k2d:302,k1f:0,k2f:0,re:20,boxCtn:8,cont:"215"},{id:19,code:"P01961",name:"CENTRA 61 HI BALL ( 300ML)",mrp:697,cmrp:5576,k2d:227,k1f:0,k2f:0,re:20,boxCtn:8,cont:"215"},{id:20,code:"P01962",name:"CENTRA 62 HI BALL ( 420 ML )",mrp:905,cmrp:7240,k2d:147,k1f:6,k2f:0,re:20,boxCtn:8,cont:""},{id:21,code:"P01963",name:"CENTRA 63 LONG DRINK 495",mrp:1011,cmrp:6066,k2d:0,k1f:73,k2f:209,re:20,boxCtn:6,cont:""},{id:22,code:"P01964",name:"CENTRA 64 ROCK (200 ML)",mrp:0,cmrp:0,k2d:118,k1f:0,k2f:303,re:20,boxCtn:8,cont:""},{id:23,code:"P03160",name:"CENTIQUE 60 ROCK ( 245 ML )",mrp:790,cmrp:6320,k2d:0,k1f:0,k2f:24,re:20,boxCtn:8,cont:""},{id:24,code:"P03161",name:"CENTIQUE 61 DOUBLE ROCK ( 345 ML )",mrp:826,cmrp:6608,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:25,code:"P03162",name:"CENTIQUE 62 HI BALL ( 370 ML )",mrp:956,cmrp:7648,k2d:26,k1f:20,k2f:0,re:20,boxCtn:8,cont:""},{id:26,code:"B17112",name:"CHARISMA 12 OZ (340 ML)",mrp:738,cmrp:5904,k2d:0,k1f:0,k2f:41,re:20,boxCtn:8,cont:""},{id:27,code:"B17115",name:"CHARISMA 15 OZ (415 ML)",mrp:791,cmrp:6328,k2d:0,k1f:0,k2f:22,re:20,boxCtn:8,cont:""},{id:28,code:"B21409",name:"ETHAN 09 (265 ML)",mrp:764,cmrp:6112,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:29,code:"B21413",name:"ETHAN 13 (360 ML)",mrp:810,cmrp:6480,k2d:0,k1f:0,k2f:218,re:20,boxCtn:8,cont:""},{id:30,code:"B21416",name:"ETHAN 16 (445 ML)",mrp:810,cmrp:6480,k2d:49,k1f:79,k2f:0,re:20,boxCtn:8,cont:""},{id:31,code:"B01206",name:"FIN LINE 06 OZ (175 ML)",mrp:468,cmrp:5616,k2d:0,k1f:0,k2f:83,re:20,boxCtn:12,cont:""},{id:32,code:"B01210",name:"FIN LNE 10 OZ (280 ML)",mrp:516,cmrp:6192,k2d:0,k1f:0,k2f:227,re:20,boxCtn:12,cont:""},{id:33,code:"B01213",name:"FIN LNE 13 OZ (355 ML)",mrp:571,cmrp:6852,k2d:0,k1f:0,k2f:47,re:20,boxCtn:12,cont:""},{id:34,code:"B01913",name:"FINE DRINK 13 OZ (380 ML)",mrp:571,cmrp:6852,k2d:315,k1f:0,k2f:0,re:20,boxCtn:12,cont:""},{id:35,code:"B01916",name:"FINE DRINK 16 OZ (485 ML)",mrp:607,cmrp:4856,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:""},{id:36,code:"C24010",name:"FYN ROCK ( 290 ML )",mrp:865,cmrp:10380,k2d:0,k1f:0,k2f:48,re:20,boxCtn:12,cont:""},{id:37,code:"C24014",name:"FYN D ROCK",mrp:1075,cmrp:8600,k2d:30,k1f:184,k2f:0,re:20,boxCtn:8,cont:""},{id:38,code:"C24012",name:"FYN HI BALL 350 ML",mrp:865,cmrp:6920,k2d:38,k1f:179,k2f:0,re:20,boxCtn:8,cont:""},{id:39,code:"C241016",name:"FYN LONG ( DRINK 460 ML )",mrp:1075,cmrp:8600,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:40,code:"B17202",name:"HAIKU SAKE 02 OZ (60 ML)",mrp:475,cmrp:3800,k2d:0,k1f:0,k2f:0,re:20,boxCtn:6,cont:"20"},{id:41,code:"B07711",name:"HANSA 11 OZ (300 ML)",mrp:571,cmrp:6852,k2d:0,k1f:151,k2f:491,re:20,boxCtn:12,cont:""},{id:42,code:"B01408",name:"HI BALL 08 OZ (245 ML)",mrp:468,cmrp:5616,k2d:0,k1f:0,k2f:22,re:20,boxCtn:8,cont:""},{id:43,code:"R00216",name:"IMPERIAL 16 OZ (475 ML)",mrp:1185,cmrp:4740,k2d:0,k1f:0,k2f:358,re:20,boxCtn:4,cont:""},{id:44,code:"R00219",name:"IMPERIAL 19 OZ (545 ML)",mrp:1221,cmrp:4884,k2d:0,k1f:0,k2f:292,re:20,boxCtn:4,cont:""},{id:45,code:"B13009",name:"IVORY 09 OZ (265 ML)",mrp:663,cmrp:7956,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:"50"},{id:46,code:"B13011",name:"IVORY 11 OZ (320 ML)",mrp:702,cmrp:8424,k2d:0,k1f:0,k2f:37,re:20,boxCtn:12,cont:""},{id:47,code:"B13013",name:"IVORY 13 OZ (370 ML)",mrp:738,cmrp:8856,k2d:0,k1f:0,k2f:100,re:20,boxCtn:12,cont:""},{id:48,code:"B13016",name:"IVORY 16 OZ (460 ML)",mrp:753,cmrp:9036,k2d:0,k1f:0,k2f:1,re:20,boxCtn:12,cont:"25"},{id:49,code:"C13011",name:"IRIS 11 OZ ( 320 ML )",mrp:918,cmrp:11016,k2d:0,k1f:0,k2f:5,re:20,boxCtn:12,cont:""},{id:50,code:"C13013",name:"IRIS 13 OZ ( 370 ML )",mrp:918,cmrp:11016,k2d:0,k1f:0,k2f:8,re:20,boxCtn:12,cont:""},{id:51,code:"B22711",name:"JUBILEE HI BALL 11oz ( 335 ML )",mrp:867,cmrp:6936,k2d:0,k1f:0,k2f:126,re:20,boxCtn:8,cont:""},{id:52,code:"B22712",name:"JUBILEE ROCK 12 oz ( 340 ML )",mrp:867,cmrp:6936,k2d:0,k1f:0,k2f:24,re:20,boxCtn:8,cont:""},{id:53,code:"B00208",name:"LONGCOOL 08 OZ (245ML)",mrp:551,cmrp:6612,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:""},{id:54,code:"B00210",name:"LONGCOOL 10 OZ (315 ML)",mrp:571,cmrp:6852,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:"50"},{id:55,code:"B07206",name:"LYRA 06 OZ ( 170 ML )",mrp:516,cmrp:6192,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:"50"},{id:56,code:"B21307",name:"METROPOLITAN 07 ( 210 ML )",mrp:535,cmrp:4280,k2d:0,k1f:0,k2f:159,re:20,boxCtn:8,cont:""},{id:57,code:"B21312",name:"METROPOLITAN 12 ( 330 ML )",mrp:673,cmrp:5384,k2d:0,k1f:0,k2f:227,re:20,boxCtn:8,cont:""},{id:58,code:"B21314",name:"METROPOLITAN 14 ( 400 ML )",mrp:906,cmrp:7248,k2d:0,k1f:0,k2f:222,re:20,boxCtn:8,cont:""},{id:59,code:"B21315",name:"METROPOLITAN 15 ( 410 ML )",mrp:1367,cmrp:5468,k2d:0,k1f:0,k2f:0,re:20,boxCtn:4,cont:""},{id:60,code:"B21323",name:"METROPOLITAN 23 ( 655 ML )",mrp:1545,cmrp:6180,k2d:0,k1f:0,k2f:26,re:20,boxCtn:4,cont:""},{id:61,code:"B24516",name:"MODULAR LONG DRINK ( 460 ML )",mrp:610,cmrp:4880,k2d:0,k1f:0,k2f:3,re:20,boxCtn:8,cont:""},{id:62,code:"B24522",name:"MODULAR LONG DRINK ( 630 ML )",mrp:760,cmrp:6080,k2d:4,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:63,code:"P04261L",name:"MATTER FIX D ROCK ( 350 ML )",mrp:0,cmrp:0,k2d:0,k1f:87,k2f:0,re:20,boxCtn:6,cont:""},{id:64,code:"P04262L",name:"MATTER FLOW D ROCK ( 350 ML )",mrp:0,cmrp:0,k2d:0,k1f:90,k2f:60,re:20,boxCtn:6,cont:""},{id:65,code:"P04263L",name:"MATTER FRESH D ROCK ( 350 ML )",mrp:0,cmrp:0,k2d:0,k1f:36,k2f:109,re:20,boxCtn:6,cont:""},{id:66,code:"B07807",name:"NEWYORK 07 OZ (205ML)",mrp:628,cmrp:7536,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:""},{id:67,code:"B07811",name:"NEWYORK 11OZ (320ML)",mrp:628,cmrp:5024,k2d:77,k1f:0,k2f:0,re:20,boxCtn:8,cont:"250"},{id:68,code:"B07812",name:"NEWYORK 12 OZ(340ML)",mrp:628,cmrp:5024,k2d:61,k1f:0,k2f:0,re:20,boxCtn:8,cont:"250"},{id:69,code:"B18310",name:"PATIO 10 OZ ( 290 ML )",mrp:645,cmrp:7740,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:"50"},{id:70,code:"B00907",name:"PILSNER 07 OZ (200 ML)",mrp:571,cmrp:4568,k2d:0,k1f:0,k2f:237,re:20,boxCtn:8,cont:""},{id:71,code:"B00910",name:"PILSNER 10 OZ (300 ML)",mrp:663,cmrp:5304,k2d:109,k1f:0,k2f:650,re:20,boxCtn:8,cont:""},{id:72,code:"BO5011",name:"PILSNER 11 OZ (315 ML)",mrp:738,cmrp:5904,k2d:0,k1f:0,k2f:776,re:20,boxCtn:8,cont:""},{id:73,code:"B00912",name:"PILSNER 12 OZ (340 ML)",mrp:663,cmrp:8304,k2d:3,k1f:27,k2f:175,re:20,boxCtn:8,cont:""},{id:74,code:"B00914",name:"PILSNER 14 OZ (400 ML)",mrp:772,cmrp:6176,k2d:305,k1f:0,k2f:512,re:20,boxCtn:8,cont:""},{id:75,code:"B11007",name:"PLAZA 07 ( 195) ML",mrp:645,cmrp:7740,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:"50"},{id:76,code:"B11010",name:"PLAZA 10 OZ (295 ML)",mrp:738,cmrp:8856,k2d:83,k1f:0,k2f:186,re:20,boxCtn:12,cont:""},{id:77,code:"B11011",name:"PLAZA 11 OZ (320 ML)",mrp:738,cmrp:8856,k2d:0,k1f:0,k2f:179,re:20,boxCtn:12,cont:""},{id:78,code:"B11014",name:"PLAZA 14 OZ (405 ML)",mrp:791,cmrp:6328,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"50"},{id:79,code:"P00210",name:"PLAZA SHOT 2 OZ (55 ML) 12 PC PACK",mrp:1178,cmrp:7068,k2d:0,k1f:0,k2f:130,re:20,boxCtn:6,cont:""},{id:80,code:"B024612",name:"PULSE D ROCK ( 355 ML )",mrp:675,cmrp:5400,k2d:0,k1f:0,k2f:61,re:20,boxCtn:8,cont:""},{id:81,code:"B024608",name:"PULSE ROCK ( 235 ML )",mrp:675,cmrp:5400,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:82,code:"B024610",name:"PULSE HI BALL (285 ML)",mrp:675,cmrp:5400,k2d:0,k1f:0,k2f:488,re:20,boxCtn:8,cont:""},{id:83,code:"B024613",name:"PULSE LONG DRINK (370 ML)",mrp:710,cmrp:5680,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:84,code:"B02309",name:"PYRAMID 09 OZ (260 ML)",mrp:571,cmrp:6852,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:"25"},{id:85,code:"B02310",name:"PYRAMID 10 OZ (300 ML)",mrp:640,cmrp:7680,k2d:0,k1f:0,k2f:340,re:20,boxCtn:12,cont:""},{id:86,code:"B02311",name:"PYRAMID 11 OZ (330 ML)",mrp:663,cmrp:7956,k2d:0,k1f:0,k2f:68,re:20,boxCtn:12,cont:""},{id:87,code:"B02313",name:"PYRAMID 13 OZ (380 ML)",mrp:701,cmrp:8412,k2d:276,k1f:0,k2f:476,re:20,boxCtn:12,cont:""},{id:88,code:"B00209",name:"ROCK 9 OZ (245 ML)",mrp:551,cmrp:6612,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:"25"},{id:89,code:"B00710",name:"ROCK 10 OZ (285 ML)",mrp:551,cmrp:6612,k2d:0,k1f:0,k2f:9,re:20,boxCtn:12,cont:"25"},{id:90,code:"R00312",name:"ROYAL ( 355 ML )",mrp:1185,cmrp:4740,k2d:259,k1f:0,k2f:205,re:20,boxCtn:4,cont:""},{id:91,code:"B19212",name:"SALSA HI BALL",mrp:1050,cmrp:8400,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:92,code:"P03010",name:"SAN MARINO SHOT ( 65 ML ) 12 PC PACK",mrp:956,cmrp:5736,k2d:0,k1f:98,k2f:0,re:20,boxCtn:6,cont:""},{id:93,code:"B00406",name:"SANMARINO 6 0Z (175 ML)",mrp:532,cmrp:6384,k2d:0,k1f:0,k2f:136,re:20,boxCtn:12,cont:""},{id:94,code:"B00409",name:"SANMARINO 09 OZ (245 ML)",mrp:607,cmrp:7284,k2d:155,k1f:0,k2f:0,re:20,boxCtn:12,cont:""},{id:95,code:"B00410",name:"SANMARINO 10 OZ (290 ML)",mrp:607,cmrp:7284,k2d:151,k1f:0,k2f:165,re:20,boxCtn:12,cont:"250"},{id:96,code:"B00411",name:"SANAMARINO 11 OZ (300 ML)",mrp:663,cmrp:7956,k2d:27,k1f:0,k2f:1050,re:20,boxCtn:12,cont:""},{id:97,code:"B00412",name:"SANAMRINO 12 OZ (350 ML)",mrp:663,cmrp:5304,k2d:0,k1f:0,k2f:423,re:20,boxCtn:8,cont:""},{id:98,code:"B00414",name:"SANAMRINO 14 OZ (385 ML)",mrp:791,cmrp:6328,k2d:0,k1f:0,k2f:869,re:20,boxCtn:8,cont:""},{id:99,code:"B00416",name:"SANAMRINO 16 OZ (480 ML)",mrp:791,cmrp:6328,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"20"},{id:100,code:"B017012",name:"SCIROCCO 12 OZ (340 ML)",mrp:738,cmrp:5904,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"50"},{id:101,code:"B017014",name:"SCIROCCO 14 0Z (410 ML)",mrp:738,cmrp:5904,k2d:136,k1f:0,k2f:11,re:20,boxCtn:8,cont:""},{id:102,code:"P00110",name:"SOLO SHOT 02 OZ (60ML)",mrp:912,cmrp:5472,k2d:193,k1f:0,k2f:113,re:20,boxCtn:6,cont:""},{id:103,code:"B00109",name:"STACK 9 OZ (245 ML)",mrp:468,cmrp:5616,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:""},{id:104,code:"B16112",name:"STUDIO 12 OZ (345 ML)",mrp:702,cmrp:5616,k2d:0,k1f:0,k2f:108,re:20,boxCtn:8,cont:""},{id:105,code:"B16115",name:"STUDIO 15 OZ (435 ML)",mrp:738,cmrp:5904,k2d:0,k1f:0,k2f:39,re:20,boxCtn:8,cont:""},{id:106,code:"B00808",name:"SWEET BELL 08 OZ (235 ML)",mrp:601,cmrp:7212,k2d:0,k1f:0,k2f:6,re:20,boxCtn:12,cont:""},{id:107,code:"B00812",name:"SWEET BELL 12 OZ (345 ML)",mrp:607,cmrp:7284,k2d:88,k1f:0,k2f:0,re:20,boxCtn:12,cont:""},{id:108,code:"P03863",name:"SPACE WAVE HI BALL (300 ML )",mrp:610,cmrp:4880,k2d:25,k1f:0,k2f:73,re:20,boxCtn:8,cont:""},{id:109,code:"P03861",name:"SPACE LEAF HI BALL ( 300 ML )",mrp:610,cmrp:4880,k2d:41,k1f:0,k2f:86,re:20,boxCtn:8,cont:""},{id:110,code:"P03862",name:"SPACE STRIPE HI BALL ( 300 ML )",mrp:610,cmrp:4880,k2d:9,k1f:0,k2f:69,re:20,boxCtn:8,cont:""},{id:111,code:"B13309",name:"TANGO 09 0Z (255 ML)",mrp:663,cmrp:5304,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:112,code:"B13311",name:"TANGO 11 OZ (315 ML)",mrp:702,cmrp:5616,k2d:0,k1f:0,k2f:281,re:20,boxCtn:8,cont:""},{id:113,code:"B13312",name:"TANGO 12 OZ (350 ML)",mrp:738,cmrp:5904,k2d:94,k1f:0,k2f:281,re:20,boxCtn:8,cont:""},{id:114,code:"B13315",name:"TANGO 15OZ (425 ML)",mrp:773,cmrp:6184,k2d:0,k1f:75,k2f:112,re:20,boxCtn:8,cont:""},{id:115,code:"B12009",name:"TIARA 09 OZ (270 ML)",mrp:663,cmrp:5304,k2d:0,k1f:0,k2f:147,re:20,boxCtn:8,cont:""},{id:116,code:"B12012",name:"TIARA 12 OZ (355 ML)",mrp:702,cmrp:5616,k2d:0,k1f:0,k2f:431,re:20,boxCtn:8,cont:""},{id:117,code:"B12013",name:"TIARA 13 OZ (365 ML)",mrp:738,cmrp:5904,k2d:0,k1f:0,k2f:455,re:20,boxCtn:8,cont:""},{id:118,code:"B12016",name:"TIARA 16 OZ",mrp:791,cmrp:6328,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"20"},{id:119,code:"B17514",name:"TIARA FOOTED",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:25,re:20,boxCtn:8,cont:"50"},{id:120,code:"B19811",name:"TRINITY 11 OZ ( 305 ML )",mrp:866,cmrp:6928,k2d:0,k1f:0,k2f:114,re:20,boxCtn:8,cont:""},{id:121,code:"B19813",name:"TRINITY 13 OZ ( 380 ML )",mrp:937,cmrp:7496,k2d:0,k1f:0,k2f:139,re:20,boxCtn:8,cont:""},{id:122,code:"B00309",name:"TOP DRINK 09 ( 235 ML )",mrp:551,cmrp:6612,k2d:11,k1f:0,k2f:118,re:20,boxCtn:12,cont:""},{id:123,code:"B00310",name:"TOP DRINK 10 OZ (305 ML)",mrp:571,cmrp:6852,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:"50"},{id:124,code:"B00311",name:"TOP DRINK 11 OZ ( 325 ML )",mrp:607,cmrp:7284,k2d:0,k1f:0,k2f:81,re:20,boxCtn:12,cont:""},{id:125,code:"B00313",name:"TOP DRINK 13 OZ ( 370 ML )",mrp:607,cmrp:7284,k2d:0,k1f:0,k2f:212,re:20,boxCtn:12,cont:""},{id:126,code:"B00322",name:"TOP DRINK 22 OZ ( 625 ML )",mrp:791,cmrp:6328,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:127,code:"P03661",name:"TRAZE 61 PST D ROCK ( 350 ML )",mrp:1420,cmrp:8520,k2d:0,k1f:0,k2f:310,re:20,boxCtn:6,cont:""},{id:128,code:"P03662",name:"TRAZE 62 PRE D ROCK ( 350 ML )",mrp:1420,cmrp:8520,k2d:0,k1f:0,k2f:114,re:20,boxCtn:6,cont:""},{id:129,code:"P03663",name:"TRAZE 63 FTR D ROCK ( 350 ML )",mrp:1420,cmrp:8520,k2d:0,k1f:0,k2f:520,re:20,boxCtn:6,cont:""},{id:130,code:"P03664",name:"TRAZE 64 PST LONG DRINK ( 350 ML )",mrp:1420,cmrp:8520,k2d:30,k1f:100,k2f:500,re:20,boxCtn:6,cont:""},{id:131,code:"P03665",name:"TRAZE 65 PRE LONG DRINK ( 350 ML )",mrp:1420,cmrp:8520,k2d:0,k1f:46,k2f:81,re:20,boxCtn:6,cont:""},{id:132,code:"P03666",name:"TRAZE 66 FTR LONG DRINK ( 350 ML )",mrp:1420,cmrp:8520,k2d:81,k1f:0,k2f:200,re:20,boxCtn:6,cont:""},{id:133,code:"B02109",name:"UNITY 09 OZ (255 ML)",mrp:552,cmrp:6624,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:""},{id:134,code:"B02110",name:"UNITY 10 OZ (290 ML)",mrp:607,cmrp:7284,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:"50"},{id:135,code:"B02113",name:"UNITY 13 OZ (370 ML)",mrp:663,cmrp:7956,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:"50"},{id:136,code:"B02910",name:"UNO SHOT ( 35 ML ) ( 12 PC PACK )",mrp:848,cmrp:5088,k2d:0,k1f:0,k2f:0,re:20,boxCtn:6,cont:""},{id:137,code:"P03710",name:"VERRINE SHOT GLASS ( 60 ML ) 12 PC PACK",mrp:1210,cmrp:7260,k2d:0,k1f:16,k2f:0,re:20,boxCtn:6,cont:""},{id:138,code:"B16315",name:"VIVA FOOTED 15 0Z",mrp:1595,cmrp:6380,k2d:68,k1f:0,k2f:0,re:20,boxCtn:4,cont:""},{id:139,code:"A113C01",name:"GATSBY BLUE ROCK 350 ML",mrp:0,cmrp:2340,k2d:0,k1f:0,k2f:35,re:20,boxCtn:4,cont:""},{id:140,code:"A113C03",name:"GATSBY GREEN ROCK 350 ML",mrp:0,cmrp:2340,k2d:0,k1f:0,k2f:17,re:20,boxCtn:4,cont:""},{id:141,code:"A113C02",name:"GATSBY VIOLET ROCK 350 ML",mrp:0,cmrp:2340,k2d:0,k1f:0,k2f:28,re:20,boxCtn:4,cont:""},{id:142,code:"A014C01",name:"TWILIGHT INDIGO ROCK 370 ML",mrp:0,cmrp:2700,k2d:0,k1f:0,k2f:8,re:20,boxCtn:4,cont:""},{id:143,code:"A014C02",name:"TWILIGHT BRONZE ROCK 370 ML",mrp:0,cmrp:2700,k2d:0,k1f:0,k2f:1,re:20,boxCtn:4,cont:""},{id:144,code:"A014C03",name:"TWILIGHT PURPLE ROCK 370 ML",mrp:0,cmrp:2700,k2d:0,k1f:0,k2f:28,re:20,boxCtn:4,cont:""},{id:145,code:"B  13011",name:"IVORY 11 OZ (320 ML) GOLD",mrp:1202,cmrp:14424,k2d:0,k1f:0,k2f:40,re:20,boxCtn:12,cont:""},{id:146,code:"B 13011",name:"IVORY 11 OZ (320 ML) PLATINUM",mrp:1202,cmrp:14424,k2d:0,k1f:0,k2f:33,re:20,boxCtn:12,cont:""},{id:147,code:"B  13013",name:"IVORY 13 OZ (370 ML) GOLD",mrp:1202,cmrp:14424,k2d:0,k1f:0,k2f:34,re:20,boxCtn:12,cont:""},{id:148,code:"B 13013",name:"IVORY 13 OZ (370 ML) PLATINUM",mrp:1202,cmrp:14424,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:""},{id:149,code:"CODE",name:"ITEMS",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""},{id:150,code:"P00115",name:"ALASKA ICE CREAM CUP ( 205 ML )",mrp:886,cmrp:3544,k2d:107,k1f:550,k2f:0,re:20,boxCtn:4,cont:""},{id:151,code:"P00315",name:"ALASKA SUNDAY CUP ( 255 ML )",mrp:1035,cmrp:4140,k2d:0,k1f:0,k2f:0,re:20,boxCtn:4,cont:"50"},{id:152,code:"P00415",name:"ALASKA SODA CUP ( 355 ML )",mrp:1595,cmrp:6380,k2d:0,k1f:2,k2f:0,re:20,boxCtn:4,cont:""},{id:153,code:"P00116",name:"ALASKA BANNANA SPLIT",mrp:1035,cmrp:4140,k2d:0,k1f:0,k2f:39,re:20,boxCtn:4,cont:""},{id:154,code:"P00140",name:"BEER MUG PLAY BOY ( 357 ML )",mrp:1329,cmrp:7974,k2d:16,k1f:6,k2f:0,re:20,boxCtn:6,cont:""},{id:155,code:"P00740",name:"BEER MUG LUGANO ( 330 ML )",mrp:1250,cmrp:7500,k2d:0,k1f:15,k2f:114,re:20,boxCtn:6,cont:""},{id:156,code:"P00840",name:"BEER MUG MUNICH ( 355 ML )",mrp:1329,cmrp:5316,k2d:15,k1f:0,k2f:0,re:20,boxCtn:4,cont:""},{id:157,code:"P00843",name:"BEER MUG MUNICH ( BIG 640 ML )",mrp:2088,cmrp:4176,k2d:0,k1f:0,k2f:702,re:20,boxCtn:2,cont:""},{id:158,code:"P00940",name:"BEER MUG BERLINER ( 365 ML )",mrp:1683,cmrp:6732,k2d:0,k1f:0,k2f:211,re:20,boxCtn:4,cont:""},{id:159,code:"P04340",name:"BELLYMUG 365 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:7,re:20,boxCtn:0,cont:""},{id:160,code:"P0615",name:"DELIGHT ICE CREAM CUP ( 5 1/2 OZ )",mrp:1010,cmrp:4040,k2d:0,k1f:0,k2f:0,re:20,boxCtn:4,cont:"50"},{id:161,code:"P0616",name:"DELIGHT (B SPLIT)",mrp:1180,cmrp:4720,k2d:0,k1f:18,k2f:57,re:20,boxCtn:4,cont:""},{id:162,code:"P0617",name:"DELIGHT SUNDAY ( 5 1/2 OZ )",mrp:1010,cmrp:4040,k2d:0,k1f:0,k2f:0,re:20,boxCtn:4,cont:"50"},{id:163,code:"P0618",name:"DELIGHT SUNDAY ( 6 3/4 OZ )",mrp:1157,cmrp:4628,k2d:0,k1f:17,k2f:47,re:20,boxCtn:4,cont:""},{id:164,code:"B02511",name:"POP JAR (325ml) G LID",mrp:980,cmrp:5880,k2d:0,k1f:81,k2f:422,re:20,boxCtn:6,cont:""},{id:165,code:"B02517",name:"POP JAR (500ml) G LID",mrp:1195,cmrp:7170,k2d:0,k1f:0,k2f:854,re:20,boxCtn:6,cont:""},{id:166,code:"B02523",name:"POP JAR (650 ML) G LID",mrp:1296,cmrp:8316,k2d:0,k1f:0,k2f:6,re:20,boxCtn:6,cont:""},{id:167,code:"B02526",name:"POP JAR ( 750 ML) G LID",mrp:1386,cmrp:8316,k2d:0,k1f:0,k2f:446,re:20,boxCtn:6,cont:""},{id:168,code:"B02536",name:"POP JAR ( 1000 ML ) G LID",mrp:1573,cmrp:6292,k2d:0,k1f:0,k2f:0,re:20,boxCtn:4,cont:""},{id:169,code:"B02511 W",name:"POP JAR (325ml) W LID",mrp:1550,cmrp:9300,k2d:0,k1f:0,k2f:0,re:20,boxCtn:6,cont:""},{id:170,code:"B02517 W",name:"POP JAR (500ml) W LID",mrp:1728,cmrp:10368,k2d:0,k1f:0,k2f:489,re:20,boxCtn:6,cont:""},{id:171,code:"B02523 W",name:"POP JAR (650ml) W LID",mrp:1835,cmrp:11010,k2d:0,k1f:0,k2f:0,re:20,boxCtn:6,cont:""},{id:172,code:"B02526 W",name:"POP JAR (750ml) W LID",mrp:1955,cmrp:11730,k2d:0,k1f:0,k2f:168,re:20,boxCtn:6,cont:""},{id:173,code:"B02536 W",name:"POP JAR (1000ml) W LID",mrp:2076,cmrp:8304,k2d:0,k1f:0,k2f:130,re:20,boxCtn:4,cont:""},{id:174,code:"P02740",name:"RIO COFEE MUG ( 320 ML )",mrp:924,cmrp:7392,k2d:0,k1f:0,k2f:69,re:20,boxCtn:8,cont:""},{id:175,code:"P00623",name:"STACK BOWL 4\"",mrp:458,cmrp:5496,k2d:0,k1f:0,k2f:3,re:20,boxCtn:12,cont:"25"},{id:176,code:"P00624",name:"STACK BOWL 5\"",mrp:645,cmrp:5160,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"25"},{id:177,code:"P00625",name:"STACK BOWL 6\"",mrp:758,cmrp:6064,k2d:0,k1f:0,k2f:21,re:20,boxCtn:8,cont:""},{id:178,code:"P00341",name:"STACK NOIR COFFEE MUG ( 350 ML )",mrp:1195,cmrp:7170,k2d:0,k1f:0,k2f:32,re:20,boxCtn:6,cont:""},{id:179,code:"P01641",name:"KENYA CAPPUCINO CUP ( 245 ML )",mrp:848,cmrp:10176,k2d:0,k1f:0,k2f:3,re:20,boxCtn:12,cont:""},{id:180,code:"B13610",name:"TEMPO CRAFE 10 OZ ( 290 ML )",mrp:749,cmrp:5992,k2d:0,k1f:0,k2f:386,re:20,boxCtn:8,cont:""},{id:181,code:"B13621",name:"TEMPO CRAFE 21 OZ ( 610 ML )",mrp:1006,cmrp:4024,k2d:0,k1f:0,k2f:377,re:20,boxCtn:4,cont:""},{id:182,code:"B13634",name:"TEMPO CRAFE 34 OZ ( 970 ML )",mrp:1797,cmrp:7188,k2d:0,k1f:0,k2f:196,re:20,boxCtn:4,cont:""},{id:183,code:"V13610",name:"BISTRO CARAFE 10 ( 270 ML )",mrp:918,cmrp:7344,k2d:0,k1f:0,k2f:51,re:20,boxCtn:8,cont:""},{id:184,code:"V13621",name:"BISTRO CARAFE 21 ( 610 ML )",mrp:1095,cmrp:4380,k2d:76,k1f:0,k2f:108,re:20,boxCtn:4,cont:""},{id:185,code:"V13633",name:"BISTRO CARAFE 33 ( 970 ML )",mrp:1797,cmrp:7188,k2d:0,k1f:159,k2f:81,re:20,boxCtn:4,cont:""},{id:186,code:"P01823",name:"SONOMA SIDE BOWL 6\"",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""},{id:187,code:"P01825",name:"SONOMA SIDE BOWL 10\"",mrp:1341,cmrp:5364,k2d:0,k1f:0,k2f:38,re:20,boxCtn:4,cont:""},{id:188,code:"P01644",name:"KENYA IRISH COFFEE ( 230 ML )",mrp:1405,cmrp:5620,k2d:0,k1f:57,k2f:371,re:20,boxCtn:4,cont:""},{id:189,code:"P01643",name:"KENYA SLIM MUG",mrp:1259,cmrp:10072,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:190,code:"P01640",name:"KENYA C MUG ( 320 ML )",mrp:924,cmrp:11088,k2d:0,k1f:0,k2f:5,re:20,boxCtn:8,cont:""},{id:191,code:"P01671",name:"KENYA SAUCER 6\"",mrp:645,cmrp:7740,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:""},{id:192,code:"P01642",name:"KENYA EXPRESSO CUP ( 65 ML )",mrp:696,cmrp:8352,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:""},{id:193,code:"P01672",name:"KENYA ESPRESSO SAUCER 4\"",mrp:533,cmrp:6396,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:""},{id:194,code:"P02040",name:"NOUVEAU ( 200 ML )",mrp:883,cmrp:7064,k2d:0,k1f:11,k2f:0,re:20,boxCtn:8,cont:"25"},{id:195,code:"P02041",name:"NOUVEAU ( 315 ML )",mrp:1061,cmrp:8488,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"25"},{id:196,code:"V18344",name:"JUG PATIO ( 1265 ML )",mrp:571,cmrp:6852,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:""},{id:197,code:"V24349",name:"JUG TERRA (1390 ML ) WHITE / GREY LID",mrp:865,cmrp:10380,k2d:0,k1f:0,k2f:7,re:20,boxCtn:12,cont:""},{id:198,code:"V20558",name:"JUG DIVANO 1600 ML",mrp:675,cmrp:8100,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""},{id:199,code:"P00911",name:"COASTER ( 12 PC PACK )",mrp:557,cmrp:6684,k2d:0,k1f:0,k2f:20,re:20,boxCtn:12,cont:""},{id:200,code:"2472.0",name:"CAFFEE SAUCER 4\" ( B )",mrp:591,cmrp:7092,k2d:0,k1f:10,k2f:15,re:20,boxCtn:8,cont:""},{id:201,code:"2471.0",name:"CAFFEE SAUCER 5\" ( B )",mrp:715,cmrp:5270,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:"20"},{id:202,code:"2442.0",name:"CAF\u00c9 EXPRESSO ( 70 ML )",mrp:753,cmrp:9036,k2d:0,k1f:0,k2f:0,re:20,boxCtn:12,cont:"20"},{id:203,code:"2440.0",name:"CAFFE AMERICANO ( 355 ML )",mrp:977,cmrp:7816,k2d:0,k1f:5,k2f:33,re:20,boxCtn:8,cont:""},{id:204,code:"2441.0",name:"CAF\u00c9 CAPPUCCNO ( 195 ML )",mrp:918,cmrp:7344,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"20"},{id:205,code:"2407.0",name:"CAF\u00c9 LATTE MODERNO ( 280 ML )",mrp:831,cmrp:6648,k2d:0,k1f:1,k2f:7,re:20,boxCtn:8,cont:""},{id:206,code:"2443.0",name:"CAF\u00c9 LATTE CUP ( 260 ML )",mrp:990,cmrp:7920,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"20"},{id:207,code:"P02820",name:"CONNEXION CONDIMENT BOWL 285 ML",mrp:956,cmrp:3824,k2d:0,k1f:0,k2f:104,re:20,boxCtn:4,cont:""},{id:208,code:"P00123",name:"DIAMOND BOWL 5\"",mrp:571,cmrp:6852,k2d:0,k1f:0,k2f:10,re:20,boxCtn:12,cont:""},{id:209,code:"P00124",name:"DIAMOND BOWL 8\"",mrp:1221,cmrp:4884,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"25"},{id:210,code:"P03411L",name:"REYA COASTER",mrp:881,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:6,cont:"10"},{id:211,code:"P03420L",name:"REYA BOWL 5\"",mrp:625,cmrp:3750,k2d:0,k1f:0,k2f:48,re:20,boxCtn:6,cont:""},{id:212,code:"P03421L",name:"REYA BOWL 8\"",mrp:1268,cmrp:5072,k2d:0,k1f:0,k2f:0,re:20,boxCtn:4,cont:"25"},{id:213,code:"P03721",name:"VERRINE DEEP BOWL 3\"",mrp:1341,cmrp:4023,k2d:3,k1f:10,k2f:0,re:20,boxCtn:12,cont:""},{id:214,code:"P03720",name:"VERRINE SHALLOW BOWL 3\"",mrp:0,cmrp:0,k2d:0,k1f:14,k2f:67,re:20,boxCtn:12,cont:""},{id:215,code:"P00723",name:"ASSURANCE BOWL 4 1/2\"",mrp:514,cmrp:6168,k2d:0,k1f:0,k2f:25,re:20,boxCtn:12,cont:""},{id:216,code:"P00724",name:"ASSURANCE BOWL 5 3/4\"",mrp:738,cmrp:4428,k2d:0,k1f:0,k2f:27,re:20,boxCtn:6,cont:""},{id:217,code:"P00725",name:"ASSURANCE BOWL 7\"",mrp:1126,cmrp:6756,k2d:0,k1f:0,k2f:41,re:20,boxCtn:6,cont:""},{id:218,code:"B03918",name:"TULIP JAR 510 ML W/L",mrp:1901,cmrp:11406,k2d:21,k1f:0,k2f:0,re:20,boxCtn:6,cont:""},{id:219,code:"7X0196",name:"DIVANO LEMON SET COLORFUL CIRCLE 1",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:16,re:20,boxCtn:8,cont:""},{id:220,code:"7X0197",name:"DIVANO LEMON SET COLORFUL CIRCLE 2",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:9,re:20,boxCtn:8,cont:""},{id:221,code:"7X0198",name:"DIVANO LEMON SET COLORFUL DOT 1",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:15,re:20,boxCtn:8,cont:""},{id:222,code:"7X0199",name:"DIVANO LEMON SET COLORFUL DOT 2",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:20,re:20,boxCtn:8,cont:""},{id:223,code:"7X0200",name:"DIVANO LEMON SET COLORFUL STRIPES 1",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:24,re:20,boxCtn:8,cont:""},{id:224,code:"7X0201",name:"DIVANO LEMON SET COLORFUL STRIPES 2",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:19,re:20,boxCtn:8,cont:""},{id:225,code:"CODE",name:"ITEMS",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""},{id:226,code:"1501B15",name:"BEER 15 0Z ( 420 ML )",mrp:1369,cmrp:10952,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"25"},{id:227,code:"1501X09",name:"BRANDY BALOON 09 OZ ( 255 ML )",mrp:1152,cmrp:9216,k2d:0,k1f:0,k2f:90,re:20,boxCtn:8,cont:""},{id:228,code:"1501X12",name:"BRANDY BALOON 12 OZ ( 340 ML )",mrp:1285,cmrp:10280,k2d:0,k1f:0,k2f:55,re:20,boxCtn:8,cont:""},{id:229,code:"1501C03",name:"COCKTAIL 03 OZ ( 95 ML )",mrp:1240,cmrp:9920,k2d:0,k1f:0,k2f:28,re:20,boxCtn:8,cont:""},{id:230,code:"1501C05",name:"COCKTAIL 05 OZ ( 140 ML )",mrp:1285,cmrp:10280,k2d:0,k1f:0,k2f:106,re:20,boxCtn:8,cont:""},{id:231,code:"1501F07",name:"FLUTE CHAMPANE 07 OZ ( 185 ML )",mrp:1152,cmrp:9216,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"50"},{id:232,code:"1501G12",name:"GOBLET 12 OZ ( 350 ML )",mrp:1285,cmrp:10280,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"50"},{id:233,code:"1501J11",name:"JUICE GOBLET 11 OZ ( 310 ML )",mrp:1285,cmrp:10280,k2d:2,k1f:0,k2f:0,re:20,boxCtn:8,cont:"25"},{id:234,code:"1501L01",name:"LIQUER 1 0Z ( 30 ML )",mrp:939,cmrp:7512,k2d:0,k1f:0,k2f:107,re:20,boxCtn:8,cont:""},{id:235,code:"1501L02",name:"LIQUER 02 OZ ( 60 ML )",mrp:1152,cmrp:9216,k2d:0,k1f:0,k2f:120,re:20,boxCtn:8,cont:""},{id:236,code:"1501M07",name:"CLASSIC MARGRITA ( 200 ML )",mrp:1285,cmrp:10280,k2d:0,k1f:0,k2f:249,re:20,boxCtn:8,cont:""},{id:237,code:"1501R08",name:"RED WINE 08 OZ ( 230 ML )",mrp:1152,cmrp:9216,k2d:39,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:238,code:"1501S05",name:"SAUCER CHAMP 05 OZ ( 135 ML )",mrp:1152,cmrp:9216,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"50"},{id:239,code:"1501S07",name:"SAUCER CHAMP 07 OZ ( 200 ML )",mrp:1152,cmrp:9216,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"50"},{id:240,code:"1501P04",name:"SHERRY 04 OZ ( 130 ML )",mrp:1152,cmrp:9216,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"25"},{id:241,code:"1501W07",name:"WHITE WINE 07 OZ ( 195 ML )",mrp:1152,cmrp:9216,k2d:3,k1f:0,k2f:0,re:20,boxCtn:8,cont:"25"},{id:242,code:"1503C07",name:"COCKTAIL 07 OZ ( 210 ML )",mrp:1424,cmrp:11392,k2d:0,k1f:0,k2f:442,re:20,boxCtn:8,cont:""},{id:243,code:"1503F06",name:"FLUTE CHAMPANE 06 OZ ( 165 ML )",mrp:1455,cmrp:11640,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"25"},{id:244,code:"1503G12",name:"DUCHESS GOBLET ( 350 ML )",mrp:1455,cmrp:11640,k2d:32,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:245,code:"1503R09",name:"RED WINE 09 OZ ( 255 ML )",mrp:1455,cmrp:11640,k2d:0,k1f:0,k2f:43,re:20,boxCtn:8,cont:""},{id:246,code:"1503W07",name:"WHITE WINE 07 OZ ( 200 ML )",mrp:1455,cmrp:11640,k2d:0,k1f:0,k2f:39,re:20,boxCtn:8,cont:""},{id:247,code:"1015A21",name:"BORDAUX 21 OZ ( 600 ML )",mrp:1962,cmrp:7848,k2d:0,k1f:0,k2f:1058,re:20,boxCtn:4,cont:""},{id:248,code:"1015D22",name:"BURGUNDY 22 OZ ( 650 ML )",mrp:1962,cmrp:7848,k2d:8,k1f:0,k2f:771,re:20,boxCtn:4,cont:""},{id:249,code:"1015C10",name:"COCKTAIL 10 OZ ( 285 ML )",mrp:1962,cmrp:7848,k2d:0,k1f:212,k2f:387,re:20,boxCtn:4,cont:""},{id:250,code:"1015N22",name:"COGNAC 22 OZ ( 650 ML )",mrp:1853,cmrp:7412,k2d:0,k1f:143,k2f:500,re:20,boxCtn:4,cont:""},{id:251,code:"1015F07",name:"FLUTE CHAMPANE 07 0Z ( 210 ML )",mrp:1853,cmrp:7412,k2d:0,k1f:0,k2f:614,re:20,boxCtn:4,cont:""},{id:252,code:"1015M12",name:"MARGRITA 12 OZ ( 345 ML )",mrp:1962,cmrp:7848,k2d:0,k1f:0,k2f:619,re:20,boxCtn:4,cont:""},{id:253,code:"1015R15",name:"RED WINE 15 OZ ( 425 ML )",mrp:1694,cmrp:6776,k2d:0,k1f:92,k2f:848,re:20,boxCtn:4,cont:""},{id:254,code:"1015G15",name:"WATER GOBLET 15 OZ ( 425 ML )",mrp:1762,cmrp:7048,k2d:26,k1f:0,k2f:100,re:20,boxCtn:4,cont:""},{id:255,code:"1015W12",name:"WHITE WINE 12 OZ ( 350 ML )",mrp:1853,cmrp:7412,k2d:62,k1f:0,k2f:26,re:20,boxCtn:4,cont:"75"},{id:256,code:"1015P04",name:"SHERRY ( 115 ML )",mrp:1853,cmrp:7412,k2d:0,k1f:0,k2f:0,re:20,boxCtn:4,cont:""},{id:257,code:"1015L03",name:"LIQUER ( 85 ML )",mrp:1853,cmrp:7412,k2d:0,k1f:0,k2f:0,re:20,boxCtn:4,cont:""},{id:258,code:"1C18414",name:"HI BALL ( 390 ML )",mrp:1249,cmrp:9992,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"50"},{id:259,code:"1C18413",name:"ROCK ( 395 ML )",mrp:1249,cmrp:9992,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:260,code:"1035F07",name:"STRIPE FLUTE CHAMPAGNE ( 210 ML )",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:262,re:20,boxCtn:4,cont:""},{id:261,code:"1035R15",name:"STRIPE RED",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:248,re:20,boxCtn:4,cont:""},{id:262,code:"1035W12",name:"STRIPE WHITE",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:184,re:20,boxCtn:4,cont:""},{id:263,code:"1533D19",name:"PALATTE GIN COCKTAIL 540 ML",mrp:0,cmrp:0,k2d:0,k1f:17,k2f:38,re:20,boxCtn:4,cont:""},{id:264,code:"1533C07L",name:"PALETTE MARTINI 220 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:4,cont:"25"},{id:265,code:"1533S07L",name:"PALETTE COUPE 205 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:66,re:20,boxCtn:4,cont:""},{id:266,code:"1533K07L",name:"PALETTE NICK & NORA 190 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:4,cont:"50"},{id:267,code:"1533E11L",name:"PALETTE CHALICE 300 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:4,cont:"25"},{id:268,code:"1019C07",name:"COCKTIL 07 0Z ( 205 ML )",mrp:1517,cmrp:12136,k2d:0,k1f:0,k2f:41,re:20,boxCtn:8,cont:""},{id:269,code:"1019R11",name:"RED WINE 11 OZ ( 315 ML )",mrp:1517,cmrp:12136,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"20"},{id:270,code:"1019G13",name:"GOBLET ( 370 ML )",mrp:1517,cmrp:12136,k2d:0,k1f:0,k2f:24,re:20,boxCtn:8,cont:""},{id:271,code:"1019F06",name:"LEXINGTON FLUTE CHAMPAGNE ( 185 ML )",mrp:1517,cmrp:12136,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"20"},{id:272,code:"1019W08",name:"WHITE WINE 08 OZ ( 240 ML )",mrp:1517,cmrp:12136,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"20"},{id:273,code:"1019R16",name:"RED WINE 16 ( 455 ML )",mrp:0,cmrp:14824,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:"20"},{id:274,code:"1521C07",name:"COCKTAIL 07 OZ ( 210 ML )",mrp:1822,cmrp:14576,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:275,code:"1521F06",name:"FLUTE CHAMPANE 06 OZ ( 165 ML )",mrp:1822,cmrp:14576,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:276,code:"1500G11",name:"GOBLET 11 OZ ( 308 ML )",mrp:1152,cmrp:9216,k2d:0,k1f:0,k2f:101,re:20,boxCtn:8,cont:""},{id:277,code:"522H12",name:"CUBA POCO GRANDE ( 350 ML )",mrp:1329,cmrp:5316,k2d:0,k1f:0,k2f:3,re:20,boxCtn:4,cont:"50"},{id:278,code:"522H16",name:"CUBA HURRICANE",mrp:2373,cmrp:9492,k2d:60,k1f:0,k2f:334,re:20,boxCtn:4,cont:""},{id:279,code:"527S07",name:"CONNECTION COUPE ( 215 ML )",mrp:1867,cmrp:7468,k2d:0,k1f:0,k2f:365,re:20,boxCtn:4,cont:""},{id:280,code:"527C07",name:"COCKTAIL ( 215 ML )",mrp:1867,cmrp:7468,k2d:0,k1f:0,k2f:52,re:20,boxCtn:4,cont:""},{id:281,code:"527D21",name:"GIN COCKATIL ( 600 ML )",mrp:1930,cmrp:7720,k2d:11,k1f:0,k2f:614,re:20,boxCtn:4,cont:""},{id:282,code:"1032A22L",name:"BORDEAUX 620 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:37,re:20,boxCtn:4,cont:""},{id:283,code:"1032R15L",name:"UNIVERSAL 435 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:15,re:20,boxCtn:4,cont:""},{id:284,code:"1032F08L",name:"SPARKLING 220 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:5,re:20,boxCtn:4,cont:""},{id:285,code:"026D22",name:"BURGUNDY ( 650 ML )",mrp:1962,cmrp:7848,k2d:0,k1f:0,k2f:81,re:20,boxCtn:4,cont:""},{id:286,code:"026F07",name:"FLUTE ( 210 ML )",mrp:1853,cmrp:7412,k2d:23,k1f:0,k2f:54,re:20,boxCtn:4,cont:""},{id:287,code:"026G14",name:"WATER GOBLET ( 405 ML )",mrp:1762,cmrp:7048,k2d:22,k1f:0,k2f:15,re:20,boxCtn:4,cont:""},{id:288,code:"026W12",name:"WHITE ( 340 ML )",mrp:1853,cmrp:7412,k2d:0,k1f:0,k2f:28,re:20,boxCtn:4,cont:""},{id:289,code:"1026A21",name:"BORDEAUX ( 595 ML )",mrp:1962,cmrp:7848,k2d:0,k1f:0,k2f:90,re:20,boxCtn:4,cont:""},{id:290,code:"1026R15",name:"RED WINE ( 420 ML )",mrp:1853,cmrp:7412,k2d:0,k1f:0,k2f:56,re:20,boxCtn:4,cont:""},{id:291,code:"1C24216",name:"SANTE STEMLESS ( 455 ML )",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:30,re:20,boxCtn:8,cont:""},{id:292,code:"1523W07",name:"WHITE WINE ( 210 ML )",mrp:1152,cmrp:9216,k2d:0,k1f:0,k2f:134,re:20,boxCtn:8,cont:""},{id:293,code:"1523R09",name:"RED WINE ( 260 ML )",mrp:1152,cmrp:9216,k2d:0,k1f:0,k2f:21,re:20,boxCtn:8,cont:""},{id:294,code:"523F07",name:"FLUTE CHAMP (190 ML)",mrp:1152,cmrp:9216,k2d:0,k1f:0,k2f:0,re:20,boxCtn:8,cont:""},{id:295,code:"1530W12",name:"VINO WHITE WINE ( 355 ML )",mrp:0,cmrp:7480,k2d:0,k1f:0,k2f:390,re:20,boxCtn:8,cont:""},{id:296,code:"S30R16",name:"VINO RED WINE ( 470 ML )",mrp:1145,cmrp:9160,k2d:0,k1f:0,k2f:419,re:20,boxCtn:8,cont:""},{id:297,code:"1529B14",name:"CRAFTMHAN STEMWARE ( 390 ML )",mrp:1452,cmrp:5808,k2d:0,k1f:0,k2f:150,re:20,boxCtn:4,cont:""},{id:298,code:"B23220",name:"CRAFTMHAN TUMBLER ( 565 ML )",mrp:1103,cmrp:8824,k2d:0,k1f:45,k2f:0,re:20,boxCtn:8,cont:""},{id:299,code:"1X0070",name:"DIVANO JUG COLORFUL CIRCLE PURPLE 1660 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""},{id:300,code:"1X0071",name:"DIVANO JUG COLORFUL CIRCLE PINK 1660 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""},{id:301,code:"1X0072",name:"DIVANO JUG COLORFUL DOT ORANGE 1660 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""},{id:302,code:"1X0073",name:"DIVANO JUG COLORFUL DOT GREEN 1660 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""},{id:303,code:"1X0074",name:"DIVNAO JUG COLORFUL STRIPE BLUE 1660 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""},{id:304,code:"1X0075",name:"DIVANO JUG COLORFUL STRIPE GREEN 1660 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""},{id:305,code:"1X0076",name:"DIVANO JUG COLORFUL DAMASK DESIGN 2 1660 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""},{id:306,code:"1X0077",name:"DIVANO JUG INFINITE 1660 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""},{id:307,code:"1X0078",name:"DIVANO JUG PAINT FLOWER BLUE 1660 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""},{id:308,code:"1X0079",name:"DIVANO JUG PAINT FLOWER PURPLE 1660 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""},{id:309,code:"1X0080",name:"DIVANO JUG PAISLEY 1660 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""},{id:310,code:"1X0081",name:"DIVANO JUG PEACOCK 1660 ML",mrp:0,cmrp:0,k2d:0,k1f:0,k2f:0,re:20,boxCtn:0,cont:""}],Ukiyo:[{id:1,code:"UK-SS-01",name:"UKIYO SAKE SET",mrp:850,cmrp:10200,k2d:4,k1f:2,k2f:1,re:10,boxCtn:6,cont:""},{id:2,code:"UK-TM-400",name:"UKIYO TUMBLER",mrp:380,cmrp:4560,k2d:24,k1f:0,k2f:0,re:20,boxCtn:6,cont:""},{id:3,code:"UK-CK-08",name:"CHEF KNIFE 08\"",mrp:275,cmrp:3300,k2d:12,k1f:0,k2f:0,re:10,boxCtn:6,cont:""},{id:4,code:"UK-SB-01",name:"STONE BOWL 8001",mrp:1260,cmrp:7560,k2d:6,k1f:0,k2f:0,re:5,boxCtn:6,cont:""}]};
function Stocks(){
  const [tab,setTab]=useState("Ocean");
  const [search,setSearch]=useState("");
  const [stocks,setStocks]=useFirestoreState("stocks",ST0);
  const [editIt,setEditIt]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [addForm,setAddForm]=useState({code:"",name:"",cmrp:"",boxCtn:""});
  const items=stocks[tab].map(it=>{const tot=(it.k2d||0)+(it.k1f||0)+(it.k2f||0);return{...it,tot,val:tot*it.cmrp,totBox:tot*(it.boxCtn||0),isZ:tot===0,isL:tot>0&&tot<=it.re};});
  const shown=search?items.filter(i=>i.name.toLowerCase().includes(search.toLowerCase())||i.code.toLowerCase().includes(search.toLowerCase())):items;
  const ac=tab==="Ocean"?C.blue:C.teal;
  const LKs=["k2d","k1f","k2f"];const LC2=[C.blue,C.purple,C.teal];
  function setItem(id,changes){setStocks(p=>({...p,[tab]:p[tab].map(i=>i.id===id?{...i,...changes}:i)}));}
  function delItem(id){setStocks(p=>({...p,[tab]:p[tab].filter(i=>i.id!==id)}));setEditIt(null);}
  function reloadCatalog(){
    if(!window.confirm(`Replace ${tab} stock list with the full ${ST0[tab].length}-item catalog from the warehouse sheet? Any custom items/edits you added beyond the catalog will be lost.`))return;
    setStocks(p=>({...p,[tab]:ST0[tab]}));
  }
  function addItem(){
    if(!addForm.code.trim()||!addForm.name.trim())return;
    setStocks(p=>({...p,[tab]:[...p[tab],{id:Date.now(),code:addForm.code.trim(),name:addForm.name.trim(),mrp:0,cmrp:parseInt(addForm.cmrp)||0,k2d:0,k1f:0,k2f:0,re:0,boxCtn:parseInt(addForm.boxCtn)||0,cont:""}]}));
    setAddForm({code:"",name:"",cmrp:"",boxCtn:""});
    setShowAdd(false);
  }
  function exportStockPDF(){
    const doc=new jsPDF();
    doc.setFontSize(14);doc.text("Tansha Hospitality — Stock Sheet",14,15);
    doc.setFontSize(10);doc.setTextColor(120);doc.text(`${tab} · Generated ${new Date().toLocaleString("en-IN")}`,14,21);
    autoTable(doc,{
      head:[["C.MRP","Code","Item","Tot CTN","Ground","1st Flr","2nd Flr","Value","Box/CTN","Tot Box","Container"]],
      body:items.map(it=>[fmt(it.cmrp),it.code,it.name,it.tot,it.k2d||"—",it.k1f||"—",it.k2f||"—",fmt(it.val),it.boxCtn||"—",it.totBox||"—",it.cont||""]),
      startY:26,styles:{fontSize:8},headStyles:{fillColor:[230,230,230],textColor:30},
      didParseCell:(data)=>{
        if(data.section!=="body")return;
        const it=items[data.row.index];
        if(it.isZ)data.cell.styles.fillColor=[254,242,242];
        else if(it.isL)data.cell.styles.fillColor=[255,247,237];
      }
    });
    const y=doc.lastAutoTable.finalY+8;
    doc.setFontSize(10);doc.setTextColor(30);
    doc.text(`Total CTN: ${items.reduce((s,i)=>s+i.tot,0)}   ·   Total Value: ${fmt(items.reduce((s,i)=>s+i.val,0))}   ·   Low Stock: ${items.filter(i=>i.isL).length}   ·   Zero Stock: ${items.filter(i=>i.isZ).length}`,14,y);
    doc.save(`Stock_${tab}_${TODAY}.pdf`);
  }
  return (<div>
    {editIt&&<Mod onClose={()=>setEditIt(null)} title={editIt.name} sub={editIt.code}>
      <div style={{display:"flex",flexDirection:"column",gap:11,marginBottom:12}}>
        <div><label style={LBL}>Item Name</label><input style={INP} value={editIt.name} onChange={e=>setEditIt(p=>({...p,name:e.target.value}))}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={LBL}>Code</label><input style={INP} value={editIt.code} onChange={e=>setEditIt(p=>({...p,code:e.target.value}))}/></div>
          <div><label style={LBL}>C.MRP (Carton)</label><input type="number" style={INP} value={editIt.cmrp} onChange={e=>setEditIt(p=>({...p,cmrp:parseInt(e.target.value)||0}))}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={LBL}>Box in CTN</label><input type="number" style={INP} value={editIt.boxCtn||0} onChange={e=>setEditIt(p=>({...p,boxCtn:parseInt(e.target.value)||0}))}/></div>
          <div><label style={LBL}>Container Note</label><input style={INP} value={editIt.cont||""} onChange={e=>setEditIt(p=>({...p,cont:e.target.value}))}/></div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:12}}>{[["Ground","k2d",C.blue],["1st Flr","k1f",C.purple],["2nd Flr","k2f",C.teal]].map(([l,k,lc])=><div key={k} style={{background:"#F9FAFB",border:`1px solid ${lc}44`,borderRadius:9,padding:"9px 12px",display:"flex",alignItems:"center",gap:11}}><span style={{color:lc,fontWeight:700,fontSize:13,flex:1}}>{l}</span><div style={{display:"flex",gap:7,alignItems:"center"}}><button onClick={()=>setEditIt(p=>({...p,[k]:Math.max(0,(p[k]||0)-1)}))} style={{background:C.cb,border:"none",color:C.text,borderRadius:5,width:26,height:26,cursor:"pointer",fontSize:16}}>−</button><input type="number" min="0" value={editIt[k]} onChange={e=>setEditIt(p=>({...p,[k]:parseInt(e.target.value)||0}))} style={{...INP,width:55,padding:"4px 6px",textAlign:"center",borderColor:lc+"44"}}/><button onClick={()=>setEditIt(p=>({...p,[k]:(p[k]||0)+1}))} style={{background:lc,border:"none",color:"#fff",borderRadius:5,width:26,height:26,cursor:"pointer",fontSize:16}}>+</button></div></div>)}</div>
      <div style={{background:C.bg,borderRadius:7,padding:"7px 11px",marginBottom:12,display:"flex",justifyContent:"space-between"}}><span style={{color:C.muted,fontSize:13}}>Total: <b style={{color:C.text}}>{(editIt.k2d||0)+(editIt.k1f||0)+(editIt.k2f||0)} CTN · {((editIt.k2d||0)+(editIt.k1f||0)+(editIt.k2f||0))*(editIt.boxCtn||0)} Boxes</b></span><span style={{color:C.green,fontWeight:700}}>{fmt(((editIt.k2d||0)+(editIt.k1f||0)+(editIt.k2f||0))*editIt.cmrp)}</span></div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>{if(window.confirm("Delete this item? This cannot be undone."))delItem(editIt.id);}} style={{background:"#FEE2E2",border:"1px solid #FECACA",color:C.red,borderRadius:10,padding:"0 16px",fontWeight:700,cursor:"pointer"}}>🗑 Delete</button>
        <button onClick={()=>{setStocks(p=>({...p,[tab]:p[tab].map(i=>i.id===editIt.id?{...i,...editIt}:i)}));setEditIt(null);}} style={{flex:1,background:C.green,border:"none",color:"#fff",borderRadius:10,padding:12,fontWeight:800,cursor:"pointer"}}>Save ✓</button>
      </div>
    </Mod>}
    {showAdd&&<Mod onClose={()=>setShowAdd(false)} title="+ New Stock Item" sub={tab}>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <div><label style={LBL}>Item Name *</label><input style={INP} value={addForm.name} onChange={e=>setAddForm(f=>({...f,name:e.target.value}))}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={LBL}>Code *</label><input style={INP} value={addForm.code} onChange={e=>setAddForm(f=>({...f,code:e.target.value}))}/></div>
          <div><label style={LBL}>C.MRP (Carton)</label><input type="number" style={INP} value={addForm.cmrp} onChange={e=>setAddForm(f=>({...f,cmrp:e.target.value}))}/></div>
        </div>
        <div><label style={LBL}>Box in CTN</label><input type="number" style={INP} value={addForm.boxCtn} onChange={e=>setAddForm(f=>({...f,boxCtn:e.target.value}))}/></div>
        <button onClick={addItem} style={{background:ac,border:"none",color:"#fff",borderRadius:10,padding:13,fontWeight:800,cursor:"pointer"}}>Add Item ✓</button>
      </div>
    </Mod>}
    <div style={{display:"flex",gap:5,marginBottom:12,background:C.card,borderRadius:11,padding:4}}>{["Ocean","Ukiyo"].map(t=><button key={t} onClick={()=>setTab(t)} style={{flex:1,background:tab===t?(t==="Ocean"?C.blue:C.teal)+"33":"transparent",border:`1px solid ${tab===t?(t==="Ocean"?C.blue:C.teal)+"55":"transparent"}`,borderRadius:9,padding:"9px 6px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><span style={{fontSize:16}}>{t==="Ocean"?"🥂":"🍽️"}</span><span style={{color:tab===t?(t==="Ocean"?C.blue:C.teal):C.muted,fontSize:11,fontWeight:700}}>{t}</span></button>)}</div>
    <div style={{display:"flex",gap:7,marginBottom:11,flexWrap:"wrap",alignItems:"center"}}><Pill label="CTN" value={items.reduce((s,i)=>s+i.tot,0)} color={ac}/><Pill label="Value" value={fmt(items.reduce((s,i)=>s+i.val,0))} color={C.green}/>{items.filter(i=>i.isL).length>0&&<Pill label="Low" value={items.filter(i=>i.isL).length} color={C.acc}/>}{items.filter(i=>i.isZ).length>0&&<Pill label="Zero" value={items.filter(i=>i.isZ).length} color={C.red}/>}
      <div style={{marginLeft:"auto",display:"flex",gap:6}}>
        <button onClick={()=>setShowAdd(true)} style={{background:ac,border:"none",color:"#fff",borderRadius:7,padding:"5px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ Item</button>
        <button onClick={reloadCatalog} style={{background:C.bg,border:`1px solid ${C.cb}`,color:C.muted,borderRadius:7,padding:"5px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>📥 Load Catalog</button>
        <button onClick={exportStockPDF} style={{background:C.bg,border:`1px solid ${C.cb}`,color:C.muted,borderRadius:7,padding:"5px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>📄 PDF</button>
      </div>
    </div>
    <input style={{...INP,marginBottom:11,padding:"7px 11px"}} placeholder="🔍 Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
    <div style={{overflowX:"auto",borderRadius:9,border:`1px solid ${C.cb}`}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:760}}>
      <thead><tr style={{background:C.card}}>{["C.MRP","Code","Item","Tot CTN","Ground","1st Flr","2nd Flr","Value","Box/CTN","Tot Box","Container",""].map(h=><th key={h} style={{padding:"6px 7px",color:C.muted,fontWeight:700,textAlign:h==="Item"||h==="Container"?"left":"center",borderBottom:`1px solid ${C.cb}`,fontSize:10,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
      <tbody>{shown.map((it,i)=><tr key={it.id} style={{background:it.isZ?C.red+"11":it.isL?C.acc+"11":i%2===0?C.card:"#F9FAFB",borderBottom:`1px solid ${C.cb}22`}}>
        <td style={{padding:"6px 7px",textAlign:"center",color:C.muted,fontSize:10}}>{fmt(it.cmrp)}</td>
        <td style={{padding:"6px 7px",textAlign:"center",color:ac,fontFamily:"monospace",fontSize:10,fontWeight:700}}>{it.code}</td>
        <td style={{padding:"6px 7px",color:C.text,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.name}</td>
        <td style={{padding:"5px 3px",textAlign:"center",color:it.isZ?C.red:it.isL?C.acc:ac,fontWeight:800,fontSize:12}}>{it.tot}</td>
        {LKs.map((k,ki)=><td key={k} style={{padding:"5px 3px",textAlign:"center",color:it[k]>0?LC2[ki]:C.dim,fontWeight:it[k]>0?700:400}}>{it[k]||"—"}</td>)}
        <td style={{padding:"5px 3px",textAlign:"center",color:C.green,fontWeight:700,fontSize:10}}>{fmt(it.val)}</td>
        <td style={{padding:"5px 3px",textAlign:"center",color:C.muted}}>{it.boxCtn||"—"}</td>
        <td style={{padding:"5px 3px",textAlign:"center",color:C.muted,fontWeight:700}}>{it.totBox||"—"}</td>
        <td style={{padding:"3px 5px"}}><input value={it.cont||""} placeholder="—" onChange={e=>setItem(it.id,{cont:e.target.value})} style={{...INP,width:80,padding:"3px 6px",fontSize:10}}/></td>
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
{n:"DELTON A P FORK (DESSERT FORK)",a:"",p:912,g:18},{n:"DELTON A P FORK LARGE",a:"",p:1003,g:18},{n:"DELTON A P KNIFE (DESSERT KNIFE)",a:"",p:1209,g:18},
{n:"DELTON A P SPOON (DESSERT SPOON)",a:"",p:912,g:18},{n:"DELTON A P SPOON LARGE",a:"",p:1003,g:18},{n:"DELTON BABY SPOON",a:"",p:755,g:18},
{n:"DELTON BUTTER KNIFE",a:"",p:1209,g:18},{n:"DELTON COFFE SPOON",a:"",p:451,g:18},{n:"DELTON ICE CREAM SPOON",a:"",p:629,g:18},
{n:"DELTON PARFAIT SPOON (SODA SPOON)",a:"",p:912,g:18},{n:"DELTON SOUP SPOON",a:"",p:912,g:18},{n:"DELTON TABLE S FORK",a:"",p:1197,g:18},
{n:"DELTON TABLE S SPOON",a:"",p:1197,g:18},{n:"DELTON TEA SPOON",a:"",p:629,g:18},
{n:"APRON - 1600 - 1",a:"1600-1",p:50,g:18},{n:"APRON - 1600 - 2 (HELLO)",a:"1600-2",p:95,g:18},{n:"APRON - 1600 - 3 (CUTLERY)",a:"1600-3",p:115,g:18},
{n:"APRON - 1600 - 4 (SMILE)",a:"1600-4",p:135,g:18},{n:"APRON - 1600 - 5",a:"1600-5",p:240,g:18},{n:"APRON - 1600 - 6",a:"1600-6",p:240,g:18},
{n:"APRON - 1600 - 7 (JING PING)",a:"1600-7",p:205,g:18},{n:"APRON - 1600 - 8 (CHECKS)",a:"1600-8",p:80,g:18},{n:"APRON - A001 BLACK",a:"A001 BK",p:300,g:18},
{n:"APRON - A001 BLUE",a:"A001 B",p:300,g:18},{n:"APRON - A001 GREEN",a:"A001 G",p:300,g:18},{n:"APRON - B001 BLACK",a:"B001 BK",p:360,g:18},
{n:"APRON - B001 BROWN",a:"B001 BR",p:360,g:18},{n:"APRON - C001 BLACK",a:"C001 BK",p:210,g:18},{n:"APRON - C001 GREY",a:"",p:210,g:18},
{n:"CARTINI 4664 MAGNETIC KNIFE BAR (30%)",a:"4664",p:296.65,g:18},{n:"CARTINI 6366 EASY PEELER (30%)",a:"6366",p:109.76,g:18},{n:"CARTINI 6367 FINE GRATER (30%)",a:"6367",p:278.85,g:18},
{n:"CARTINI 6368 CHEFS PIZZA SLICER (30%)",a:"6368",p:142.39,g:18},{n:"CARTINI 6370 SALAD KNIFE (30%)",a:"6370",p:183.92,g:18},{n:"CARTINI 6371 KITCHEN KNIFE (30%)",a:"6371",p:243.25,g:18},
{n:"CARTINI 6373 ESNTIAL KTCN CLEAVER (30%)",a:"6373",p:462.77,g:18},{n:"CARTINI 7244 CHEF KNIFE (30%)",a:"7244",p:494.51,g:18},{n:"CARTINI 7245 BREAD KNIFE (30%)",a:"7245",p:486.51,g:18},
{n:"CARTINI 7246 CARVING KNIFE (30%)",a:"7246",p:486.51,g:18},{n:"CARTINI 7247 KITCHEN KNIFE (30%)",a:"7247",p:421.24,g:18},{n:"CARTINI 7248 VEGETABLE KNIFE (30%)",a:"7248",p:308.52,g:18},
{n:"CARTINI 7249 PARING KNIFE (30%)",a:"7249",p:284.78,g:18},{n:"CARTINI 7250 RUBBERWOOD CHOP BOARD (30%)",a:"7250",p:439.04,g:18},{n:"CARTINI 7254 BAMBOO BLOCK SET (30%)",a:"7254",p:468.71,g:5},
{n:"CARTINI 7255 RUBBERWOOD BLOCK SET (30%)",a:"7255",p:2818.18,g:18},
{n:"BASE CROCKERY (BS CROCK)",a:"BS CROCK",p:735,g:18},{n:"BASE CUP & SAUCER (BS C&S)",a:"BS C&S",p:665,g:18},{n:"BASE CUTLERY (BS CTLRY)",a:"BS CTLRY",p:665,g:18},
{n:"BASE TRAY (BS TRAY)",a:"BS TRAY",p:700,g:18},{n:"BASE+2EXT+1FRAME(BS+EX+FR-20)",a:"BS+EX+FR-20",p:2300,g:18},{n:"BASE+2EXT+1FRAME(BS+EX+FR-30)",a:"BS+EX+FR-30",p:2300,g:18},
{n:"BASE+2EXT+1FRAME(BS+EX+FR-54)",a:"BS+EX+FR-54",p:2475,g:18},{n:"BASE+EXTENDER - 16 (BS+EXT-16)",a:"BS+EXT-16",p:987,g:18},{n:"BASE+EXTENDER - 25 (BS+EXT-25)",a:"BS+EXT-25",p:987,g:18},
{n:"BASE+EXTENDER - 36 (BS+EXT-36)",a:"BS+EXT-36",p:1008,g:18},{n:"BASE+EXTENDER - 49 (BS+EXT-49)",a:"BS+EXT-49",p:1067,g:18},{n:"EXTENDER - 16 (EXT-16)",a:"EXT-16",p:329,g:18},
{n:"EXTENDER - 25 (EXT-25)",a:"EXT-25",p:329,g:18},{n:"EXTENDER - 36 (EXT-36)",a:"EXT-36",p:350,g:18},{n:"EXTENDER - 49 (EXT-49)",a:"EXT-49",p:399,g:18},
{n:"ROOF COVER (RC-01)",a:"RC-01",p:360,g:18},{n:"ROOF COVER FRAME (RCF-01)",a:"RCF-01",p:340,g:18},
{n:"INGREDIENT BOX 010 LITER",a:"",p:1100,g:18},{n:"INGREDIENT BOX 024 LITER",a:"",p:2100,g:18},{n:"INGREDIENT BOX 047 LITER",a:"",p:2800,g:18},
{n:"INGREDIENT BOX 081 LITER",a:"",p:6000,g:18},{n:"INGREDIENT BOX 100 LITER",a:"",p:7000,g:18},{n:"INGREDIENT BOX 120 LITER",a:"",p:9900,g:18},
{n:"PLASTIC STORAGE BOX 02LTR W LID",a:"02 RED",p:160,g:18},{n:"PLASTIC STORAGE BOX 04LTR W LID",a:"04 RED",p:230,g:18},{n:"PLASTIC STORAGE BOX 06LTR W LID",a:"06 RED",p:330,g:18},
{n:"PLASTIC STORAGE BOX 08LTR W LID",a:"08 RED",p:380,g:18},{n:"PLASTIC STORAGE BOX 12LTR W LID",a:"12 RED",p:600,g:18},{n:"PLASTIC STORAGE BOX 18LTR W LID",a:"18 RED",p:800,g:18},
{n:"PLASTIC STORAGE BOX 22LTR W LID",a:"22 RED",p:1000,g:18},
{n:"SIGNORA DYNAMATIC - F.B.J",a:"SIG-DM",p:4594.06,g:18},{n:"SIGNORA DYNAMATIC PLUS - F.F.J",a:"SIG-DMP",p:4825.42,g:18},{n:"SIGNORA FROOTMATIC - F.F.J",a:"SIG-FM",p:3651.69,g:18},
{n:"SIGNORA MEGAMATIC",a:"SIG-MM",p:3498.30,g:18},{n:"SIGNORA POWERMATIC - F.B.J",a:"SIG-PM",p:4253.38,g:18},{n:"SIGNORA POWERMATIC PRO-F.B.J",a:"SIG-PMP",p:4564.40,g:18},
{n:"SIGNORA SUPERMATIC",a:"SIG-SM",p:3559.32,g:18},{n:"SIGNORA SUPERMATIC PLUS-F.B.J",a:"SIG-SMP",p:4513.56,g:18},
{n:"STANDARD IMPRESS A P FORK (DESSERT FORK)",a:"",p:210,g:18},{n:"STANDARD IMPRESS A P KNIFE (DSERT KNIFE)",a:"",p:420,g:18},{n:"STANDARD IMPRESS A P SPOON (DSERT SPOON)",a:"",p:210,g:18},
{n:"STANDARD IMPRESS BABY FORK",a:"",p:172,g:18},{n:"STANDARD IMPRESS BABY SOUP SPOON",a:"",p:172,g:18},{n:"STANDARD IMPRESS BABY SPOON",a:"",p:172,g:18},
{n:"STANDARD IMPRESS COFFEE SPOON",a:"",p:116,g:18},{n:"STANDARD IMPRESS ICE CREAM SPOON",a:"",p:128,g:18},{n:"STANDARD IMPRESS PARFAIT (SODA) SPOON",a:"",p:210,g:18},
{n:"STANDARD IMPRESS PICKLE SPOON",a:"",p:110,g:18},{n:"STANDARD IMPRESS SOUP SPOON",a:"",p:210,g:18},{n:"STANDARD IMPRESS SUGAR SPOON",a:"",p:172,g:18},
{n:"STANDARD IMPRESS TABLE S FORK",a:"",p:282,g:18},{n:"STANDARD IMPRESS TABLE S SPOON",a:"",p:282,g:18},{n:"STANDARD IMPRESS TEA FORK",a:"",p:128,g:18},
{n:"STANDARD IMPRESS TEA SPOON",a:"",p:128,g:18},
{n:"FRY PAN MASTER STAR 20 CM",a:"",p:530,g:5},{n:"FRY PAN MASTER STAR 22 CM",a:"",p:580,g:5},{n:"FRY PAN MASTER STAR 24 CM",a:"",p:690,g:5},
{n:"FRY PAN MASTER STAR 26 CM",a:"",p:730,g:5},{n:"FRY PAN MASTER STAR 28 CM",a:"",p:820,g:5},{n:"FRY PAN MASTER STAR 30 CM",a:"",p:870,g:5},
{n:"FRY PAN MASTER STAR 32 CM",a:"",p:980,g:5},{n:"UKIYO TRI PLY DEEP FRY PAN 20CM",a:"",p:760,g:5},{n:"UKIYO TRI PLY DEEP FRY PAN 24CM",a:"",p:920,g:5},
{n:"UKIYO TRI PLY DEEP FRY PAN 26CM",a:"",p:1030,g:5},{n:"UKIYO TRI PLY DEEP FRY PAN 28CM",a:"",p:1100,g:5},{n:"UKIYO TRI PLY DEEP FRY PAN 30CM",a:"",p:1220,g:5},
{n:"UKIYO TRI PLY DEEP FRY PAN 32CM",a:"",p:1360,g:5},{n:"UKIYO TRI PLY SAUCE PAN 14CM",a:"",p:930,g:5},{n:"UKIYO TRI PLY SAUCE PAN 16CM",a:"",p:950,g:5},
{n:"UKIYO TRI PLY SAUCE PAN 20CM",a:"",p:1200,g:5},{n:"UKIYO TRI PLY SAUCE PAN 21CM",a:"",p:1300,g:5},{n:"UKIYO TRI PLY SAUCE PAN 23CM",a:"",p:1400,g:5},
{n:"UKIYO TRI PLY SAUCE PAN 24CM",a:"",p:1500,g:5},{n:"UKIYO TRI PLY SAUCE PAN 25CM",a:"",p:1600,g:5},{n:"UKIYO TRI PLY SAUCIER FRY PAN 26CM",a:"",p:1200,g:5},
{n:"UKIYO TRI PLY SAUCIER FRY PAN 28CM",a:"",p:1270,g:5},
{n:"DIAMOND CHOPPER - 1",a:"",p:318,g:18},{n:"DIAMOND CHOPPER - 2",a:"",p:294,g:18},{n:"KNIFE 18CM (004)",a:"004",p:225,g:18},
{n:"KNIFE WOODEN HANDLE (001)",a:"001",p:40,g:18},{n:"KNIFE WOODEN HANDLE (002)",a:"002",p:60,g:18},{n:"KNIFE WOODEN HANDLE (060)",a:"060",p:110,g:18},
{n:"UKIYO CHEF KNIFE 08 INCH BLACK",a:"BLACK 08",p:275,g:18},{n:"UKIYO CHEF KNIFE 08 INCH BLUE",a:"BLUE 08",p:275,g:18},{n:"UKIYO CHEF KNIFE 08 INCH BROWN",a:"BROWN 08",p:275,g:18},
{n:"UKIYO CHEF KNIFE 08 INCH GREEN",a:"GREEN 08",p:275,g:18},{n:"UKIYO CHEF KNIFE 08 INCH RED",a:"RED 08",p:275,g:18},{n:"UKIYO CHEF KNIFE 08 INCH WHITE",a:"WHITE 08",p:275,g:18},
{n:"UKIYO CHEF KNIFE 08 INCH YELLOW",a:"YELLOW 08",p:275,g:18},{n:"UKIYO CHEF KNIFE 10 INCH GREEN",a:"GREEN 10",p:305,g:18},{n:"UKIYO CHEF KNIFE 10 INCH RED",a:"RED 10",p:305,g:18},
{n:"UKIYO CHEF KNIFE 10 INCH WHITE",a:"WHITE 10",p:305,g:18},{n:"UKIYO CLEAVER/CHOPPER KNIFE - 1",a:"",p:450,g:18},{n:"UKIYO CLEAVER/CHOPPER KNIFE - 2 (RD)",a:"RD EDGE",p:490,g:18},
{n:"UKIYO M.PURPOSE KNIFE 06 INCH GREEN",a:"GREEN 06",p:150,g:18},{n:"UKIYO M.PURPOSE KNIFE 06 INCH RED",a:"RED 06",p:150,g:18},{n:"UKIYO M.PURPOSE KNIFE 06 INCH WHITE",a:"WHITE 06",p:150,g:18},
{n:"ACRYLIC FOOD COVER 08in",a:"",p:110,g:18},{n:"ACRYLIC FOOD COVER 09in",a:"",p:136,g:18},{n:"ACRYLIC FOOD COVER 10in",a:"",p:178,g:18},
{n:"ACRYLIC FOOD COVER 11in",a:"",p:202,g:18},{n:"ACRYLIC FOOD COVER 14in",a:"",p:284,g:18},{n:"OVEN GLOVES SILVER (1 PAIR)",a:"OG-1 PAIR",p:180,g:18},
{n:"PC JUG BIG (8231)",a:"",p:316,g:18},{n:"PC JUG SMALL (8230)",a:"",p:270,g:18},{n:"PC MEASURE GLASS 400ML",a:"",p:224,g:18},
{n:"PC MEASURING JUG 5LTR",a:"",p:278,g:18},{n:"PC MEASURING JUG SLTR",a:"",p:376,g:18},{n:"PC PITCHER + SS LID BIG (8306)",a:"",p:494,g:5},
{n:"PC PITCHER + SS LID MED (8307)",a:"",p:470,g:5},{n:"PC PITCHER + SS LID SML (8308)",a:"",p:446,g:18},{n:"SAFETY GLOVES (1 PC PACK)",a:"",p:360,g:18},
{n:"UKIYO B.BASKET RD 30cm+DOME COVER",a:"DOME COVER",p:700,g:18},{n:"UKIYO B.BASKET RD 40cm+ROLL COVER",a:"ROLL COVER",p:1250,g:18},{n:"UKIYO B.BASKET RECT 32x25cm+R CVR",a:"ROLL COVER",p:1130,g:18},
{n:"UKIYO B.BASKET RECT 52x32cm+DOME COV",a:"DOME COVER",p:1300,g:18},{n:"UKIYO B.BASKET RECT 52x32cm+R CVR",a:"ROLL COVER",p:1600,g:18},
{n:"WC CHOPPING BOARD 30x20x1.8 CM",a:"30x20x1.8 CM",p:112,g:18},{n:"WC CHOPPING BOARD 32x22x1.8 CM",a:"32x22x1.8 CM",p:132,g:18},{n:"WC CHOPPING BOARD 34x24x1.8 CM",a:"34x24x1.8 CM",p:152,g:18},
{n:"WC DIMSUM RD 13CM",a:"DS RD 13",p:280,g:5},{n:"WC DIMSUM RD 15CM",a:"DS RD 15",p:280,g:5},{n:"WC DIMSUM RD 16.5CM",a:"DS RD 16.5",p:316,g:5},
{n:"WC DIMSUM RD 18CM",a:"DS RD 18",p:320,g:5},{n:"WC DIMSUM RD 20CM",a:"DS RD 20",p:344,g:5},{n:"WC DIMSUM RD 22CM",a:"DS RD 22",p:380,g:5},
{n:"WC DIMSUM RD 24CM",a:"DS RD 24",p:425,g:5},{n:"WC DIMSUM RD 26CM",a:"DS RD 26",p:440,g:5},{n:"WC DIMSUM RD 28CM",a:"DS RD 28",p:500,g:5},
{n:"WC DIMSUM RD 30CM",a:"DS RD 30",p:540,g:5},
];
function Quotation(){
  const [team,setTeam]=useState("Ocean");const [client,setClient]=useState("");const [items,setItems]=useState([]);const [search,setSearch]=useState("");const [disc,setDisc]=useState(0);
  const [editingId,setEditingId]=useState(null);const [qSearch,setQSearch]=useState("");
  const [saved,setSaved]=useFirestoreState("quotes",[{id:1,q:"TH-Q101",client:"Taj Hotels",team:"Ocean",grand:143175,date:"20 Apr",items:[],disc:0},{id:2,q:"TH-Q102",client:"Hyatt",team:"Ukiyo",grand:87654,date:"22 Apr",items:[],disc:0}]);
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
  const [team,setTeam]=useState("Ocean");const [sales,setSales]=useFirestoreState("sales",SD0);const [view,setView]=useState("daily");const [showNew,setShowNew]=useState(false);const [editE,setEditE]=useState(null);
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
  const [entries,setEntries]=useFirestoreState("payments",PAY0);const [am,setAm]=useState("All");const [sel,setSel]=useState(null);const [pa,setPa]=useState("");const [sp,setSp]=useState(false);const today=TODAY;
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
function SalaryReport({attLog,salaries,setSalaries,onClose}){
  const [month,setMonth]=useState(TODAY.slice(0,7));
  const rows=TEAM.map(name=>{
    let present=0,half=0,absent=0,advance=0,travel=0;
    Object.entries(attLog).forEach(([date,recs])=>{
      if(!date.startsWith(month))return;
      const r=recs[name];if(!r)return;
      if(r.status==="Present")present++;
      else if(r.status==="Half Day"){half++;present+=0.5;}
      else if(r.status==="Absent")absent++;
      advance+=Number(r.advance)||0;
      travel+=Number(r.travelExp)||0;
    });
    const salary=salaries[name]||0;
    const net=salary+travel-advance;
    return{name,present,half,absent,advance,travel,salary,net};
  });
  function exportPDF(){
    const doc=new jsPDF();
    doc.setFontSize(14);doc.text("Tansha Hospitality — Salary Report",14,15);
    doc.setFontSize(10);doc.setTextColor(120);doc.text(`Month: ${month} · Generated ${new Date().toLocaleString("en-IN")}`,14,21);
    autoTable(doc,{
      head:[["Employee","Present","Half Day","Absent","Advance","Travel Exp","Salary","Net Payable"]],
      body:rows.map(r=>[r.name,r.present,r.half,r.absent,fmt(r.advance),fmt(r.travel),fmt(r.salary),fmt(r.net)]),
      startY:26,styles:{fontSize:9},headStyles:{fillColor:[230,230,230],textColor:30}
    });
    doc.save(`Salary_Report_${month}.pdf`);
  }
  return(<Mod onClose={onClose} title="📊 Salary Report" sub="Monthly attendance, advances & payable">
    <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
      <input type="month" style={{...INP,width:160}} value={month} onChange={e=>setMonth(e.target.value)}/>
      <button onClick={exportPDF} style={{marginLeft:"auto",background:C.bg,border:`1px solid ${C.cb}`,color:C.muted,borderRadius:7,padding:"7px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>📄 PDF</button>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:7}}>{rows.map(r=><div key={r.name} style={{background:C.bg,border:`1px solid ${C.cb}`,borderRadius:9,padding:"9px 12px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{color:C.text,fontWeight:700,fontSize:12}}>{r.name}</span>
        <span style={{color:r.net>=0?C.green:C.red,fontWeight:800,fontSize:13}}>{fmt(r.net)}</span>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
        <Bdg label={`Present ${r.present}`} color={C.green} bg={C.green+"22"} border={C.green+"44"}/>
        <Bdg label={`Half ${r.half}`} color={C.acc} bg={C.acc+"22"} border={C.acc+"44"}/>
        <Bdg label={`Absent ${r.absent}`} color={C.red} bg={C.red+"22"} border={C.red+"44"}/>
        {r.advance>0&&<Bdg label={`Advance ${fmt(r.advance)}`} color={C.red} bg={C.red+"22"} border={C.red+"44"}/>}
        {r.travel>0&&<Bdg label={`Travel ${fmt(r.travel)}`} color={C.blue} bg={C.blue+"22"} border={C.blue+"44"}/>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <label style={{...LBL,marginBottom:0,fontSize:10}}>Salary</label>
        <input type="number" min="0" value={salaries[r.name]||0} onChange={e=>setSalaries(p=>({...p,[r.name]:parseInt(e.target.value)||0}))} style={{...INP,padding:"4px 8px",fontSize:12,width:110}}/>
      </div>
    </div>)}
    </div>
  </Mod>);
}
function Operations({role,currentUser}){
  const [sub,setSub]=useState("att");
  const [attLog,setAttLog]=useFirestoreState("attLog",{});
  const [salaries,setSalaries]=useFirestoreState("salaries",{});
  const [attDate,setAttDate]=useState(TODAY);
  const [showSalary,setShowSalary]=useState(false);
  const [sup,setSup]=useFirestoreState("support",SUP0);const [notes,setNotes]=useFirestoreState("opsnotes",NOTES0);
  const [selTkt,setSelTkt]=useState(null);const [selNote,setSelNote]=useState(null);
  const [showNewT,setShowNewT]=useState(false);const [showNewN,setShowNewN]=useState(false);
  const [tf,setTf]=useState({date:TODAY,client:"",invNo:"",reason:"",status:"Open",assignedTo:currentUser,notes:""});
  const [nf,setNf]=useState({title:"",body:"",tag:"General",pinned:false});
  const [editId,setEditId]=useState(null);const can=MANAGERS.includes(role);
  const SC2={Present:C.green,Absent:C.red,"Half Day":C.acc};
  const DEF_REC={status:"Present",inTime:"",outTime:"",advance:0,travelExp:0,notes:""};
  function getRec(date,name){return (attLog[date]&&attLog[date][name])||DEF_REC;}
  function setRec(date,name,changes){setAttLog(p=>({...p,[date]:{...(p[date]||{}),[name]:{...getRec(date,name),...changes}}}));}
  const pr=TEAM.filter(n=>getRec(attDate,n).status==="Present").length;const ab=TEAM.filter(n=>getRec(attDate,n).status==="Absent").length;
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
      {showSalary&&<SalaryReport attLog={attLog} salaries={salaries} setSalaries={setSalaries} onClose={()=>setShowSalary(false)}/>}
      <div style={{display:"flex",gap:7,marginBottom:can?8:12,flexWrap:"wrap",alignItems:"center"}}>
        <input type="date" style={{...INP,width:150}} value={attDate} onChange={e=>setAttDate(e.target.value)}/>
        <Pill label="Present" value={pr} color={C.green}/><Pill label="Absent" value={ab} color={C.red}/>
      </div>
      {can&&<button onClick={()=>setShowSalary(true)} style={{width:"100%",marginBottom:12,background:C.green+"22",border:`1px solid ${C.green}44`,color:C.green,borderRadius:8,padding:"9px 11px",fontWeight:700,fontSize:12,cursor:"pointer"}}>📊 Salary Report</button>}
      <div style={{display:"flex",flexDirection:"column",gap:7}}>{TEAM.map(name=>{const a=getRec(attDate,name);const isMe=name===currentUser,cE=isMe||can,ed=editId===name;const sc=SC2[a.status]||C.dim;return<div key={name} style={{background:C.card,border:`1px solid ${a.status==="Present"?C.green+"33":a.status==="Absent"?C.red+"33":C.acc+"33"}`,borderRadius:11,padding:"10px 13px"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <Av name={name} size={28}/>
          <div style={{flex:1,minWidth:0}}><div style={{color:C.text,fontWeight:600,fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{name}</div>
            <div style={{color:C.muted,fontSize:10,marginTop:1,display:"flex",gap:6,flexWrap:"wrap"}}>
              {a.inTime&&<span>In: {a.inTime}{a.outTime?` · Out: ${a.outTime}`:""}</span>}
              {a.advance>0&&<span style={{color:C.red}}>Advance: {fmt(a.advance)}</span>}
              {a.travelExp>0&&<span style={{color:C.blue}}>Travel: {fmt(a.travelExp)}</span>}
            </div>
          </div>
          {cE?<button onClick={()=>{const cy={Present:"Absent",Absent:"Half Day","Half Day":"Present"};setRec(attDate,name,{status:cy[a.status]||"Present"});}} style={{background:sc+"22",border:`1px solid ${sc}44`,color:sc,borderRadius:18,padding:"3px 9px",fontWeight:700,fontSize:10,cursor:"pointer"}}>{a.status}</button>:<Bdg label={a.status} color={sc} bg={sc+"22"} border={sc+"44"}/>}
          {cE&&<button onClick={()=>setEditId(ed?null:name)} style={{background:ed?C.orange+"33":C.cb,border:`1px solid ${ed?C.orange+"55":"transparent"}`,color:ed?C.orange:C.muted,borderRadius:6,padding:"3px 7px",cursor:"pointer",fontSize:11}}>✏️</button>}
        </div>
        {ed&&<div style={{marginTop:7,borderTop:`1px solid ${C.cb}`,paddingTop:7,display:"flex",flexDirection:"column",gap:6}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <div><label style={{...LBL,fontSize:9,marginBottom:2}}>In Time</label><input type="time" value={a.inTime||""} onChange={e=>setRec(attDate,name,{inTime:e.target.value})} style={{...INP,padding:"4px 6px",fontSize:11}}/></div>
            <div><label style={{...LBL,fontSize:9,marginBottom:2}}>Out Time</label><input type="time" value={a.outTime||""} onChange={e=>setRec(attDate,name,{outTime:e.target.value})} style={{...INP,padding:"4px 6px",fontSize:11}}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <div><label style={{...LBL,fontSize:9,marginBottom:2}}>Advance Taken (₹)</label><input type="number" min="0" value={a.advance||0} onChange={e=>setRec(attDate,name,{advance:parseInt(e.target.value)||0})} style={{...INP,padding:"4px 6px",fontSize:11}}/></div>
            <div><label style={{...LBL,fontSize:9,marginBottom:2}}>Travel Expense (₹)</label><input type="number" min="0" value={a.travelExp||0} onChange={e=>setRec(attDate,name,{travelExp:parseInt(e.target.value)||0})} style={{...INP,padding:"4px 6px",fontSize:11}}/></div>
          </div>
          <div><label style={{...LBL,fontSize:9,marginBottom:2}}>Notes</label><input value={a.notes||""} placeholder="e.g. reason for advance / travel" onChange={e=>setRec(attDate,name,{notes:e.target.value})} style={{...INP,padding:"4px 6px",fontSize:11}}/></div>
          <button onClick={()=>setEditId(null)} style={{background:C.orange,border:"none",color:"#fff",borderRadius:6,padding:"7px",fontWeight:700,fontSize:11,cursor:"pointer"}}>✓ Done</button>
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
  const [ach,setAch]=useState("gen");const [msgs,setMsgs]=useFirestoreState("chat",MSGS0);const [inp,setInp]=useState("");const [ss,setSs]=useState(true);const [lp,setLp]=useState(null);const [ct,setCt]=useState(null);const [ctf,setCtf]=useState({title:"",to:"",due:""});const eRef=useRef();
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
const _ALL=NAV.map(n=>n.id);
const RA=Object.fromEntries(TEAM.map(n=>[n,_ALL]));
const UM=Object.fromEntries(TEAM.map(n=>[n,n]));
const TITLES={home:"Dashboard",tasks:"Tasks",dispatch:"Dispatch",quote:"Sales Quotation",stocks:"Bhiwandi Stocks",sales:"Sales",routes:"Saeed Bhai — Routes",payment:"Payment Collection",ops:"Operations",chat:"Team Chat"};

export default function App(){
  const [role,setRole]=useState("Ali Bhai (Owner)");const [active,setActive]=useState("home");const [showN,setShowN]=useState(false);const [showNav,setShowNav]=useState(false);const [notifs,setNotifs]=useState(NOTIFS);
  const [isDesktop,setIsDesktop]=useState(typeof window!=="undefined"&&window.innerWidth>=768);
  useEffect(()=>{const h=()=>setIsDesktop(window.innerWidth>=768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  const [pushPerm,setPushPerm]=useState(typeof window!=="undefined"&&"Notification"in window?Notification.permission:"unsupported");
  useEffect(()=>{
    initMessaging((payload)=>{
      const {title,body}=payload.notification||{};
      setNotifs(p=>[{id:Date.now(),icon:"🔔",title:title||"Notification",body:body||"",time:"Just now",read:false,color:C.acc},...p]);
      if("Notification"in window&&Notification.permission==="granted"){
        try{new Notification(title||"Tansha Hospitality",{body:body||"",icon:"/logo192.png"});}catch{}
      }
    });
  },[]);
  async function enablePush(){
    const token=await requestNotificationPermission();
    setPushPerm("Notification"in window?Notification.permission:"unsupported");
    if(token){
      try{localStorage.setItem("tansha_fcm_token",token);}catch{}
      registerDeviceToken(UM[role],token).catch(err=>console.error(err));
      setNotifs(p=>[{id:Date.now(),icon:"🔔",title:"Notifications Enabled",body:"You'll now get alerts for your tasks.",time:"Just now",read:false,color:C.green},...p]);
    }
  }
  const cu=UM[role];const unread=notifs.filter(n=>!n.read).length;const acc=RA[role];const bnav=NAV.filter(n=>acc.includes(n.id)).slice(0,5);
  function nav(m){if(acc.includes(m)){setActive(m);setShowNav(false);}}
  const SW=220;
  return (<div style={{fontFamily:"'Inter','DM Sans','Segoe UI',sans-serif",background:"#F7F8FA",minHeight:"100vh",color:C.text,position:"relative"}}>
    <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:${C.cb};border-radius:2px}`}</style>
    {showN&&<NotifPanel notifs={notifs} setNotifs={setNotifs} onClose={()=>setShowN(false)}/>}
    {pushPerm==="default"&&<div style={{position:"fixed",left:12,right:12,bottom:12,zIndex:500,background:"#fff",border:`1px solid ${C.cb}`,borderRadius:12,padding:"12px 14px",boxShadow:"0 8px 24px rgba(0,0,0,0.12)",display:"flex",alignItems:"center",gap:10,maxWidth:420,margin:"0 auto"}}>
      <div style={{fontSize:22}}>🔔</div>
      <div style={{flex:1}}>
        <div style={{fontWeight:700,fontSize:13}}>Enable Notifications</div>
        <div style={{fontSize:11,color:C.dim}}>Get alerts for tasks even when the app is closed.</div>
      </div>
      <button onClick={enablePush} style={{background:C.acc,color:"#fff",border:"none",borderRadius:8,padding:"8px 12px",fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>Enable</button>
      <button onClick={()=>setPushPerm("dismissed")} style={{background:"transparent",border:"none",color:C.dim,fontSize:18,cursor:"pointer",padding:"0 2px"}}>×</button>
    </div>}
    {showNav&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:400,backdropFilter:"blur(2px)"}} onClick={()=>setShowNav(false)}>
      <div onClick={e=>e.stopPropagation()} style={{position:"absolute",left:0,top:0,bottom:0,width:240,background:C.nav,overflowY:"auto",animation:"sL .22s ease"}}>
        <style>{`@keyframes sL{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
        <div style={{padding:"20px 16px 14px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{color:"#fff",fontWeight:800,fontSize:17,letterSpacing:-.3,marginBottom:14}}>TANSHA <span style={{color:"#6366F1",fontWeight:400,fontSize:12}}>Hospitality</span></div>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}><Av name={cu} size={36}/><div><div style={{color:"#F1F5F9",fontWeight:600,fontSize:12}}>{cu}</div><span style={{background:"rgba(99,102,241,0.25)",color:"#A5B4FC",border:"1px solid rgba(99,102,241,0.3)",borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:700}}>{(RC[role]||RC_DEF).label}</span></div></div>
          <div style={{color:"#475569",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Switch User</div>
          <div style={{maxHeight:160,overflowY:"auto",display:"flex",flexDirection:"column",gap:2}}>{TEAM.map(n=><button key={n} onClick={()=>{setRole(n);setActive("home");setShowNav(false);}} style={{display:"flex",alignItems:"center",gap:8,background:role===n?"rgba(99,102,241,0.25)":"transparent",border:`1px solid ${role===n?"rgba(99,102,241,0.4)":"transparent"}`,borderRadius:7,padding:"5px 7px",cursor:"pointer",textAlign:"left",width:"100%"}}><Av name={n} size={22}/><span style={{color:role===n?"#A5B4FC":"#94A3B8",fontSize:11,fontWeight:role===n?700:400,lineHeight:1.2,flex:1}}>{n}</span>{role===n&&<span style={{color:"#6366F1",fontSize:10}}>✓</span>}</button>)}</div>
        </div>
        <div style={{padding:"10px 10px"}}>{NAV.filter(n=>acc.includes(n.id)).map(n=><button key={n.id} onClick={()=>nav(n.id)} style={{width:"100%",display:"flex",gap:10,alignItems:"center",background:active===n.id?"rgba(99,102,241,0.18)":"transparent",border:"none",borderRadius:8,padding:"9px 10px",cursor:"pointer",marginBottom:1,textAlign:"left"}}><span style={{fontSize:16}}>{n.i}</span><span style={{color:active===n.id?"#A5B4FC":"#94A3B8",fontWeight:active===n.id?600:400,fontSize:13}}>{TITLES[n.id]}</span></button>)}
        </div>
      </div>
    </div>}

    {/* Desktop sidebar */}
    {isDesktop&&<div style={{position:"fixed",left:0,top:0,bottom:0,width:SW,background:C.nav,overflowY:"auto",zIndex:200}}>
      <div style={{padding:"20px 16px 14px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{color:"#fff",fontWeight:800,fontSize:18,letterSpacing:-.5,marginBottom:16}}>TANSHA <span style={{color:"#6366F1",fontWeight:400,fontSize:12}}>Hospitality</span></div>
        <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}><Av name={cu} size={36}/><div><div style={{color:"#F1F5F9",fontWeight:600,fontSize:12}}>{cu}</div><span style={{background:"rgba(99,102,241,0.25)",color:"#A5B4FC",border:"1px solid rgba(99,102,241,0.3)",borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:700}}>{(RC[role]||RC_DEF).label}</span></div></div>
        <div style={{color:"#475569",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Switch User</div>
        <div style={{maxHeight:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:2}}>{TEAM.map(n=><button key={n} onClick={()=>{setRole(n);setActive("home");}} style={{display:"flex",alignItems:"center",gap:8,background:role===n?"rgba(99,102,241,0.25)":"transparent",border:`1px solid ${role===n?"rgba(99,102,241,0.4)":"transparent"}`,borderRadius:7,padding:"5px 7px",cursor:"pointer",textAlign:"left",width:"100%"}}><Av name={n} size={22}/><span style={{color:role===n?"#A5B4FC":"#94A3B8",fontSize:11,fontWeight:role===n?700:400,lineHeight:1.2,flex:1}}>{n}</span>{role===n&&<span style={{color:"#6366F1",fontSize:10}}>✓</span>}</button>)}</div>
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
        <span style={{background:(RC[role]||RC_DEF).bg,color:(RC[role]||RC_DEF).text,border:`1px solid ${(RC[role]||RC_DEF).border}`,borderRadius:6,padding:"3px 10px",fontSize:10,fontWeight:600}}>{(RC[role]||RC_DEF).label}</span>
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
