import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import LegalTab from "./Legal";

const SUPABASE_URL = "https://hzojqsalrlqrfmgkvsxm.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6b2pxc2FscmxxcmZtZ2t2c3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzQ3OTQsImV4cCI6MjA5MjQ1MDc5NH0.8vvCJ5FqbH2zOdsUEj6lGgBR_lYhxTrIOdT9JRIwdkw";
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --ink: #1a1208; --cream: #f5f0e8; --warm: #e8dfc8;
    --gold: #b8860b; --gold-light: #d4a017; --rust: #8b3a0f;
    --sage: #4a6741; --mist: #c8d4c0; --card: #faf7f2;
    --shadow: rgba(26,18,8,0.12);
  }
  body { font-family: sans-serif; background: var(--cream); color: var(--ink); }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .desktop-nav { display: none !important; }
    .mobile-menu-btn { display: flex !important; }
    .hero-title { font-size: 32px !important; }
    .listing-grid { grid-template-columns: 1fr !important; }
    .offers-grid { grid-template-columns: 1fr !important; }
    .step-tracker { display: none !important; }
    .msg-sidebar { display: none !important; }
    .msg-sidebar.active { display: flex !important; }
  }
  @media (min-width: 769px) {
    .mobile-menu-btn { display: none !important; }
    .mobile-nav { display: none !important; }
  }
`;

const TRANSACTION_STEPS = [
  { id: 1,  key: "offer",              label: "Offer",               desc: "Seller reviews and responds to the offer",           icon: "📋", owner: "seller",
    buyerAction: "Your offer has been submitted. Waiting for the seller to respond.",
    sellerAction: "Review the offer. You may accept, counter, or decline.",
    relatedDocs: ["Purchase & Sale Agreement", "Counteroffer Addendum"] },
  { id: 2,  key: "preapproval",        label: "Pre-Approval",        desc: "Buyer provides proof of financing or funds",          icon: "🏦", owner: "buyer",
    buyerAction: "Upload your mortgage pre-approval letter or proof of funds (for cash buyers). This is required before the transaction can advance.",
    sellerAction: "Waiting for the buyer to upload their pre-approval or proof of funds.",
    relatedDocs: [] },
  { id: 3,  key: "earnest",            label: "Earnest Money",       desc: "Buyer deposits earnest money into escrow",            icon: "💰", owner: "buyer",
    buyerAction: "Deposit earnest money with a licensed title company or real estate attorney. Upload your deposit confirmation receipt.",
    sellerAction: "Waiting for buyer to deposit earnest money with the escrow agent.",
    relatedDocs: ["Earnest Money Agreement"] },
  { id: 4,  key: "inspection",         label: "Inspection",          desc: "Buyer schedules and completes home inspection",       icon: "🔍", owner: "buyer",
    buyerAction: "Schedule a licensed home inspector. Upload the inspection report and submit any repair requests.",
    sellerAction: "Waiting for buyer to complete their inspection and share the report.",
    relatedDocs: ["Inspection Contingency Waiver", "Property Disclosure Statement"] },
  { id: 5,  key: "inspection_response",label: "Repair Response",     desc: "Seller responds to repair requests",                  icon: "🔨", owner: "seller",
    buyerAction: "Waiting for the seller to respond to your repair requests.",
    sellerAction: "Review the buyer's repair requests. Agree to repairs, offer a credit, or decline.",
    relatedDocs: ["Counteroffer Addendum", "As-Is Addendum"] },
  { id: 6,  key: "appraisal",          label: "Appraisal",           desc: "Buyer uploads property appraisal",                   icon: "📊", owner: "buyer",
    buyerAction: "Your lender will order the appraisal. Upload the appraisal report when received.",
    sellerAction: "Waiting for buyer to upload the appraisal report.",
    relatedDocs: [] },
  { id: 7,  key: "financing",          label: "Financing",           desc: "Buyer confirms final loan approval",                  icon: "✅", owner: "buyer",
    buyerAction: "Upload your final loan commitment letter from your lender.",
    sellerAction: "Waiting for buyer to confirm final loan approval.",
    relatedDocs: [] },
  { id: 8,  key: "title",              label: "Title Search",        desc: "Seller clears title for transfer",                   icon: "📜", owner: "seller",
    buyerAction: "Waiting for the seller to clear title. You will be notified when complete.",
    sellerAction: "Work with your title company to complete the title search and resolve any issues.",
    relatedDocs: ["Lead Paint Disclosure"] },
  { id: 9,  key: "walkthrough",        label: "Final Walkthrough",   desc: "Buyer completes final walkthrough",                  icon: "🚶", owner: "buyer",
    buyerAction: "Complete your final walkthrough and confirm the property condition below.",
    sellerAction: "Ensure the property is clean and all agreed repairs are complete.",
    relatedDocs: [] },
  { id: 10, key: "closing",            label: "Closing",             desc: "Both parties sign and complete the transaction",     icon: "🎉", owner: "both",
    buyerAction: "Sign the closing documents and confirm funds have been transferred.",
    sellerAction: "Sign the closing documents and confirm you are ready to transfer keys.",
    relatedDocs: ["Purchase & Sale Agreement"] },
];

const CONTRACT_TEMPLATES = [
  { name: "Purchase & Sale Agreement",   icon: "📋", steps: [1, 10] },
  { name: "Counteroffer Addendum",       icon: "🔄", steps: [1, 5] },
  { name: "Earnest Money Agreement",     icon: "💰", steps: [3] },
  { name: "Property Disclosure Statement", icon: "📝", steps: [4] },
  { name: "Inspection Contingency Waiver", icon: "✅", steps: [4] },
  { name: "As-Is Addendum",             icon: "🏚️", steps: [5] },
  { name: "Lead Paint Disclosure",       icon: "⚠️", steps: [8] },
  { name: "Seller Financing Addendum",   icon: "🏦", steps: [7] },
];

function formatPrice(p) { return "$" + Number(p).toLocaleString(); }
function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

async function callClaude(messages, maxTokens = 1000) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: maxTokens, messages }),
  });
  if (!res.ok) throw new Error("API error: " + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content.map(b => b.text || "").join("");
}

async function sendNotification(userId, message, link) {
  if (!userId) return;
  await sb.from("notifications").insert([{ user_id: userId, message, link }]);
}

async function sendEmail(to, subject, html) {
  try {
    await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });
  } catch (e) { console.error("Email error:", e.message); }
}

function getContractPrompt(templateName, offer) {
  const listing = offer.listings || {};
  const base = `Property: ${listing.address || ""}, ${listing.city || ""}, ${listing.state || ""} ${listing.zip || ""}. Buyer: ${offer.buyer_name || "___"}. Seller: ${listing.seller_name || "___"}. Purchase Price: $${offer.offer_price || "___"}. Closing Date: ${offer.closing_date || "___"}. Earnest Money: $${offer.earnest_money || "___"}.`;
  const prompts = {
    "Purchase & Sale Agreement": `Generate a detailed residential Purchase and Sale Agreement for US real estate. ${base} Include: 1) Parties and Property, 2) Purchase Price, 3) Earnest Money, 4) Financing Contingency, 5) Inspection Contingency, 6) Appraisal Contingency, 7) Title and Closing, 8) Possession Date, 9) Included Items, 10) Property Condition, 11) Closing Costs, 12) Default and Remedies, 13) Dispute Resolution, 14) Entire Agreement. End with signature blocks. Plain-English legal language. No markdown.`,
    "Counteroffer Addendum": `Generate a formal Counteroffer Addendum. ${base} Counter price: ${offer.counter_price || "___"}. Counter closing date: ${offer.counter_closing_date || "___"}. Include: 1) Reference to original offer, 2) Modified terms, 3) Expiration, 4) Other terms unchanged, 5) Signature blocks. No markdown.`,
    "Earnest Money Agreement": `Generate an Earnest Money Agreement. ${base} Include: 1) Deposit amount, 2) Escrow holder, 3) Deadline, 4) Return conditions, 5) Forfeiture conditions, 6) Dispute resolution, 7) Signature blocks. No markdown.`,
    "Property Disclosure Statement": `Generate a Seller Property Disclosure Statement. ${base} Include Yes/No/Unknown for: 1) Roof, 2) Foundation, 3) Water intrusion, 4) Plumbing, 5) Electrical, 6) HVAC, 7) Pests, 8) Environmental hazards, 9) HOA, 10) Legal disputes, 11) Unpermitted work, 12) Other defects. Seller certification and signature block. No markdown.`,
    "Inspection Contingency Waiver": `Generate an Inspection Contingency Waiver. ${base} Include: 1) Voluntary waiver, 2) As-is acceptance, 3) No warranties, 4) Risks acknowledged, 5) Other terms remain, 6) Signature blocks. No markdown.`,
    "As-Is Addendum": `Generate an As-Is Addendum. ${base} Include: 1) As-is statement, 2) No warranties, 3) No repairs or credits, 4) Buyer acknowledgment, 5) Survivability, 6) Signature blocks. No markdown.`,
    "Lead Paint Disclosure": `Generate a Lead Paint Disclosure per 42 USC 4852d. ${base} Include: 1) Federal requirement, 2) Seller disclosure checkboxes, 3) Available records, 4) EPA pamphlet acknowledgment, 5) 10-day inspection notice, 6) Signature blocks. No markdown.`,
    "Seller Financing Addendum": `Generate a Seller Financing Addendum. ${base} Include: 1) Loan amount, 2) Interest rate, 3) Term, 4) Monthly payment, 5) Late penalty, 6) Default, 7) Due-on-sale, 8) Security interest, 9) Signature blocks. No markdown.`,
  };
  return prompts[templateName] || `Generate a professional ${templateName} for US residential real estate. ${base} No markdown.`;
}

function Spinner({ dark }) {
  return <div style={{ width: 18, height: 18, border: `2px solid ${dark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)"}`, borderTop: `2px solid ${dark ? "var(--ink)" : "#fff"}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />;
}

