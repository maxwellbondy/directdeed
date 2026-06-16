import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import LegalTab from "./Legal";

const SUPABASE_URL = "https://hzojqsalrlqrfmgkvsxm.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6b2pxc2FscmxxcmZtZ2t2c3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzQ3OTQsImV4cCI6MjA5MjQ1MDc5NH0.8vvCJ5FqbH2zOdsUEj6lGgBR_lYhxTrIOdT9JRIwdkw";
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

const styles = `
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --ink: #1a1208; --cream: #f5f0e8; --warm: #e8dfc8;
    --gold: #b8860b; --gold-light: #d4a017; --rust: #8b3a0f;
    --sage: #4a6741; --mist: #c8d4c0; --card: #faf7f2;
    --shadow: rgba(26,18,8,0.12);
    --msg-bg: #f0f2f5; --msg-sent: #4a6741; --msg-recv: #ffffff;
  }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--cream); color: var(--ink); }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }
  @keyframes msgIn { from { opacity:0; transform:scale(0.95) translateY(4px); } to { opacity:1; transform:none; } }
  .msg-bubble { animation: msgIn 0.15s ease; }
  @media (max-width: 768px) {
    .desktop-nav { display: none !important; }
    .mobile-menu-btn { display: flex !important; }
    .hero-title { font-size: 28px !important; }
    .listing-grid { grid-template-columns: 1fr !important; }
    .messenger-sidebar { display: none !important; }
    .messenger-sidebar.active { display: flex !important; }
    .messenger-chat { display: none !important; }
    .messenger-chat.active { display: flex !important; }
  }
  @media (min-width: 769px) {
    .mobile-menu-btn { display: none !important; }
    .mobile-nav { display: none !important; }
    .messenger-sidebar { display: flex !important; }
    .messenger-chat { display: flex !important; }
  }
`;

const REQUIRED_DOC_STEPS = ["preapproval","earnest","inspection","appraisal","financing","title"];

const TRANSACTION_STEPS = [
  { id:1,  key:"offer",               label:"Offer",            icon:"📋", owner:"seller",
    desc:"Seller reviews and responds to the offer",
    buyerAction:"Your offer has been submitted. Waiting for the seller to respond.",
    sellerAction:"Review the offer below. You may accept, counter, or decline.",
    relatedDocs:["Purchase & Sale Agreement","Counteroffer Addendum"] },
  { id:2,  key:"preapproval",         label:"Pre-Approval",     icon:"🏦", owner:"buyer",
    desc:"Buyer provides proof of financing or funds",
    buyerAction:"Upload your mortgage pre-approval letter OR proof of funds. Required to advance.",
    sellerAction:"Waiting for buyer to upload pre-approval or proof of funds.",
    relatedDocs:[], requiresDoc:true },
  { id:3,  key:"earnest",             label:"Earnest Money",    icon:"💰", owner:"buyer",
    desc:"Buyer deposits earnest money with escrow agent",
    buyerAction:"Deposit earnest money with a licensed title company. Upload your deposit receipt to advance.",
    sellerAction:"Waiting for buyer to deposit earnest money and upload confirmation.",
    relatedDocs:["Earnest Money Agreement"], requiresDoc:true },
  { id:4,  key:"inspection",          label:"Inspection",       icon:"🔍", owner:"buyer",
    desc:"Buyer completes home inspection",
    buyerAction:"Schedule a licensed home inspector. Upload the inspection report to advance.",
    sellerAction:"Waiting for buyer to complete inspection and upload the report.",
    relatedDocs:["Property Disclosure Statement","Lead Paint Disclosure","Inspection Contingency Waiver"], requiresDoc:true },
  { id:5,  key:"inspection_response", label:"Repair Response",  icon:"🔨", owner:"seller",
    desc:"Seller responds to repair requests",
    buyerAction:"Waiting for seller to respond to your repair requests.",
    sellerAction:"Review buyer's repair requests and respond.",
    relatedDocs:["Counteroffer Addendum","As-Is Addendum"] },
  { id:6,  key:"appraisal",           label:"Appraisal",        icon:"📊", owner:"buyer",
    desc:"Buyer uploads property appraisal",
    buyerAction:"Your lender will order the appraisal. Upload the report to advance.",
    sellerAction:"Waiting for buyer to upload the appraisal report.",
    relatedDocs:[], requiresDoc:true },
  { id:7,  key:"financing",           label:"Financing",        icon:"✅", owner:"buyer",
    desc:"Buyer uploads final loan commitment",
    buyerAction:"Upload your final loan commitment letter from your lender to advance.",
    sellerAction:"Waiting for buyer to upload their loan commitment letter.",
    relatedDocs:["Seller Financing Addendum"], requiresDoc:true },
  { id:8,  key:"title",               label:"Title Search",     icon:"📜", owner:"seller",
    desc:"Seller clears title for transfer",
    buyerAction:"Waiting for seller to clear title.",
    sellerAction:"Work with your title company to complete the title search. Upload clearance confirmation to advance.",
    relatedDocs:[], requiresDoc:true },
  { id:9,  key:"walkthrough",         label:"Walkthrough",      icon:"🚶", owner:"buyer",
    desc:"Buyer completes final walkthrough",
    buyerAction:"Complete your final walkthrough and confirm the property condition below.",
    sellerAction:"Ensure the property is ready. Buyer will confirm condition.",
    relatedDocs:[] },
  { id:10, key:"closing",             label:"Closing",          icon:"🎉", owner:"both",
    desc:"Both parties sign and complete the transaction",
    buyerAction:"Sign the closing documents below. Both parties must sign to complete.",
    sellerAction:"Sign the closing documents below. Both parties must sign to complete.",
    relatedDocs:["Purchase & Sale Agreement"] },
];

function formatPrice(p) { return "$" + Number(p).toLocaleString(); }
function formatTime(ts) {
  const d = new Date(ts), now = new Date();
  const diff = Math.floor((now-d)/86400000);
  if (diff===0) return d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  if (diff===1) return "Yesterday";
  if (diff<7) return d.toLocaleDateString([],{weekday:"long"});
  return d.toLocaleDateString([],{month:"short",day:"numeric"});
}
function formatDateLabel(ts) {
  const d = new Date(ts), now = new Date();
  const diff = Math.floor((now-d)/86400000);
  if (diff===0) return "Today";
  if (diff===1) return "Yesterday";
  if (diff<7) return d.toLocaleDateString([],{weekday:"long"});
  return d.toLocaleDateString([],{month:"long",day:"numeric",year:"numeric"});
}
function timeAgo(ts) {
  const s = Math.floor((Date.now()-new Date(ts))/1000);
  if (s<60) return "just now";
  if (s<3600) return Math.floor(s/60)+"m ago";
  if (s<86400) return Math.floor(s/3600)+"h ago";
  return Math.floor(s/86400)+"d ago";
}

async function callClaude(messages, maxTokens=1000) {
  const res = await fetch("/api/claude", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:maxTokens,messages}) });
  if (!res.ok) throw new Error("API error "+res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content.map(b=>b.text||"").join("");
}

async function sendNotification(userId, message, link) {
  if (!userId) return;
  try { await sb.from("notifications").insert([{user_id:userId,message,link,read:false}]); }
  catch(e) { console.error("Notif:",e); }
}

async function sendEmail(to, subject, html) {
  if (!to) return;
  try {
    const res = await fetch("/api/email", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({to,subject,html}) });
    if (!res.ok) { const d = await res.json(); console.error("Email error:",d); }
  } catch(e) { console.error("Email:",e); }
}

function emailTemplate(title, body, cta="Open DirectDeed", ctaUrl="https://directdeed.vercel.app") {
  return `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
    <div style="background:#1a1208;padding:18px 24px;border-radius:8px 8px 0 0">
      <span style="color:#fff;font-size:18px;font-weight:700">🏡 DirectDeed</span>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;border:1px solid #eee">
      <p style="color:#1a1208;font-size:16px;font-weight:600;margin:0 0 12px">${title}</p>
      <div style="color:#444;font-size:14px;line-height:1.7;margin-bottom:20px">${body}</div>
      <a href="${ctaUrl}" style="display:block;background:#4a6741;color:#fff;text-align:center;padding:12px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">${cta} →</a>
      <p style="color:#aaa;font-size:11px;margin-top:16px;text-align:center">DirectDeed · Bondy Technologies LLC · Not a licensed brokerage</p>
    </div>
  </div>`;
}

function getContractPrompt(name, offer) {
  const l=offer.listings||{};
  const base=`Property: ${l.address||""}, ${l.city||""}, ${l.state||""} ${l.zip||""}. Buyer: ${offer.buyer_name||"___"}. Seller: ${l.seller_name||"___"}. Price: $${offer.offer_price||"___"}. Closing: ${offer.closing_date||"___"}. Earnest: $${offer.earnest_money||"___"}.`;
  const p={
    "Purchase & Sale Agreement":`Generate a complete residential Purchase and Sale Agreement. ${base} Sections: 1)Parties 2)Price 3)Earnest 4)Financing Contingency 5)Inspection Contingency 6)Appraisal Contingency 7)Title 8)Closing 9)Possession 10)Inclusions 11)Condition 12)Costs 13)Default 14)Disputes 15)Entire Agreement. Signature blocks. Plain English. No markdown.`,
    "Counteroffer Addendum":`Generate a Counteroffer Addendum. ${base} Include reference to original offer, modified terms, expiration, unchanged terms, signatures. No markdown.`,
    "Earnest Money Agreement":`Generate an Earnest Money Agreement. ${base} Include deposit amount, escrow holder, deadline, return conditions, forfeiture, dispute resolution, signatures. No markdown.`,
    "Property Disclosure Statement":`Generate a Seller Disclosure. ${base} Yes/No/Unknown for: roof, foundation, water, plumbing, electrical, HVAC, pests, environmental, HOA, legal disputes, unpermitted work, defects. Seller certification and signatures. No markdown.`,
    "Lead Paint Disclosure":`Generate a Lead Paint Disclosure per 42 USC 4852d. ${base} Federal requirement, seller checkboxes, records, EPA pamphlet, 10-day inspection right, signatures. No markdown.`,
    "Inspection Contingency Waiver":`Generate an Inspection Contingency Waiver. ${base} Voluntary waiver, as-is, no warranties, risks acknowledged, other terms remain, signatures. No markdown.`,
    "As-Is Addendum":`Generate an As-Is Addendum. ${base} As-is, no warranties, no repairs, buyer acknowledgment, survivability, signatures. No markdown.`,
    "Seller Financing Addendum":`Generate a Seller Financing Addendum. ${base} Loan amount, interest, term, payment, late penalty, default, due-on-sale, security interest, signatures. No markdown.`,
  };
  return p[name]||`Generate a professional ${name}. ${base} No markdown.`;
}