function AuthModal({ onClose, onAuth }) {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const inp = { width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid var(--warm)", background: "#fff", fontSize: 15, outline: "none", color: "var(--ink)", transition: "border-color 0.2s" };
  const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 };

  const submitLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError(null);
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onAuth(data.user); onClose();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const submitSignup = async () => {
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true); setError(null);
    try {
      const { error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) throw error;
      setEmailSent(true);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const resendEmail = async () => {
    setResending(true);
    try { await sb.auth.resend({ type: "signup", email }); setResent(true); } catch {}
    setResending(false);
  };

  if (emailSent) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 24, maxWidth: 440, width: "100%", padding: "44px 40px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--sage)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32 }}>📧</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>Check your email</h2>
        <div style={{ background: "var(--warm)", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontWeight: 600, color: "var(--ink)", fontSize: 14 }}>{email}</div>
        <p style={{ color: "#777", lineHeight: 1.7, marginBottom: 24, fontSize: 13 }}>Click the confirmation link to activate your account. Check your spam folder if you don't see it within a few minutes.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={resendEmail} disabled={resending || resent} style={{ background: resent ? "var(--sage)" : "var(--warm)", color: resent ? "#fff" : "var(--ink)", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, cursor: "pointer" }}>
            {resending ? "Sending..." : resent ? "✓ Resent!" : "Resend confirmation email"}
          </button>
          <button onClick={() => { setMode("login"); setEmailSent(false); }} style={{ background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, cursor: "pointer" }}>I've confirmed — Log In</button>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#999", fontSize: 13, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 24, maxWidth: 440, width: "100%", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: "var(--ink)", padding: "28px 32px 24px", textAlign: "center", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>✕</button>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🏡</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{mode === "login" ? "Welcome back" : "Join DirectDeed"}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{mode === "login" ? "Sign in to your account" : "Buy or sell without a realtor — free"}</div>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid var(--warm)" }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null); setStep(1); }} style={{ flex: 1, padding: "14px", background: mode === m ? "var(--card)" : "var(--cream)", border: "none", borderBottom: mode === m ? "2px solid var(--gold)" : "2px solid transparent", fontSize: 13, fontWeight: mode === m ? 600 : 400, color: mode === m ? "var(--gold)" : "#888", cursor: "pointer", marginBottom: -1 }}>
              {m === "login" ? "Log In" : "Create Account"}
            </button>
          ))}
        </div>
        <div style={{ padding: "28px 32px 32px" }}>
          {mode === "login" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div><label style={lbl}>Email</label><input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" onFocus={e => e.target.style.borderColor="var(--gold)"} onBlur={e => e.target.style.borderColor="var(--warm)"} /></div>
              <div><label style={lbl}>Password</label><input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submitLogin()} onFocus={e => e.target.style.borderColor="var(--gold)"} onBlur={e => e.target.style.borderColor="var(--warm)"} /></div>
              {error && <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 10, padding: "10px 14px", color: "var(--rust)", fontSize: 13 }}>{error}</div>}
              <button onClick={submitLogin} disabled={loading} style={{ background: loading ? "#aaa" : "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {loading ? <Spinner /> : "Log In"}
              </button>
              <div style={{ textAlign: "center", fontSize: 13, color: "#888" }}>No account? <span onClick={() => { setMode("signup"); setError(null); }} style={{ color: "var(--gold)", cursor: "pointer", fontWeight: 600 }}>Create one free</span></div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                {["Your Name", "Email & Password", "Confirm"].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: step > i+1 ? "var(--sage)" : step === i+1 ? "var(--gold)" : "var(--warm)", color: step >= i+1 ? "#fff" : "#aaa", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 3px", fontSize: 10, fontWeight: 700 }}>{step > i+1 ? "✓" : i+1}</div>
                    <div style={{ fontSize: 9, color: step === i+1 ? "var(--gold)" : "#aaa" }}>{s}</div>
                  </div>
                ))}
              </div>
              {step === 1 && <>
                <div style={{ background: "var(--warm)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#555", lineHeight: 1.6 }}>Save thousands in commissions. DirectDeed connects buyers and sellers directly.</div>
                <div><label style={lbl}>Your Full Name</label><input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" autoFocus onFocus={e => e.target.style.borderColor="var(--gold)"} onBlur={e => e.target.style.borderColor="var(--warm)"} onKeyDown={e => e.key === "Enter" && name.trim() && setStep(2)} /></div>
                {error && <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 10, padding: "10px 14px", color: "var(--rust)", fontSize: 13 }}>{error}</div>}
                <button onClick={() => { if (!name.trim()) { setError("Please enter your name."); return; } setError(null); setStep(2); }} style={{ background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Continue</button>
              </>}
              {step === 2 && <>
                <div style={{ fontSize: 14, color: "#555" }}>Hi <strong style={{ color: "var(--ink)" }}>{name}</strong>! Set up your login.</div>
                <div><label style={lbl}>Email</label><input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" autoFocus onFocus={e => e.target.style.borderColor="var(--gold)"} onBlur={e => e.target.style.borderColor="var(--warm)"} /></div>
                <div><label style={lbl}>Password <span style={{ color: "#aaa", fontWeight: 400 }}>(min 8 characters)</span></label><input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} onFocus={e => e.target.style.borderColor="var(--gold)"} onBlur={e => e.target.style.borderColor="var(--warm)"} /></div>
                {error && <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 10, padding: "10px 14px", color: "var(--rust)", fontSize: 13 }}>{error}</div>}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setError(null); setStep(1); }} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer", color: "var(--ink)" }}>Back</button>
                  <button onClick={() => { if (!email.trim()) { setError("Enter your email."); return; } if (password.length < 8) { setError("Password must be at least 8 characters."); return; } setError(null); setStep(3); }} style={{ flex: 2, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Continue</button>
                </div>
              </>}
              {step === 3 && <>
                <div style={{ background: "var(--warm)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--ink)", lineHeight: 1.7 }}>
                  <strong>Almost done!</strong><br />Name: {name}<br />Email: {email}
                </div>
                <div><label style={lbl}>Confirm Password</label><input style={inp} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && submitSignup()} onFocus={e => e.target.style.borderColor="var(--gold)"} onBlur={e => e.target.style.borderColor="var(--warm)"} /></div>
                <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>By creating an account you agree to our <span style={{ color: "var(--gold)" }}>Terms of Service</span> and <span style={{ color: "var(--gold)" }}>Privacy Policy</span>. DirectDeed is not a licensed real estate brokerage.</div>
                {error && <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 10, padding: "10px 14px", color: "var(--rust)", fontSize: 13 }}>{error}</div>}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setError(null); setStep(2); }} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer", color: "var(--ink)" }}>Back</button>
                  <button onClick={submitSignup} disabled={loading} style={{ flex: 2, background: loading ? "#aaa" : "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    {loading ? <Spinner /> : "Create My Account"}
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

function ListingCard({ listing, onClick, onDelete, isOwner }) {
  const [hovered, setHovered] = useState(false);
  const photos = listing.photos || [];
  const cover = photos[0];
  const daysAgo = Math.floor((Date.now() - new Date(listing.created_at)) / 86400000);
  const shareUrl = window.location.origin + "?listing=" + listing.id;

  const handleShare = async (e) => {
    e.stopPropagation();
    if (navigator.share) {
      try { await navigator.share({ title: listing.address + " — DirectDeed", text: formatPrice(listing.price) + " · " + listing.beds + "bd · " + listing.city + ", " + listing.state, url: shareUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied!");
    }
  };

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16, overflow: "hidden", cursor: "pointer", transform: hovered ? "translateY(-3px)" : "none", boxShadow: hovered ? "0 12px 40px var(--shadow)" : "0 2px 12px var(--shadow)", transition: "all 0.2s ease", position: "relative" }}>
      {listing.sold && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(26,18,8,0.6)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16 }}>
          <span style={{ background: "var(--rust)", color: "#fff", fontSize: 20, fontWeight: 700, padding: "8px 24px", borderRadius: 10, letterSpacing: 2, transform: "rotate(-8deg)" }}>SOLD</span>
        </div>
      )}
      <div onClick={() => onClick(listing)} style={{ height: 180, background: "linear-gradient(135deg,var(--warm),var(--mist))", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>
        {cover ? <img src={cover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : "🏡"}
        <span style={{ position: "absolute", top: 10, right: 10, background: "var(--sage)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 20, textTransform: "uppercase" }}>FSBO</span>
        <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.92)", fontSize: 11, padding: "3px 9px", borderRadius: 20, color: "var(--ink)" }}>{daysAgo === 0 ? "Today" : daysAgo + "d ago"}</span>
        <button onClick={handleShare} style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 16, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "var(--ink)" }}>🔗 Share</button>
      </div>
      <div onClick={() => onClick(listing)} style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.2, marginBottom: 2, color: "var(--ink)" }}>{listing.address}</div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>{listing.city}, {listing.state} {listing.zip}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--gold)", marginBottom: 8 }}>{formatPrice(listing.price)}</div>
        <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#555" }}>
          <span>{listing.beds} bd</span><span>{listing.baths} ba</span><span>{Number(listing.sqft).toLocaleString()} sqft</span>
        </div>
      </div>
      {isOwner && (
        <div style={{ padding: "0 16px 14px", display: "flex", gap: 8 }}>
          <button onClick={handleShare} style={{ flex: 1, background: "var(--warm)", color: "var(--ink)", border: "none", borderRadius: 8, padding: "7px", fontSize: 12, cursor: "pointer" }}>🔗 Share</button>
          <button onClick={e => { e.stopPropagation(); onDelete(listing.id); }} style={{ flex: 1, background: "#fff5f5", color: "var(--rust)", border: "1px solid #fcc", borderRadius: 8, padding: "7px", fontSize: 12, cursor: "pointer" }}>Delete</button>
        </div>
      )}
    </div>
  );
}