function Spinner({size=16,dark}) {
  return <div style={{width:size,height:size,border:`2px solid ${dark?"rgba(0,0,0,0.12)":"rgba(255,255,255,0.25)"}`,borderTop:`2px solid ${dark?"var(--ink)":"#fff"}`,borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block",flexShrink:0}}/>;
}

function AuthModal({onClose,onAuth}) {
  const [mode,setMode]=useState("login");
  const [step,setStep]=useState(1);
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [emailSent,setEmailSent]=useState(false);
  const [resent,setResent]=useState(false);
  const [resetSent,setResetSent]=useState(false);

  const inp={width:"100%",padding:"12px 16px",borderRadius:12,border:"1.5px solid var(--warm)",background:"#fff",fontSize:15,outline:"none",color:"var(--ink)"};
  const lbl={display:"block",fontSize:12,fontWeight:600,color:"#555",marginBottom:6};

  const login=async()=>{
    if(!email||!password){setError("Please fill in all fields.");return;}
    setLoading(true);setError(null);
    const{data,error:e}=await sb.auth.signInWithPassword({email,password});
    if(e){setError(e.message);setLoading(false);return;}
    onAuth(data.user);onClose();
  };

  const sendPasswordReset=async()=>{
    if(!email){setError("Enter your email address above first.");return;}
    setLoading(true);setError(null);
    const{error:e}=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
    if(e){setError(e.message);}
    else{setResetSent(true);}
    setLoading(false);
  };

  const signup=async()=>{
    if(password!==confirm){setError("Passwords do not match.");return;}
    if(password.length<8){setError("Password must be at least 8 characters.");return;}
    setLoading(true);setError(null);
    const{error:e}=await sb.auth.signUp({email,password,options:{data:{full_name:name}}});
    if(e){setError(e.message);setLoading(false);return;}
    setEmailSent(true);setLoading(false);
  };

  if(emailSent) return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,18,8,0.65)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"var(--card)",borderRadius:24,maxWidth:420,width:"100%",padding:"44px 38px",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:68,height:68,borderRadius:"50%",background:"var(--sage)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",fontSize:30}}>📧</div>
        <h2 style={{fontSize:22,fontWeight:700,color:"var(--ink)",marginBottom:8}}>Check your email</h2>
        <div style={{background:"var(--warm)",borderRadius:8,padding:"9px 14px",marginBottom:14,fontWeight:600,fontSize:13}}>{email}</div>
        <p style={{color:"#777",lineHeight:1.7,marginBottom:20,fontSize:13}}>Click the confirmation link to activate your account. Check spam if you don't see it.</p>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          <button onClick={async()=>{await sb.auth.resend({type:"signup",email});setResent(true);}} disabled={resent} style={{background:resent?"var(--sage)":"var(--warm)",color:resent?"#fff":"var(--ink)",border:"none",borderRadius:10,padding:"12px",fontSize:13,cursor:"pointer"}}>
            {resent?"✓ Email resent!":"Resend confirmation"}
          </button>
          <button onClick={()=>{setMode("login");setEmailSent(false);}} style={{background:"var(--sage)",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:13,cursor:"pointer"}}>I've confirmed — Log In</button>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#aaa",fontSize:12,cursor:"pointer"}}>Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,18,8,0.65)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"var(--card)",borderRadius:24,maxWidth:420,width:"100%",overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:"var(--ink)",padding:"26px 30px 20px",textAlign:"center",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",borderRadius:"50%",width:26,height:26,cursor:"pointer",fontSize:12}}>✕</button>
          <div style={{fontSize:22,marginBottom:6}}>🏡</div>
          <div style={{fontSize:19,fontWeight:700,color:"#fff",marginBottom:3}}>{mode==="login"?"Welcome back":"Create your account"}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>{mode==="login"?"Sign in to continue":"Keep more of your money — sell directly"}</div>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid var(--warm)"}}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError(null);setStep(1);setResetSent(false);}} style={{flex:1,padding:"12px",background:mode===m?"var(--card)":"var(--cream)",border:"none",borderBottom:mode===m?"2px solid var(--gold)":"2px solid transparent",fontSize:13,fontWeight:mode===m?600:400,color:mode===m?"var(--gold)":"#888",cursor:"pointer",marginBottom:-1}}>
              {m==="login"?"Log In":"Create Account"}
            </button>
          ))}
        </div>
        <div style={{padding:"22px 28px 26px"}}>
          {mode==="login"?(
            <div style={{display:"flex",flexDirection:"column",gap:13}}>
              <div>
                <label style={lbl}>Email</label>
                <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--warm)"}/>
              </div>
              <div>
                <label style={lbl}>Password</label>
                <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--warm)"}/>
                <div style={{textAlign:"right",marginTop:5}}>
                  {resetSent
                    ? <span style={{fontSize:12,color:"var(--sage)"}}>✓ Reset email sent! Check your inbox.</span>
                    : <span onClick={sendPasswordReset} style={{fontSize:12,color:"var(--gold)",cursor:"pointer",textDecoration:"underline"}}>{loading?"Sending...":"Forgot password?"}</span>
                  }
                </div>
              </div>
              {error&&<div style={{background:"#fff5f5",border:"1px solid #fcc",borderRadius:8,padding:"9px 12px",color:"var(--rust)",fontSize:12}}>{error}</div>}
              <button onClick={login} disabled={loading} style={{background:loading?"#aaa":"var(--sage)",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:14,cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {loading?<Spinner/>:"Log In"}
              </button>
              <div style={{textAlign:"center",fontSize:12,color:"#888"}}>No account? <span onClick={()=>{setMode("signup");setError(null);}} style={{color:"var(--gold)",cursor:"pointer",fontWeight:600}}>Sign up free</span></div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:13}}>
              <div style={{display:"flex",gap:5,marginBottom:4}}>
                {["Name","Email & Password","Confirm"].map((s,i)=>(
                  <div key={i} style={{flex:1,textAlign:"center"}}>
                    <div style={{width:20,height:20,borderRadius:"50%",background:step>i+1?"var(--sage)":step===i+1?"var(--gold)":"var(--warm)",color:step>=i+1?"#fff":"#aaa",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 3px",fontSize:9,fontWeight:700}}>{step>i+1?"✓":i+1}</div>
                    <div style={{fontSize:9,color:step===i+1?"var(--gold)":"#aaa"}}>{s}</div>
                  </div>
                ))}
              </div>
              {step===1&&<>
                <div style={{background:"var(--warm)",borderRadius:8,padding:"10px 13px",fontSize:12,color:"#555",lineHeight:1.6}}>Skip agent fees. Sell directly and keep thousands more.</div>
                <div><label style={lbl}>Your Full Name</label><input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Smith" autoFocus onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--warm)"} onKeyDown={e=>e.key==="Enter"&&name.trim()&&setStep(2)}/></div>
                {error&&<div style={{background:"#fff5f5",border:"1px solid #fcc",borderRadius:8,padding:"9px 12px",color:"var(--rust)",fontSize:12}}>{error}</div>}
                <button onClick={()=>{if(!name.trim()){setError("Please enter your name.");return;}setError(null);setStep(2);}} style={{background:"var(--gold)",color:"#fff",border:"none",borderRadius:12,padding:"12px",fontSize:13,cursor:"pointer",fontWeight:600}}>Continue</button>
              </>}
              {step===2&&<>
                <div style={{fontSize:13,color:"#666"}}>Hi <strong style={{color:"var(--ink)"}}>{name}</strong>! Set up your login.</div>
                <div><label style={lbl}>Email</label><input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} autoFocus onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--warm)"}/>
                </div>
                <div><label style={lbl}>Password <span style={{fontWeight:400,color:"#aaa"}}>(min 8 chars)</span></label><input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--warm)"}/>
                </div>
                {error&&<div style={{background:"#fff5f5",border:"1px solid #fcc",borderRadius:8,padding:"9px 12px",color:"var(--rust)",fontSize:12}}>{error}</div>}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setError(null);setStep(1);}} style={{flex:1,background:"none",border:"1.5px solid var(--warm)",borderRadius:10,padding:"10px",fontSize:12,cursor:"pointer",color:"var(--ink)"}}>Back</button>
                  <button onClick={()=>{if(!email.trim()){setError("Enter your email.");return;}if(password.length<8){setError("Min 8 characters.");return;}setError(null);setStep(3);}} style={{flex:2,background:"var(--gold)",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontSize:12,cursor:"pointer",fontWeight:600}}>Continue</button>
                </div>
              </>}
              {step===3&&<>
                <div style={{background:"var(--warm)",borderRadius:8,padding:"10px 13px",fontSize:12,color:"var(--ink)",lineHeight:1.7}}><strong>Almost done!</strong><br/>Name: {name} · Email: {email}</div>
                <div><label style={lbl}>Confirm Password</label><input style={inp} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&signup()} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--warm)"}/>
                </div>
                <div style={{fontSize:11,color:"#888",lineHeight:1.6}}>By signing up you agree to our <span style={{color:"var(--gold)"}}>Terms</span> and <span style={{color:"var(--gold)"}}>Privacy Policy</span>. DirectDeed is not a licensed brokerage.</div>
                {error&&<div style={{background:"#fff5f5",border:"1px solid #fcc",borderRadius:8,padding:"9px 12px",color:"var(--rust)",fontSize:12}}>{error}</div>}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setError(null);setStep(2);}} style={{flex:1,background:"none",border:"1.5px solid var(--warm)",borderRadius:10,padding:"10px",fontSize:12,cursor:"pointer",color:"var(--ink)"}}>Back</button>
                  <button onClick={signup} disabled={loading} style={{flex:2,background:loading?"#aaa":"var(--sage)",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontSize:12,cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {loading?<Spinner/>:"Create My Account"}
                  </button>
                </div>
              </>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListingCard({listing,onClick,onDelete,isOwner,onMessage,user}) {
  const [hovered,setHovered]=useState(false);
  const photos=listing.photos||[];
  const cover=photos[0];
  const daysAgo=Math.floor((Date.now()-new Date(listing.created_at))/86400000);
  const shareUrl=window.location.origin+"?listing="+listing.id;
  const isOwnListing=user?.id===listing.user_id;

  const handleShare=async e=>{
    e.stopPropagation();
    if(navigator.share){try{await navigator.share({title:listing.address+" — DirectDeed",text:formatPrice(listing.price)+" · "+listing.city+", "+listing.state,url:shareUrl});}catch{}}
    else{await navigator.clipboard.writeText(shareUrl);alert("Link copied!");}
  };

  return (
    <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{background:"var(--card)",border:"1px solid var(--warm)",borderRadius:16,overflow:"hidden",cursor:"pointer",transform:hovered?"translateY(-3px)":"none",boxShadow:hovered?"0 12px 36px var(--shadow)":"0 2px 8px var(--shadow)",transition:"all 0.2s",position:"relative"}}>
      {listing.sold&&(
        <div style={{position:"absolute",inset:0,background:"rgba(26,18,8,0.6)",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:16}}>
          <span style={{background:"var(--rust)",color:"#fff",fontSize:17,fontWeight:700,padding:"7px 20px",borderRadius:9,letterSpacing:2,transform:"rotate(-8deg)"}}>SOLD</span>
        </div>
      )}
      <div onClick={()=>onClick(listing)} style={{height:175,background:"linear-gradient(135deg,var(--warm),var(--mist))",position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:50}}>
        {cover?<img src={cover} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>:"🏡"}
        <span style={{position:"absolute",top:10,left:10,background:"rgba(255,255,255,0.92)",fontSize:10,padding:"3px 8px",borderRadius:14,color:"var(--ink)"}}>{daysAgo===0?"Today":daysAgo+"d ago"}</span>
        <div style={{position:"absolute",bottom:8,left:8,right:8,display:"flex",gap:6}}>
          <button onClick={handleShare} style={{background:"rgba(255,255,255,0.92)",border:"none",borderRadius:14,padding:"4px 10px",fontSize:11,cursor:"pointer",color:"var(--ink)",fontWeight:500}}>🔗 Share</button>
          {!isOwnListing&&!listing.sold&&(
            <button onClick={e=>{e.stopPropagation();if(onMessage)onMessage(listing);}} style={{background:"rgba(74,103,65,0.92)",border:"none",borderRadius:14,padding:"4px 10px",fontSize:11,cursor:"pointer",color:"#fff",fontWeight:500}}>💬 Message</button>
          )}
        </div>
      </div>
      <div onClick={()=>onClick(listing)} style={{padding:"13px 15px"}}>
        <div style={{fontSize:15,fontWeight:600,lineHeight:1.2,marginBottom:2,color:"var(--ink)"}}>{listing.address}</div>
        <div style={{fontSize:12,color:"#666",marginBottom:7}}>{listing.city}, {listing.state} {listing.zip}</div>
        <div style={{fontSize:22,fontWeight:700,color:"var(--gold)",marginBottom:7}}>{formatPrice(listing.price)}</div>
        <div style={{display:"flex",gap:12,fontSize:12,color:"#555"}}>
          <span>{listing.beds} bd</span><span>{listing.baths} ba</span><span>{Number(listing.sqft).toLocaleString()} sqft</span>
        </div>
      </div>
      {isOwner&&(
        <div style={{padding:"0 15px 13px",display:"flex",gap:7}}>
          <button onClick={handleShare} style={{flex:1,background:"var(--warm)",color:"var(--ink)",border:"none",borderRadius:8,padding:"7px",fontSize:12,cursor:"pointer"}}>🔗 Share</button>
          <button onClick={e=>{e.stopPropagation();onDelete(listing.id);}} style={{flex:1,background:"#fff5f5",color:"var(--rust)",border:"1px solid #fcc",borderRadius:8,padding:"7px",fontSize:12,cursor:"pointer"}}>Delete</button>
        </div>
      )}
    </div>
  );
}

function ListingModal({listing,onClose,onMessage,onOffer,user}) {
  const [photoIdx,setPhotoIdx]=useState(0);
  if(!listing) return null;
  const photos=listing.photos||[];
  const shareUrl=window.location.origin+"?listing="+listing.id;
  const isOwnListing=user?.id===listing.user_id;

  const handleShare=async()=>{
    if(navigator.share){try{await navigator.share({title:listing.address+" — DirectDeed",text:formatPrice(listing.price)+" · "+listing.city+", "+listing.state,url:shareUrl});}catch{}}
    else{await navigator.clipboard.writeText(shareUrl);alert("Link copied!");}
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,18,8,0.55)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"var(--card)",borderRadius:20,maxWidth:540,width:"100%",maxHeight:"90vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.35)"}} onClick={e=>e.stopPropagation()}>
        <div style={{height:215,background:"linear-gradient(135deg,var(--warm),var(--mist))",borderRadius:"20px 20px 0 0",position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:78}}>
          {photos.length>0?<img src={photos[photoIdx]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🏡"}
          {listing.sold&&<div style={{position:"absolute",inset:0,background:"rgba(26,18,8,0.55)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{background:"var(--rust)",color:"#fff",fontSize:24,fontWeight:700,padding:"10px 26px",borderRadius:10,letterSpacing:2,transform:"rotate(-8deg)"}}>SOLD</span></div>}
          {photos.length>1&&!listing.sold&&<>
            <button onClick={e=>{e.stopPropagation();setPhotoIdx(i=>(i-1+photos.length)%photos.length);}} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.5)",color:"#fff",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:13}}>{"<"}</button>
            <button onClick={e=>{e.stopPropagation();setPhotoIdx(i=>(i+1)%photos.length);}} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.5)",color:"#fff",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:13}}>{">"}</button>
          </>}
        </div>
        <div style={{padding:"20px 24px 24px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}>
            <h2 style={{fontSize:20,fontWeight:600,flex:1,color:"var(--ink)"}}>{listing.address}</h2>
            <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#888",marginLeft:8}}>✕</button>
          </div>
          <div style={{color:"#666",fontSize:12,marginBottom:10}}>{listing.city}, {listing.state} {listing.zip} · {listing.type}</div>
          <div style={{fontSize:28,fontWeight:700,color:"var(--gold)",marginBottom:13}}>{formatPrice(listing.price)}</div>
          <div style={{display:"flex",gap:14,fontSize:13,color:"#555",marginBottom:13,paddingBottom:13,borderBottom:"1px solid var(--warm)"}}>
            <span>{listing.beds} Beds</span><span>{listing.baths} Baths</span><span>{Number(listing.sqft).toLocaleString()} sqft</span>
          </div>
          {listing.description&&<p style={{fontSize:13,lineHeight:1.8,color:"#444",marginBottom:13}}>{listing.description}</p>}
          <div style={{background:"var(--warm)",borderRadius:10,padding:"10px 14px",marginBottom:13,display:"flex",alignItems:"center",gap:9}}>
            <span style={{fontSize:19}}>👤</span>
            <div><div style={{fontWeight:600,fontSize:12,color:"var(--ink)"}}>{listing.seller_name}</div><div style={{fontSize:11,color:"#666"}}>Owner · No commission</div></div>
          </div>
          <div style={{background:"var(--cream)",borderRadius:9,padding:"9px 13px",marginBottom:13,border:"1px solid var(--warm)"}}>
            <div style={{fontSize:11,color:"#666",marginBottom:6}}>Share this listing</div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={handleShare} style={{flex:1,background:"var(--ink)",color:"#fff",border:"none",borderRadius:7,padding:"7px",fontSize:11,cursor:"pointer"}}>🔗 Copy Link</button>
              <a href={"https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(shareUrl)} target="_blank" rel="noopener noreferrer" style={{flex:1,background:"#1877f2",color:"#fff",borderRadius:7,padding:"7px",fontSize:11,textDecoration:"none",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"}}>📘 Facebook</a>
              <a href={"https://twitter.com/intent/tweet?url="+encodeURIComponent(shareUrl)+"&text="+encodeURIComponent(formatPrice(listing.price)+" home in "+listing.city+", "+listing.state)} target="_blank" rel="noopener noreferrer" style={{flex:1,background:"#000",color:"#fff",borderRadius:7,padding:"7px",fontSize:11,textDecoration:"none",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"}}>✕ Post</a>
            </div>
          </div>
          {!listing.sold&&!isOwnListing?(
            <div style={{display:"flex",gap:9}}>
              <button onClick={()=>{onMessage(listing);onClose();}} style={{flex:1,background:"var(--warm)",color:"var(--ink)",border:"none",borderRadius:12,padding:"12px",fontSize:13,fontWeight:600,cursor:"pointer"}}>💬 Message Seller</button>
              <button onClick={()=>{onOffer(listing);onClose();}} style={{flex:2,background:"var(--sage)",color:"#fff",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:600,cursor:"pointer"}}>Make an Offer</button>
            </div>
          ):listing.sold?(
            <div style={{background:"#fff5f5",border:"1px solid #fcc",borderRadius:10,padding:"12px",textAlign:"center",color:"var(--rust)",fontWeight:500}}>This property has been sold.</div>
          ):(
            <div style={{background:"var(--warm)",borderRadius:10,padding:"12px",textAlign:"center",color:"#666",fontSize:13}}>This is your listing.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function BrowseTab({onMessage,onOffer,user,deepLinkListingId,onClearDeepLink}) {
  const [listings,setListings]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [maxPrice,setMaxPrice]=useState(2000000);
  const [minBeds,setMinBeds]=useState(0);
  const [showSold,setShowSold]=useState(false);
  const [selected,setSelected]=useState(null);

  useEffect(()=>{
    sb.from("listings").select("*").order("created_at",{ascending:false})
      .then(({data})=>{setListings(data||[]);setLoading(false);});
  },[]);

  useEffect(()=>{
    if(deepLinkListingId&&listings.length>0){
      const found=listings.find(l=>l.id===deepLinkListingId);
      if(found){setSelected(found);onClearDeepLink();}
    }
  },[deepLinkListingId,listings]);

  const filtered=listings.filter(l=>
    (l.address+" "+l.city+" "+l.state+" "+(l.zip||"")).toLowerCase().includes(search.toLowerCase())&&
    Number(l.price)<=maxPrice&&Number(l.beds)>=minBeds&&(showSold||!l.sold)
  );

  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:"20px 16px"}}>
      <div style={{display:"flex",gap:9,marginBottom:18,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search address, city, or ZIP..." style={{flex:2,minWidth:150,padding:"9px 13px",borderRadius:9,border:"1.5px solid var(--warm)",background:"var(--card)",fontSize:13,outline:"none",color:"var(--ink)"}}/>
        <select value={minBeds} onChange={e=>setMinBeds(Number(e.target.value))} style={{padding:"9px 11px",borderRadius:9,border:"1.5px solid var(--warm)",background:"var(--card)",fontSize:12,cursor:"pointer",color:"var(--ink)"}}>
          <option value={0}>Any beds</option><option value={2}>2+</option><option value={3}>3+</option><option value={4}>4+</option>
        </select>
        <select value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))} style={{padding:"9px 11px",borderRadius:9,border:"1.5px solid var(--warm)",background:"var(--card)",fontSize:12,cursor:"pointer",color:"var(--ink)"}}>
          <option value={2000000}>Any price</option><option value={400000}>Under $400k</option><option value={600000}>Under $600k</option><option value={800000}>Under $800k</option><option value={1000000}>Under $1M</option>
        </select>
        <label style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#555",cursor:"pointer"}}>
          <input type="checkbox" checked={showSold} onChange={e=>setShowSold(e.target.checked)}/>Show sold
        </label>
      </div>
      {loading&&<div style={{textAlign:"center",padding:"56px",color:"#888"}}>Loading listings...</div>}
      {!loading&&(
        <div className="listing-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:18}}>
          {filtered.map(l=><ListingCard key={l.id} listing={l} onClick={setSelected} onDelete={()=>{}} isOwner={false} onMessage={onMessage} user={user}/>)}
        </div>
      )}
      {!loading&&filtered.length===0&&(
        <div style={{textAlign:"center",color:"#888",padding:"56px 0"}}>
          <div style={{fontSize:40,marginBottom:10}}>🏡</div>
          <div style={{fontSize:18,marginBottom:6,color:"var(--ink)"}}>No listings found</div>
          <div style={{fontSize:12}}>Try adjusting your filters.</div>
        </div>
      )}
      <ListingModal listing={selected} onClose={()=>setSelected(null)} onMessage={onMessage} onOffer={onOffer} user={user}/>
    </div>
  );
}
function MakeOfferModal({listing,user,onClose,onRequireAuth}) {
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({
    offer_price:listing?.price||"",earnest_money:"",closing_date:"",
    financing_contingency:true,inspection_contingency:true,appraisal_contingency:true,
    message:"",buyer_name:user?.user_metadata?.full_name||"",
    buyer_email:user?.email||"",buyer_phone:"",
  });
  const [submitting,setSubmitting]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [error,setError]=useState(null);
  const update=(k,v)=>setForm(f=>({...f,[k]:v}));
  const inp={width:"100%",padding:"10px 13px",borderRadius:9,border:"1.5px solid var(--warm)",background:"#fff",fontSize:13,outline:"none",color:"var(--ink)"};
  const lbl={display:"block",fontSize:10,fontWeight:600,color:"#555",marginBottom:4,textTransform:"uppercase"};

  if(!user) return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,18,8,0.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"var(--card)",borderRadius:18,maxWidth:380,width:"100%",padding:"32px 28px",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:40,marginBottom:12}}>🔒</div>
        <h2 style={{fontSize:22,marginBottom:9,color:"var(--ink)"}}>Sign in to make an offer</h2>
        <p style={{color:"#666",marginBottom:20,lineHeight:1.7,fontSize:13}}>Create a free account to submit and track offers.</p>
        <button onClick={()=>{onClose();onRequireAuth();}} style={{background:"var(--sage)",color:"#fff",border:"none",borderRadius:10,padding:"12px 26px",fontSize:13,cursor:"pointer",fontWeight:600}}>Sign Up Free</button>
      </div>
    </div>
  );

  const submit=async()=>{
    setSubmitting(true);setError(null);
    try {
      const{error:e}=await sb.from("offers").insert([{
        listing_id:listing.id,buyer_id:user.id,seller_id:listing.user_id,
        buyer_name:form.buyer_name,buyer_email:form.buyer_email,buyer_phone:form.buyer_phone,
        offer_price:Number(form.offer_price),earnest_money:Number(form.earnest_money),
        closing_date:form.closing_date,financing_contingency:form.financing_contingency,
        inspection_contingency:form.inspection_contingency,appraisal_contingency:form.appraisal_contingency,
        message:form.message,status:"pending",step:"offer",step_index:1,
      }]);
      if(e) throw new Error(e.message);
      await sendNotification(listing.user_id,"New offer of "+formatPrice(form.offer_price)+" on "+listing.address,"offers");
      await sendEmail(
        listing.seller_email,
        "🏡 New Offer on "+listing.address,
        emailTemplate(
          "You received a new offer!",
          `<strong>${form.buyer_name}</strong> has offered <strong>${formatPrice(form.offer_price)}</strong> on ${listing.address}.<br/><br/>Closing date: <strong>${form.closing_date||"TBD"}</strong><br/>Earnest money: <strong>${formatPrice(form.earnest_money)}</strong><br/><br/>Log in to accept, counter, or decline.`,
          "Review Offer"
        )
      );
      setSubmitted(true);
    } catch(e){setError(e.message);}
    setSubmitting(false);
  };

  if(submitted) return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,18,8,0.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"var(--card)",borderRadius:18,maxWidth:400,width:"100%",padding:"36px 30px",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:48,marginBottom:12}}>🎉</div>
        <h2 style={{fontSize:24,marginBottom:9,color:"var(--ink)"}}>Offer Submitted!</h2>
        <p style={{color:"#555",lineHeight:1.8,marginBottom:20,fontSize:13}}>Your offer of {formatPrice(form.offer_price)} has been sent. Track it in the Offers tab.</p>
        <button onClick={onClose} style={{background:"var(--sage)",color:"#fff",border:"none",borderRadius:10,padding:"12px 26px",fontSize:13,cursor:"pointer",fontWeight:600}}>Done</button>
      </div>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,18,8,0.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"var(--card)",borderRadius:18,maxWidth:500,width:"100%",maxHeight:"90vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"20px 24px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <h2 style={{fontSize:20,fontWeight:600,color:"var(--ink)"}}>Make an Offer</h2>
            <button onClick={onClose} style={{background:"none",border:"none",fontSize:17,cursor:"pointer",color:"#888"}}>✕</button>
          </div>
          <div style={{fontSize:12,color:"#666",marginBottom:16}}>{listing.address}, {listing.city}, {listing.state} {listing.zip} · {formatPrice(listing.price)}</div>
          <div style={{display:"flex",gap:4,marginBottom:20}}>
            {["Terms","Contingencies","Your Info"].map((s,i)=>(
              <div key={i} style={{flex:1,textAlign:"center"}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:step>i+1?"var(--sage)":step===i+1?"var(--gold)":"var(--warm)",color:step>=i+1?"#fff":"#aaa",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 2px",fontSize:8,fontWeight:700}}>{step>i+1?"✓":i+1}</div>
                <div style={{fontSize:8,color:step===i+1?"var(--gold)":"#aaa"}}>{s}</div>
              </div>
            ))}
          </div>

          {step===1&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <label style={lbl}>Offer Price</label>
                <input style={inp} type="number" value={form.offer_price} onChange={e=>update("offer_price",e.target.value)} placeholder="480000"/>
                {listing.price&&Number(form.offer_price)>0&&Number(form.offer_price)<Number(listing.price)&&<div style={{fontSize:10,color:"var(--rust)",marginTop:2}}>{Math.round((1-Number(form.offer_price)/Number(listing.price))*100)}% below asking</div>}
                {listing.price&&Number(form.offer_price)>Number(listing.price)&&<div style={{fontSize:10,color:"var(--sage)",marginTop:2}}>{Math.round((Number(form.offer_price)/Number(listing.price)-1)*100)}% above asking</div>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={lbl}>Earnest Money</label><input style={inp} type="number" value={form.earnest_money} onChange={e=>update("earnest_money",e.target.value)} placeholder="5000"/></div>
                <div><label style={lbl}>Closing Date</label><input style={inp} type="date" value={form.closing_date} onChange={e=>update("closing_date",e.target.value)}/></div>
              </div>
              <div><label style={lbl}>Message to Seller <span style={{fontWeight:400,textTransform:"none",color:"#aaa"}}>optional</span></label>
                <textarea style={{...inp,minHeight:60,resize:"vertical"}} value={form.message} onChange={e=>update("message",e.target.value)} placeholder="Introduce yourself..."/>
              </div>
              <button onClick={()=>setStep(2)} style={{background:"var(--gold)",color:"#fff",border:"none",borderRadius:10,padding:"11px",fontSize:13,cursor:"pointer",fontWeight:600}}>Continue</button>
            </div>
          )}

          {step===2&&(
            <div style={{display:"flex",flexDirection:"column",gap:11}}>
              <div style={{background:"var(--warm)",borderRadius:8,padding:"10px 13px",fontSize:12,color:"#555",lineHeight:1.7}}>Contingencies protect you. Keeping them gives you an exit if something goes wrong.</div>
              {[
                {key:"financing_contingency",label:"Financing Contingency",desc:"Protects you if your loan falls through."},
                {key:"inspection_contingency",label:"Inspection Contingency",desc:"Lets you negotiate or walk away after inspection."},
                {key:"appraisal_contingency",label:"Appraisal Contingency",desc:"Protects you if home appraises below offer price."},
              ].map(c=>(
                <div key={c.key} style={{background:form[c.key]?"#f0fff4":"#fff5f5",border:"1px solid "+(form[c.key]?"#9ae6b4":"#fcc"),borderRadius:10,padding:"11px 13px",display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer"}} onClick={()=>update(c.key,!form[c.key])}>
                  <div style={{width:17,height:17,borderRadius:4,background:form[c.key]?"var(--sage)":"#ddd",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                    {form[c.key]&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}
                  </div>
                  <div><div style={{fontWeight:600,fontSize:12,marginBottom:1,color:"var(--ink)"}}>{c.label}</div><div style={{fontSize:11,color:"#666"}}>{c.desc}</div></div>
                </div>
              ))}
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setStep(1)} style={{flex:1,background:"none",border:"1.5px solid var(--warm)",borderRadius:10,padding:"10px",fontSize:12,cursor:"pointer",color:"var(--ink)"}}>Back</button>
                <button onClick={()=>setStep(3)} style={{flex:2,background:"var(--gold)",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontSize:12,cursor:"pointer",fontWeight:600}}>Continue</button>
              </div>
            </div>
          )}

          {step===3&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div><label style={lbl}>Full Name</label><input style={inp} value={form.buyer_name} onChange={e=>update("buyer_name",e.target.value)}/></div>
              <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.buyer_email} onChange={e=>update("buyer_email",e.target.value)}/></div>
              <div><label style={lbl}>Phone</label><input style={inp} type="tel" value={form.buyer_phone} onChange={e=>update("buyer_phone",e.target.value)} placeholder="(555) 123-4567"/></div>
              <div style={{background:"var(--warm)",borderRadius:8,padding:"10px 13px",fontSize:11,color:"var(--ink)",lineHeight:1.7}}>
                <strong>Summary:</strong> {formatPrice(form.offer_price)} · Earnest: {formatPrice(form.earnest_money)} · Closing: {form.closing_date||"TBD"}
              </div>
              {error&&<div style={{background:"#fff5f5",border:"1px solid #fcc",borderRadius:8,padding:"9px 12px",color:"var(--rust)",fontSize:12}}>{error}</div>}
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setStep(2)} style={{flex:1,background:"none",border:"1.5px solid var(--warm)",borderRadius:10,padding:"10px",fontSize:12,cursor:"pointer",color:"var(--ink)"}}>Back</button>
                <button onClick={submit} disabled={submitting} style={{flex:2,background:submitting?"#aaa":"var(--sage)",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontSize:12,cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                  {submitting?<Spinner/>:"Submit Offer"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SignaturePad({onSign}) {
  const canvasRef=useRef(null);
  const [drawing,setDrawing]=useState(false);
  const [signed,setSigned]=useState(false);
  const getPos=(e,c)=>{const r=c.getBoundingClientRect();const cx=e.touches?e.touches[0].clientX:e.clientX;const cy=e.touches?e.touches[0].clientY:e.clientY;return{x:cx-r.left,y:cy-r.top};};
  const start=e=>{const c=canvasRef.current;const ctx=c.getContext("2d");const p=getPos(e,c);ctx.beginPath();ctx.moveTo(p.x,p.y);setDrawing(true);};
  const draw=e=>{if(!drawing)return;const c=canvasRef.current;const ctx=c.getContext("2d");const p=getPos(e,c);ctx.lineTo(p.x,p.y);ctx.strokeStyle="#1a1208";ctx.lineWidth=2;ctx.lineCap="round";ctx.stroke();setSigned(true);};
  const stop=()=>setDrawing(false);
  const clear=()=>{canvasRef.current.getContext("2d").clearRect(0,0,460,100);setSigned(false);};
  return (
    <div>
      <div style={{border:"1.5px solid var(--warm)",borderRadius:9,background:"#fff",marginBottom:6}}>
        <canvas ref={canvasRef} width={460} height={100} style={{display:"block",cursor:"crosshair",width:"100%",height:100}}
          onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}/>
      </div>
      <div style={{fontSize:10,color:"#888",marginBottom:6}}>Sign using mouse or finger</div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={clear} style={{flex:1,background:"none",border:"1.5px solid var(--warm)",borderRadius:7,padding:"6px",fontSize:11,cursor:"pointer",color:"var(--ink)"}}>Clear</button>
        <button onClick={()=>signed&&onSign(canvasRef.current.toDataURL())} disabled={!signed} style={{flex:2,background:signed?"var(--sage)":"#ccc",color:"#fff",border:"none",borderRadius:7,padding:"6px",fontSize:11,cursor:signed?"pointer":"default"}}>Apply Signature</button>
      </div>
    </div>
  );
}

function DocGenerator({templateName,offer,onClose}) {
  const [loading,setLoading]=useState(true);
  const [text,setText]=useState("");
  useEffect(()=>{
    callClaude([{role:"user",content:getContractPrompt(templateName,offer)}],2000)
      .then(t=>{setText(t);setLoading(false);})
      .catch(e=>{setText("Error: "+e.message);setLoading(false);});
  },[]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,18,8,0.65)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"var(--card)",borderRadius:18,maxWidth:560,width:"100%",maxHeight:"85vh",overflow:"auto",padding:"22px"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}>
          <h3 style={{fontSize:16,color:"var(--ink)",fontWeight:600}}>{templateName}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:17,cursor:"pointer",color:"#888"}}>✕</button>
        </div>
        {loading?(
          <div style={{textAlign:"center",padding:"36px",color:"#888"}}><Spinner dark size={24}/><br/><br/>Preparing document...<br/><span style={{fontSize:11}}>~15 seconds</span></div>
        ):(
          <>
            <div style={{background:"#fffbf0",border:"1px solid var(--warm)",borderRadius:7,padding:"8px 12px",fontSize:11,color:"var(--rust)",marginBottom:11}}>Review carefully. Consult a licensed attorney before signing.</div>
            <div style={{background:"var(--cream)",borderRadius:9,padding:"13px",fontSize:11,lineHeight:1.9,color:"#333",whiteSpace:"pre-wrap",fontFamily:"Georgia, serif",maxHeight:360,overflow:"auto",marginBottom:13}}>{text}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={onClose} style={{flex:1,background:"none",border:"1.5px solid var(--warm)",borderRadius:9,padding:"9px",fontSize:12,cursor:"pointer",color:"var(--ink)"}}>Close</button>
              <button onClick={()=>{const b=new Blob([text],{type:"text/plain"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=templateName.replace(/\s/g,"_")+".txt";a.click();}} style={{flex:2,background:"var(--gold)",color:"#fff",border:"none",borderRadius:9,padding:"9px",fontSize:12,cursor:"pointer",fontWeight:600}}>Download Document</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OfferMessages({offer,user}) {
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [sending,setSending]=useState(false);
  const [open,setOpen]=useState(false);
  const [unread,setUnread]=useState(0);
  const bottomRef=useRef(null);
  const inputRef=useRef(null);
  const channelRef=useRef(null);

  useEffect(()=>{
    if(!user)return;
    sb.from("direct_messages").select("id",{count:"exact"})
      .eq("listing_id",offer.listing_id).eq("recipient_id",user.id).eq("read",false)
      .then(({count})=>setUnread(count||0));
  },[]);

  useEffect(()=>{
    if(!open)return;
    loadMsgs();
    if(channelRef.current)sb.removeChannel(channelRef.current);
    const ch=sb.channel("offermsg-"+offer.id)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"direct_messages",filter:"listing_id=eq."+offer.listing_id},
        payload=>{
          const m=payload.new;
          if(m.user_id===m.recipient_id)return;
          const rel=(m.user_id===offer.buyer_id&&m.recipient_id===offer.seller_id)||(m.user_id===offer.seller_id&&m.recipient_id===offer.buyer_id);
          if(rel)setMsgs(prev=>prev.find(x=>x.id===m.id)?prev:[...prev,m]);
        }).subscribe();
    channelRef.current=ch;
    return()=>{if(channelRef.current)sb.removeChannel(channelRef.current);};
  },[open]);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  useEffect(()=>{if(open)setTimeout(()=>inputRef.current?.focus(),100);},[open]);

  const loadMsgs=async()=>{
    const{data}=await sb.from("direct_messages").select("*")
      .eq("listing_id",offer.listing_id)
      .or(`and(user_id.eq.${offer.buyer_id},recipient_id.eq.${offer.seller_id}),and(user_id.eq.${offer.seller_id},recipient_id.eq.${offer.buyer_id})`)
      .order("created_at",{ascending:true});
    setMsgs((data||[]).filter(m=>m.user_id!==m.recipient_id));
    setUnread(0);
    await sb.from("direct_messages").update({read:true}).eq("listing_id",offer.listing_id).eq("recipient_id",user.id).eq("read",false);
  };

  const send=async()=>{
    if(!input.trim()||!user)return;
    if(user.id===offer.buyer_id&&user.id===offer.seller_id)return;
    const recipientId=user.id===offer.buyer_id?offer.seller_id:offer.buyer_id;
    const recipientName=user.id===offer.buyer_id?(offer.listings?.seller_name||"Seller"):offer.buyer_name;
    const recipientEmail=user.id===offer.buyer_id?(offer.listings?.seller_email||""):offer.buyer_email;
    setSending(true);
    const body=input.trim();setInput("");
    const{data,error}=await sb.from("direct_messages").insert([{
      listing_id:offer.listing_id,user_id:user.id,recipient_id:recipientId,
      sender_name:user.user_metadata?.full_name||user.email,
      recipient_name:recipientName,body,read:false,
    }]).select();
    if(!error&&data?.[0]){
      setMsgs(prev=>prev.find(m=>m.id===data[0].id)?prev:[...prev,data[0]]);
      await sendNotification(recipientId,"New message about "+(offer.listings?.address||"your transaction"),"messages");
      await sendEmail(
        recipientEmail,
        "💬 New message from "+(user.user_metadata?.full_name||user.email)+" — DirectDeed",
        emailTemplate(
          (user.user_metadata?.full_name||"Someone")+" sent you a message",
          `<div style="background:#f5f0e8;border-radius:8px;padding:12px;font-size:15px;margin-bottom:12px">${body}</div>About: <strong>${offer.listings?.address||"your listing"}</strong>`,
          "Reply on DirectDeed"
        )
      );
    }
    setSending(false);
  };

  const otherName=user?.id===offer.buyer_id?(offer.listings?.seller_name||"Seller"):offer.buyer_name;

  return (
    <div style={{marginTop:10,borderTop:"1px solid var(--warm)",paddingTop:10}}>
      <button onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",gap:7,background:open?"var(--sage)":"var(--warm)",color:open?"#fff":"var(--ink)",border:"none",borderRadius:18,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:600,position:"relative"}}>
        💬 {open?"Hide chat":"Chat with"} {otherName}
        {unread>0&&!open&&<span style={{background:"var(--rust)",color:"#fff",borderRadius:"50%",width:15,height:15,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{unread}</span>}
      </button>
      {open&&(
        <div style={{marginTop:9,borderRadius:12,overflow:"hidden",border:"1px solid var(--warm)",animation:"fadeIn 0.2s ease"}}>
          <div style={{background:"var(--sage)",padding:"9px 14px",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700}}>{otherName[0]?.toUpperCase()}</div>
            <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{otherName}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.65)",marginLeft:"auto"}}>{offer.listings?.address}</div>
          </div>
          <div style={{background:"var(--msg-bg)",maxHeight:200,overflow:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:5}}>
            {msgs.length===0&&<div style={{textAlign:"center",color:"#aaa",fontSize:12,padding:"14px 0"}}>No messages yet — start the conversation.</div>}
            {msgs.map((m,i)=>{
              const isMe=m.user_id===user.id;
              return (
                <div key={m.id||i} className="msg-bubble" style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"78%",background:isMe?"var(--msg-sent)":"var(--msg-recv)",color:isMe?"#fff":"var(--ink)",borderRadius:isMe?"16px 16px 3px 16px":"16px 16px 16px 3px",padding:"8px 12px",fontSize:13,lineHeight:1.5,boxShadow:"0 1px 2px rgba(0,0,0,0.08)"}}>
                    {m.body}
                    <div style={{fontSize:9,color:isMe?"rgba(255,255,255,0.5)":"#bbb",marginTop:2,textAlign:"right"}}>{formatTime(m.created_at)}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef}/>
          </div>
          <div style={{background:"#fff",padding:"8px 10px",borderTop:"1px solid var(--warm)",display:"flex",gap:8,alignItems:"flex-end"}}>
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
              placeholder="Type a message..." rows={1}
              style={{flex:1,padding:"9px 14px",borderRadius:22,border:"1.5px solid #e0e0e0",background:"var(--msg-bg)",fontSize:14,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.5,color:"var(--ink)",overflowY:"auto",maxHeight:80}}
              onFocus={e=>e.target.style.borderColor="var(--sage)"}
              onBlur={e=>e.target.style.borderColor="#e0e0e0"}/>
            <button onClick={send} disabled={sending||!input.trim()}
              style={{background:input.trim()?"var(--sage)":"#ddd",color:"#fff",border:"none",borderRadius:"50%",width:36,height:36,cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,transition:"background 0.15s"}}>
              {sending?<Spinner size={14}/>:"↑"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepCard({step,offer,user,onUpdate,isExpanded,onToggle}) {
  const isSeller=user?.id===offer.seller_id;
  const isBuyer=user?.id===offer.buyer_id;
  const isCompleted=offer.step_index>step.id;
  const isLocked=offer.step_index<step.id;
  const isMyTurn=(step.owner==="buyer"&&isBuyer)||(step.owner==="seller"&&isSeller)||step.owner==="both";
  const [loading,setLoading]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [uploadedFile,setUploadedFile]=useState(null);
  const [note,setNote]=useState("");
  const [buyerSigned,setBuyerSigned]=useState(false);
  const [sellerSigned,setSellerSigned]=useState(false);
  const [showCounter,setShowCounter]=useState(false);
  const [activeDoc,setActiveDoc]=useState(null);
  const [counterForm,setCounterForm]=useState({counter_price:"",counter_closing_date:"",counter_message:""});
  const inp={width:"100%",padding:"8px 12px",borderRadius:8,border:"1.5px solid var(--warm)",background:"#fff",fontSize:12,outline:"none",color:"var(--ink)"};

  const needsDoc=!!step.requiresDoc&&isMyTurn;
  const canAdvance=!needsDoc||!!uploadedFile;

  const uploadDoc=async file=>{
    setUploading(true);
    const ext=file.name.split(".").pop();
    const path="offers/"+offer.id+"/"+step.key+"-"+Date.now()+"."+ext;
    const{error}=await sb.storage.from("property-photos").upload(path,file,{contentType:file.type});
    if(!error){
      const{data:{publicUrl}}=sb.storage.from("property-photos").getPublicUrl(path);
      setUploadedFile(publicUrl);
    }
    setUploading(false);
  };

  const advance=async()=>{
    setLoading(true);
    const nextIndex=Math.min(offer.step_index+1,TRANSACTION_STEPS.length);
    const nextStep=TRANSACTION_STEPS[nextIndex-1];
    const updates={step_index:nextIndex,step:nextStep?.key||"closing"};
    if(uploadedFile)updates["step_"+step.key+"_doc"]=uploadedFile;
    const{error}=await sb.from("offers").update(updates).eq("id",offer.id);
    if(!error){
      const otherId=isSeller?offer.buyer_id:offer.seller_id;
      const otherEmail=isSeller?offer.buyer_email:offer.listings?.seller_email;
      const otherName=isSeller?offer.buyer_name:offer.listings?.seller_name;
      await sendNotification(otherId,step.label+" complete. Next: "+nextStep?.label,"offers");
      await sendEmail(
        otherEmail,
        "📋 Transaction Update: "+step.label+" Complete — DirectDeed",
        emailTemplate(
          step.label+" has been completed",
          `The next step is <strong>${nextStep?.label}</strong>.<br/><br/>Property: ${offer.listings?.address||""}<br/><br/>Log in to take action on your next step.`,
          "View Transaction"
        )
      );
      onUpdate({...offer,...updates});
    }
    setLoading(false);
  };

  const respondToOffer=async status=>{
    setLoading(true);
    const updates={status};
    if(status==="accepted"){updates.step="preapproval";updates.step_index=2;}
    const{error}=await sb.from("offers").update(updates).eq("id",offer.id);
    if(!error){
      const msg=status==="accepted"?"Your offer was accepted! Upload pre-approval to continue.":"Your offer was declined.";
      await sendNotification(offer.buyer_id,msg,"offers");
      await sendEmail(
        offer.buyer_email,
        status==="accepted"?"✅ Your offer was accepted! — DirectDeed":"❌ Offer update — DirectDeed",
        emailTemplate(
          status==="accepted"?"Your offer was accepted!":"Your offer was declined",
          status==="accepted"
            ?`Great news! Your offer on <strong>${offer.listings?.address||"the property"}</strong> was accepted.<br/><br/>Next step: Upload your mortgage pre-approval or proof of funds to continue.`
            :`Your offer on <strong>${offer.listings?.address||"the property"}</strong> was declined by the seller.`,
          status==="accepted"?"Continue Transaction":"Browse More Homes"
        )
      );
      onUpdate({...offer,...updates});
    }
    setLoading(false);
  };

  const submitCounter=async()=>{
    setLoading(true);
    const updates={status:"countered",counter_price:Number(counterForm.counter_price)||null,counter_closing_date:counterForm.counter_closing_date||null,counter_message:counterForm.counter_message};
    const{error}=await sb.from("offers").update(updates).eq("id",offer.id);
    if(!error){
      await sendNotification(offer.buyer_id,"The seller countered your offer.","offers");
      await sendEmail(
        offer.buyer_email,
        "🔄 Counteroffer received — DirectDeed",
        emailTemplate(
          "The seller sent a counteroffer",
          `${counterForm.counter_price?`Counter price: <strong>${formatPrice(counterForm.counter_price)}</strong><br/>`:""}${counterForm.counter_closing_date?`Counter closing: <strong>${counterForm.counter_closing_date}</strong><br/>`:""}${counterForm.counter_message?`<br/>Message: "${counterForm.counter_message}"`:""}`,
          "View & Respond"
        )
      );
      onUpdate({...offer,...updates});setShowCounter(false);
    }
    setLoading(false);
  };

  const acceptCounter=async()=>{
    setLoading(true);
    const updates={status:"accepted",offer_price:offer.counter_price||offer.offer_price,closing_date:offer.counter_closing_date||offer.closing_date,step:"preapproval",step_index:2,counter_price:null,counter_closing_date:null,counter_message:null};
    const{error}=await sb.from("offers").update(updates).eq("id",offer.id);
    if(!error){
      await sendNotification(offer.seller_id,"Buyer accepted your counter. Next: pre-approval.","offers");
      await sendEmail(
        offer.listings?.seller_email,
        "✅ Counter accepted — DirectDeed",
        emailTemplate(
          "The buyer accepted your counteroffer!",
          `The buyer has accepted your counter on <strong>${offer.listings?.address||"the property"}</strong>.<br/><br/>Next step: The buyer will upload their pre-approval or proof of funds.`,
          "View Transaction"
        )
      );
      onUpdate({...offer,...updates});
    }
    setLoading(false);
  };

  const handleClosing=async()=>{
    setLoading(true);
    const myField=isBuyer?"step_closing_buyer_signed":"step_closing_seller_signed";
    await sb.from("offers").update({[myField]:true}).eq("id",offer.id);
    const{data:fresh}=await sb.from("offers").select("step_closing_buyer_signed,step_closing_seller_signed").eq("id",offer.id).single();
    const buyerDone=isBuyer?true:fresh?.step_closing_buyer_signed;
    const sellerDone=isSeller?true:fresh?.step_closing_seller_signed;
    if(buyerDone&&sellerDone){
      await sb.from("offers").update({status:"closed",step_index:10}).eq("id",offer.id);
      const{error:soldErr}=await sb.from("listings").update({sold:true,sold_at:new Date().toISOString()}).eq("id",offer.listing_id);
      if(soldErr)console.error("Sold error:",soldErr);
      const otherId=isSeller?offer.buyer_id:offer.seller_id;
      const otherEmail=isSeller?offer.buyer_email:offer.listings?.seller_email;
      await sendNotification(otherId,"🎉 Transaction complete! Congratulations!","offers");
      await sendEmail(
        otherEmail,
        "🎉 Transaction Complete — DirectDeed",
        emailTemplate(
          "Congratulations! Transaction complete!",
          `The sale of <strong>${offer.listings?.address||"the property"}</strong> has been completed. Both parties have signed the closing documents.<br/><br/>Thank you for using DirectDeed!`,
          "View Completed Transaction"
        )
      );
      onUpdate({...offer,[myField]:true,status:"closed",step_index:10});
    } else {
      const otherId=isSeller?offer.buyer_id:offer.seller_id;
      const otherEmail=isSeller?offer.buyer_email:offer.listings?.seller_email;
      await sendNotification(otherId,(isBuyer?"Buyer":"Seller")+" has signed closing documents. Your signature is needed.","offers");
      await sendEmail(
        otherEmail,
        "✍️ Signature needed for closing — DirectDeed",
        emailTemplate(
          "Your signature is needed to close",
          `${isBuyer?"The buyer":"The seller"} has signed the closing documents for <strong>${offer.listings?.address||"the property"}</strong>.<br/><br/>Please log in and add your signature to complete the transaction.`,
          "Sign & Complete"
        )
      );
      onUpdate({...offer,[myField]:true});
    }
    setLoading(false);
  };

  if(isCompleted) return (
    <div style={{background:"#f0fff4",border:"1px solid #9ae6b4",borderRadius:10,marginBottom:6,overflow:"hidden"}}>
      <div onClick={onToggle} style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
        <span style={{fontSize:15}}>{step.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:600,fontSize:12,color:"var(--sage)"}}>Step {step.id}: {step.label}</div>
          <div style={{fontSize:10,color:"var(--sage)"}}>Completed ✓ — {isExpanded?"tap to collapse":"tap to review"}</div>
        </div>
        <span style={{color:"var(--sage)",fontSize:11}}>{isExpanded?"▲":"▼"}</span>
      </div>
      {isExpanded&&(
        <div style={{padding:"0 14px 11px",borderTop:"1px solid #9ae6b4"}}>
          <div style={{background:"rgba(255,255,255,0.7)",borderRadius:7,padding:"8px 11px",marginTop:8,fontSize:11,color:"#444",lineHeight:1.7}}>
            <strong>Summary:</strong> {step.desc}<br/>
            {offer["step_"+step.key+"_doc"]&&<><strong>Document:</strong> <a href={offer["step_"+step.key+"_doc"]} target="_blank" rel="noopener noreferrer" style={{color:"var(--gold)"}}>View ↗</a></>}
          </div>
          {step.relatedDocs?.length>0&&(
            <div style={{marginTop:8,display:"flex",gap:5,flexWrap:"wrap"}}>
              {step.relatedDocs.map(d=><button key={d} onClick={()=>setActiveDoc(d)} style={{background:"var(--warm)",border:"none",borderRadius:6,padding:"3px 8px",fontSize:10,cursor:"pointer",color:"var(--ink)"}}>📋 {d}</button>)}
            </div>
          )}
        </div>
      )}
      {activeDoc&&<DocGenerator templateName={activeDoc} offer={offer} onClose={()=>setActiveDoc(null)}/>}
    </div>
  );

  if(isLocked) return (
    <div style={{background:"var(--card)",border:"1px solid var(--warm)",borderRadius:10,padding:"10px 14px",marginBottom:6,opacity:0.4}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:14}}>{step.icon}</span>
        <div style={{flex:1}}><div style={{fontWeight:500,fontSize:12,color:"var(--ink)"}}>Step {step.id}: {step.label}</div><div style={{fontSize:10,color:"#aaa"}}>Complete previous steps first</div></div>
        <span style={{fontSize:12}}>🔒</span>
      </div>
    </div>
  );

  return (
    <div style={{background:"var(--card)",border:"2px solid var(--gold)",borderRadius:12,padding:"15px",marginBottom:9,animation:"fadeIn 0.3s ease"}}>
      {activeDoc&&<DocGenerator templateName={activeDoc} offer={offer} onClose={()=>setActiveDoc(null)}/>}
      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}>
        <span style={{fontSize:20}}>{step.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:13,color:"var(--ink)"}}>Step {step.id}: {step.label}</div>
          <div style={{fontSize:11,color:"#666"}}>{step.desc}</div>
        </div>
        {isMyTurn?<span style={{background:"var(--gold)",color:"#fff",fontSize:8,padding:"2px 7px",borderRadius:8,fontWeight:700}}>YOUR TURN</span>
                 :<span style={{background:"#eee",color:"#777",fontSize:8,padding:"2px 7px",borderRadius:8,fontWeight:700}}>WAITING</span>}
      </div>

      <div style={{background:"var(--cream)",borderRadius:7,padding:"9px 12px",marginBottom:10,fontSize:12,color:"var(--ink)",lineHeight:1.7,border:"1px solid var(--warm)"}}>
        {isBuyer?step.buyerAction:step.sellerAction}
      </div>

      {step.key==="preapproval"&&isBuyer&&(
        <div style={{background:"#f0f6ff",border:"1px solid #90c0f0",borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:11,color:"#444",lineHeight:1.8}}>
          <strong style={{color:"#1d4ed8"}}>🏦 What to Upload</strong><br/>
          <strong>Mortgage:</strong> Pre-approval letter from your lender.<br/>
          <strong>Cash:</strong> Bank statement or proof of funds letter.
        </div>
      )}
      {step.key==="earnest"&&isBuyer&&(
        <div style={{background:"#fffbf0",border:"1px solid #f0d080",borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:11,color:"#555",lineHeight:1.8}}>
          <strong style={{color:"var(--gold)"}}>💰 How to Deposit</strong><br/>
          1. Find a title company or real estate attorney in the property's state.<br/>
          2. Contact them with address, price, and both party names.<br/>
          3. Wire funds — <strong style={{color:"var(--rust)"}}>never directly to the seller.</strong><br/>
          4. Upload your wire receipt below.
        </div>
      )}
      {step.key==="title"&&isSeller&&(
        <div style={{background:"#f5f0ff",border:"1px solid #c0a0f0",borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:11,color:"#444",lineHeight:1.8}}>
          <strong style={{color:"#6d28d9"}}>📜 Clearing Title</strong><br/>
          1. Contact a title company to order a title search.<br/>
          2. Resolve any liens, unpaid mortgages, or judgments.<br/>
          3. Title insurance will be issued to the buyer.<br/>
          4. Upload clearance confirmation below.
        </div>
      )}

      {step.key==="offer"&&offer.status==="pending"&&isSeller&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
            {[["Offer",formatPrice(offer.offer_price),"var(--gold)"],["Earnest",formatPrice(offer.earnest_money),"var(--ink)"],["Closing",offer.closing_date||"TBD","var(--ink)"]].map(([l,v,c])=>(
              <div key={l} style={{background:"var(--warm)",borderRadius:7,padding:"8px",textAlign:"center"}}>
                <div style={{fontSize:8,color:"#666",textTransform:"uppercase",marginBottom:2}}>{l}</div>
                <div style={{fontSize:13,fontWeight:700,color:c}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:"#666"}}>Contingencies: {[offer.financing_contingency&&"Financing",offer.inspection_contingency&&"Inspection",offer.appraisal_contingency&&"Appraisal"].filter(Boolean).join(", ")||"None"}</div>
          {offer.message&&<div style={{background:"var(--cream)",borderRadius:7,padding:"8px 10px",fontSize:11,color:"#555",fontStyle:"italic",border:"1px solid var(--warm)"}}>"{offer.message}"</div>}
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>respondToOffer("accepted")} disabled={loading} style={{flex:2,background:"var(--sage)",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:12,cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>{loading?<Spinner size={13}/>:"Accept Offer"}</button>
            <button onClick={()=>setShowCounter(!showCounter)} style={{flex:1,background:"var(--gold)",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:11,cursor:"pointer",fontWeight:600}}>Counter</button>
            <button onClick={()=>respondToOffer("declined")} disabled={loading} style={{flex:1,background:"#fff5f5",color:"var(--rust)",border:"1px solid #fcc",borderRadius:8,padding:"9px",fontSize:11,cursor:"pointer"}}>Decline</button>
          </div>
          {showCounter&&(
            <div style={{background:"var(--cream)",borderRadius:9,padding:"12px",border:"1px solid var(--warm)"}}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:8,color:"var(--ink)"}}>Your Counteroffer</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div><label style={{display:"block",fontSize:10,color:"#555",marginBottom:2}}>Counter Price (blank = keep original)</label><input style={inp} type="number" value={counterForm.counter_price} onChange={e=>setCounterForm(f=>({...f,counter_price:e.target.value}))} placeholder={offer.offer_price}/></div>
                <div><label style={{display:"block",fontSize:10,color:"#555",marginBottom:2}}>Counter Closing Date</label><input style={inp} type="date" value={counterForm.counter_closing_date} onChange={e=>setCounterForm(f=>({...f,counter_closing_date:e.target.value}))}/></div>
                <div><label style={{display:"block",fontSize:10,color:"#555",marginBottom:2}}>Message</label><textarea style={{...inp,minHeight:50,resize:"vertical"}} value={counterForm.counter_message} onChange={e=>setCounterForm(f=>({...f,counter_message:e.target.value}))} placeholder="Explain your counter..."/></div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setShowCounter(false)} style={{flex:1,background:"none",border:"1.5px solid var(--warm)",borderRadius:7,padding:"7px",fontSize:11,cursor:"pointer",color:"var(--ink)"}}>Cancel</button>
                  <button onClick={submitCounter} disabled={loading} style={{flex:2,background:"var(--rust)",color:"#fff",border:"none",borderRadius:7,padding:"7px",fontSize:11,cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>{loading?<Spinner size={12}/>:"Send Counter"}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step.key==="offer"&&offer.status==="pending"&&isBuyer&&(
        <div style={{background:"var(--cream)",borderRadius:7,padding:"10px",fontSize:12,color:"#555",textAlign:"center",border:"1px solid var(--warm)"}}>
          Waiting for the seller to respond...
          <div style={{marginTop:6,display:"flex",justifyContent:"center",gap:4}}>
            {[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:"var(--gold)",animation:"pulse 1.4s "+(i*0.2)+"s infinite"}}/>)}
          </div>
        </div>
      )}

      {step.key==="offer"&&offer.status==="countered"&&isBuyer&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{background:"#fff8f0",border:"1px solid #fcd",borderRadius:9,padding:"10px 12px"}}>
            <div style={{fontWeight:700,marginBottom:5,color:"var(--rust)",fontSize:12}}>Counteroffer Received</div>
            {offer.counter_price&&<div style={{fontSize:12,marginBottom:2}}>Counter Price: <strong>{formatPrice(offer.counter_price)}</strong></div>}
            {offer.counter_closing_date&&<div style={{fontSize:12,marginBottom:2}}>Counter Closing: <strong>{offer.counter_closing_date}</strong></div>}
            {offer.counter_message&&<div style={{fontSize:11,color:"#555",fontStyle:"italic",marginTop:4}}>"{offer.counter_message}"</div>}
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={acceptCounter} disabled={loading} style={{flex:2,background:"var(--sage)",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:12,cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>{loading?<Spinner size={13}/>:"Accept Counter"}</button>
            <button onClick={()=>respondToOffer("declined")} disabled={loading} style={{flex:1,background:"#fff5f5",color:"var(--rust)",border:"1px solid #fcc",borderRadius:8,padding:"9px",fontSize:11,cursor:"pointer"}}>Decline</button>
          </div>
        </div>
      )}
      {step.key==="offer"&&offer.status==="countered"&&isSeller&&(
        <div style={{background:"var(--cream)",borderRadius:7,padding:"10px",fontSize:12,color:"#555",textAlign:"center",border:"1px solid var(--warm)"}}>Waiting for buyer to respond to your counter...</div>
      )}

      {step.key==="closing"&&(
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {[["Buyer",offer.step_closing_buyer_signed],["Seller",offer.step_closing_seller_signed]].map(([role,sig])=>(
              <div key={role} style={{background:sig?"#f0fff4":"var(--cream)",border:"1px solid "+(sig?"#9ae6b4":"var(--warm)"),borderRadius:8,padding:"9px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#666",marginBottom:3,textTransform:"uppercase"}}>{role}</div>
                <div style={{fontSize:12,fontWeight:600,color:sig?"var(--sage)":"#bbb"}}>{sig?"✓ Signed":"Awaiting"}</div>
              </div>
            ))}
          </div>
          {isMyTurn&&!(isBuyer?offer.step_closing_buyer_signed:offer.step_closing_seller_signed)&&(
            <>
              <div style={{fontSize:11,color:"#555"}}>Sign below to complete your portion:</div>
              <SignaturePad onSign={isBuyer?()=>setBuyerSigned(true):()=>setSellerSigned(true)}/>
              {((isBuyer&&buyerSigned)||(isSeller&&sellerSigned))&&(
                <button onClick={handleClosing} disabled={loading} style={{background:"var(--sage)",color:"#fff",border:"none",borderRadius:9,padding:"11px",fontSize:13,cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                  {loading?<Spinner/>:"Submit My Signature"}
                </button>
              )}
            </>
          )}
          {(isBuyer?offer.step_closing_buyer_signed:offer.step_closing_seller_signed)&&(
            <div style={{background:"#f0fff4",border:"1px solid #9ae6b4",borderRadius:7,padding:"9px 12px",fontSize:12,color:"var(--sage)",fontWeight:500}}>✓ You have signed. Waiting for the other party.</div>
          )}
        </div>
      )}

      {step.key!=="offer"&&step.key!=="closing"&&isMyTurn&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <label style={{display:"flex",alignItems:"center",gap:8,border:"1.5px dashed "+(uploadedFile?"var(--sage)":needsDoc?"var(--gold)":"var(--warm)"),borderRadius:9,padding:"9px 12px",cursor:"pointer",background:uploadedFile?"#f0fff4":"#fff"}}>
            <span style={{fontSize:16}}>📎</span>
            <div>
              <div style={{fontSize:12,color:uploadedFile?"var(--sage)":"#555",fontWeight:uploadedFile?600:400}}>
                {uploading?"Uploading...":uploadedFile?"✓ Document uploaded":needsDoc?"Upload required to advance":"Upload document (optional)"}
              </div>
              {needsDoc&&!uploadedFile&&<div style={{fontSize:10,color:"var(--gold)",marginTop:1}}>Required for this step</div>}
            </div>
            <input type="file" style={{display:"none"}} onChange={e=>e.target.files[0]&&uploadDoc(e.target.files[0])}/>
          </label>
          {step.relatedDocs?.length>0&&(
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {step.relatedDocs.map(d=><button key={d} onClick={()=>setActiveDoc(d)} style={{background:"var(--warm)",border:"none",borderRadius:6,padding:"4px 8px",fontSize:10,cursor:"pointer",color:"var(--ink)"}}>📋 {d}</button>)}
            </div>
          )}
          <textarea style={{...inp,minHeight:44,resize:"vertical",fontSize:11}} value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note for the other party (optional)..."/>
          <button onClick={advance} disabled={loading||!canAdvance}
            style={{background:loading?"#aaa":!canAdvance?"#ddd":"var(--sage)",color:"#fff",border:"none",borderRadius:9,padding:"11px",fontSize:13,cursor:canAdvance&&!loading?"pointer":"default",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
            {loading?<Spinner/>:!canAdvance?"Upload document to continue":"Mark Complete & Continue →"}
          </button>
        </div>
      )}
      {step.key!=="offer"&&step.key!=="closing"&&!isMyTurn&&(
        <div style={{background:"var(--cream)",borderRadius:7,padding:"10px",fontSize:12,color:"#555",textAlign:"center",border:"1px solid var(--warm)"}}>
          Waiting for {step.owner==="buyer"?"buyer":"seller"} to complete this step...
          <div style={{marginTop:6,display:"flex",justifyContent:"center",gap:4}}>
            {[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:"var(--gold)",animation:"pulse 1.4s "+(i*0.2)+"s infinite"}}/>)}
          </div>
        </div>
      )}
      <OfferMessages offer={offer} user={user}/>
    </div>
  );
}
function OffersTab({user,onRequireAuth}) {
  const [offers,setOffers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [activeOffer,setActiveOffer]=useState(null);
  const [expandedSteps,setExpandedSteps]=useState({});
  const [unreadCount,setUnreadCount]=useState(0);

  useEffect(()=>{
    if(!user){setLoading(false);return;}
    loadOffers();loadUnread();
  },[user]);

  const loadOffers=async()=>{
    const{data}=await sb.from("offers")
      .select("*, listings(address,city,state,zip,seller_name,price,user_id,seller_email)")
      .or("buyer_id.eq."+user.id+",seller_id.eq."+user.id)
      .order("created_at",{ascending:false});
    setOffers(data||[]);setLoading(false);
  };

  const loadUnread=async()=>{
    const{count}=await sb.from("notifications").select("id",{count:"exact"}).eq("user_id",user.id).eq("read",false);
    setUnreadCount(count||0);
  };

  useEffect(()=>{
    if(!user)return;
    const sub=sb.channel("offer-notifs-"+user.id)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:"user_id=eq."+user.id},
        ()=>{loadUnread();loadOffers();})
      .subscribe();
    return()=>sb.removeChannel(sub);
  },[user?.id]);

  const updateOffer=updated=>{
    setOffers(prev=>prev.map(o=>o.id===updated.id?{...o,...updated}:o));
    if(activeOffer?.id===updated.id)setActiveOffer(prev=>({...prev,...updated}));
  };

  const markRead=async()=>{
    await sb.from("notifications").update({read:true}).eq("user_id",user.id).eq("read",false);
    setUnreadCount(0);
  };

  if(!user) return (
    <div style={{maxWidth:440,margin:"80px auto",textAlign:"center",padding:"0 24px"}}>
      <div style={{fontSize:44,marginBottom:12}}>📋</div>
      <h2 style={{fontSize:26,marginBottom:9,color:"var(--ink)"}}>Your Offers</h2>
      <p style={{color:"#666",lineHeight:1.7,marginBottom:22,fontSize:13}}>Sign in to view and manage your offers.</p>
      <button onClick={onRequireAuth} style={{background:"var(--sage)",color:"#fff",border:"none",borderRadius:12,padding:"12px 26px",fontSize:14,cursor:"pointer",fontWeight:600}}>Sign In</button>
    </div>
  );

  if(activeOffer){
    const stepIndex=Math.min(activeOffer.step_index||1,TRANSACTION_STEPS.length);
    const isClosed=activeOffer.status==="closed";
    return (
      <div style={{maxWidth:660,margin:"0 auto",padding:"20px 16px"}}>
        <button onClick={()=>{setActiveOffer(null);markRead();}} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:12,marginBottom:12,display:"flex",alignItems:"center",gap:4}}>← Back to Offers</button>

        <div style={{background:"var(--card)",border:"1px solid var(--warm)",borderRadius:14,padding:"15px 18px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11}}>
            <div>
              <div style={{fontSize:17,fontWeight:700,marginBottom:2,color:"var(--ink)"}}>{activeOffer.listings?.address}</div>
              <div style={{fontSize:11,color:"#666"}}>{activeOffer.listings?.city}, {activeOffer.listings?.state} {activeOffer.listings?.zip}</div>
            </div>
            <span style={{background:isClosed?"var(--sage)":activeOffer.status==="accepted"?"var(--sage)":activeOffer.status==="declined"?"#aaa":activeOffer.status==="countered"?"var(--rust)":"var(--gold)",color:"#fff",fontSize:9,fontWeight:700,padding:"3px 9px",borderRadius:12,textTransform:"uppercase"}}>
              {isClosed?"Closed":activeOffer.status}
            </span>
          </div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {[["Offer",formatPrice(activeOffer.offer_price),"var(--gold)"],["Earnest",formatPrice(activeOffer.earnest_money),"var(--ink)"],["Closing",activeOffer.closing_date||"TBD","var(--ink)"],["Contingencies",[activeOffer.financing_contingency&&"Fin.",activeOffer.inspection_contingency&&"Insp.",activeOffer.appraisal_contingency&&"Appr."].filter(Boolean).join(" · ")||"None","#666"]].map(([l,v,c])=>(
              <div key={l} style={{background:"var(--warm)",borderRadius:7,padding:"7px 10px",flex:1,minWidth:75}}>
                <div style={{fontSize:8,color:"#777",textTransform:"uppercase",marginBottom:2}}>{l}</div>
                <div style={{fontSize:11,fontWeight:700,color:c}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{overflowX:"auto",marginBottom:14,paddingBottom:3}}>
          <div style={{display:"flex",minWidth:500}}>
            {TRANSACTION_STEPS.map((s,i)=>(
              <div key={s.id} style={{display:"flex",alignItems:"center",flexShrink:0}}>
                <div style={{textAlign:"center",width:48}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:stepIndex>s.id?"var(--sage)":stepIndex===s.id?"var(--gold)":"var(--warm)",color:stepIndex>=s.id?"#fff":"#aaa",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 2px",fontSize:10}}>
                    {stepIndex>s.id?"✓":s.icon}
                  </div>
                  <div style={{fontSize:6.5,color:stepIndex===s.id?"var(--gold)":"#aaa",lineHeight:1.2,fontWeight:stepIndex===s.id?700:400}}>{s.label}</div>
                </div>
                {i<TRANSACTION_STEPS.length-1&&<div style={{width:9,height:2,background:stepIndex>s.id?"var(--sage)":"var(--warm)",flexShrink:0,marginBottom:13}}/>}
              </div>
            ))}
          </div>
        </div>

        {activeOffer.status==="declined"&&<div style={{background:"#fff5f5",border:"1px solid #fcc",borderRadius:10,padding:"14px",textAlign:"center",color:"var(--rust)",marginBottom:12}}>This offer was declined.</div>}

        {isClosed&&(
          <div style={{background:"linear-gradient(135deg,var(--sage),#3a5530)",color:"#fff",borderRadius:14,padding:"20px",textAlign:"center",marginBottom:12}}>
            <div style={{fontSize:32,marginBottom:7}}>🎉</div>
            <div style={{fontSize:18,fontWeight:700,marginBottom:3}}>Transaction Complete!</div>
            <div style={{fontSize:12,opacity:0.85}}>Congratulations — the property has been sold.</div>
          </div>
        )}

        {activeOffer.status!=="declined"&&TRANSACTION_STEPS.map(step=>(
          <StepCard key={step.id} step={step} offer={activeOffer} user={user} onUpdate={updateOffer}
            isExpanded={!!expandedSteps[step.id]} onToggle={()=>setExpandedSteps(p=>({...p,[step.id]:!p[step.id]}))}/>
        ))}
      </div>
    );
  }

  const buyerOffers=offers.filter(o=>o.buyer_id===user.id);
  const sellerOffers=offers.filter(o=>o.seller_id===user.id);

  const OfferRow=({o})=>{
    const si=Math.min(o.step_index||1,TRANSACTION_STEPS.length);
    const cur=TRANSACTION_STEPS.find(s=>s.id===si);
    const needsAction=o.status!=="declined"&&o.status!=="closed"&&(
      (cur?.owner==="buyer"&&o.buyer_id===user.id)||(cur?.owner==="seller"&&o.seller_id===user.id)||cur?.owner==="both"
    );
    return (
      <div onClick={()=>{setActiveOffer(o);markRead();}}
        style={{background:"var(--card)",border:"1.5px solid "+(needsAction?"var(--gold)":"var(--warm)"),borderRadius:11,padding:"13px 16px",marginBottom:9,cursor:"pointer",transition:"all 0.15s",position:"relative"}}
        onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"}
        onMouseLeave={e=>e.currentTarget.style.transform="none"}>
        {needsAction&&<div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"var(--gold)",borderRadius:"11px 11px 0 0"}}/>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:2,color:"var(--ink)"}}>{o.listings?.address}</div>
            <div style={{fontSize:11,color:"#999",marginBottom:4}}>{o.listings?.city}, {o.listings?.state} {o.listings?.zip}</div>
            <div style={{fontSize:12,color:"#555",marginBottom:2}}>
              {o.buyer_id===user.id?formatPrice(o.offer_price):o.buyer_name+" — "+formatPrice(o.offer_price)}
              {o.closing_date&&<span style={{color:"#aaa",marginLeft:7,fontSize:10}}>· Closing: {o.closing_date}</span>}
            </div>
            <div style={{fontSize:10,color:needsAction?"var(--gold)":"#bbb",fontWeight:needsAction?700:400}}>
              {needsAction?"⚡ Action needed — ":""}{cur?.label} (Step {si}/{TRANSACTION_STEPS.length})
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
            <span style={{background:o.status==="closed"||o.status==="accepted"?"var(--sage)":o.status==="declined"?"#aaa":o.status==="countered"?"var(--rust)":"var(--gold)",color:"#fff",fontSize:8,fontWeight:700,padding:"2px 7px",borderRadius:9,textTransform:"uppercase"}}>
              {o.status==="closed"?"Closed":o.status}
            </span>
            <span style={{fontSize:10,color:"var(--gold)"}}>View →</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{maxWidth:760,margin:"0 auto",padding:"20px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div>
          <h2 style={{fontSize:24,fontWeight:700,color:"var(--ink)",marginBottom:2}}>Offers</h2>
          <p style={{color:"#666",fontSize:12}}>Track every offer through the full transaction.</p>
        </div>
        {unreadCount>0&&<div onClick={markRead} style={{background:"var(--gold)",color:"#fff",borderRadius:18,padding:"5px 13px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{unreadCount} new · Mark read</div>}
      </div>
      {loading&&<div style={{textAlign:"center",padding:"36px",color:"#888"}}>Loading...</div>}
      {!loading&&offers.length===0&&(
        <div style={{textAlign:"center",padding:"52px 24px",color:"#888",background:"var(--card)",border:"1px solid var(--warm)",borderRadius:14}}>
          <div style={{fontSize:40,marginBottom:11}}>📋</div>
          <div style={{fontSize:17,marginBottom:6,color:"var(--ink)"}}>No offers yet</div>
          <div style={{fontSize:12}}>Browse homes and make an offer, or list your home to receive offers.</div>
        </div>
      )}
      {sellerOffers.length>0&&<div style={{marginBottom:24}}><h3 style={{fontSize:14,fontWeight:700,marginBottom:9,color:"var(--ink)"}}>Offers on My Listings</h3>{sellerOffers.map(o=><OfferRow key={o.id} o={o}/>)}</div>}
      {buyerOffers.length>0&&<div><h3 style={{fontSize:14,fontWeight:700,marginBottom:9,color:"var(--ink)"}}>My Offers</h3>{buyerOffers.map(o=><OfferRow key={o.id} o={o}/>)}</div>}
    </div>
  );
}

function MessagesTab({newThread,user,onRequireAuth}) {
  const [conversations,setConversations]=useState([]);
  const [activeConv,setActiveConv]=useState(null);
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [sending,setSending]=useState(false);
  const [loading,setLoading]=useState(true);
  const [totalUnread,setTotalUnread]=useState(0);
  const [mobileView,setMobileView]=useState("list");
  const bottomRef=useRef(null);
  const inputRef=useRef(null);
  const channelRef=useRef(null);

  useEffect(()=>{
    if(!user){setLoading(false);return;}
    loadConversations();
  },[user]);

  const loadConversations=async()=>{
    const{data}=await sb.from("direct_messages")
      .select("*, listings(address,city,state,zip,seller_name,seller_email,user_id)")
      .or("user_id.eq."+user.id+",recipient_id.eq."+user.id)
      .order("created_at",{ascending:false});
    if(!data){setLoading(false);return;}
    const map={};
    let unread=0;
    data.filter(m=>m.user_id!==m.recipient_id).forEach(msg=>{
      const otherId=msg.user_id===user.id?msg.recipient_id:msg.user_id;
      const key=msg.listing_id+"-"+[msg.user_id,msg.recipient_id].sort().join("-");
      if(!map[key]){
        map[key]={
          key,listing_id:msg.listing_id,listing:msg.listings,
          other_user_id:otherId,
          other_name:msg.user_id===user.id?msg.recipient_name:msg.sender_name,
          other_email:msg.user_id===user.id?(msg.listings?.seller_email||""):user.email,
          last_message:msg.body,last_time:msg.created_at,unread:0,
        };
      }
      if(msg.recipient_id===user.id&&!msg.read){map[key].unread++;unread++;}
    });
    setTotalUnread(unread);
    setConversations(Object.values(map).sort((a,b)=>new Date(b.last_time)-new Date(a.last_time)));
    setLoading(false);
  };

  useEffect(()=>{
    if(newThread&&user&&newThread.user_id!==user.id){
      const conv={
        key:newThread.id+"-"+[user.id,newThread.user_id].sort().join("-"),
        listing_id:newThread.id,listing:newThread,
        other_user_id:newThread.user_id,other_name:newThread.seller_name,
        other_email:newThread.seller_email||"",
        last_message:"",last_time:new Date().toISOString(),unread:0,
      };
      openConv(conv);
    }
  },[newThread,user]);

  const openConv=conv=>{
    setActiveConv(conv);setMobileView("chat");
    setTimeout(()=>inputRef.current?.focus(),150);
  };

  useEffect(()=>{
    if(!activeConv||!user)return;
    loadMessages();
    if(channelRef.current)sb.removeChannel(channelRef.current);
    const ch=sb.channel("conv-"+activeConv.key)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"direct_messages",filter:"listing_id=eq."+activeConv.listing_id},
        payload=>{
          const m=payload.new;
          if(m.user_id===m.recipient_id)return;
          const rel=(m.user_id===user.id&&m.recipient_id===activeConv.other_user_id)||(m.user_id===activeConv.other_user_id&&m.recipient_id===user.id);
          if(rel)setMessages(prev=>prev.find(x=>x.id===m.id)?prev:[...prev,m]);
        }).subscribe();
    channelRef.current=ch;
    return()=>{if(channelRef.current)sb.removeChannel(channelRef.current);};
  },[activeConv?.key]);

  const loadMessages=async()=>{
    if(!activeConv||!user)return;
    const{data}=await sb.from("direct_messages").select("*")
      .eq("listing_id",activeConv.listing_id)
      .or("and(user_id.eq."+user.id+",recipient_id.eq."+activeConv.other_user_id+"),and(user_id.eq."+activeConv.other_user_id+",recipient_id.eq."+user.id+")")
      .order("created_at",{ascending:true});
    setMessages((data||[]).filter(m=>m.user_id!==m.recipient_id));
    await sb.from("direct_messages").update({read:true}).eq("listing_id",activeConv.listing_id).eq("recipient_id",user.id).eq("read",false);
    loadConversations();
  };

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const send=async()=>{
    if(!input.trim()||!activeConv||!user)return;
    if(activeConv.other_user_id===user.id)return;
    const body=input.trim();setInput("");
    setSending(true);
    try{
      const{data,error}=await sb.from("direct_messages").insert([{
        listing_id:activeConv.listing_id,user_id:user.id,
        recipient_id:activeConv.other_user_id,
        sender_name:user.user_metadata?.full_name||user.email,
        recipient_name:activeConv.other_name,body,read:false,
      }]).select();
      if(error){console.error("Send error:",error);setSending(false);return;}
      if(data?.[0]){
        setMessages(prev=>prev.find(m=>m.id===data[0].id)?prev:[...prev,data[0]]);
        await sendNotification(activeConv.other_user_id,"New message from "+(user.user_metadata?.full_name||user.email),"messages");
        if(activeConv.other_email){
          await sendEmail(
            activeConv.other_email,
            "💬 New message from "+(user.user_metadata?.full_name||user.email)+" — DirectDeed",
            emailTemplate(
              (user.user_metadata?.full_name||"Someone")+" sent you a message",
              `<div style="background:#f5f0e8;border-radius:8px;padding:12px;font-size:15px;line-height:1.6;margin-bottom:12px">${body}</div>About: <strong>${activeConv.listing?.address||"your listing"}</strong>`,
              "Reply on DirectDeed"
            )
          );
        }
        loadConversations();
      }
    }catch(e){console.error(e);}
    setSending(false);
  };

  const handleKey=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}};

  if(!user) return (
    <div style={{maxWidth:440,margin:"80px auto",textAlign:"center",padding:"0 24px"}}>
      <div style={{fontSize:44,marginBottom:12}}>💬</div>
      <h2 style={{fontSize:26,marginBottom:9,color:"var(--ink)"}}>Messages</h2>
      <p style={{color:"#666",lineHeight:1.7,marginBottom:22,fontSize:13}}>Sign in to message buyers and sellers directly.</p>
      <button onClick={onRequireAuth} style={{background:"var(--sage)",color:"#fff",border:"none",borderRadius:12,padding:"12px 26px",fontSize:14,cursor:"pointer",fontWeight:600}}>Sign In</button>
    </div>
  );

  const groupedMessages=[];
  let lastDate=null;
  messages.forEach(m=>{
    const label=formatDateLabel(m.created_at);
    if(label!==lastDate){groupedMessages.push({type:"date",label});lastDate=label;}
    groupedMessages.push({type:"msg",data:m});
  });

  const chatHeight="calc(100vh - 128px)";

  return (
    <div style={{height:chatHeight,display:"flex",overflow:"hidden",background:"var(--msg-bg)"}}>

      {/* SIDEBAR */}
      <div className={"messenger-sidebar"+(mobileView==="list"?" active":"")}
        style={{width:320,minWidth:320,background:"#fff",borderRight:"1px solid #e5e7eb",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"16px 18px 12px",borderBottom:"1px solid #f0f0f0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h2 style={{fontSize:20,fontWeight:700,color:"var(--ink)"}}>
              Messages
              {totalUnread>0&&<span style={{background:"var(--sage)",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:700,marginLeft:8}}>{totalUnread}</span>}
            </h2>
          </div>
          <input placeholder="Search conversations..." style={{width:"100%",padding:"8px 12px",borderRadius:20,border:"none",background:"var(--msg-bg)",fontSize:13,outline:"none",color:"var(--ink)"}}/>
        </div>
        <div style={{flex:1,overflow:"auto"}}>
          {loading&&<div style={{padding:24,textAlign:"center",color:"#aaa",fontSize:13}}>Loading...</div>}
          {!loading&&conversations.length===0&&(
            <div style={{padding:"40px 20px",textAlign:"center",color:"#aaa"}}>
              <div style={{fontSize:36,marginBottom:10}}>💬</div>
              <div style={{fontSize:14,color:"var(--ink)",marginBottom:5,fontWeight:600}}>No conversations yet</div>
              <div style={{fontSize:12,lineHeight:1.6}}>Tap "Message" on any listing to start talking with the seller.</div>
            </div>
          )}
          {conversations.map(conv=>{
            const isActive=activeConv?.key===conv.key;
            return (
              <div key={conv.key} onClick={()=>openConv(conv)}
                style={{padding:"12px 18px",cursor:"pointer",background:isActive?"#e8f0fe":"transparent",borderBottom:"1px solid #f5f5f5",display:"flex",alignItems:"center",gap:12,transition:"background 0.1s",position:"relative"}}
                onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background="#f8f9fa";}}
                onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background="transparent";}}>
                <div style={{width:46,height:46,borderRadius:"50%",background:isActive?"var(--sage)":"var(--warm)",display:"flex",alignItems:"center",justifyContent:"center",color:isActive?"#fff":"var(--ink)",fontWeight:700,fontSize:17,flexShrink:0,position:"relative"}}>
                  {conv.other_name?.[0]?.toUpperCase()||"?"}
                  {conv.unread>0&&<div style={{position:"absolute",top:-2,right:-2,background:"var(--rust)",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{conv.unread}</div>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:2}}>
                    <div style={{fontWeight:conv.unread>0?700:500,fontSize:14,color:"var(--ink)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:160}}>{conv.other_name}</div>
                    <div style={{fontSize:10,color:"#bbb",flexShrink:0,marginLeft:6}}>{formatTime(conv.last_time)}</div>
                  </div>
                  <div style={{fontSize:11,color:"#888",marginBottom:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{conv.listing?.address}</div>
                  <div style={{fontSize:12,color:conv.unread>0?"var(--ink)":"#bbb",fontWeight:conv.unread>0?600:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{conv.last_message||"Start a conversation"}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CHAT PANE */}
      <div className={"messenger-chat"+(mobileView==="chat"?" active":"")}
        style={{flex:1,display:"flex",flexDirection:"column",background:"var(--msg-bg)",minWidth:0}}>
        {activeConv?(
          <>
            <div style={{background:"#fff",padding:"12px 18px",borderBottom:"1px solid #e5e7eb",display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 3px rgba(0,0,0,0.05)",flexShrink:0}}>
              <button onClick={()=>setMobileView("list")} className="mobile-menu-btn" style={{background:"none",border:"none",color:"var(--ink)",fontSize:18,cursor:"pointer",padding:0,display:"none"}}>←</button>
              <div style={{width:42,height:42,borderRadius:"50%",background:"var(--sage)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:16,flexShrink:0}}>
                {activeConv.other_name?.[0]?.toUpperCase()||"?"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15,color:"var(--ink)"}}>{activeConv.other_name}</div>
                <div style={{fontSize:11,color:"#888"}}>
                  {activeConv.listing?.address}{activeConv.listing?.city?", "+activeConv.listing.city:""}
                  <span style={{marginLeft:6,background:"#e8f5e9",color:"var(--sage)",borderRadius:8,padding:"1px 6px",fontSize:10,fontWeight:600}}>Active</span>
                </div>
              </div>
            </div>

            <div style={{flex:1,overflow:"auto",padding:"16px 18px 8px",display:"flex",flexDirection:"column",gap:2,background:"var(--msg-bg)"}}>
              {messages.length===0&&(
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,color:"#aaa",textAlign:"center",padding:"40px 20px"}}>
                  <div style={{width:64,height:64,borderRadius:"50%",background:"var(--sage)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:24,marginBottom:14}}>
                    {activeConv.other_name?.[0]?.toUpperCase()||"?"}
                  </div>
                  <div style={{fontSize:16,color:"var(--ink)",fontWeight:600,marginBottom:5}}>{activeConv.other_name}</div>
                  <div style={{fontSize:12,color:"#888",lineHeight:1.6,maxWidth:280}}>
                    Start your conversation about<br/><strong style={{color:"var(--ink)"}}>{activeConv.listing?.address}</strong>
                  </div>
                </div>
              )}
              {groupedMessages.map((item,idx)=>{
                if(item.type==="date") return (
                  <div key={"d"+idx} style={{display:"flex",justifyContent:"center",margin:"10px 0 6px"}}>
                    <span style={{background:"rgba(0,0,0,0.07)",color:"#666",fontSize:11,padding:"3px 12px",borderRadius:12,fontWeight:500}}>{item.label}</span>
                  </div>
                );
                const m=item.data;
                const isMe=m.user_id===user.id;
                const prevMsg=idx>0&&groupedMessages[idx-1]?.type==="msg"?groupedMessages[idx-1].data:null;
                const nextMsg=idx<groupedMessages.length-1&&groupedMessages[idx+1]?.type==="msg"?groupedMessages[idx+1].data:null;
                const isFirst=!prevMsg||prevMsg.user_id!==m.user_id;
                const isLast=!nextMsg||nextMsg.user_id!==m.user_id;
                const showAvatar=!isMe&&isLast;
                const gap=isFirst?8:2;
                const br=isMe
                  ?{borderRadius:isFirst?"18px 18px 4px 18px":isLast?"18px 4px 18px 18px":"18px 4px 4px 18px"}
                  :{borderRadius:isFirst?"18px 18px 18px 4px":isLast?"4px 18px 18px 18px":"4px 18px 18px 4px"};
                return (
                  <div key={m.id||idx} className="msg-bubble" style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",alignItems:"flex-end",gap:8,marginTop:gap}}>
                    {!isMe&&(
                      <div style={{width:30,height:30,borderRadius:"50%",background:showAvatar?"var(--sage)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:12,flexShrink:0}}>
                        {showAvatar?activeConv.other_name?.[0]?.toUpperCase()||"?":""}
                      </div>
                    )}
                    <div style={{maxWidth:"65%",display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start",gap:1}}>
                      {isFirst&&!isMe&&<div style={{fontSize:10,color:"#aaa",marginLeft:4,marginBottom:1}}>{activeConv.other_name}</div>}
                      <div style={{background:isMe?"var(--sage)":"#ffffff",color:isMe?"#fff":"var(--ink)",...br,padding:"9px 14px",fontSize:14,lineHeight:1.5,boxShadow:"0 1px 2px rgba(0,0,0,0.08)",wordBreak:"break-word"}}>
                        {m.body}
                      </div>
                      {isLast&&(
                        <div style={{fontSize:10,color:"#bbb",margin:isMe?"0 4px 0 0":"0 0 0 4px"}}>
                          {formatTime(m.created_at)}{isMe&&<span style={{marginLeft:3}}>{m.read?"✓✓":"✓"}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef}/>
            </div>

            <div style={{background:"#fff",borderTop:"1px solid #e5e7eb",padding:"12px 16px",display:"flex",alignItems:"flex-end",gap:10,flexShrink:0}}>
              <div style={{flex:1,background:"var(--msg-bg)",borderRadius:24,padding:"10px 16px",display:"flex",alignItems:"flex-end",gap:8,border:"1.5px solid transparent",transition:"border-color 0.2s"}}
                onFocusCapture={e=>e.currentTarget.style.borderColor="var(--sage)"}
                onBlurCapture={e=>e.currentTarget.style.borderColor="transparent"}>
                <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
                  placeholder="Aa" rows={1}
                  style={{flex:1,background:"none",border:"none",outline:"none",resize:"none",fontSize:15,lineHeight:1.5,color:"var(--ink)",fontFamily:"inherit",maxHeight:120,overflowY:"auto"}}/>
              </div>
              <button onClick={send} disabled={sending||!input.trim()}
                style={{width:42,height:42,borderRadius:"50%",background:input.trim()?"var(--sage)":"#e5e7eb",color:"#fff",border:"none",cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s",boxShadow:input.trim()?"0 2px 10px rgba(74,103,65,0.4)":"none"}}>
                {sending?<Spinner size={16}/>:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
              </button>
            </div>
          </>
        ):(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#aaa",padding:40}}>
            <div style={{width:80,height:80,borderRadius:"50%",background:"var(--warm)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,marginBottom:18}}>💬</div>
            <div style={{fontSize:20,color:"var(--ink)",fontWeight:700,marginBottom:8}}>Your Messages</div>
            <div style={{fontSize:13,color:"#888",textAlign:"center",maxWidth:260,lineHeight:1.7}}>Select a conversation or tap Message on any listing to start talking.</div>
          </div>
        )}
      </div>
    </div>
  );
}
function SellTab({user,onRequireAuth}) {
  const [mode,setMode]=useState("home");
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({address:"",city:"",state:"",zip:"",price:"",beds:"",baths:"",sqft:"",type:"Single Family",description:"",seller_name:"",seller_email:"",seller_phone:""});
  const [photos,setPhotos]=useState([]);
  const [submitting,setSubmitting]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [error,setError]=useState(null);
  const [valForm,setValForm]=useState({address:"",beds:3,baths:2,sqft:1800,year:2005,condition:"Good",type:"Single Family"});
  const [valResult,setValResult]=useState(null);
  const [valLoading,setValLoading]=useState(false);
  const update=(k,v)=>setForm(f=>({...f,[k]:v}));
  const updateVal=(k,v)=>setValForm(f=>({...f,[k]:v}));
  const inp={width:"100%",padding:"10px 13px",borderRadius:9,border:"1.5px solid var(--warm)",background:"#fff",fontSize:13,outline:"none",color:"var(--ink)"};
  const lbl={display:"block",fontSize:10,fontWeight:600,color:"#555",marginBottom:4,textTransform:"uppercase"};

  useEffect(()=>{
    if(user)setForm(f=>({...f,seller_name:user.user_metadata?.full_name||"",seller_email:user.email||""}));
  },[user]);

  if(!user) return (
    <div style={{maxWidth:440,margin:"80px auto",textAlign:"center",padding:"0 24px"}}>
      <div style={{fontSize:48,marginBottom:12}}>🏡</div>
      <h2 style={{fontSize:26,marginBottom:9,color:"var(--ink)"}}>Ready to sell?</h2>
      <p style={{color:"#666",lineHeight:1.7,marginBottom:22,fontSize:13}}>Create a free account and list your home in minutes. Keep more of what you earn.</p>
      <button onClick={onRequireAuth} style={{background:"var(--sage)",color:"#fff",border:"none",borderRadius:12,padding:"12px 26px",fontSize:14,cursor:"pointer",fontWeight:600}}>Get Started Free</button>
    </div>
  );

  const estimate=async()=>{
    setValLoading(true);setValResult(null);
    try{
      const text=await callClaude([{role:"user",content:"You are a real estate valuation expert. Return ONLY valid JSON, no markdown. Property: "+(valForm.address||"Unknown")+", Type: "+valForm.type+", Beds: "+valForm.beds+", Baths: "+valForm.baths+", SqFt: "+valForm.sqft+", Year: "+valForm.year+", Condition: "+valForm.condition+". Return: {\"low\":number,\"mid\":number,\"high\":number,\"pricePerSqft\":number,\"summary\":\"2-3 sentences\",\"tips\":[\"tip1\",\"tip2\",\"tip3\"]}"}]);
      setValResult(JSON.parse(text.replace(/```json|```/g,"").trim()));
    }catch{
      setValResult({low:380000,mid:435000,high:490000,pricePerSqft:241,summary:"Based on your inputs, this property sits in a competitive range.",tips:["Stage key rooms before listing","Price at mid-range to attract multiple offers","Disclose all known issues upfront"]});
    }
    setValLoading(false);
  };

  const addPhotos=files=>{
    Array.from(files).forEach(file=>{
      const reader=new FileReader();
      reader.onload=e=>setPhotos(prev=>[...prev,{file,preview:e.target.result}]);
      reader.readAsDataURL(file);
    });
  };

  const publish=async()=>{
    setSubmitting(true);setError(null);
    try{
      const photoUrls=[];
      for(const p of photos){
        const ext=p.file.name.split(".").pop();
        const path=Date.now()+"-"+Math.random().toString(36).slice(2)+"."+ext;
        const{error:e}=await sb.storage.from("property-photos").upload(path,p.file,{contentType:p.file.type});
        if(e)throw new Error("Photo upload failed: "+e.message);
        const{data:{publicUrl}}=sb.storage.from("property-photos").getPublicUrl(path);
        photoUrls.push(publicUrl);
      }
      const{error:e}=await sb.from("listings").insert([{
        address:form.address,city:form.city,state:form.state,zip:form.zip,
        price:Number(form.price),beds:Number(form.beds),baths:Number(form.baths),
        sqft:Number(form.sqft),type:form.type,description:form.description,
        seller_name:form.seller_name,seller_email:form.seller_email,seller_phone:form.seller_phone,
        photos:photoUrls,tags:[],user_id:user.id,sold:false,
      }]);
      if(e)throw new Error(e.message);
      setSubmitted(true);
    }catch(e){setError(e.message);}
    setSubmitting(false);
  };

  const reset=()=>{
    setSubmitted(false);setStep(1);setPhotos([]);setError(null);setMode("home");
    setForm({address:"",city:"",state:"",zip:"",price:"",beds:"",baths:"",sqft:"",type:"Single Family",description:"",seller_name:user?.user_metadata?.full_name||"",seller_email:user?.email||"",seller_phone:""});
  };

  if(mode==="home") return (
    <div style={{maxWidth:600,margin:"0 auto",padding:"32px 20px"}}>
      <h2 style={{fontSize:28,fontWeight:700,marginBottom:5,color:"var(--ink)"}}>Sell Your Home</h2>
      <p style={{color:"#666",fontSize:13,marginBottom:24,lineHeight:1.6}}>Skip the agent fees. Connect directly with buyers and keep more of your money.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:20}}>
        <div onClick={()=>setMode("value")} style={{background:"var(--card)",border:"2px solid var(--warm)",borderRadius:14,padding:"24px 20px",cursor:"pointer",textAlign:"center",transition:"all 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.transform="translateY(-2px)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--warm)";e.currentTarget.style.transform="none";}}>
          <div style={{fontSize:38,marginBottom:11}}>💰</div>
          <div style={{fontSize:16,fontWeight:700,color:"var(--ink)",marginBottom:6}}>Get My Home Value</div>
          <div style={{fontSize:12,color:"#666",lineHeight:1.6}}>Find out what your home is worth before listing. Instant AI-powered estimate.</div>
          <div style={{marginTop:10,color:"var(--gold)",fontSize:12,fontWeight:600}}>Free Estimate →</div>
        </div>
        <div onClick={()=>setMode("list")} style={{background:"var(--sage)",border:"2px solid var(--sage)",borderRadius:14,padding:"24px 20px",cursor:"pointer",textAlign:"center",transition:"all 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(74,103,65,0.3)";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
          <div style={{fontSize:38,marginBottom:11}}>🏡</div>
          <div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:6}}>List My Home</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.8)",lineHeight:1.6}}>Create your listing in minutes. Connect directly with buyers — no agent needed.</div>
          <div style={{marginTop:10,color:"rgba(255,255,255,0.9)",fontSize:12,fontWeight:600}}>Start Listing →</div>
        </div>
      </div>
      <div style={{background:"var(--warm)",borderRadius:12,padding:"14px 16px"}}>
        <div style={{fontSize:13,fontWeight:700,color:"var(--ink)",marginBottom:5}}>💡 Price it right the first time</div>
        <div style={{fontSize:12,color:"#555",lineHeight:1.7}}>Homes priced correctly sell 2–3 weeks faster. Get your free valuation before you list.</div>
      </div>
    </div>
  );

  if(mode==="value") return (
    <div style={{maxWidth:600,margin:"0 auto",padding:"20px 16px"}}>
      <button onClick={()=>{setMode("home");setValResult(null);}} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:12,marginBottom:12}}>← Back</button>
      <h2 style={{fontSize:24,fontWeight:700,marginBottom:4,color:"var(--ink)"}}>Home Valuation</h2>
      <p style={{color:"#666",fontSize:12,marginBottom:18}}>Free instant estimate — no agent required.</p>
      <div style={{background:"var(--card)",border:"1px solid var(--warm)",borderRadius:13,padding:"18px",marginBottom:13}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div><label style={lbl}>Property Address</label><input style={inp} value={valForm.address} onChange={e=>updateVal("address",e.target.value)} placeholder="123 Main St, Austin TX 78701"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9}}>
            <div><label style={lbl}>Beds</label><input style={inp} type="number" value={valForm.beds} onChange={e=>updateVal("beds",Number(e.target.value))}/></div>
            <div><label style={lbl}>Baths</label><input style={inp} type="number" value={valForm.baths} onChange={e=>updateVal("baths",Number(e.target.value))}/></div>
            <div><label style={lbl}>Sq Ft</label><input style={inp} type="number" value={valForm.sqft} onChange={e=>updateVal("sqft",Number(e.target.value))}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9}}>
            <div><label style={lbl}>Year Built</label><input style={inp} type="number" value={valForm.year} onChange={e=>updateVal("year",Number(e.target.value))}/></div>
            <div><label style={lbl}>Condition</label>
              <select style={{...inp,cursor:"pointer"}} value={valForm.condition} onChange={e=>updateVal("condition",e.target.value)}>
                <option>Excellent</option><option>Good</option><option>Fair</option><option>Needs Work</option>
              </select>
            </div>
            <div><label style={lbl}>Type</label>
              <select style={{...inp,cursor:"pointer"}} value={valForm.type} onChange={e=>updateVal("type",e.target.value)}>
                <option>Single Family</option><option>Condo</option><option>Townhome</option><option>Multi-Family</option>
              </select>
            </div>
          </div>
          <button onClick={estimate} disabled={valLoading} style={{background:valLoading?"#aaa":"var(--rust)",color:"#fff",border:"none",borderRadius:10,padding:"11px",fontSize:13,cursor:valLoading?"default":"pointer",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
            {valLoading?<><Spinner size={14}/>  Analyzing...</>:"Get My Home Value"}
          </button>
        </div>
      </div>
      {valResult&&(
        <div style={{animation:"fadeIn 0.4s ease"}}>
          <div style={{background:"linear-gradient(135deg,var(--ink),#2d2010)",borderRadius:13,padding:"20px",color:"#fff",marginBottom:11}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:1,marginBottom:11}}>Estimated Value Range</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:13}}>
              {[["Low",valResult.low,"#bbb"],["Mid",valResult.mid,"var(--gold-light)"],["High",valResult.high,"var(--mist)"]].map(([l,v,c])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <div style={{fontSize:8,color:"rgba(255,255,255,0.4)",marginBottom:2}}>{l}</div>
                  <div style={{fontSize:19,fontWeight:700,color:c}}>{formatPrice(v)}</div>
                </div>
              ))}
            </div>
            <div style={{borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:11,fontSize:11,color:"rgba(255,255,255,0.65)",lineHeight:1.7}}>{valResult.summary}</div>
          </div>
          <div style={{background:"var(--card)",border:"1px solid var(--warm)",borderRadius:13,padding:"16px 18px",marginBottom:11}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:10,color:"var(--ink)"}}>Tips to Maximize Your Sale</div>
            {valResult.tips.map((tip,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:7,alignItems:"flex-start"}}>
                <span style={{background:"var(--sage)",color:"#fff",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,flexShrink:0,marginTop:2}}>{i+1}</span>
                <span style={{fontSize:12,color:"#444",lineHeight:1.6}}>{tip}</span>
              </div>
            ))}
          </div>
          <button onClick={()=>setMode("list")} style={{width:"100%",background:"var(--sage)",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:13,cursor:"pointer",fontWeight:600}}>Ready to List? Start My Listing →</button>
        </div>
      )}
    </div>
  );

  if(submitted) return (
    <div style={{maxWidth:440,margin:"80px auto",textAlign:"center",padding:"0 24px"}}>
      <div style={{fontSize:56,marginBottom:12}}>🎉</div>
      <h2 style={{fontSize:26,marginBottom:9,color:"var(--ink)"}}>Your listing is live!</h2>
      <p style={{color:"#555",lineHeight:1.8,marginBottom:20,fontSize:13}}>Buyers can find and message you directly. Share your listing to reach more people.</p>
      <div style={{display:"flex",gap:9}}>
        <button onClick={reset} style={{flex:1,background:"var(--warm)",color:"var(--ink)",border:"none",borderRadius:10,padding:"11px",fontSize:12,cursor:"pointer",fontWeight:600}}>List Another</button>
        <button onClick={()=>setMode("home")} style={{flex:1,background:"var(--sage)",color:"#fff",border:"none",borderRadius:10,padding:"11px",fontSize:12,cursor:"pointer",fontWeight:600}}>Done</button>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"20px 16px"}}>
      <button onClick={()=>setMode("home")} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:12,marginBottom:12}}>← Back</button>
      <h2 style={{fontSize:24,fontWeight:700,marginBottom:4,color:"var(--ink)"}}>List Your Home</h2>
      <p style={{color:"#666",fontSize:12,marginBottom:18}}>Skip the agent fees. Sell directly to buyers.</p>
      <div style={{display:"flex",gap:5,marginBottom:22}}>
        {["Property","Photos","Pricing","Contact"].map((s,i)=>(
          <div key={i} style={{flex:1,textAlign:"center"}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:step>i+1?"var(--sage)":step===i+1?"var(--gold)":"var(--warm)",color:step>=i+1?"#fff":"#aaa",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 3px",fontSize:9,fontWeight:700}}>{step>i+1?"✓":i+1}</div>
            <div style={{fontSize:8,color:step===i+1?"var(--gold)":"#aaa"}}>{s}</div>
          </div>
        ))}
      </div>

      {step===1&&(
        <div style={{display:"flex",flexDirection:"column",gap:13}}>
          <div><label style={lbl}>Street Address</label><input style={inp} value={form.address} onChange={e=>update("address",e.target.value)} placeholder="123 Main Street"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9}}>
            <div><label style={lbl}>City</label><input style={inp} value={form.city} onChange={e=>update("city",e.target.value)} placeholder="Austin"/></div>
            <div><label style={lbl}>State</label><input style={inp} value={form.state} onChange={e=>update("state",e.target.value)} placeholder="TX"/></div>
            <div><label style={lbl}>ZIP</label><input style={inp} value={form.zip} onChange={e=>update("zip",e.target.value)} placeholder="78701"/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:9}}>
            <div><label style={lbl}>Beds</label><input style={inp} type="number" value={form.beds} onChange={e=>update("beds",e.target.value)} placeholder="3"/></div>
            <div><label style={lbl}>Baths</label><input style={inp} type="number" value={form.baths} onChange={e=>update("baths",e.target.value)} placeholder="2"/></div>
            <div><label style={lbl}>Sq Ft</label><input style={inp} type="number" value={form.sqft} onChange={e=>update("sqft",e.target.value)} placeholder="1800"/></div>
            <div><label style={lbl}>Type</label>
              <select style={{...inp,cursor:"pointer"}} value={form.type} onChange={e=>update("type",e.target.value)}>
                <option>Single Family</option><option>Condo</option><option>Townhome</option><option>Multi-Family</option><option>Land</option>
              </select>
            </div>
          </div>
          <button onClick={()=>{if(!form.address||!form.city||!form.state||!form.zip){alert("Please fill in the complete address.");return;}setStep(2);}} style={{background:"var(--gold)",color:"#fff",border:"none",borderRadius:10,padding:"11px",fontSize:13,cursor:"pointer",fontWeight:600}}>Continue</button>
        </div>
      )}

      {step===2&&(
        <div style={{display:"flex",flexDirection:"column",gap:13}}>
          <label htmlFor="photo-upload" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:"2px dashed var(--warm)",borderRadius:11,padding:"24px 16px",cursor:"pointer",background:"var(--cream)"}}>
            <span style={{fontSize:28,marginBottom:6}}>📷</span>
            <span style={{fontWeight:600,fontSize:13,marginBottom:2,color:"var(--ink)"}}>Click to upload photos</span>
            <span style={{fontSize:11,color:"#888"}}>JPG, PNG, WEBP · Multiple allowed</span>
            <input id="photo-upload" type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>addPhotos(e.target.files)}/>
          </label>
          {photos.length>0&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(88px,1fr))",gap:6}}>
              {photos.map((p,i)=>(
                <div key={i} style={{position:"relative",borderRadius:8,overflow:"hidden",aspectRatio:"4/3"}}>
                  <img src={p.preview} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  <button onClick={()=>setPhotos(prev=>prev.filter((_,j)=>j!==i))} style={{position:"absolute",top:3,right:3,background:"rgba(0,0,0,0.6)",color:"#fff",border:"none",borderRadius:"50%",width:18,height:18,cursor:"pointer",fontSize:10}}>✕</button>
                </div>
              ))}
            </div>
          )}
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>setStep(1)} style={{flex:1,background:"none",border:"1.5px solid var(--warm)",borderRadius:10,padding:"10px",fontSize:12,cursor:"pointer",color:"var(--ink)"}}>Back</button>
            <button onClick={()=>setStep(3)} style={{flex:2,background:"var(--gold)",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontSize:12,cursor:"pointer",fontWeight:600}}>Continue</button>
          </div>
        </div>
      )}

      {step===3&&(
        <div style={{display:"flex",flexDirection:"column",gap:13}}>
          <div><label style={lbl}>Asking Price</label><input style={inp} type="number" value={form.price} onChange={e=>update("price",e.target.value)} placeholder="485000"/></div>
          <div><label style={lbl}>Description</label><textarea style={{...inp,minHeight:90,resize:"vertical"}} value={form.description} onChange={e=>update("description",e.target.value)} placeholder="Describe your home — highlights, updates, neighborhood..."/></div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>setStep(2)} style={{flex:1,background:"none",border:"1.5px solid var(--warm)",borderRadius:10,padding:"10px",fontSize:12,cursor:"pointer",color:"var(--ink)"}}>Back</button>
            <button onClick={()=>setStep(4)} style={{flex:2,background:"var(--gold)",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontSize:12,cursor:"pointer",fontWeight:600}}>Continue</button>
          </div>
        </div>
      )}

      {step===4&&(
        <div style={{display:"flex",flexDirection:"column",gap:13}}>
          <div><label style={lbl}>Your Name</label><input style={inp} value={form.seller_name} onChange={e=>update("seller_name",e.target.value)} placeholder="Jane Smith"/></div>
          <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.seller_email} onChange={e=>update("seller_email",e.target.value)}/></div>
          <div><label style={lbl}>Phone</label><input style={inp} type="tel" value={form.seller_phone} onChange={e=>update("seller_phone",e.target.value)} placeholder="(555) 123-4567"/></div>
          <div style={{background:"var(--warm)",borderRadius:7,padding:"8px 12px",fontSize:11,color:"#555"}}>Your contact info is only shared with buyers who make an offer.</div>
          {error&&<div style={{background:"#fff5f5",border:"1px solid #fcc",borderRadius:8,padding:"8px 12px",color:"var(--rust)",fontSize:12}}>{error}</div>}
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>setStep(3)} style={{flex:1,background:"none",border:"1.5px solid var(--warm)",borderRadius:10,padding:"10px",fontSize:12,cursor:"pointer",color:"var(--ink)"}}>Back</button>
            <button onClick={publish} disabled={submitting} style={{flex:2,background:submitting?"#aaa":"var(--sage)",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontSize:12,cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
              {submitting?<Spinner size={13}/>:"Publish Listing 🚀"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileDropdown({user,onLogout,onRequireAuth,setTab}) {
  const [open,setOpen]=useState(false);
  const [listings,setListings]=useState([]);
  const [loading,setLoading]=useState(false);
  const ref=useRef(null);

  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);

  useEffect(()=>{
    if(open&&user){
      setLoading(true);
      sb.from("listings").select("*").eq("user_id",user.id).order("created_at",{ascending:false})
        .then(({data})=>{setListings(data||[]);setLoading(false);});
    }
  },[open,user]);

  const deleteListing=async(id,e)=>{
    e.stopPropagation();
    if(!window.confirm("Delete this listing?"))return;
    await sb.from("listings").delete().eq("id",id);
    setListings(prev=>prev.filter(l=>l.id!==id));
  };

  if(!user) return (
    <button onClick={onRequireAuth} style={{background:"var(--gold)",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:600}}>Sign In</button>
  );

  return (
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(!open)} style={{background:open?"rgba(255,255,255,0.12)":"none",border:"1px solid "+(open?"rgba(255,255,255,0.25)":"transparent"),color:"rgba(255,255,255,0.85)",borderRadius:8,padding:"5px 13px",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"all 0.15s"}}>
        Profile {open?"▲":"▼"}
      </button>
      {open&&(
        <div style={{position:"absolute",right:0,top:42,background:"var(--card)",border:"1px solid var(--warm)",borderRadius:14,width:290,boxShadow:"0 12px 40px rgba(0,0,0,0.18)",zIndex:300,animation:"slideDown 0.2s ease",overflow:"hidden"}}>
          <div style={{background:"var(--ink)",padding:"14px 16px"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:1}}>{user.user_metadata?.full_name||"Your Account"}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>{user.email}</div>
          </div>
          <div style={{padding:"11px 16px",borderBottom:"1px solid var(--warm)"}}>
            <div style={{fontSize:9,fontWeight:700,color:"#bbb",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>My Listings</div>
            {loading&&<div style={{fontSize:11,color:"#aaa",textAlign:"center",padding:7}}>Loading...</div>}
            {!loading&&listings.length===0&&(
              <div style={{fontSize:11,color:"#aaa",textAlign:"center",padding:7}}>
                No listings — <span onClick={()=>{setTab("Sell");setOpen(false);}} style={{color:"var(--gold)",cursor:"pointer"}}>list your home</span>
              </div>
            )}
            {listings.map(l=>(
              <div key={l.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid var(--warm)"}}>
                <div style={{width:32,height:32,borderRadius:6,background:"var(--warm)",overflow:"hidden",flexShrink:0}}>
                  {l.photos?.[0]?<img src={l.photos[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🏡</div>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:600,color:"var(--ink)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.address}</div>
                  <div style={{fontSize:10,color:"#888"}}>{formatPrice(l.price)} {l.sold?"· SOLD":""}</div>
                </div>
                <button onClick={e=>deleteListing(l.id,e)} style={{background:"none",border:"none",color:"#ddd",cursor:"pointer",fontSize:12,flexShrink:0}}>🗑️</button>
              </div>
            ))}
          </div>
          <div style={{padding:"9px 16px 13px"}}>
            <button onClick={()=>{setTab("Sell");setOpen(false);}} style={{width:"100%",background:"var(--sage)",color:"#fff",border:"none",borderRadius:9,padding:"8px",fontSize:12,cursor:"pointer",fontWeight:600,marginBottom:6}}>+ List a Property</button>
            <button onClick={()=>{onLogout();setOpen(false);}} style={{width:"100%",background:"none",border:"1px solid var(--warm)",borderRadius:9,padding:"7px",fontSize:12,cursor:"pointer",color:"#888"}}>Log Out</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab,setTab]=useState("Browse");
  const [user,setUser]=useState(null);
  const [showAuth,setShowAuth]=useState(false);
  const [messageThread,setMessageThread]=useState(null);
  const [offerListing,setOfferListing]=useState(null);
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
  const [deepLinkListingId,setDeepLinkListingId]=useState(null);
  const [offerUnread,setOfferUnread]=useState(0);
  const [msgUnread,setMsgUnread]=useState(0);
  const NAV=["Browse","Sell","Offers","Messages"];

  useEffect(()=>{
    sb.auth.getSession().then(({data:{session}})=>setUser(session?.user||null));
    const{data:{subscription}}=sb.auth.onAuthStateChange((_,session)=>setUser(session?.user||null));
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const id=params.get("listing");
    if(id){setDeepLinkListingId(id);setTab("Browse");window.history.replaceState({},"",window.location.pathname);}
  },[]);

  useEffect(()=>{
    if(!user){setOfferUnread(0);setMsgUnread(0);return;}
    const load=async()=>{
      const{count:oc}=await sb.from("notifications").select("id",{count:"exact"}).eq("user_id",user.id).eq("read",false);
      const{count:mc}=await sb.from("direct_messages").select("id",{count:"exact"}).eq("recipient_id",user.id).eq("read",false);
      setOfferUnread(oc||0);setMsgUnread(mc||0);
    };
    load();
    const sub=sb.channel("badges-"+user.id)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:"user_id=eq."+user.id},()=>load())
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"direct_messages",filter:"recipient_id=eq."+user.id},()=>load())
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"direct_messages",filter:"recipient_id=eq."+user.id},()=>load())
      .subscribe();
    return()=>sb.removeChannel(sub);
  },[user?.id]);

  const handleMessage=listing=>{
    if(!user){setShowAuth(true);return;}
    if(listing.user_id===user.id)return;
    setMessageThread(listing);setTab("Messages");
  };
  const handleLogout=async()=>{await sb.auth.signOut();setUser(null);setTab("Browse");};

  const NavBtn=({n})=>{
    const badge=n==="Offers"?offerUnread:n==="Messages"?msgUnread:0;
    return (
      <button onClick={()=>{setTab(n);setMobileMenuOpen(false);}}
        style={{background:tab===n?"rgba(255,255,255,0.12)":"none",border:"1px solid "+(tab===n?"rgba(255,255,255,0.2)":"transparent"),color:tab===n?"#fff":"rgba(255,255,255,0.65)",borderRadius:8,padding:"5px 13px",fontSize:12,cursor:"pointer",position:"relative",transition:"all 0.15s"}}>
        {n}
        {badge>0&&<span style={{position:"absolute",top:-5,right:-5,background:"var(--rust)",color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{badge>9?"9+":badge}</span>}
      </button>
    );
  };

  return (
    <div style={{minHeight:"100vh",background:"var(--cream)"}}>
      <style>{styles}</style>
      <title>DirectDeed — Buy & Sell Homes and Save Thousands</title>

      <header style={{background:"var(--ink)",color:"#fff",padding:"0 18px",display:"flex",alignItems:"center",justifyContent:"space-between",height:54,position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 14px rgba(0,0,0,0.25)"}}>
        <div style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer"}} onClick={()=>setTab("Browse")}>
          <span style={{fontSize:18}}>🏡</span>
          <span style={{fontSize:18,fontWeight:700}}>DirectDeed</span>
          <span style={{fontSize:8,color:"var(--gold-light)",background:"rgba(212,160,23,0.15)",padding:"2px 7px",borderRadius:9,marginLeft:1}}>Save Thousands</span>
        </div>
        <div className="desktop-nav" style={{display:"flex",alignItems:"center",gap:3}}>
          <nav style={{display:"flex",gap:2}}>{NAV.map(n=><NavBtn key={n} n={n}/>)}</nav>
          <div style={{width:1,height:16,background:"rgba(255,255,255,0.15)",margin:"0 5px"}}/>
          <ProfileDropdown user={user} onLogout={handleLogout} onRequireAuth={()=>setShowAuth(true)} setTab={setTab}/>
        </div>
        <button className="mobile-menu-btn" onClick={()=>setMobileMenuOpen(!mobileMenuOpen)} style={{background:"none",border:"none",color:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center"}}>
          {mobileMenuOpen?"✕":"☰"}
        </button>
      </header>

      {mobileMenuOpen&&(
        <div className="mobile-nav" style={{background:"var(--ink)",padding:"10px 14px",display:"flex",flexDirection:"column",gap:5,borderBottom:"1px solid rgba(255,255,255,0.1)",animation:"slideDown 0.2s ease"}}>
          {NAV.map(n=>{
            const badge=n==="Offers"?offerUnread:n==="Messages"?msgUnread:0;
            return <button key={n} onClick={()=>{setTab(n);setMobileMenuOpen(false);}} style={{background:tab===n?"rgba(255,255,255,0.1)":"none",border:"none",color:tab===n?"#fff":"rgba(255,255,255,0.7)",borderRadius:9,padding:"10px 13px",fontSize:13,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              {n}{badge>0&&<span style={{background:"var(--rust)",color:"#fff",borderRadius:9,padding:"1px 6px",fontSize:9,fontWeight:700}}>{badge}</span>}
            </button>;
          })}
          {!user
            ?<button onClick={()=>{setShowAuth(true);setMobileMenuOpen(false);}} style={{background:"var(--gold)",color:"#fff",border:"none",borderRadius:9,padding:"10px 13px",fontSize:13,cursor:"pointer",fontWeight:600}}>Sign In</button>
            :<button onClick={()=>{handleLogout();setMobileMenuOpen(false);}} style={{background:"none",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.6)",borderRadius:9,padding:"10px 13px",fontSize:13,cursor:"pointer"}}>Log Out</button>
          }
        </div>
      )}

      {tab==="Browse"&&(
        <div style={{background:"linear-gradient(135deg,var(--ink) 0%,#3d2b0f 60%,var(--rust) 100%)",color:"#fff",padding:"40px 22px 48px",textAlign:"center"}}>
          <div className="hero-title" style={{fontSize:38,fontWeight:700,lineHeight:1.15,marginBottom:10}}>Buy and Sell Your Home.<br/>Keep More of Your Money.</div>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.65)",maxWidth:380,margin:"0 auto 20px",lineHeight:1.7}}>Connect directly with buyers and sellers. Save the 5–6% commission — up to $30,000 on a $500k home.</p>
          <div style={{display:"flex",gap:9,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>user?setTab("Sell"):setShowAuth(true)} style={{background:"var(--gold)",color:"#fff",border:"none",borderRadius:11,padding:"11px 22px",fontSize:13,cursor:"pointer",fontWeight:700}}>List My Home</button>
            <button onClick={()=>document.getElementById("browse-start")?.scrollIntoView({behavior:"smooth"})} style={{background:"rgba(255,255,255,0.1)",color:"#fff",border:"1px solid rgba(255,255,255,0.25)",borderRadius:11,padding:"11px 22px",fontSize:13,cursor:"pointer"}}>Browse Homes</button>
          </div>
        </div>
      )}

      <div id="browse-start">
        {tab==="Browse"&&<BrowseTab onMessage={handleMessage} onOffer={l=>setOfferListing(l)} user={user} deepLinkListingId={deepLinkListingId} onClearDeepLink={()=>setDeepLinkListingId(null)}/>}
      </div>
      {tab==="Sell"&&<SellTab user={user} onRequireAuth={()=>setShowAuth(true)}/>}
      {tab==="Offers"&&<OffersTab user={user} onRequireAuth={()=>setShowAuth(true)}/>}
      {tab==="Messages"&&<MessagesTab newThread={messageThread} user={user} onRequireAuth={()=>setShowAuth(true)}/>}
      {tab==="Privacy"&&<LegalTab section="privacy"/>}
      {tab==="Terms"&&<LegalTab section="terms"/>}

      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onAuth={setUser}/>}
      {offerListing&&<MakeOfferModal listing={offerListing} user={user} onClose={()=>setOfferListing(null)} onRequireAuth={()=>{setOfferListing(null);setShowAuth(true);}}/>}

      <footer style={{background:"var(--ink)",color:"rgba(255,255,255,0.35)",textAlign:"center",padding:"16px",fontSize:10,marginTop:0}}>
        © 2026 Bondy Technologies LLC. All rights reserved. DirectDeed is not a licensed real estate brokerage. ·
        <span onClick={()=>setTab("Privacy")} style={{cursor:"pointer",marginLeft:5,textDecoration:"underline"}}>Privacy Policy</span> ·
        <span onClick={()=>setTab("Terms")} style={{cursor:"pointer",marginLeft:5,textDecoration:"underline"}}>Terms of Service</span> ·
        <a href="mailto:maxbondy@hotmail.com" style={{color:"rgba(255,255,255,0.35)",marginLeft:5}}>Contact</a>
      </footer>
    </div>
  );
}