function ListingModal({ listing, onClose, onMessage, onOffer, user }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  if (!listing) return null;
  const photos = listing.photos || [];
  const shareUrl = window.location.origin + "?listing=" + listing.id;

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: listing.address + " — DirectDeed", text: formatPrice(listing.price) + " · " + listing.city + ", " + listing.state, url: shareUrl }); } catch {}
    } else { await navigator.clipboard.writeText(shareUrl); alert("Link copied!"); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 20, maxWidth: 560, width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }} onClick={e => e.stopPropagation()}>
        <div style={{ height: 220, background: "linear-gradient(135deg,var(--warm),var(--mist))", borderRadius: "20px 20px 0 0", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>
          {photos.length > 0 ? <img src={photos[photoIdx]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏡"}
          {listing.sold && <div style={{ position: "absolute", inset: 0, background: "rgba(26,18,8,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ background: "var(--rust)", color: "#fff", fontSize: 28, fontWeight: 700, padding: "12px 32px", borderRadius: 12, letterSpacing: 2, transform: "rotate(-8deg)" }}>SOLD</span></div>}
          {photos.length > 1 && !listing.sold && <>
            <button onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i-1+photos.length)%photos.length); }} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 14 }}>{"<"}</button>
            <button onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i+1)%photos.length); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 14 }}>{">"}</button>
          </>}
        </div>
        <div style={{ padding: "24px 28px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, flex: 1, color: "var(--ink)" }}>{listing.address}</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888", marginLeft: 10 }}>✕</button>
          </div>
          <div style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>{listing.city}, {listing.state} {listing.zip} · {listing.type}</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--gold)", marginBottom: 16 }}>{formatPrice(listing.price)}</div>
          <div style={{ display: "flex", gap: 16, fontSize: 14, color: "#555", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--warm)" }}>
            <span>{listing.beds} Beds</span><span>{listing.baths} Baths</span><span>{Number(listing.sqft).toLocaleString()} sqft</span>
          </div>
          {listing.description && <p style={{ fontSize: 14, lineHeight: 1.8, color: "#444", marginBottom: 16 }}>{listing.description}</p>}
          <div style={{ background: "var(--warm)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>👤</span>
            <div><div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{listing.seller_name}</div><div style={{ fontSize: 12, color: "#666" }}>Owner · No commission</div></div>
          </div>
          <div style={{ background: "var(--cream)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, border: "1px solid var(--warm)" }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Share this listing</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleShare} style={{ flex: 1, background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer" }}>🔗 Copy Link</button>
              <a href={"https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(shareUrl)} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: "#1877f2", color: "#fff", borderRadius: 8, padding: "8px", fontSize: 12, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>📘 Facebook</a>
              <a href={"https://twitter.com/intent/tweet?url=" + encodeURIComponent(shareUrl) + "&text=" + encodeURIComponent(formatPrice(listing.price) + " home for sale - " + listing.address)} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: "#000", color: "#fff", borderRadius: 8, padding: "8px", fontSize: 12, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>✕ Post</a>
            </div>
          </div>
          {!listing.sold ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { onMessage(listing); onClose(); }} style={{ flex: 1, background: "var(--warm)", color: "var(--ink)", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Message Seller</button>
              <button onClick={() => { onOffer(listing); onClose(); }} style={{ flex: 2, background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Make an Offer</button>
            </div>
          ) : (
            <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 12, padding: "14px", textAlign: "center", color: "var(--rust)", fontWeight: 500 }}>This property has been sold.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function BrowseTab({ onMessage, onOffer, user, deepLinkListingId, onClearDeepLink }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState(2000000);
  const [minBeds, setMinBeds] = useState(0);
  const [showSold, setShowSold] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    sb.from("listings").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setListings(data || []); setLoading(false); });
  }, []);

  useEffect(() => {
    if (deepLinkListingId && listings.length > 0) {
      const found = listings.find(l => l.id === deepLinkListingId);
      if (found) { setSelected(found); onClearDeepLink(); }
    }
  }, [deepLinkListingId, listings]);

  const filtered = listings.filter(l =>
    (l.address + " " + l.city + " " + l.state + " " + (l.zip || "")).toLowerCase().includes(search.toLowerCase()) &&
    Number(l.price) <= maxPrice && Number(l.beds) >= minBeds && (showSold ? true : !l.sold)
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search address, city, or ZIP..." style={{ flex: 2, minWidth: 180, padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "var(--card)", fontSize: 14, outline: "none", color: "var(--ink)" }} />
        <select value={minBeds} onChange={e => setMinBeds(Number(e.target.value))} style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "var(--card)", fontSize: 13, cursor: "pointer", color: "var(--ink)" }}>
          <option value={0}>Any beds</option><option value={2}>2+</option><option value={3}>3+</option><option value={4}>4+</option>
        </select>
        <select value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "var(--card)", fontSize: 13, cursor: "pointer", color: "var(--ink)" }}>
          <option value={2000000}>Any price</option><option value={400000}>Under $400k</option><option value={600000}>Under $600k</option><option value={800000}>Under $800k</option><option value={1000000}>Under $1M</option>
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#555", cursor: "pointer" }}>
          <input type="checkbox" checked={showSold} onChange={e => setShowSold(e.target.checked)} />Show sold
        </label>
      </div>
      {loading && <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>Loading listings...</div>}
      {!loading && (
        <div className="listing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 20 }}>
          {filtered.map(l => <ListingCard key={l.id} listing={l} onClick={setSelected} onDelete={() => {}} isOwner={false} />)}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", color: "#888", padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏡</div>
          <div style={{ fontSize: 20, marginBottom: 8, color: "var(--ink)" }}>No listings found</div>
          <div style={{ fontSize: 14 }}>Try adjusting your filters.</div>
        </div>
      )}
      <ListingModal listing={selected} onClose={() => setSelected(null)} onMessage={onMessage} onOffer={onOffer} user={user} />
    </div>
  );
}
function MakeOfferModal({ listing, user, onClose, onRequireAuth }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    offer_price: listing?.price || "",
    earnest_money: "",
    closing_date: "",
    financing_contingency: true,
    inspection_contingency: true,
    appraisal_contingency: true,
    message: "",
    buyer_name: user?.user_metadata?.full_name || "",
    buyer_email: user?.email || "",
    buyer_phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "#fff", fontSize: 14, outline: "none", color: "var(--ink)" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 5, textTransform: "uppercase" };

  if (!user) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 20, maxWidth: 400, width: "100%", padding: "36px 32px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 26, marginBottom: 12, color: "var(--ink)" }}>Sign in to make an offer</h2>
        <p style={{ color: "#666", marginBottom: 24, lineHeight: 1.7 }}>Create a free account to submit and track your offers.</p>
        <button onClick={() => { onClose(); onRequireAuth(); }} style={{ background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, cursor: "pointer", fontWeight: 600 }}>Sign Up Free</button>
      </div>
    </div>
  );

  const submit = async () => {
    setSubmitting(true); setError(null);
    try {
      const { error: insertErr } = await sb.from("offers").insert([{
        listing_id: listing.id, buyer_id: user.id, seller_id: listing.user_id,
        buyer_name: form.buyer_name, buyer_email: form.buyer_email, buyer_phone: form.buyer_phone,
        offer_price: Number(form.offer_price), earnest_money: Number(form.earnest_money),
        closing_date: form.closing_date,
        financing_contingency: form.financing_contingency,
        inspection_contingency: form.inspection_contingency,
        appraisal_contingency: form.appraisal_contingency,
        message: form.message, status: "pending", step: "offer", step_index: 1,
      }]);
      if (insertErr) throw new Error(insertErr.message);
      await sendNotification(listing.user_id, "New offer of " + formatPrice(form.offer_price) + " on " + listing.address, "offers");
      await sendEmail(listing.seller_email, "New Offer on " + listing.address,
        "<h2 style='font-family:sans-serif;color:#1a1208'>You have a new offer!</h2><p style='font-family:sans-serif;color:#444'><strong>" + form.buyer_name + "</strong> has offered <strong>" + formatPrice(form.offer_price) + "</strong> on " + listing.address + ". Closing date: <strong>" + (form.closing_date || "TBD") + "</strong>. Log in to DirectDeed to respond.</p>"
      );
      setSubmitted(true);
    } catch (e) { setError(e.message); }
    setSubmitting(false);
  };

  if (submitted) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 20, maxWidth: 420, width: "100%", padding: "40px 36px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 28, marginBottom: 12, color: "var(--ink)" }}>Offer Submitted!</h2>
        <p style={{ color: "#555", lineHeight: 1.8, marginBottom: 24 }}>Your offer of {formatPrice(form.offer_price)} on {listing.address} has been sent. Track it in the Offers tab.</p>
        <button onClick={onClose} style={{ background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, cursor: "pointer", fontWeight: 600 }}>Done</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 20, maxWidth: 540, width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: "var(--ink)" }}>Make an Offer</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
          </div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>{listing.address}, {listing.city}, {listing.state} {listing.zip} · Listed at {formatPrice(listing.price)}</div>

          <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
            {["Offer Terms", "Contingencies", "Your Info"].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: step > i+1 ? "var(--sage)" : step === i+1 ? "var(--gold)" : "var(--warm)", color: step >= i+1 ? "#fff" : "#aaa", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 3px", fontSize: 10, fontWeight: 700 }}>{step > i+1 ? "✓" : i+1}</div>
                <div style={{ fontSize: 9, color: step === i+1 ? "var(--gold)" : "#aaa" }}>{s}</div>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Your Offer Price</label>
                <input style={inp} type="number" value={form.offer_price} onChange={e => update("offer_price", e.target.value)} placeholder="480000" />
                {listing.price && Number(form.offer_price) > 0 && Number(form.offer_price) < Number(listing.price) && <div style={{ fontSize: 11, color: "var(--rust)", marginTop: 3 }}>{Math.round((1 - Number(form.offer_price) / Number(listing.price)) * 100)}% below asking</div>}
                {listing.price && Number(form.offer_price) > Number(listing.price) && <div style={{ fontSize: 11, color: "var(--sage)", marginTop: 3 }}>{Math.round((Number(form.offer_price) / Number(listing.price) - 1) * 100)}% above asking</div>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={lbl}>Earnest Money</label><input style={inp} type="number" value={form.earnest_money} onChange={e => update("earnest_money", e.target.value)} placeholder="5000" /></div>
                <div>
                  <label style={lbl}>Closing Date <span style={{ color: "#888", fontWeight: 400, textTransform: "none" }}>— key term</span></label>
                  <input style={inp} type="date" value={form.closing_date} onChange={e => update("closing_date", e.target.value)} />
                </div>
              </div>
              <div><label style={lbl}>Message to Seller (optional)</label>
                <textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} value={form.message} onChange={e => update("message", e.target.value)} placeholder="Introduce yourself and why you love the home..." />
              </div>
              <button onClick={() => setStep(2)} style={{ background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, cursor: "pointer", fontWeight: 600 }}>Continue</button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "var(--warm)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                Contingencies protect you as a buyer. Keeping them gives you an exit if something goes wrong. Waiving them makes your offer more competitive.
              </div>
              {[
                { key: "financing_contingency", label: "Financing Contingency", desc: "Protects you if your loan falls through." },
                { key: "inspection_contingency", label: "Inspection Contingency", desc: "Lets you negotiate or walk away after inspection." },
                { key: "appraisal_contingency", label: "Appraisal Contingency", desc: "Protects you if the home appraises below offer price." },
              ].map(c => (
                <div key={c.key} style={{ background: form[c.key] ? "#f0fff4" : "#fff5f5", border: "1px solid " + (form[c.key] ? "#9ae6b4" : "#fcc"), borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }} onClick={() => update(c.key, !form[c.key])}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: form[c.key] ? "var(--sage)" : "#ddd", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    {form[c.key] && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, color: "var(--ink)" }}>{c.label}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{c.desc}</div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer", color: "var(--ink)" }}>Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 2, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={lbl}>Your Full Name</label><input style={inp} value={form.buyer_name} onChange={e => update("buyer_name", e.target.value)} placeholder="John Smith" /></div>
              <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.buyer_email} onChange={e => update("buyer_email", e.target.value)} placeholder="john@email.com" /></div>
              <div><label style={lbl}>Phone</label><input style={inp} type="tel" value={form.buyer_phone} onChange={e => update("buyer_phone", e.target.value)} placeholder="(555) 123-4567" /></div>
              <div style={{ background: "var(--warm)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--ink)", lineHeight: 1.7 }}>
                <strong>Summary:</strong> {formatPrice(form.offer_price)} · Earnest: {formatPrice(form.earnest_money)} · Closing: {form.closing_date || "TBD"}<br />
                Contingencies: {[form.financing_contingency && "Financing", form.inspection_contingency && "Inspection", form.appraisal_contingency && "Appraisal"].filter(Boolean).join(", ") || "None"}
              </div>
              {error && <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 10, padding: "10px 14px", color: "var(--rust)", fontSize: 13 }}>{error}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer", color: "var(--ink)" }}>Back</button>
                <button onClick={submit} disabled={submitting} style={{ flex: 2, background: submitting ? "#aaa" : "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  {submitting ? <Spinner /> : "Submit Offer"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SignaturePad({ onSign }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [signed, setSigned] = useState(false);
  const getPos = (e, canvas) => { const rect = canvas.getBoundingClientRect(); const cx = e.touches ? e.touches[0].clientX : e.clientX; const cy = e.touches ? e.touches[0].clientY : e.clientY; return { x: cx - rect.left, y: cy - rect.top }; };
  const start = e => { const canvas = canvasRef.current; const ctx = canvas.getContext("2d"); const pos = getPos(e, canvas); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); setDrawing(true); };
  const draw = e => { if (!drawing) return; const canvas = canvasRef.current; const ctx = canvas.getContext("2d"); const pos = getPos(e, canvas); ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = "#1a1208"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke(); setSigned(true); };
  const stop = () => setDrawing(false);
  const clear = () => { const canvas = canvasRef.current; canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); setSigned(false); };
  return (
    <div>
      <div style={{ border: "1.5px solid var(--warm)", borderRadius: 10, background: "#fff", marginBottom: 8 }}>
        <canvas ref={canvasRef} width={460} height={100} style={{ display: "block", cursor: "crosshair", width: "100%", height: 100 }}
          onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} />
      </div>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Sign above using mouse or finger</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={clear} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 8, padding: "7px", fontSize: 12, cursor: "pointer", color: "var(--ink)" }}>Clear</button>
        <button onClick={() => signed && onSign(canvasRef.current.toDataURL())} disabled={!signed} style={{ flex: 2, background: signed ? "var(--sage)" : "#ccc", color: "#fff", border: "none", borderRadius: 8, padding: "7px", fontSize: 12, cursor: signed ? "pointer" : "default" }}>Apply Signature</button>
      </div>
    </div>
  );
}

function DocGenerator({ templateName, offer, onClose }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await callClaude([{ role: "user", content: getContractPrompt(templateName, offer) }], 2000);
      setText(result);
      setDone(true);
    } catch (e) { setText("Error generating document. Please try again."); setDone(true); }
    setLoading(false);
  };

  useEffect(() => { generate(); }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 20, maxWidth: 600, width: "100%", maxHeight: "85vh", overflow: "auto", padding: "28px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 20, color: "var(--ink)" }}>{templateName}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
        </div>
        {loading && (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            <Spinner dark /><br /><br />Preparing your document...<br /><span style={{ fontSize: 12 }}>This takes about 15 seconds</span>
          </div>
        )}
        {done && (
          <>
            <div style={{ background: "#fffbf0", border: "1px solid var(--warm)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "var(--rust)", marginBottom: 14 }}>
              Review carefully. Consult a licensed real estate attorney before signing.
            </div>
            <div style={{ background: "var(--cream)", borderRadius: 10, padding: "16px", fontSize: 12, lineHeight: 1.9, color: "#333", whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", maxHeight: 400, overflow: "auto", marginBottom: 16 }}>{text}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 12, padding: "11px", fontSize: 13, cursor: "pointer", color: "var(--ink)" }}>Close</button>
              <button onClick={() => { const b = new Blob([text], { type: "text/plain" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = templateName.replace(/\s/g, "_") + ".txt"; a.click(); }} style={{ flex: 2, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "11px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Download Document</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StepCard({ step, offer, user, onUpdate, isExpanded, onToggle }) {
  const isSeller = user?.id === offer.seller_id;
  const isBuyer = user?.id === offer.buyer_id;
  const isCompleted = offer.step_index > step.id;
  const isLocked = offer.step_index < step.id;
  const isCurrent = offer.step_index === step.id;
  const isMyTurn = (step.owner === "buyer" && isBuyer) || (step.owner === "seller" && isSeller) || step.owner === "both";
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [signed, setSigned] = useState(false);
  const [sellerSigned, setSellerSigned] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showCounter, setShowCounter] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);
  const [counterForm, setCounterForm] = useState({ counter_price: "", counter_closing_date: "", counter_message: "" });
  const [showMsg, setShowMsg] = useState(false);
  const [msgInput, setMsgInput] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [sendingMsg, setSendingMsg] = useState(false);
  const inp = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "#fff", fontSize: 13, outline: "none", color: "var(--ink)" };

  useEffect(() => {
    if (showMsg) loadMsgs();
  }, [showMsg]);

  const loadMsgs = async () => {
    const { data } = await sb.from("direct_messages").select("*")
      .eq("listing_id", offer.listing_id)
      .or("and(user_id.eq." + offer.buyer_id + ",recipient_id.eq." + offer.seller_id + "),and(user_id.eq." + offer.seller_id + ",recipient_id.eq." + offer.buyer_id + ")")
      .order("created_at", { ascending: true });
    setMsgs(data || []);
  };

  const sendMsg = async () => {
    if (!msgInput.trim()) return;
    setSendingMsg(true);
    const recipientId = isBuyer ? offer.seller_id : offer.buyer_id;
    const recipientName = isBuyer ? (offer.listings?.seller_name || "Seller") : offer.buyer_name;
    const { data } = await sb.from("direct_messages").insert([{
      listing_id: offer.listing_id,
      user_id: user.id,
      recipient_id: recipientId,
      sender_name: user.user_metadata?.full_name || user.email,
      recipient_name: recipientName,
      body: msgInput.trim(),
      read: false,
    }]).select();
    if (data) {
      setMsgs(prev => [...prev, data[0]]);
      setMsgInput("");
      await sendNotification(recipientId, "New message about " + (offer.listings?.address || "your transaction"), "offers");
    }
    setSendingMsg(false);
  };

  const uploadDoc = async (file) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = "offers/" + offer.id + "/" + step.key + "-" + Date.now() + "." + ext;
    const { error } = await sb.storage.from("property-photos").upload(path, file, { contentType: file.type });
    if (!error) {
      const { data: { publicUrl } } = sb.storage.from("property-photos").getPublicUrl(path);
      setUploadedFile(publicUrl);
    }
    setUploading(false);
  };

  const advance = async () => {
    setLoading(true);
    const nextIndex = offer.step_index + 1;
    const nextStep = TRANSACTION_STEPS[nextIndex - 1];
    const updates = { step_index: nextIndex, step: nextStep?.key || "closing" };
    if (uploadedFile) updates["step_" + step.key + "_doc"] = uploadedFile;
    if (step.key === "closing") {
      updates.status = "closed";
      await sb.from("listings").update({ sold: true, sold_at: new Date().toISOString() }).eq("id", offer.listing_id);
    }
    const { error } = await sb.from("offers").update(updates).eq("id", offer.id);
    if (!error) {
      const otherId = isSeller ? offer.buyer_id : offer.seller_id;
      const otherEmail = isSeller ? offer.buyer_email : offer.listings?.seller_email;
      const nextLabel = nextStep?.label || "Closing";
      await sendNotification(otherId, step.label + " complete. Next: " + nextLabel, "offers");
      await sendEmail(otherEmail, "Transaction Update: " + step.label + " Complete",
        "<h2 style='font-family:sans-serif;color:#1a1208'>" + step.label + " complete.</h2><p style='font-family:sans-serif;color:#444'>Next step: <strong>" + nextLabel + "</strong>. Log in to DirectDeed to continue.</p>"
      );
      onUpdate({ ...offer, ...updates });
    }
    setLoading(false);
  };

  const respondToOffer = async (status) => {
    setLoading(true);
    const updates = { status };
    if (status === "accepted") { updates.step = "preapproval"; updates.step_index = 2; }
    const { error } = await sb.from("offers").update(updates).eq("id", offer.id);
    if (!error) {
      const msg = status === "accepted" ? "Your offer was accepted! Next: upload your pre-approval or proof of funds." : "Your offer was declined.";
      await sendNotification(offer.buyer_id, msg, "offers");
      await sendEmail(offer.buyer_email, "Offer Update on " + (offer.listings?.address || "property"),
        "<h2 style='font-family:sans-serif;color:#1a1208'>Your offer was " + status + ".</h2>" +
        (status === "accepted" ? "<p style='font-family:sans-serif;color:#444'>Next: upload your mortgage pre-approval or proof of funds in DirectDeed.</p>" : "")
      );
      onUpdate({ ...offer, ...updates });
    }
    setLoading(false);
  };

  const submitCounter = async () => {
    setLoading(true);
    const updates = { status: "countered", counter_price: Number(counterForm.counter_price) || null, counter_closing_date: counterForm.counter_closing_date || null, counter_message: counterForm.counter_message };
    const { error } = await sb.from("offers").update(updates).eq("id", offer.id);
    if (!error) {
      await sendNotification(offer.buyer_id, "The seller countered your offer. Log in to respond.", "offers");
      onUpdate({ ...offer, ...updates });
      setShowCounter(false);
    }
    setLoading(false);
  };

  const acceptCounter = async () => {
    setLoading(true);
    const updates = { status: "accepted", offer_price: offer.counter_price || offer.offer_price, closing_date: offer.counter_closing_date || offer.closing_date, step: "preapproval", step_index: 2, counter_price: null, counter_closing_date: null, counter_message: null };
    const { error } = await sb.from("offers").update(updates).eq("id", offer.id);
    if (!error) {
      await sendNotification(offer.seller_id, "Buyer accepted your counteroffer! Next: pre-approval upload.", "offers");
      onUpdate({ ...offer, ...updates });
    }
    setLoading(false);
  };

  // COMPLETED STEP — expandable
  if (isCompleted) return (
    <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={onToggle} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <span style={{ fontSize: 18 }}>{step.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--sage)" }}>Step {step.id}: {step.label}</div>
          <div style={{ fontSize: 11, color: "var(--sage)" }}>Completed ✓ — {isExpanded ? "tap to collapse" : "tap to review"}</div>
        </div>
        <span style={{ color: "var(--sage)", fontSize: 14 }}>{isExpanded ? "▲" : "▼"}</span>
      </div>
      {isExpanded && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid #9ae6b4" }}>
          <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "10px 14px", marginTop: 10, fontSize: 12, color: "#444", lineHeight: 1.7 }}>
            <strong>What happened:</strong> {step.desc}<br />
            {offer["step_" + step.key + "_doc"] && <><strong>Document:</strong> <a href={offer["step_" + step.key + "_doc"]} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>View uploaded document</a><br /></>}
          </div>
          {step.relatedDocs.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>Related documents:</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {step.relatedDocs.map(doc => (
                  <button key={doc} onClick={() => setActiveDoc(doc)} style={{ background: "var(--warm)", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer", color: "var(--ink)" }}>📋 {doc}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {activeDoc && <DocGenerator templateName={activeDoc} offer={offer} onClose={() => setActiveDoc(null)} />}
    </div>
  );

  // LOCKED STEP
  if (isLocked) return (
    <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 12, padding: "12px 16px", marginBottom: 8, opacity: 0.45 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>{step.icon}</span>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 500, fontSize: 13, color: "var(--ink)" }}>Step {step.id}: {step.label}</div><div style={{ fontSize: 11, color: "#aaa" }}>Complete previous steps first</div></div>
        <span>🔒</span>
      </div>
    </div>
  );

  // CURRENT ACTIVE STEP
  return (
    <div style={{ background: "var(--card)", border: "2px solid var(--gold)", borderRadius: 12, padding: "18px", marginBottom: 10, animation: "fadeIn 0.3s ease" }}>
      {activeDoc && <DocGenerator templateName={activeDoc} offer={offer} onClose={() => setActiveDoc(null)} />}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{step.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>Step {step.id}: {step.label}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{step.desc}</div>
        </div>
        {isMyTurn ? <span style={{ background: "var(--gold)", color: "#fff", fontSize: 9, padding: "3px 8px", borderRadius: 10, fontWeight: 700 }}>YOUR TURN</span>
                  : <span style={{ background: "#eee", color: "#666", fontSize: 9, padding: "3px 8px", borderRadius: 10, fontWeight: 700 }}>WAITING</span>}
      </div>

      <div style={{ background: "var(--cream)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "var(--ink)", lineHeight: 1.7, border: "1px solid var(--warm)" }}>
        {isBuyer ? step.buyerAction : step.sellerAction}
      </div>

      {/* ESCROW GUIDANCE — Step 3 */}
      {step.key === "earnest" && isBuyer && (
        <div style={{ background: "#fffbf0", border: "1px solid #f0d080", borderRadius: 10, padding: "14px", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "var(--gold)", marginBottom: 8 }}>📋 How to Deposit Earnest Money</div>
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
            <strong>1. Choose a title company or real estate attorney</strong> in the property's state to act as your escrow agent.<br />
            <strong>2. Search for options:</strong> Google "[your state] title companies" or "[city] real estate closing attorney."<br />
            <strong>3. Contact them</strong> with the property address, purchase price, buyer and seller names.<br />
            <strong>4. Wire funds</strong> using their instructions. <strong style={{ color: "var(--rust)" }}>Never wire directly to the seller.</strong><br />
            <strong>5. Upload your receipt</strong> below to advance the transaction.
          </div>
        </div>
      )}

      {/* PRE-APPROVAL GUIDANCE — Step 2 */}
      {step.key === "preapproval" && isBuyer && (
        <div style={{ background: "#f0f6ff", border: "1px solid #90c0f0", borderRadius: 10, padding: "14px", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "#1d4ed8", marginBottom: 8 }}>🏦 What to Upload</div>
          <div style={{ fontSize: 12, color: "#444", lineHeight: 1.8 }}>
            <strong>If financing:</strong> Upload your mortgage pre-approval letter from your lender. This confirms your loan amount and that a lender has reviewed your finances.<br />
            <strong>If paying cash:</strong> Upload a bank statement or proof of funds letter showing sufficient funds to cover the purchase price.
          </div>
        </div>
      )}

      {/* TITLE SEARCH GUIDANCE — Step 8 */}
      {step.key === "title" && isSeller && (
        <div style={{ background: "#f5f0ff", border: "1px solid #c0a0f0", borderRadius: 10, padding: "14px", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "#6d28d9", marginBottom: 8 }}>📜 How to Clear Title</div>
          <div style={{ fontSize: 12, color: "#444", lineHeight: 1.8 }}>
            <strong>1. Contact the same title company</strong> handling escrow (or hire one if you haven't yet).<br />
            <strong>2. They will search</strong> for any liens, unpaid mortgages, judgments, or HOA dues on the property.<br />
            <strong>3. Common issues to resolve:</strong> Pay off any remaining mortgage balance, clear any contractor liens or tax liens, resolve any HOA arrears.<br />
            <strong>4. Title insurance</strong> will be issued to the buyer — the title company handles this.<br />
            <strong>5. Once clear</strong>, the title company confirms and you upload confirmation below.
          </div>
        </div>
      )}

      {/* OFFER STEP — Seller actions */}
      {step.key === "offer" && offer.status === "pending" && isSeller && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div style={{ background: "var(--warm)", borderRadius: 8, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase" }}>Offer Price</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--gold)" }}>{formatPrice(offer.offer_price)}</div>
            </div>
            <div style={{ background: "var(--warm)", borderRadius: 8, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase" }}>Earnest</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>{formatPrice(offer.earnest_money)}</div>
            </div>
            <div style={{ background: "var(--warm)", borderRadius: 8, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase" }}>Closing Date</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{offer.closing_date || "TBD"}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>Contingencies: {[offer.financing_contingency && "Financing", offer.inspection_contingency && "Inspection", offer.appraisal_contingency && "Appraisal"].filter(Boolean).join(", ") || "None"}</div>
          {offer.message && <div style={{ background: "var(--cream)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#555", fontStyle: "italic", border: "1px solid var(--warm)" }}>"{offer.message}"</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => respondToOffer("accepted")} disabled={loading} style={{ flex: 2, background: "var(--sage)", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {loading ? <Spinner /> : "Accept Offer"}
            </button>
            <button onClick={() => setShowCounter(!showCounter)} style={{ flex: 1, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Counter</button>
            <button onClick={() => respondToOffer("declined")} disabled={loading} style={{ flex: 1, background: "#fff5f5", color: "var(--rust)", border: "1px solid #fcc", borderRadius: 10, padding: "11px", fontSize: 12, cursor: "pointer" }}>Decline</button>
          </div>
          {showCounter && (
            <div style={{ background: "var(--cream)", borderRadius: 10, padding: "14px", border: "1px solid var(--warm)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>Your Counteroffer</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div><label style={{ display: "block", fontSize: 11, color: "#555", marginBottom: 3 }}>Counter Price (leave blank to keep original)</label><input style={inp} type="number" value={counterForm.counter_price} onChange={e => setCounterForm(f => ({ ...f, counter_price: e.target.value }))} placeholder={offer.offer_price} /></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#555", marginBottom: 3 }}>Counter Closing Date</label><input style={inp} type="date" value={counterForm.counter_closing_date} onChange={e => setCounterForm(f => ({ ...f, counter_closing_date: e.target.value }))} /></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#555", marginBottom: 3 }}>Message</label><textarea style={{ ...inp, minHeight: 60, resize: "vertical" }} value={counterForm.counter_message} onChange={e => setCounterForm(f => ({ ...f, counter_message: e.target.value }))} placeholder="Explain your counteroffer..." /></div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowCounter(false)} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 8, padding: "9px", fontSize: 12, cursor: "pointer", color: "var(--ink)" }}>Cancel</button>
                  <button onClick={submitCounter} disabled={loading} style={{ flex: 2, background: "var(--rust)", color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: 12, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {loading ? <Spinner /> : "Send Counteroffer"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step.key === "offer" && offer.status === "pending" && isBuyer && (
        <div style={{ background: "var(--cream)", borderRadius: 8, padding: "12px", fontSize: 13, color: "#555", textAlign: "center", border: "1px solid var(--warm)" }}>
          Waiting for seller to respond...
          <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 5 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gold)", animation: "pulse 1.4s " + (i*0.2) + "s infinite" }} />)}
          </div>
        </div>
      )}

      {step.key === "offer" && offer.status === "countered" && isBuyer && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: "#fff8f0", border: "1px solid #fcd", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--rust)", fontSize: 13 }}>Counteroffer Received</div>
            {offer.counter_price && <div style={{ fontSize: 13, color: "var(--ink)", marginBottom: 2 }}>Counter Price: <strong>{formatPrice(offer.counter_price)}</strong></div>}
            {offer.counter_closing_date && <div style={{ fontSize: 13, color: "var(--ink)", marginBottom: 2 }}>Counter Closing: <strong>{offer.counter_closing_date}</strong></div>}
            {offer.counter_message && <div style={{ fontSize: 12, color: "#555", fontStyle: "italic", marginTop: 4 }}>"{offer.counter_message}"</div>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={acceptCounter} disabled={loading} style={{ flex: 2, background: "var(--sage)", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {loading ? <Spinner /> : "Accept Counter"}
            </button>
            <button onClick={() => respondToOffer("declined")} disabled={loading} style={{ flex: 1, background: "#fff5f5", color: "var(--rust)", border: "1px solid #fcc", borderRadius: 10, padding: "11px", fontSize: 12, cursor: "pointer" }}>Decline</button>
          </div>
        </div>
      )}

      {step.key === "offer" && offer.status === "countered" && isSeller && (
        <div style={{ background: "var(--cream)", borderRadius: 8, padding: "12px", fontSize: 13, color: "#555", textAlign: "center", border: "1px solid var(--warm)" }}>Waiting for buyer to respond to your counteroffer...</div>
      )}

      {/* ALL OTHER STEPS — active party actions */}
      {step.key !== "offer" && isMyTurn && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px dashed var(--warm)", borderRadius: 10, padding: "10px 14px", cursor: "pointer", background: "#fff" }}>
            <span style={{ fontSize: 18 }}>📎</span>
            <span style={{ fontSize: 12, color: "#666" }}>{uploading ? "Uploading..." : uploadedFile ? "✓ Document uploaded" : "Upload document or confirmation"}</span>
            <input type="file" style={{ display: "none" }} onChange={e => e.target.files[0] && uploadDoc(e.target.files[0])} />
          </label>
          {uploadedFile && <div style={{ fontSize: 11, color: "var(--sage)" }}>✓ Ready to submit</div>}

          {step.relatedDocs.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>Generate related document:</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {step.relatedDocs.map(doc => (
                  <button key={doc} onClick={() => setActiveDoc(doc)} style={{ background: "var(--warm)", border: "1px solid var(--warm)", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer", color: "var(--ink)" }}>📋 {doc}</button>
                ))}
              </div>
            </div>
          )}

          <textarea style={{ ...inp, minHeight: 50, resize: "vertical", fontSize: 12 }} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note for the other party (optional)..." />

          {step.key === "closing" && (
            <div>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 6, fontWeight: 600 }}>E-SIGNATURE REQUIRED</div>
              {isBuyer && !signed ? <SignaturePad onSign={() => setSigned(true)} /> : isBuyer && signed && <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 8, padding: "10px", fontSize: 12, color: "var(--sage)" }}>✓ Buyer signature captured</div>}
              {isSeller && !sellerSigned ? <SignaturePad onSign={() => setSellerSigned(true)} /> : isSeller && sellerSigned && <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 8, padding: "10px", fontSize: 12, color: "var(--sage)" }}>✓ Seller signature captured</div>}
            </div>
          )}

          <button onClick={advance} disabled={loading || (step.key === "closing" && ((isBuyer && !signed) || (isSeller && !sellerSigned)))}
            style={{ background: loading ? "#aaa" : "var(--sage)", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <Spinner /> : step.key === "closing" ? "Complete Transaction 🎉" : "Mark Complete & Continue →"}
          </button>
        </div>
      )}

      {step.key !== "offer" && !isMyTurn && (
        <div style={{ background: "var(--cream)", borderRadius: 8, padding: "12px", fontSize: 13, color: "#555", textAlign: "center", border: "1px solid var(--warm)" }}>
          Waiting for {step.owner === "buyer" ? "buyer" : "seller"} to complete this step...
          <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 5 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gold)", animation: "pulse 1.4s " + (i*0.2) + "s infinite" }} />)}
          </div>
        </div>
      )}

      {/* INLINE MESSAGING */}
      <div style={{ marginTop: 12, borderTop: "1px solid var(--warm)", paddingTop: 10 }}>
        <button onClick={() => setShowMsg(!showMsg)} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 12, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          💬 {showMsg ? "Hide" : "Message"} {isBuyer ? "Seller" : "Buyer"}
        </button>
        {showMsg && (
          <div style={{ marginTop: 10 }}>
            <div style={{ maxHeight: 160, overflow: "auto", marginBottom: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {msgs.length === 0 && <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", padding: "10px" }}>No messages yet</div>}
              {msgs.map((m, i) => {
                const isMe = m.user_id === user.id;
                return (
                  <div key={i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                    <div style={{ background: isMe ? "var(--sage)" : "var(--warm)", color: isMe ? "#fff" : "var(--ink)", borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px", padding: "7px 10px", fontSize: 12, maxWidth: "80%", lineHeight: 1.5 }}>{m.body}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()} placeholder="Type a message..." style={{ flex: 1, padding: "8px 12px", borderRadius: 20, border: "1.5px solid var(--warm)", background: "#fff", fontSize: 12, outline: "none", color: "var(--ink)" }} />
              <button onClick={sendMsg} disabled={sendingMsg || !msgInput.trim()} style={{ background: msgInput.trim() ? "var(--sage)" : "#ddd", color: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function OffersTab({ user, onRequireAuth }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOffer, setActiveOffer] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
  }, [user]);

  const load = async () => {
    const { data } = await sb.from("offers")
      .select("*, listings(address, city, state, zip, seller_name, price, user_id, seller_email)")
      .or("buyer_id.eq." + user.id + ",seller_id.eq." + user.id)
      .order("created_at", { ascending: false });
    setOffers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    sb.from("notifications").select("id", { count: "exact" }).eq("user_id", user.id).eq("read", false)
      .then(({ count }) => setUnreadCount(count || 0));
    const sub = sb.channel("offer-notifs-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: "user_id=eq." + user.id },
        () => setUnreadCount(c => c + 1))
      .subscribe();
    return () => sb.removeChannel(sub);
  }, [user?.id]);

  const updateOffer = (updated) => {
    setOffers(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
    if (activeOffer?.id === updated.id) setActiveOffer(prev => ({ ...prev, ...updated }));
  };

  const toggleStep = (stepId) => setExpandedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));

  if (!user) return (
    <div style={{ maxWidth: 460, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <h2 style={{ fontSize: 30, marginBottom: 12, color: "var(--ink)" }}>Your Offers</h2>
      <p style={{ color: "#666", lineHeight: 1.7, marginBottom: 28 }}>Sign in to view and manage your offers.</p>
      <button onClick={onRequireAuth} style={{ background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, cursor: "pointer", fontWeight: 600 }}>Sign In</button>
    </div>
  );

  if (activeOffer) {
    const currentStepIndex = activeOffer.step_index || 1;
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}>
        <button onClick={() => setActiveOffer(null)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          ← Back to Offers
        </button>

        {/* Offer summary */}
        <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2, color: "var(--ink)" }}>{activeOffer.listings?.address}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{activeOffer.listings?.city}, {activeOffer.listings?.state} {activeOffer.listings?.zip}</div>
            </div>
            <span style={{ background: activeOffer.status === "accepted" || activeOffer.status === "closed" ? "var(--sage)" : activeOffer.status === "declined" ? "#aaa" : activeOffer.status === "countered" ? "var(--rust)" : "var(--gold)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 16, textTransform: "uppercase" }}>{activeOffer.status}</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              ["Offer Price", formatPrice(activeOffer.offer_price), "var(--gold)"],
              ["Earnest Money", formatPrice(activeOffer.earnest_money), "var(--ink)"],
              ["Closing Date", activeOffer.closing_date || "TBD", "var(--ink)"],
              ["Contingencies", [activeOffer.financing_contingency && "Fin", activeOffer.inspection_contingency && "Insp", activeOffer.appraisal_contingency && "Appr"].filter(Boolean).join(", ") || "None", "#555"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: "var(--warm)", borderRadius: 8, padding: "8px 12px", flex: 1, minWidth: 90 }}>
                <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="step-tracker" style={{ overflowX: "auto", marginBottom: 16, paddingBottom: 6 }}>
          <div style={{ display: "flex", minWidth: 520 }}>
            {TRANSACTION_STEPS.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{ textAlign: "center", width: 52 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: currentStepIndex > s.id ? "var(--sage)" : currentStepIndex === s.id ? "var(--gold)" : "var(--warm)", color: currentStepIndex >= s.id ? "#fff" : "#aaa", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 3px", fontSize: 11 }}>
                    {currentStepIndex > s.id ? "✓" : s.icon}
                  </div>
                  <div style={{ fontSize: 7, color: currentStepIndex === s.id ? "var(--gold)" : "#aaa", lineHeight: 1.2, fontWeight: currentStepIndex === s.id ? 700 : 400 }}>{s.label}</div>
                </div>
                {i < TRANSACTION_STEPS.length - 1 && <div style={{ width: 10, height: 2, background: currentStepIndex > s.id ? "var(--sage)" : "var(--warm)", flexShrink: 0, marginBottom: 14 }} />}
              </div>
            ))}
          </div>
        </div>

        {activeOffer.status === "declined" && (
          <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 12, padding: "18px", textAlign: "center", color: "var(--rust)", marginBottom: 14 }}>This offer was declined.</div>
        )}
        {activeOffer.status === "closed" && (
          <div style={{ background: "var(--sage)", color: "#fff", borderRadius: 14, padding: "20px", textAlign: "center", fontSize: 17, fontWeight: 700, marginBottom: 14 }}>🎉 Transaction Complete! Congratulations!</div>
        )}

        {activeOffer.status !== "declined" && TRANSACTION_STEPS.map(step => (
          <StepCard key={step.id} step={step} offer={activeOffer} user={user} onUpdate={updateOffer}
            isExpanded={!!expandedSteps[step.id]} onToggle={() => toggleStep(step.id)} />
        ))}
      </div>
    );
  }

  const buyerOffers = offers.filter(o => o.buyer_id === user.id);
  const sellerOffers = offers.filter(o => o.seller_id === user.id);

  const OfferRow = ({ o }) => {
    const currentStep = TRANSACTION_STEPS.find(s => s.id === o.step_index);
    const needsAction = (currentStep?.owner === "buyer" && o.buyer_id === user.id) ||
                        (currentStep?.owner === "seller" && o.seller_id === user.id) ||
                        currentStep?.owner === "both";
    return (
      <div onClick={() => setActiveOffer(o)} style={{ background: "var(--card)", border: "1px solid " + (needsAction ? "var(--gold)" : "var(--warm)"), borderRadius: 12, padding: "16px 18px", marginBottom: 10, cursor: "pointer", transition: "all 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
        onMouseLeave={e => e.currentTarget.style.transform = "none"}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, color: "var(--ink)" }}>{o.listings?.address}</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{o.listings?.city}, {o.listings?.state} {o.listings?.zip}</div>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>
              {o.buyer_id === user.id ? formatPrice(o.offer_price) : o.buyer_name + " — " + formatPrice(o.offer_price)}
              {o.closing_date && <span style={{ color: "#888", marginLeft: 8, fontSize: 12 }}>· Closing: {o.closing_date}</span>}
            </div>
            <div style={{ fontSize: 11, color: needsAction ? "var(--gold)" : "#aaa", fontWeight: needsAction ? 700 : 400 }}>
              {needsAction ? "⚡ Action needed — " : ""}Step {o.step_index} of {TRANSACTION_STEPS.length}: {currentStep?.label}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <span style={{ background: o.status === "accepted" || o.status === "closed" ? "var(--sage)" : o.status === "declined" ? "#aaa" : o.status === "countered" ? "var(--rust)" : "var(--gold)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 12, textTransform: "uppercase" }}>{o.status}</span>
            <span style={{ fontSize: 11, color: "var(--gold)" }}>View →</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>Offers</h2>
          <p style={{ color: "#666", fontSize: 13 }}>Track every offer and transaction step by step.</p>
        </div>
        {unreadCount > 0 && (
          <div style={{ background: "var(--gold)", color: "#fff", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700 }}>
            {unreadCount} new update{unreadCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>Loading...</div>}

      {!loading && offers.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 24px", color: "#888", background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📋</div>
          <div style={{ fontSize: 20, marginBottom: 8, color: "var(--ink)" }}>No offers yet</div>
          <div style={{ fontSize: 13 }}>Browse homes and make an offer, or list your home to receive offers.</div>
        </div>
      )}

      {sellerOffers.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "var(--ink)" }}>Offers on My Listings</h3>
          {sellerOffers.map(o => <OfferRow key={o.id} o={o} />)}
        </div>
      )}
      {buyerOffers.length > 0 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "var(--ink)" }}>My Offers</h3>
          {buyerOffers.map(o => <OfferRow key={o.id} o={o} />)}
        </div>
      )}
    </div>
  );
}

function MessagesTab({ newThread, user, onRequireAuth }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const bottomRef = useRef(null);
  const channelRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    const { data } = await sb.from("direct_messages")
      .select("*, listings(address, city, state, zip, seller_name, user_id)")
      .or("user_id.eq." + user.id + ",recipient_id.eq." + user.id)
      .order("created_at", { ascending: false });
    if (!data) { setLoading(false); return; }
    const convMap = {};
    let unread = 0;
    data.forEach(msg => {
      const otherId = msg.user_id === user.id ? msg.recipient_id : msg.user_id;
      const key = msg.listing_id + "-" + [msg.user_id, msg.recipient_id].sort().join("-");
      if (!convMap[key]) {
        convMap[key] = {
          key, listing_id: msg.listing_id, listing: msg.listings,
          other_user_id: otherId,
          other_name: msg.user_id === user.id ? msg.recipient_name : msg.sender_name,
          last_message: msg.body, last_time: msg.created_at, unread: 0,
        };
      }
      if (msg.recipient_id === user.id && !msg.read) { convMap[key].unread++; unread++; }
    });
    setUnreadCount(unread);
    setConversations(Object.values(convMap).sort((a, b) => new Date(b.last_time) - new Date(a.last_time)));
    setLoading(false);
  };

  useEffect(() => {
    if (newThread && user) {
      const conv = {
        key: newThread.id + "-" + [user.id, newThread.user_id].sort().join("-"),
        listing_id: newThread.id, listing: newThread,
        other_user_id: newThread.user_id, other_name: newThread.seller_name,
        last_message: "", last_time: new Date().toISOString(), unread: 0,
      };
      setActiveConv(conv);
      setShowSidebar(false);
    }
  }, [newThread, user]);

  useEffect(() => {
    if (!activeConv || !user) return;
    loadMessages();
    if (channelRef.current) sb.removeChannel(channelRef.current);
    const ch = sb.channel("conv-" + activeConv.key)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: "listing_id=eq." + activeConv.listing_id },
        payload => {
          const msg = payload.new;
          const relevant = (msg.user_id === user.id && msg.recipient_id === activeConv.other_user_id) ||
                           (msg.user_id === activeConv.other_user_id && msg.recipient_id === user.id);
          if (relevant) setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
        })
      .subscribe();
    channelRef.current = ch;
    return () => { if (channelRef.current) sb.removeChannel(channelRef.current); };
  }, [activeConv?.key]);

  const loadMessages = async () => {
    if (!activeConv || !user) return;
    const { data } = await sb.from("direct_messages").select("*")
      .eq("listing_id", activeConv.listing_id)
      .or("and(user_id.eq." + user.id + ",recipient_id.eq." + activeConv.other_user_id + "),and(user_id.eq." + activeConv.other_user_id + ",recipient_id.eq." + user.id + ")")
      .order("created_at", { ascending: true });
    setMessages(data || []);
    await sb.from("direct_messages").update({ read: true }).eq("listing_id", activeConv.listing_id).eq("recipient_id", user.id).eq("read", false);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || !activeConv || !user) return;
    const body = input.trim();
    setInput("");
    setSending(true);
    try {
      const { data, error } = await sb.from("direct_messages").insert([{
        listing_id: activeConv.listing_id, user_id: user.id, recipient_id: activeConv.other_user_id,
        sender_name: user.user_metadata?.full_name || user.email,
        recipient_name: activeConv.other_name, body, read: false,
      }]).select();
      if (error) { console.error("Message error:", error); setSending(false); return; }
      if (data?.[0]) {
        setMessages(prev => prev.find(m => m.id === data[0].id) ? prev : [...prev, data[0]]);
        await sendNotification(activeConv.other_user_id, "New message from " + (user.user_metadata?.full_name || user.email), "messages");
        loadConversations();
      }
    } catch (e) { console.error(e); }
    setSending(false);
  };

  if (!user) return (
    <div style={{ maxWidth: 460, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
      <h2 style={{ fontSize: 30, marginBottom: 12, color: "var(--ink)" }}>Messages</h2>
      <p style={{ color: "#666", lineHeight: 1.7, marginBottom: 28 }}>Sign in to message buyers and sellers directly.</p>
      <button onClick={onRequireAuth} style={{ background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, cursor: "pointer", fontWeight: 600 }}>Sign In</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "var(--ink)" }}>Messages</h2>
        {activeConv && (
          <button onClick={() => { setActiveConv(null); setShowSidebar(true); }} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 13 }}>← All Conversations</button>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: activeConv ? "280px 1fr" : "1fr", gap: 14, height: "calc(100vh - 200px)", minHeight: 400, maxHeight: 600 }}>

        {/* Sidebar */}
        {(!activeConv || showSidebar) && (
          <div className={"msg-sidebar" + (showSidebar ? " active" : "")} style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--warm)", fontWeight: 700, fontSize: 13, color: "var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              Conversations
              {unreadCount > 0 && <span style={{ background: "var(--sage)", color: "#fff", borderRadius: "50%", width: 20, height: 20, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{unreadCount}</span>}
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              {loading && <div style={{ padding: 20, textAlign: "center", color: "#888", fontSize: 13 }}>Loading...</div>}
              {!loading && conversations.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#888", fontSize: 13, lineHeight: 1.6 }}>No conversations yet.<br />Message a seller from any listing.</div>}
              {conversations.map(conv => (
                <div key={conv.key} onClick={() => { setActiveConv(conv); setShowSidebar(false); }}
                  style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid var(--warm)", background: activeConv?.key === conv.key ? "var(--warm)" : "transparent", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <div style={{ fontWeight: conv.unread > 0 ? 700 : 500, fontSize: 12, color: "var(--ink)" }}>{conv.listing?.address || "Property"}</div>
                    <div style={{ fontSize: 10, color: "#aaa" }}>{timeAgo(conv.last_time)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>{conv.other_name}</div>
                  <div style={{ fontSize: 11, color: conv.unread > 0 ? "var(--ink)" : "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{conv.last_message}</div>
                  {conv.unread > 0 && <div style={{ position: "absolute", top: 12, right: 12, background: "var(--sage)", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{conv.unread}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat pane */}
        {activeConv && (
          <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--warm)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--sage)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                {activeConv.other_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>{activeConv.other_name}</div>
                <div style={{ fontSize: 11, color: "#666" }}>{activeConv.listing?.address}{activeConv.listing?.city ? ", " + activeConv.listing.city : ""}</div>
              </div>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
              {messages.length === 0 && <div style={{ textAlign: "center", color: "#aaa", marginTop: 50, fontSize: 14 }}>Start the conversation</div>}
              {messages.map((m, i) => {
                const isMe = m.user_id === user.id;
                const showAvatar = !isMe && (i === 0 || messages[i-1].user_id !== m.user_id);
                return (
                  <div key={m.id || i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}>
                    {!isMe && <div style={{ width: 24, height: 24, borderRadius: "50%", background: showAvatar ? "var(--mist)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--sage)", flexShrink: 0 }}>{showAvatar ? (activeConv.other_name?.[0]?.toUpperCase() || "?") : ""}</div>}
                    <div style={{ maxWidth: "72%" }}>
                      <div style={{ background: isMe ? "var(--sage)" : "var(--warm)", color: isMe ? "#fff" : "var(--ink)", borderRadius: isMe ? "16px 16px 3px 16px" : "16px 16px 16px 3px", padding: "9px 13px", fontSize: 13, lineHeight: 1.5 }}>{m.body}</div>
                      <div style={{ fontSize: 9, color: "#bbb", marginTop: 2, textAlign: isMe ? "right" : "left" }}>{timeAgo(m.created_at)}{isMe && (m.read ? " ✓✓" : " ✓")}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div style={{ padding: "10px 14px", borderTop: "1px solid var(--warm)", display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Message..." rows={1}
                style={{ flex: 1, padding: "9px 13px", borderRadius: 20, border: "1.5px solid var(--warm)", background: "var(--cream)", fontSize: 13, outline: "none", resize: "none", fontFamily: "sans-serif", lineHeight: 1.5, maxHeight: 90, overflow: "auto", color: "var(--ink)" }} />
              <button onClick={send} disabled={sending || !input.trim()}
                style={{ background: input.trim() ? "var(--sage)" : "#ddd", color: "#fff", border: "none", borderRadius: "50%", width: 38, height: 38, cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                {sending ? <Spinner /> : "↑"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function SellTab({ user, onRequireAuth }) {
  const [mode, setMode] = useState("home"); // home | list | value
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ address: "", city: "", state: "", zip: "", price: "", beds: "", baths: "", sqft: "", type: "Single Family", description: "", seller_name: "", seller_email: "", seller_phone: "" });
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [valForm, setValForm] = useState({ address: "", beds: 3, baths: 2, sqft: 1800, year: 2005, condition: "Good", type: "Single Family" });
  const [valResult, setValResult] = useState(null);
  const [valLoading, setValLoading] = useState(false);
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updateVal = (k, v) => setValForm(f => ({ ...f, [k]: v }));
  const inp = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "#fff", fontSize: 14, outline: "none", color: "var(--ink)" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 5, textTransform: "uppercase" };

  useEffect(() => {
    if (user) setForm(f => ({ ...f, seller_name: user.user_metadata?.full_name || "", seller_email: user.email || "" }));
  }, [user]);

  if (!user) return (
    <div style={{ maxWidth: 460, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🏡</div>
      <h2 style={{ fontSize: 30, marginBottom: 12, color: "var(--ink)" }}>Ready to sell?</h2>
      <p style={{ color: "#666", lineHeight: 1.7, marginBottom: 28, fontSize: 15 }}>Create a free account to list your home and connect with buyers directly — no realtor needed.</p>
      <button onClick={onRequireAuth} style={{ background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, cursor: "pointer", fontWeight: 600 }}>Get Started Free</button>
    </div>
  );

  const estimate = async () => {
    setValLoading(true); setValResult(null);
    try {
      const text = await callClaude([{ role: "user", content: "You are a real estate valuation expert. Return ONLY valid JSON, no markdown, no explanation. Property: " + (valForm.address || "Unknown") + ", Type: " + valForm.type + ", Beds: " + valForm.beds + ", Baths: " + valForm.baths + ", SqFt: " + valForm.sqft + ", Year: " + valForm.year + ", Condition: " + valForm.condition + ". Return: {\"low\":number,\"mid\":number,\"high\":number,\"pricePerSqft\":number,\"summary\":\"2-3 sentences\",\"tips\":[\"tip1\",\"tip2\",\"tip3\"]}" }]);
      setValResult(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch {
      setValResult({ low: 380000, mid: 435000, high: 490000, pricePerSqft: 241, summary: "Based on your inputs, this property sits in a competitive range.", tips: ["Stage key rooms before listing", "Price at mid-range to attract multiple offers", "Disclose all known issues upfront"] });
    }
    setValLoading(false);
  };

  const addPhotos = (files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => setPhotos(prev => [...prev, { file, preview: e.target.result }]);
      reader.readAsDataURL(file);
    });
  };

  const publish = async () => {
    setSubmitting(true); setError(null);
    try {
      const photoUrls = [];
      for (const p of photos) {
        const ext = p.file.name.split(".").pop();
        const path = Date.now() + "-" + Math.random().toString(36).slice(2) + "." + ext;
        const { error: uploadErr } = await sb.storage.from("property-photos").upload(path, p.file, { contentType: p.file.type });
        if (uploadErr) throw new Error("Photo upload failed: " + uploadErr.message);
        const { data: { publicUrl } } = sb.storage.from("property-photos").getPublicUrl(path);
        photoUrls.push(publicUrl);
      }
      const { error: insertErr } = await sb.from("listings").insert([{
        address: form.address, city: form.city, state: form.state, zip: form.zip,
        price: Number(form.price), beds: Number(form.beds), baths: Number(form.baths),
        sqft: Number(form.sqft), type: form.type, description: form.description,
        seller_name: form.seller_name, seller_email: form.seller_email, seller_phone: form.seller_phone,
        photos: photoUrls, tags: [], user_id: user.id, sold: false,
      }]);
      if (insertErr) throw new Error(insertErr.message);
      setSubmitted(true);
    } catch (e) { setError(e.message); }
    setSubmitting(false);
  };

  const reset = () => {
    setSubmitted(false); setStep(1); setPhotos([]); setError(null); setMode("home");
    setForm({ address: "", city: "", state: "", zip: "", price: "", beds: "", baths: "", sqft: "", type: "Single Family", description: "", seller_name: user?.user_metadata?.full_name || "", seller_email: user?.email || "", seller_phone: "" });
  };

  // HOME — choose list or value
  if (mode === "home") return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>
      <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 6, color: "var(--ink)" }}>Sell Your Home</h2>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 32 }}>No realtor. No commission. You're in control.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div onClick={() => setMode("value")} style={{ background: "var(--card)", border: "2px solid var(--warm)", borderRadius: 16, padding: "28px 24px", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--warm)"; e.currentTarget.style.transform = "none"; }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>💰</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Get My Home Value</div>
          <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>Find out what your home is worth before you list. Get a low, mid, and high estimate instantly.</div>
          <div style={{ marginTop: 14, color: "var(--gold)", fontSize: 13, fontWeight: 600 }}>Free Estimate →</div>
        </div>
        <div onClick={() => setMode("list")} style={{ background: "var(--sage)", border: "2px solid var(--sage)", borderRadius: 16, padding: "28px 24px", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(74,103,65,0.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🏡</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>List My Home</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>Create your listing in minutes. Buyers can find you directly — no agent required.</div>
          <div style={{ marginTop: 14, color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 600 }}>Start Listing →</div>
        </div>
      </div>
      <div style={{ marginTop: 28, background: "var(--warm)", borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>💡 Pro tip: Get your value first</div>
        <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>Most sellers who price their home correctly the first time sell 2-3 weeks faster. Use our free valuation tool before you list to set the right price.</div>
      </div>
    </div>
  );

  // VALUATION MODE
  if (mode === "value") return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => { setMode("home"); setValResult(null); }} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 13, marginBottom: 16 }}>← Back</button>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6, color: "var(--ink)" }}>Home Valuation</h2>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 24 }}>Get an instant estimate — free, no realtor required.</p>
      <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 14, padding: "22px", marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={lbl}>Property Address</label><input style={inp} value={valForm.address} onChange={e => updateVal("address", e.target.value)} placeholder="123 Main St, Austin TX 78701" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div><label style={lbl}>Beds</label><input style={inp} type="number" value={valForm.beds} onChange={e => updateVal("beds", Number(e.target.value))} /></div>
            <div><label style={lbl}>Baths</label><input style={inp} type="number" value={valForm.baths} onChange={e => updateVal("baths", Number(e.target.value))} /></div>
            <div><label style={lbl}>Sq Ft</label><input style={inp} type="number" value={valForm.sqft} onChange={e => updateVal("sqft", Number(e.target.value))} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div><label style={lbl}>Year Built</label><input style={inp} type="number" value={valForm.year} onChange={e => updateVal("year", Number(e.target.value))} /></div>
            <div><label style={lbl}>Condition</label>
              <select style={{ ...inp, cursor: "pointer" }} value={valForm.condition} onChange={e => updateVal("condition", e.target.value)}>
                <option>Excellent</option><option>Good</option><option>Fair</option><option>Needs Work</option>
              </select>
            </div>
            <div><label style={lbl}>Type</label>
              <select style={{ ...inp, cursor: "pointer" }} value={valForm.type} onChange={e => updateVal("type", e.target.value)}>
                <option>Single Family</option><option>Condo</option><option>Townhome</option><option>Multi-Family</option>
              </select>
            </div>
          </div>
          <button onClick={estimate} disabled={valLoading} style={{ background: valLoading ? "#aaa" : "var(--rust)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, cursor: valLoading ? "default" : "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {valLoading ? <><Spinner /> Analyzing...</> : "Get My Home Value"}
          </button>
        </div>
      </div>
      {valResult && (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
          <div style={{ background: "linear-gradient(135deg,var(--ink),#2d2010)", borderRadius: 14, padding: "22px", color: "#fff", marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Estimated Value Range</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[["Low", valResult.low, "#bbb"], ["Mid", valResult.mid, "var(--gold-light)"], ["High", valResult.high, "var(--mist)"]].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{formatPrice(v)}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>{valResult.summary}</div>
          </div>
          <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 14, padding: "18px 20px", marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "var(--ink)" }}>Tips to Maximize Your Price</div>
            {valResult.tips.map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ background: "var(--sage)", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{i+1}</span>
                <span style={{ fontSize: 13, color: "#444", lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setMode("list")} style={{ width: "100%", background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, cursor: "pointer", fontWeight: 600 }}>
            Ready to List? Start My Listing →
          </button>
        </div>
      )}
    </div>
  );

  // LIST MODE
  if (submitted) return (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 30, marginBottom: 12, color: "var(--ink)" }}>Your listing is live!</h2>
      <p style={{ color: "#555", lineHeight: 1.8, marginBottom: 24 }}>Buyers can now find and contact you directly. Share it to reach more buyers.</p>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={reset} style={{ flex: 1, background: "var(--warm)", color: "var(--ink)", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>List Another</button>
        <button onClick={() => setMode("home")} style={{ flex: 1, background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Done</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => setMode("home")} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 13, marginBottom: 16 }}>← Back</button>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: "var(--ink)" }}>List Your Home</h2>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 24 }}>Sell directly to buyers. No realtor. No commission.</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {["Property", "Photos", "Pricing", "Contact"].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: step > i+1 ? "var(--sage)" : step === i+1 ? "var(--gold)" : "var(--warm)", color: step >= i+1 ? "#fff" : "#aaa", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: 11, fontWeight: 700 }}>{step > i+1 ? "✓" : i+1}</div>
            <div style={{ fontSize: 10, color: step === i+1 ? "var(--gold)" : "#aaa" }}>{s}</div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={lbl}>Street Address</label><input style={inp} value={form.address} onChange={e => update("address", e.target.value)} placeholder="123 Main Street" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div><label style={lbl}>City</label><input style={inp} value={form.city} onChange={e => update("city", e.target.value)} placeholder="Austin" /></div>
            <div><label style={lbl}>State</label><input style={inp} value={form.state} onChange={e => update("state", e.target.value)} placeholder="TX" /></div>
            <div><label style={lbl}>ZIP</label><input style={inp} value={form.zip} onChange={e => update("zip", e.target.value)} placeholder="78701" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            <div><label style={lbl}>Beds</label><input style={inp} type="number" value={form.beds} onChange={e => update("beds", e.target.value)} placeholder="3" /></div>
            <div><label style={lbl}>Baths</label><input style={inp} type="number" value={form.baths} onChange={e => update("baths", e.target.value)} placeholder="2" /></div>
            <div><label style={lbl}>Sq Ft</label><input style={inp} type="number" value={form.sqft} onChange={e => update("sqft", e.target.value)} placeholder="1800" /></div>
            <div><label style={lbl}>Type</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.type} onChange={e => update("type", e.target.value)}>
                <option>Single Family</option><option>Condo</option><option>Townhome</option><option>Multi-Family</option><option>Land</option>
              </select>
            </div>
          </div>
          <button onClick={() => { if (!form.address || !form.city || !form.state || !form.zip) { alert("Please fill in the full address including ZIP."); return; } setStep(2); }} style={{ background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, cursor: "pointer", fontWeight: 600 }}>Continue</button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label htmlFor="photo-upload" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed var(--warm)", borderRadius: 12, padding: "28px 20px", cursor: "pointer", background: "var(--cream)" }}>
            <span style={{ fontSize: 32, marginBottom: 8 }}>📷</span>
            <span style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, color: "var(--ink)" }}>Click to upload photos</span>
            <span style={{ fontSize: 12, color: "#888" }}>JPG, PNG, WEBP — multiple allowed</span>
            <input id="photo-upload" type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => addPhotos(e.target.files)} />
          </label>
          {photos.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px,1fr))", gap: 8 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "4/3" }}>
                  <img src={p.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={() => setPhotos(prev => prev.filter((_,j) => j !== i))} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 11 }}>✕</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer", color: "var(--ink)" }}>Back</button>
            <button onClick={() => setStep(3)} style={{ flex: 2, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Continue</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={lbl}>Asking Price</label><input style={inp} type="number" value={form.price} onChange={e => update("price", e.target.value)} placeholder="485000" /></div>
          <div><label style={lbl}>Description</label><textarea style={{ ...inp, minHeight: 100, resize: "vertical" }} value={form.description} onChange={e => update("description", e.target.value)} placeholder="Describe your home — highlights, updates, neighborhood..." /></div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(2)} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer", color: "var(--ink)" }}>Back</button>
            <button onClick={() => setStep(4)} style={{ flex: 2, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Continue</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={lbl}>Your Name</label><input style={inp} value={form.seller_name} onChange={e => update("seller_name", e.target.value)} placeholder="Jane Smith" /></div>
          <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.seller_email} onChange={e => update("seller_email", e.target.value)} placeholder="jane@email.com" /></div>
          <div><label style={lbl}>Phone</label><input style={inp} type="tel" value={form.seller_phone} onChange={e => update("seller_phone", e.target.value)} placeholder="(555) 123-4567" /></div>
          <div style={{ background: "var(--warm)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#555" }}>Your contact info is only shared with buyers who make an offer.</div>
          {error && <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 10, padding: "10px 14px", color: "var(--rust)", fontSize: 13 }}>{error}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(3)} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer", color: "var(--ink)" }}>Back</button>
            <button onClick={publish} disabled={submitting} style={{ flex: 2, background: submitting ? "#aaa" : "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {submitting ? <Spinner /> : "Publish Listing 🚀"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileDropdown({ user, onLogout, onRequireAuth, tab, setTab }) {
  const [open, setOpen] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      sb.from("listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
        .then(({ data }) => { setListings(data || []); setLoading(false); });
    }
  }, [open, user]);

  const deleteListing = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this listing?")) return;
    await sb.from("listings").delete().eq("id", id);
    setListings(prev => prev.filter(l => l.id !== id));
  };

  if (!user) return (
    <button onClick={onRequireAuth} style={{ background: "var(--gold)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Sign In</button>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background: open ? "rgba(255,255,255,0.12)" : "none", border: "1px solid " + (open ? "rgba(255,255,255,0.2)" : "transparent"), color: "rgba(255,255,255,0.85)", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}>
        Profile {open ? "▲" : "▼"}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: 42, background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16, width: 300, boxShadow: "0 12px 40px rgba(0,0,0,0.2)", zIndex: 300, animation: "slideDown 0.2s ease", overflow: "hidden" }}>
          {/* User info */}
          <div style={{ background: "var(--ink)", padding: "18px 20px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{user.user_metadata?.full_name || "Your Account"}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{user.email}</div>
          </div>

          {/* My listings */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--warm)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>My Listings</div>
            {loading && <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", padding: "8px" }}>Loading...</div>}
            {!loading && listings.length === 0 && (
              <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", padding: "8px" }}>
                No listings yet — <span onClick={() => { setTab("Sell"); setOpen(false); }} style={{ color: "var(--gold)", cursor: "pointer" }}>list your home</span>
              </div>
            )}
            {listings.map(l => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--warm)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--warm)", overflow: "hidden", flexShrink: 0 }}>
                  {l.photos?.[0] ? <img src={l.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏡</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.address}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{formatPrice(l.price)} {l.sold ? "· SOLD" : ""}</div>
                </div>
                <button onClick={e => deleteListing(l.id, e)} style={{ background: "none", border: "none", color: "#fcc", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>🗑️</button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ padding: "10px 20px 14px" }}>
            <button onClick={() => { setTab("Sell"); setOpen(false); }} style={{ width: "100%", background: "var(--sage)", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, cursor: "pointer", fontWeight: 600, marginBottom: 8 }}>+ List a Property</button>
            <button onClick={() => { onLogout(); setOpen(false); }} style={{ width: "100%", background: "none", border: "1px solid var(--warm)", borderRadius: 10, padding: "9px", fontSize: 13, cursor: "pointer", color: "#888" }}>Log Out</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("Browse");
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [messageThread, setMessageThread] = useState(null);
  const [offerListing, setOfferListing] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deepLinkListingId, setDeepLinkListingId] = useState(null);
  const [offerUnread, setOfferUnread] = useState(0);
  const [msgUnread, setMsgUnread] = useState(0);

  const NAV = ["Browse", "Sell", "Offers", "Messages"];

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  // Deep link — open listing from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const listingId = params.get("listing");
    if (listingId) {
      setDeepLinkListingId(listingId);
      setTab("Browse");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Unread badges
  useEffect(() => {
    if (!user) return;
    const loadUnread = async () => {
      const { count: offerCount } = await sb.from("notifications").select("id", { count: "exact" }).eq("user_id", user.id).eq("read", false).like("message", "%offer%");
      const { count: msgCount } = await sb.from("direct_messages").select("id", { count: "exact" }).eq("recipient_id", user.id).eq("read", false);
      setOfferUnread(offerCount || 0);
      setMsgUnread(msgCount || 0);
    };
    loadUnread();
    const sub = sb.channel("app-notifs-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: "user_id=eq." + user.id }, () => loadUnread())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: "recipient_id=eq." + user.id }, () => loadUnread())
      .subscribe();
    return () => sb.removeChannel(sub);
  }, [user?.id]);

  const handleMessage = (listing) => { setMessageThread(listing); setTab("Messages"); };
  const handleOffer = (listing) => { setOfferListing(listing); };
  const handleLogout = async () => { await sb.auth.signOut(); setUser(null); setTab("Browse"); };

  const NavBtn = ({ n }) => {
    const badge = n === "Offers" ? offerUnread : n === "Messages" ? msgUnread : 0;
    return (
      <button onClick={() => { setTab(n); setMobileMenuOpen(false); }} style={{ background: tab === n ? "rgba(255,255,255,0.12)" : "none", border: tab === n ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent", color: tab === n ? "#fff" : "rgba(255,255,255,0.65)", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", position: "relative", transition: "all 0.15s" }}>
        {n}
        {badge > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "var(--rust)", color: "#fff", borderRadius: "50%", width: 14, height: 14, fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{badge > 9 ? "9+" : badge}</span>}
      </button>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <style>{styles}</style>

      {/* Open Graph for social sharing */}
      <title>DirectDeed — Buy & Sell Homes Without a Realtor</title>

      <header style={{ background: "var(--ink)", color: "#fff", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setTab("Browse")}>
          <span style={{ fontSize: 20 }}>🏡</span>
          <span style={{ fontSize: 20, fontWeight: 700 }}>DirectDeed</span>
          <span style={{ fontSize: 9, color: "var(--gold-light)", background: "rgba(212,160,23,0.15)", padding: "2px 8px", borderRadius: 12 }}>No Realtors</span>
        </div>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <nav style={{ display: "flex", gap: 3 }}>
            {NAV.map(n => <NavBtn key={n} n={n} />)}
          </nav>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)", margin: "0 6px" }} />
          <ProfileDropdown user={user} onLogout={handleLogout} onRequireAuth={() => setShowAuth(true)} tab={tab} setTab={setTab} />
        </div>

        {/* Mobile menu button */}
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center" }}>
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav" style={{ background: "var(--ink)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.1)", animation: "slideDown 0.2s ease" }}>
          {NAV.map(n => {
            const badge = n === "Offers" ? offerUnread : n === "Messages" ? msgUnread : 0;
            return (
              <button key={n} onClick={() => { setTab(n); setMobileMenuOpen(false); }} style={{ background: tab === n ? "rgba(255,255,255,0.1)" : "none", border: "none", color: tab === n ? "#fff" : "rgba(255,255,255,0.7)", borderRadius: 10, padding: "12px 16px", fontSize: 15, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {n}
                {badge > 0 && <span style={{ background: "var(--rust)", color: "#fff", borderRadius: 12, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{badge}</span>}
              </button>
            );
          })}
          <button onClick={() => { setTab("Profile"); setMobileMenuOpen(false); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "12px 16px", fontSize: 15, cursor: "pointer", textAlign: "left" }}>Profile</button>
          {!user ? (
            <button onClick={() => { setShowAuth(true); setMobileMenuOpen(false); }} style={{ background: "var(--gold)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 15, cursor: "pointer", fontWeight: 600 }}>Sign In</button>
          ) : (
            <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", borderRadius: 10, padding: "12px 16px", fontSize: 15, cursor: "pointer" }}>Log Out</button>
          )}
        </div>
      )}

      {/* Hero banner */}
      {tab === "Browse" && (
        <div style={{ background: "linear-gradient(135deg,var(--ink) 0%,#3d2b0f 60%,var(--rust) 100%)", color: "#fff", padding: "48px 24px 56px", textAlign: "center" }}>
          <div className="hero-title" style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.15, marginBottom: 12 }}>Buy and Sell Without the Middleman</div>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", maxWidth: 420, margin: "0 auto 24px", lineHeight: 1.7 }}>Connect directly. Save the 5-6% commission.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => user ? setTab("Sell") : setShowAuth(true)} style={{ background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 26px", fontSize: 14, cursor: "pointer", fontWeight: 700 }}>List My Home</button>
            <button onClick={() => document.getElementById("browse-start")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 12, padding: "13px 26px", fontSize: 14, cursor: "pointer" }}>Browse Homes</button>
          </div>
        </div>
      )}

      <div id="browse-start">
        {tab === "Browse" && <BrowseTab onMessage={handleMessage} onOffer={handleOffer} user={user} deepLinkListingId={deepLinkListingId} onClearDeepLink={() => setDeepLinkListingId(null)} />}
      </div>
      {tab === "Sell" && <SellTab user={user} onRequireAuth={() => setShowAuth(true)} />}
      {tab === "Offers" && <OffersTab user={user} onRequireAuth={() => setShowAuth(true)} />}
      {tab === "Messages" && <MessagesTab newThread={messageThread} user={user} onRequireAuth={() => setShowAuth(true)} />}
      {tab === "Privacy" && <LegalTab section="privacy" />}
      {tab === "Terms" && <LegalTab section="terms" />}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={setUser} />}
      {offerListing && <MakeOfferModal listing={offerListing} user={user} onClose={() => setOfferListing(null)} onRequireAuth={() => { setOfferListing(null); setShowAuth(true); }} />}

      <footer style={{ background: "var(--ink)", color: "rgba(255,255,255,0.35)", textAlign: "center", padding: "20px", fontSize: 11, marginTop: 60 }}>
        © 2026 Bondy Technologies LLC. All rights reserved. DirectDeed is not a licensed real estate brokerage. ·
        <span onClick={() => setTab("Privacy")} style={{ cursor: "pointer", marginLeft: 6, textDecoration: "underline" }}>Privacy Policy</span> ·
        <span onClick={() => setTab("Terms")} style={{ cursor: "pointer", marginLeft: 6, textDecoration: "underline" }}>Terms of Service</span> ·
        <a href="mailto:maxbondy@hotmail.com" style={{ color: "rgba(255,255,255,0.35)", marginLeft: 6 }}>Contact</a>
      </footer>
    </div>
  );
}