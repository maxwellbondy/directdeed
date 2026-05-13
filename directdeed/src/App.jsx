import { useState, useEffect, useRef, useCallback } from "react";
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
`;

const TRANSACTION_STEPS = [
  { id: 1, key: "offer", label: "Offer", desc: "Review and respond to the offer", buyerAction: "Wait for seller response", sellerAction: "Accept, counter, or decline the offer", icon: "📋" },
  { id: 2, key: "earnest", label: "Earnest Money", desc: "Deposit earnest money into escrow", buyerAction: "Deposit earnest money and upload confirmation", sellerAction: "Confirm earnest money received", icon: "💰" },
  { id: 3, key: "inspection", label: "Inspection", desc: "Complete home inspection", buyerAction: "Schedule and complete inspection. Upload report and submit any repair requests.", sellerAction: "Review inspection report and repair requests", icon: "🔍" },
  { id: 4, key: "inspection_response", label: "Repair Response", desc: "Seller responds to repair requests", buyerAction: "Review seller response to repair requests", sellerAction: "Agree to repairs, offer credit, or decline", icon: "🔨" },
  { id: 5, key: "appraisal", label: "Appraisal", desc: "Property appraisal completed", buyerAction: "Upload appraisal report and confirm value meets contract price", sellerAction: "Review appraisal results", icon: "📊" },
  { id: 6, key: "financing", label: "Financing", desc: "Loan approval confirmed", buyerAction: "Upload loan commitment letter from lender", sellerAction: "Confirm financing approval received", icon: "🏦" },
  { id: 7, key: "title", label: "Title Search", desc: "Title search and insurance", buyerAction: "Confirm title search is ordered and review results", sellerAction: "Resolve any title issues", icon: "📜" },
  { id: 8, key: "walkthrough", label: "Final Walkthrough", desc: "Final walkthrough of property", buyerAction: "Complete final walkthrough and confirm property condition", sellerAction: "Ensure property is ready for walkthrough", icon: "🚶" },
  { id: 9, key: "closing", label: "Closing", desc: "Sign closing documents and transfer ownership", buyerAction: "Sign all closing documents and transfer funds", sellerAction: "Sign closing documents and transfer keys", icon: "🎉" },
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

function Spinner({ dark }) {
  return <div style={{ width: 18, height: 18, border: `2px solid ${dark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)"}`, borderTop: `2px solid ${dark ? "var(--ink)" : "#fff"}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />;
}

function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    sb.from("notifications").select("*").eq("user_id", user.id).eq("read", false).order("created_at", { ascending: false })
      .then(({ data }) => setNotifications(data || []));
    const sub = sb.channel("notifs-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: "user_id=eq." + user.id },
        payload => setNotifications(prev => [payload.new, ...prev]))
      .subscribe();
    return () => sb.removeChannel(sub);
  }, [user?.id]);

  const markAllRead = async () => {
    await sb.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications([]);
    setOpen(false);
  };

  if (!user) return null;

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", fontSize: 18, position: "relative", padding: "4px 8px" }}>
        🔔
        {notifications.length > 0 && (
          <span style={{ position: "absolute", top: 0, right: 0, background: "var(--rust)", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: 40, background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 14, width: 320, boxShadow: "0 8px 32px var(--shadow)", zIndex: 300, animation: "fadeIn 0.2s ease" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--warm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Notifications</div>
            {notifications.length > 0 && <button onClick={markAllRead} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 12, cursor: "pointer" }}>Mark all read</button>}
          </div>
          <div style={{ maxHeight: 300, overflow: "auto" }}>
            {notifications.length === 0 && <div style={{ padding: "24px", textAlign: "center", color: "#aaa", fontSize: 13 }}>No new notifications</div>}
            {notifications.map(n => (
              <div key={n.id} style={{ padding: "12px 18px", borderBottom: "1px solid var(--warm)", background: "var(--cream)", fontSize: 13, lineHeight: 1.5 }}>
                <div>{n.message}</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{timeAgo(n.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AuthModal({ onClose, onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const inp = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "var(--cream)", fontSize: 14, outline: "none" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 500, color: "#888", marginBottom: 5, textTransform: "uppercase" };

  const submit = async () => {
    setLoading(true); setError(null); setSuccess(null);
    try {
      if (mode === "signup") {
        const { error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (error) throw error;
        setSuccess("Account created! Check your email to confirm, then log in.");
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user); onClose();
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 20, maxWidth: 420, width: "100%", padding: "36px 32px", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <h2 style={{ fontSize: 28 }}>{mode === "login" ? "Welcome back" : "Create account"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#bbb" }}>x</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "signup" && <div><label style={lbl}>Full Name</label><input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" /></div>}
          <div><label style={lbl}>Email</label><input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" /></div>
          <div><label style={lbl}>Password</label><input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} /></div>
          {error && <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 10, padding: "10px 14px", color: "var(--rust)", fontSize: 13 }}>{error}</div>}
          {success && <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 10, padding: "10px 14px", color: "var(--sage)", fontSize: 13 }}>{success}</div>}
          <button onClick={submit} disabled={loading} style={{ background: loading ? "#aaa" : "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {loading ? <Spinner /> : mode === "login" ? "Log In" : "Create Account"}
          </button>
          <div style={{ textAlign: "center", fontSize: 13, color: "#888" }}>
            {mode === "login" ? "No account? " : "Have an account? "}
            <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setSuccess(null); }} style={{ color: "var(--gold)", cursor: "pointer", fontWeight: 500 }}>
              {mode === "login" ? "Sign up" : "Log in"}
            </span>
          </div>
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

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16, overflow: "hidden", cursor: "pointer", transform: hovered ? "translateY(-4px)" : "none", boxShadow: hovered ? "0 12px 40px var(--shadow)" : "0 2px 12px var(--shadow)", transition: "all 0.25s ease" }}>
      <div onClick={() => onClick(listing)} style={{ height: 160, background: "linear-gradient(135deg,var(--warm),var(--mist))", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>
        {cover ? <img src={cover} alt="property" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : "🏡"}
        <span style={{ position: "absolute", top: 10, right: 10, background: "var(--sage)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 20, textTransform: "uppercase" }}>FSBO</span>
        <span style={{ position: "absolute", top: 10, left: 10, background: "var(--card)", fontSize: 11, padding: "3px 9px", borderRadius: 20 }}>{daysAgo === 0 ? "Today" : daysAgo + "d ago"}</span>
        {photos.length > 1 && <span style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 10, padding: "3px 8px", borderRadius: 10 }}>+{photos.length - 1} photos</span>}
      </div>
      <div onClick={() => onClick(listing)} style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.2, marginBottom: 3 }}>{listing.address}</div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>{listing.city}, {listing.state} - {listing.type}</div>
        <div style={{ fontSize: 26, fontWeight: 600, color: "var(--gold)", marginBottom: 10 }}>{formatPrice(listing.price)}</div>
        <div style={{ display: "flex", gap: 14, fontSize: 13, color: "#666" }}>
          <span>{listing.beds} bd</span><span>{listing.baths} ba</span><span>{Number(listing.sqft).toLocaleString()} sqft</span>
        </div>
      </div>
      {isOwner && (
        <div style={{ padding: "0 18px 16px" }}>
          <button onClick={() => onDelete(listing.id)} style={{ width: "100%", background: "#fff5f5", color: "var(--rust)", border: "1px solid #fcc", borderRadius: 8, padding: "7px", fontSize: 12, cursor: "pointer" }}>Delete Listing</button>
        </div>
      )}
    </div>
  );
}

function ListingModal({ listing, onClose, onMessage, onOffer, user }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  if (!listing) return null;
  const photos = listing.photos || [];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 20, maxWidth: 580, width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }} onClick={e => e.stopPropagation()}>
        <div style={{ height: 220, background: "linear-gradient(135deg,var(--warm),var(--mist))", borderRadius: "20px 20px 0 0", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>
          {photos.length > 0 ? <img src={photos[photoIdx]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏡"}
          {photos.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i - 1 + photos.length) % photos.length); }} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", color: "#fff", border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 16 }}>{"<"}</button>
              <button onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i + 1) % photos.length); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", color: "#fff", border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 16 }}>{">"}</button>
            </>
          )}
        </div>
        <div style={{ padding: "26px 30px 30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <h2 style={{ fontSize: 26, fontWeight: 500, flex: 1 }}>{listing.address}</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#bbb", marginLeft: 12 }}>x</button>
          </div>
          <div style={{ color: "#888", fontSize: 13, marginBottom: 14 }}>{listing.city}, {listing.state} - {listing.type}</div>
          <div style={{ fontSize: 34, fontWeight: 600, color: "var(--gold)", marginBottom: 18 }}>{formatPrice(listing.price)}</div>
          <div style={{ display: "flex", gap: 20, fontSize: 14, color: "#555", marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--warm)" }}>
            <span>{listing.beds} Beds</span><span>{listing.baths} Baths</span><span>{Number(listing.sqft).toLocaleString()} sqft</span>
          </div>
          {listing.description && <p style={{ fontSize: 14, lineHeight: 1.8, color: "#444", marginBottom: 18 }}>{listing.description}</p>}
          <div style={{ background: "var(--warm)", borderRadius: 12, padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 26 }}>👤</span>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>Listed by {listing.seller_name}</div>
              <div style={{ fontSize: 12, color: "#888" }}>Owner - No realtor commission</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { onMessage(listing); onClose(); }} style={{ flex: 1, background: "var(--warm)", color: "var(--ink)", border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Message Seller</button>
            <button onClick={() => { onOffer(listing); onClose(); }} style={{ flex: 2, background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>Make an Offer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowseTab({ onMessage, onOffer, user }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState(2000000);
  const [minBeds, setMinBeds] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await sb.from("listings").select("*").order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setListings(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = listings.filter(l =>
    (l.address + " " + l.city + " " + l.state).toLowerCase().includes(search.toLowerCase()) &&
    Number(l.price) <= maxPrice && Number(l.beds) >= minBeds
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <h2 style={{ fontSize: 36, fontWeight: 400, marginBottom: 6 }}>Browse Homes</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Every listing is sold directly by the owner.</p>
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search address or city..." style={{ flex: 2, minWidth: 200, padding: "11px 16px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "var(--card)", fontSize: 14, outline: "none" }} />
        <select value={minBeds} onChange={e => setMinBeds(Number(e.target.value))} style={{ padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "var(--card)", fontSize: 14, cursor: "pointer" }}>
          <option value={0}>Any beds</option><option value={2}>2+ beds</option><option value={3}>3+ beds</option><option value={4}>4+ beds</option>
        </select>
        <select value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} style={{ padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "var(--card)", fontSize: 14, cursor: "pointer" }}>
          <option value={2000000}>Any price</option><option value={400000}>Under $400k</option><option value={600000}>Under $600k</option><option value={800000}>Under $800k</option><option value={1000000}>Under $1M</option>
        </select>
      </div>
      {loading && <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa", fontSize: 22 }}>Loading listings...</div>}
      {error && <div style={{ textAlign: "center", padding: "32px", background: "#fff5f5", borderRadius: 12, color: "var(--rust)" }}>{error}</div>}
      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {filtered.map(l => <ListingCard key={l.id} listing={l} onClick={setSelected} onDelete={() => {}} isOwner={false} />)}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "#aaa", padding: "60px 0" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>No listings yet</div>
              <div style={{ fontSize: 14 }}>Be the first to list your home.</div>
            </div>
          )}
        </>
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
  const inp = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "var(--cream)", fontSize: 14, outline: "none" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 500, color: "#888", marginBottom: 5, textTransform: "uppercase" };

  if (!user) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 20, maxWidth: 420, width: "100%", padding: "36px 32px" }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>Sign in to make an offer</h2>
          <p style={{ color: "#888", marginBottom: 24, lineHeight: 1.7 }}>Create a free account to submit and track your offers.</p>
          <button onClick={() => { onClose(); onRequireAuth(); }} style={{ background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, cursor: "pointer" }}>Sign Up Free</button>
        </div>
      </div>
    </div>
  );

  const submit = async () => {
    setSubmitting(true); setError(null);
    try {
      const { error: insertErr } = await sb.from("offers").insert([{
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.user_id,
        buyer_name: form.buyer_name,
        buyer_email: form.buyer_email,
        buyer_phone: form.buyer_phone,
        offer_price: Number(form.offer_price),
        earnest_money: Number(form.earnest_money),
        closing_date: form.closing_date,
        financing_contingency: form.financing_contingency,
        inspection_contingency: form.inspection_contingency,
        appraisal_contingency: form.appraisal_contingency,
        message: form.message,
        status: "pending",
        step: "offer",
        step_index: 1,
      }]);
      if (insertErr) throw new Error(insertErr.message);
      await sendNotification(listing.user_id, "You have a new offer of " + formatPrice(form.offer_price) + " on " + listing.address, "offers");
      setSubmitted(true);
    } catch (e) { setError(e.message); }
    setSubmitting(false);
  };

  if (submitted) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 20, maxWidth: 460, width: "100%", padding: "40px 36px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 30, marginBottom: 12 }}>Offer Submitted!</h2>
        <p style={{ color: "#666", lineHeight: 1.8, marginBottom: 12 }}>Your offer of {formatPrice(form.offer_price)} on {listing.address} has been sent to the seller.</p>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 28 }}>Track your offer in the Offers tab. The seller will be notified.</p>
        <button onClick={onClose} style={{ background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, cursor: "pointer" }}>Done</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 20, maxWidth: 560, width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "28px 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h2 style={{ fontSize: 26, fontWeight: 500 }}>Make an Offer</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#bbb" }}>x</button>
          </div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>{listing.address} - Listed at {formatPrice(listing.price)}</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
            {["Offer Terms", "Contingencies", "Your Info"].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: step > i + 1 ? "var(--sage)" : step === i + 1 ? "var(--gold)" : "var(--warm)", color: step >= i + 1 ? "#fff" : "#aaa", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: 11, fontWeight: 600 }}>{step > i + 1 ? "v" : i + 1}</div>
                <div style={{ fontSize: 10, color: step === i + 1 ? "var(--gold)" : "#aaa" }}>{s}</div>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div><label style={lbl}>Your Offer Price</label>
                <input style={inp} type="number" value={form.offer_price} onChange={e => update("offer_price", e.target.value)} placeholder="480000" />
                {listing.price && Number(form.offer_price) > 0 && Number(form.offer_price) < Number(listing.price) && <div style={{ fontSize: 12, color: "var(--rust)", marginTop: 4 }}>{Math.round((1 - Number(form.offer_price) / Number(listing.price)) * 100)}% below asking price</div>}
                {listing.price && Number(form.offer_price) > Number(listing.price) && <div style={{ fontSize: 12, color: "var(--sage)", marginTop: 4 }}>{Math.round((Number(form.offer_price) / Number(listing.price) - 1) * 100)}% above asking price</div>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={lbl}>Earnest Money</label><input style={inp} type="number" value={form.earnest_money} onChange={e => update("earnest_money", e.target.value)} placeholder="5000" /></div>
                <div><label style={lbl}>Proposed Closing Date</label><input style={inp} type="date" value={form.closing_date} onChange={e => update("closing_date", e.target.value)} /></div>
              </div>
              <div><label style={lbl}>Message to Seller (optional)</label>
                <textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={form.message} onChange={e => update("message", e.target.value)} placeholder="Tell the seller about yourself and why you love the home..." />
              </div>
              <button onClick={() => setStep(2)} style={{ background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, cursor: "pointer" }}>Continue</button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, background: "var(--warm)", padding: "14px 16px", borderRadius: 10 }}>Contingencies protect you as a buyer. Keeping them gives you an exit if something goes wrong. Waiving them makes your offer more competitive but carries more risk.</p>
              {[
                { key: "financing_contingency", label: "Financing Contingency", desc: "Protects you if your loan falls through. Recommended if you need a mortgage." },
                { key: "inspection_contingency", label: "Inspection Contingency", desc: "Allows you to negotiate repairs or walk away after a home inspection." },
                { key: "appraisal_contingency", label: "Appraisal Contingency", desc: "Protects you if the home appraises below your offer price." },
              ].map(c => (
                <div key={c.key} style={{ background: form[c.key] ? "#f0fff4" : "#fff5f5", border: "1px solid " + (form[c.key] ? "#9ae6b4" : "#fcc"), borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14, cursor: "pointer" }} onClick={() => update(c.key, !form[c.key])}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: form[c.key] ? "var(--sage)" : "#ddd", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    {form[c.key] && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>v</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 3 }}>{c.label}</div>
                    <div style={{ fontSize: 12, color: "#777", lineHeight: 1.5 }}>{c.desc}</div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 12, padding: "13px", fontSize: 14, cursor: "pointer" }}>Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 2, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, cursor: "pointer" }}>Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div><label style={lbl}>Your Full Name</label><input style={inp} value={form.buyer_name} onChange={e => update("buyer_name", e.target.value)} placeholder="John Smith" /></div>
              <div><label style={lbl}>Email Address</label><input style={inp} type="email" value={form.buyer_email} onChange={e => update("buyer_email", e.target.value)} placeholder="john@email.com" /></div>
              <div><label style={lbl}>Phone Number</label><input style={inp} type="tel" value={form.buyer_phone} onChange={e => update("buyer_phone", e.target.value)} placeholder="(555) 123-4567" /></div>
              <div style={{ background: "var(--warm)", borderRadius: 10, padding: "14px 16px", fontSize: 13, lineHeight: 1.8 }}>
                <strong>Offer Summary</strong><br />
                Price: {formatPrice(form.offer_price)} | Earnest: {formatPrice(form.earnest_money)} | Closing: {form.closing_date || "TBD"}<br />
                Contingencies: {[form.financing_contingency && "Financing", form.inspection_contingency && "Inspection", form.appraisal_contingency && "Appraisal"].filter(Boolean).join(", ") || "None"}
              </div>
              {error && <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 10, padding: "12px 16px", color: "var(--rust)", fontSize: 13 }}>{error}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 12, padding: "13px", fontSize: 14, cursor: "pointer" }}>Back</button>
                <button onClick={submit} disabled={submitting} style={{ flex: 2, background: submitting ? "#aaa" : "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, cursor: submitting ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
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

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "var(--ink)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    setSigned(true);
  };

  const stop = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
  };

  const save = () => {
    if (!signed) return;
    const canvas = canvasRef.current;
    onSign(canvas.toDataURL());
  };

  return (
    <div>
      <div style={{ border: "1.5px solid var(--warm)", borderRadius: 10, background: "#fff", marginBottom: 8 }}>
        <canvas ref={canvasRef} width={460} height={120} style={{ display: "block", cursor: "crosshair", width: "100%", height: 120 }}
          onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} />
      </div>
      <div style={{ fontSize: 11, color: "#aaa", marginBottom: 10 }}>Sign above using your mouse or touchscreen</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={clear} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 8, padding: "8px", fontSize: 13, cursor: "pointer" }}>Clear</button>
        <button onClick={save} disabled={!signed} style={{ flex: 2, background: signed ? "var(--sage)" : "#ccc", color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontSize: 13, cursor: signed ? "pointer" : "default" }}>Apply Signature</button>
      </div>
    </div>
  );
}

function StepCard({ step, offer, user, onUpdate }) {
  const isSeller = user?.id === offer.seller_id;
  const isBuyer = user?.id === offer.buyer_id;
  const isCurrentStep = offer.step_index === step.id;
  const isCompleted = offer.step_index > step.id;
  const isLocked = offer.step_index < step.id;
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [showSign, setShowSign] = useState(false);
  const [signed, setSigned] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const inp = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "var(--cream)", fontSize: 14, outline: "none" };

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

  const advance = async (newStatus) => {
    setLoading(true);
    const nextIndex = offer.step_index + 1;
    const nextStep = TRANSACTION_STEPS[nextIndex - 1];
    const updates = { step_index: nextIndex, step: nextStep?.key || "closing" };
    if (newStatus) updates.status = newStatus;
    if (uploadedFile) updates["step_" + step.key + "_doc"] = uploadedFile;
    const { error } = await sb.from("offers").update(updates).eq("id", offer.id);
    if (!error) {
      const otherPartyId = isSeller ? offer.buyer_id : offer.seller_id;
      await sendNotification(otherPartyId, step.label + " step completed. Action required on your end.", "offers");
      onUpdate({ ...offer, ...updates });
    }
    setLoading(false);
  };

  const respondToOffer = async (status) => {
    setLoading(true);
    const updates = { status };
    if (status === "accepted") { updates.step = "earnest"; updates.step_index = 2; }
    const { error } = await sb.from("offers").update(updates).eq("id", offer.id);
    if (!error) {
      const otherPartyId = isSeller ? offer.buyer_id : offer.seller_id;
      await sendNotification(otherPartyId, status === "accepted" ? "Your offer was accepted! Next step: Earnest Money deposit." : "Your offer was " + status + ".", "offers");
      onUpdate({ ...offer, ...updates });
    }
    setLoading(false);
  };

  if (isLocked) return (
    <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 14, padding: "18px 22px", marginBottom: 12, opacity: 0.5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>{step.icon}</span>
        <div>
          <div style={{ fontWeight: 500, fontSize: 15 }}>Step {step.id}: {step.label}</div>
          <div style={{ fontSize: 12, color: "#aaa" }}>Locked - complete previous steps first</div>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 18 }}>🔒</span>
      </div>
    </div>
  );

  if (isCompleted) return (
    <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 14, padding: "18px 22px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>{step.icon}</span>
        <div>
          <div style={{ fontWeight: 500, fontSize: 15, color: "var(--sage)" }}>Step {step.id}: {step.label}</div>
          <div style={{ fontSize: 12, color: "var(--sage)" }}>Completed</div>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 20 }}>✅</span>
      </div>
    </div>
  );

  return (
    <div style={{ background: "var(--card)", border: "2px solid var(--gold)", borderRadius: 14, padding: "22px", marginBottom: 12, animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 28 }}>{step.icon}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Step {step.id}: {step.label}</div>
          <div style={{ fontSize: 13, color: "#666" }}>{step.desc}</div>
        </div>
        <span style={{ marginLeft: "auto", background: "var(--gold)", color: "#fff", fontSize: 10, padding: "3px 10px", borderRadius: 12, fontWeight: 700 }}>ACTION NEEDED</span>
      </div>

      <div style={{ background: "var(--warm)", borderRadius: 10, padding: "14px 16px", marginBottom: 16, fontSize: 14, lineHeight: 1.7 }}>
        <strong>Your action:</strong> {isBuyer ? step.buyerAction : step.sellerAction}
      </div>

      {step.key === "offer" && offer.status === "pending" && isSeller && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {offer.message && <div style={{ background: "var(--cream)", borderRadius: 10, padding: "14px", fontSize: 14, color: "#555", fontStyle: "italic" }}>"{offer.message}"</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div style={{ background: "var(--warm)", borderRadius: 10, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#888" }}>OFFER PRICE</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--gold)" }}>{formatPrice(offer.offer_price)}</div>
            </div>
            <div style={{ background: "var(--warm)", borderRadius: 10, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#888" }}>EARNEST</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{formatPrice(offer.earnest_money)}</div>
            </div>
            <div style={{ background: "var(--warm)", borderRadius: 10, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#888" }}>CLOSING</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{offer.closing_date || "TBD"}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#666" }}>
            Contingencies: {[offer.financing_contingency && "Financing", offer.inspection_contingency && "Inspection", offer.appraisal_contingency && "Appraisal"].filter(Boolean).join(", ") || "None"}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => respondToOffer("accepted")} disabled={loading} style={{ flex: 2, background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading ? <Spinner /> : "Accept Offer"}
            </button>
            <button onClick={() => respondToOffer("declined")} disabled={loading} style={{ flex: 1, background: "#fff5f5", color: "var(--rust)", border: "1px solid #fcc", borderRadius: 12, padding: "12px", fontSize: 13, cursor: "pointer" }}>Decline</button>
          </div>
        </div>
      )}

      {step.key === "offer" && offer.status === "pending" && isBuyer && (
        <div style={{ background: "var(--cream)", borderRadius: 10, padding: "14px", fontSize: 14, color: "#666", textAlign: "center" }}>
          Waiting for seller to review your offer...
          <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 6 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", animation: "pulse 1.4s " + (i * 0.2) + "s infinite" }} />)}
          </div>
        </div>
      )}

      {step.key !== "offer" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>Upload Document (optional)</label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px dashed var(--warm)", borderRadius: 10, padding: "12px 16px", cursor: "pointer", background: "var(--cream)" }}>
              <span style={{ fontSize: 20 }}>📎</span>
              <span style={{ fontSize: 13, color: "#888" }}>{uploading ? "Uploading..." : uploadedFile ? "Document uploaded" : "Click to upload document"}</span>
              <input type="file" style={{ display: "none" }} onChange={e => e.target.files[0] && uploadDoc(e.target.files[0])} />
            </label>
            {uploadedFile && <div style={{ fontSize: 12, color: "var(--sage)", marginTop: 4 }}>Document ready to submit</div>}
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>Add a Note (optional)</label>
            <textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} value={note} onChange={e => setNote(e.target.value)} placeholder="Add any notes for the other party..." />
          </div>

          {step.key === "closing" && (
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 6, textTransform: "uppercase" }}>E-Signature Required</label>
              {!signed ? <SignaturePad onSign={() => setSigned(true)} /> : (
                <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--sage)" }}>Signature captured</div>
              )}
            </div>
          )}

          <button onClick={() => advance()} disabled={loading || (step.key === "closing" && !signed)} style={{ background: loading ? "#aaa" : step.key === "closing" && !signed ? "#ccc" : "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {loading ? <Spinner /> : step.key === "closing" ? "Complete Transaction" : "Mark Complete & Continue"}
          </button>
        </div>
      )}
    </div>
  );
}

function OffersTab({ user, onRequireAuth }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOffer, setActiveOffer] = useState(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function load() {
      const { data } = await sb.from("offers").select("*, listings(address, city, state, seller_name, price, user_id)").or("buyer_id.eq." + user.id + ",seller_id.eq." + user.id).order("created_at", { ascending: false });
      setOffers(data || []);
      setLoading(false);
    }
    load();
  }, [user]);

  const updateOffer = (updated) => {
    setOffers(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
    if (activeOffer?.id === updated.id) setActiveOffer(prev => ({ ...prev, ...updated }));
  };

  if (!user) return (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <h2 style={{ fontSize: 32, marginBottom: 12 }}>Your Offers</h2>
      <p style={{ color: "#888", lineHeight: 1.7, marginBottom: 28 }}>Sign in to view and manage your offers.</p>
      <button onClick={onRequireAuth} style={{ background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, cursor: "pointer" }}>Sign In</button>
    </div>
  );

  if (activeOffer) {
    const currentStepIndex = activeOffer.step_index || 1;
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
        <button onClick={() => setActiveOffer(null)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>Back to All Offers</button>
        <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16, padding: "22px 26px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>{activeOffer.listings?.address}</div>
              <div style={{ fontSize: 13, color: "#888" }}>{activeOffer.listings?.city}, {activeOffer.listings?.state}</div>
            </div>
            <span style={{ background: activeOffer.status === "accepted" ? "var(--sage)" : activeOffer.status === "declined" ? "#aaa" : "var(--gold)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, textTransform: "uppercase" }}>{activeOffer.status}</span>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ background: "var(--warm)", borderRadius: 10, padding: "10px 14px", flex: 1, minWidth: 100 }}>
              <div style={{ fontSize: 10, color: "#888" }}>OFFER PRICE</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--gold)" }}>{formatPrice(activeOffer.offer_price)}</div>
            </div>
            <div style={{ background: "var(--warm)", borderRadius: 10, padding: "10px 14px", flex: 1, minWidth: 100 }}>
              <div style={{ fontSize: 10, color: "#888" }}>EARNEST</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{formatPrice(activeOffer.earnest_money)}</div>
            </div>
            <div style={{ background: "var(--warm)", borderRadius: 10, padding: "10px 14px", flex: 1, minWidth: 100 }}>
              <div style={{ fontSize: 10, color: "#888" }}>CLOSING</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{activeOffer.closing_date || "TBD"}</div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", overflowX: "auto", gap: 0, paddingBottom: 8, marginBottom: 20 }}>
            {TRANSACTION_STEPS.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{ textAlign: "center", width: 64 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: currentStepIndex > s.id ? "var(--sage)" : currentStepIndex === s.id ? "var(--gold)" : "var(--warm)", color: currentStepIndex >= s.id ? "#fff" : "#aaa", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: 12 }}>
                    {currentStepIndex > s.id ? "v" : s.icon}
                  </div>
                  <div style={{ fontSize: 8, color: currentStepIndex === s.id ? "var(--gold)" : "#aaa", lineHeight: 1.2 }}>{s.label}</div>
                </div>
                {i < TRANSACTION_STEPS.length - 1 && <div style={{ width: 16, height: 2, background: currentStepIndex > s.id ? "var(--sage)" : "var(--warm)", flexShrink: 0, marginBottom: 16 }} />}
              </div>
            ))}
          </div>
        </div>

        {activeOffer.status === "declined" && (
          <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 14, padding: "20px", textAlign: "center", color: "var(--rust)" }}>
            This offer was declined.
          </div>
        )}

        {activeOffer.status !== "declined" && TRANSACTION_STEPS.map(step => (
          <StepCard key={step.id} step={step} offer={activeOffer} user={user} onUpdate={updateOffer} />
        ))}

        {activeOffer.step === "closing" && activeOffer.step_index > 9 && (
          <div style={{ background: "var(--sage)", color: "#fff", borderRadius: 16, padding: "24px", textAlign: "center", fontSize: 18, fontWeight: 500 }}>
            Transaction Complete! Congratulations!
          </div>
        )}
      </div>
    );
  }

  const buyerOffers = offers.filter(o => o.buyer_id === user.id);
  const sellerOffers = offers.filter(o => o.seller_id === user.id);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <h2 style={{ fontSize: 36, fontWeight: 400, marginBottom: 6 }}>Offers</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 32 }}>Track every offer and transaction step by step.</p>
      {loading && <div style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>Loading...</div>}
      {!loading && offers.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px", color: "#aaa", background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 22, marginBottom: 8 }}>No offers yet</div>
          <div style={{ fontSize: 14 }}>Browse homes and make an offer to get started.</div>
        </div>
      )}
      {sellerOffers.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 22, fontWeight: 400, marginBottom: 16 }}>Offers on My Listings</h3>
          {sellerOffers.map(o => (
            <div key={o.id} onClick={() => setActiveOffer(o)} style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 14, padding: "18px 22px", marginBottom: 12, cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--warm)"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 16, marginBottom: 3 }}>{o.listings?.address}</div>
                  <div style={{ fontSize: 13, color: "#888" }}>Buyer: {o.buyer_name} - {formatPrice(o.offer_price)}</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Step {o.step_index} of 9: {TRANSACTION_STEPS.find(s => s.id === o.step_index)?.label}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <span style={{ background: o.status === "accepted" ? "var(--sage)" : o.status === "declined" ? "#aaa" : "var(--gold)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 16, textTransform: "uppercase" }}>{o.status}</span>
                  <span style={{ fontSize: 12, color: "var(--gold)" }}>View Details →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {buyerOffers.length > 0 && (
        <div>
          <h3 style={{ fontSize: 22, fontWeight: 400, marginBottom: 16 }}>My Offers</h3>
          {buyerOffers.map(o => (
            <div key={o.id} onClick={() => setActiveOffer(o)} style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 14, padding: "18px 22px", marginBottom: 12, cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--warm)"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 16, marginBottom: 3 }}>{o.listings?.address}</div>
                  <div style={{ fontSize: 13, color: "#888" }}>Offer: {formatPrice(o.offer_price)} - Closing: {o.closing_date || "TBD"}</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Step {o.step_index} of 9: {TRANSACTION_STEPS.find(s => s.id === o.step_index)?.label}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <span style={{ background: o.status === "accepted" ? "var(--sage)" : o.status === "declined" ? "#aaa" : "var(--gold)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 16, textTransform: "uppercase" }}>{o.status}</span>
                  <span style={{ fontSize: 12, color: "var(--gold)" }}>View Details →</span>
                </div>
              </div>
            </div>
          ))}
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
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    const { data } = await sb.from("messages")
      .select("*, listings(address, city, state, seller_name, user_id)")
      .or("user_id.eq." + user.id + ",recipient_id.eq." + user.id)
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    const convMap = {};
    data.forEach(msg => {
      const key = msg.listing_id + "-" + [msg.user_id, msg.recipient_id].sort().join("-");
      if (!convMap[key]) {
        convMap[key] = {
          key,
          listing_id: msg.listing_id,
          listing: msg.listings,
          other_user_id: msg.user_id === user.id ? msg.recipient_id : msg.user_id,
          other_name: msg.user_id === user.id ? msg.recipient_name : msg.sender_name,
          last_message: msg.body,
          last_time: msg.created_at,
          unread: 0,
        };
      }
      if (msg.recipient_id === user.id && !msg.read) convMap[key].unread++;
    });

    setConversations(Object.values(convMap).sort((a, b) => new Date(b.last_time) - new Date(a.last_time)));
    setLoading(false);
  };

  useEffect(() => {
    if (newThread && user) {
      const conv = {
        key: newThread.id + "-" + [user.id, newThread.user_id].sort().join("-"),
        listing_id: newThread.id,
        listing: newThread,
        other_user_id: newThread.user_id,
        other_name: newThread.seller_name,
        last_message: "",
        last_time: new Date().toISOString(),
        unread: 0,
      };
      setActiveConv(conv);
    }
  }, [newThread, user]);

  useEffect(() => {
    if (!activeConv || !user) return;
    loadMessages();
    const sub = sb.channel("conv-" + activeConv.key)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "listing_id=eq." + activeConv.listing_id },
        payload => {
          const msg = payload.new;
          if (msg.user_id === activeConv.other_user_id || msg.recipient_id === activeConv.other_user_id) {
            setMessages(prev => [...prev, msg]);
          }
        })
      .subscribe();
    return () => sb.removeChannel(sub);
  }, [activeConv?.key]);

  const loadMessages = async () => {
    const { data } = await sb.from("messages").select("*")
      .eq("listing_id", activeConv.listing_id)
      .or("and(user_id.eq." + user.id + ",recipient_id.eq." + activeConv.other_user_id + "),and(user_id.eq." + activeConv.other_user_id + ",recipient_id.eq." + user.id + ")")
      .order("created_at", { ascending: true });
    setMessages(data || []);
    await sb.from("messages").update({ read: true }).eq("listing_id", activeConv.listing_id).eq("recipient_id", user.id);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || !activeConv || !user) return;
    setSending(true);
    const msg = {
      listing_id: activeConv.listing_id,
      user_id: user.id,
      recipient_id: activeConv.other_user_id,
      sender_name: user.user_metadata?.full_name || user.email,
      recipient_name: activeConv.other_name,
      body: input,
      read: false,
    };
    const { data } = await sb.from("messages").insert([msg]).select();
    if (data) {
      setMessages(prev => [...prev, data[0]]);
      setInput("");
      await sendNotification(activeConv.other_user_id, "New message from " + (user.user_metadata?.full_name || user.email) + " about " + (activeConv.listing?.address || "a listing"), "messages");
      loadConversations();
    }
    setSending(false);
  };

  if (!user) return (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
      <h2 style={{ fontSize: 32, marginBottom: 12 }}>Messages</h2>
      <p style={{ color: "#888", lineHeight: 1.7, marginBottom: 28 }}>Sign in to message buyers and sellers directly.</p>
      <button onClick={onRequireAuth} style={{ background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, cursor: "pointer" }}>Sign In</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
      <h2 style={{ fontSize: 36, fontWeight: 400, marginBottom: 24 }}>Messages</h2>
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, height: 580 }}>

        {/* Conversation list */}
        <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--warm)", fontWeight: 600, fontSize: 14 }}>Conversations</div>
          <div style={{ flex: 1, overflow: "auto" }}>
            {loading && <div style={{ padding: 24, textAlign: "center", color: "#ccc", fontSize: 13 }}>Loading...</div>}
            {!loading && conversations.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "#ccc", fontSize: 13 }}>No conversations yet. Browse a listing and message the seller!</div>
            )}
            {conversations.map(conv => (
              <div key={conv.key} onClick={() => setActiveConv(conv)}
                style={{ padding: "14px 18px", cursor: "pointer", borderBottom: "1px solid var(--warm)", background: activeConv?.key === conv.key ? "var(--warm)" : "transparent", transition: "background 0.15s", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div style={{ fontWeight: conv.unread > 0 ? 700 : 500, fontSize: 13 }}>{conv.listing?.address || "Property"}</div>
                  <div style={{ fontSize: 10, color: "#aaa" }}>{timeAgo(conv.last_time)}</div>
                </div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{conv.other_name}</div>
                <div style={{ fontSize: 12, color: conv.unread > 0 ? "var(--ink)" : "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{conv.last_message}</div>
                {conv.unread > 0 && (
                  <div style={{ position: "absolute", top: 14, right: 14, background: "var(--sage)", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{conv.unread}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Message pane */}
        <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {activeConv ? (
            <>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--warm)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--sage)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14 }}>
                  {activeConv.other_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{activeConv.other_name}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{activeConv.listing?.address}</div>
                </div>
              </div>

              <div style={{ flex: 1, overflow: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", color: "#ccc", marginTop: 60, fontSize: 16 }}>Send a message to start the conversation</div>
                )}
                {messages.map((m, i) => {
                  const isMe = m.user_id === user.id;
                  const showAvatar = !isMe && (i === 0 || messages[i-1].user_id !== m.user_id);
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
                      {!isMe && (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: showAvatar ? "var(--mist)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "var(--sage)", flexShrink: 0 }}>
                          {showAvatar ? (activeConv.other_name?.[0]?.toUpperCase() || "?") : ""}
                        </div>
                      )}
                      <div style={{ maxWidth: "68%" }}>
                        <div style={{ background: isMe ? "var(--sage)" : "var(--warm)", color: isMe ? "#fff" : "var(--ink)", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 14, lineHeight: 1.5 }}>
                          {m.body}
                        </div>
                        <div style={{ fontSize: 10, color: "#bbb", marginTop: 3, textAlign: isMe ? "right" : "left" }}>
                          {timeAgo(m.created_at)} {isMe && m.read ? "✓✓" : isMe ? "✓" : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--warm)", display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Message..." rows={1}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 22, border: "1.5px solid var(--warm)", background: "var(--cream)", fontSize: 14, outline: "none", resize: "none", fontFamily: "sans-serif", lineHeight: 1.5, maxHeight: 100, overflow: "auto" }} />
                <button onClick={send} disabled={sending || !input.trim()}
                  style={{ background: input.trim() ? "var(--sage)" : "#ddd", color: "#fff", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {sending ? <Spinner /> : "↑"}
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, color: "#ccc", gap: 12 }}>
              <div style={{ fontSize: 48 }}>💬</div>
              <div style={{ fontSize: 18 }}>Select a conversation</div>
              <div style={{ fontSize: 13 }}>or browse a listing to start one</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function SellTab({ user, onRequireAuth }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ address: "", city: "", state: "", zip: "", price: "", beds: "", baths: "", sqft: "", type: "Single Family", description: "", seller_name: "", seller_email: "", seller_phone: "" });
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "var(--cream)", fontSize: 14, outline: "none" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 500, color: "#888", marginBottom: 5, textTransform: "uppercase" };

  useEffect(() => {
    if (user) setForm(f => ({ ...f, seller_name: user.user_metadata?.full_name || "", seller_email: user.email || "" }));
  }, [user]);

  if (!user) return (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 32, marginBottom: 12 }}>Sign in to list your home</h2>
      <p style={{ color: "#888", lineHeight: 1.7, marginBottom: 28 }}>Create a free account to post your listing and message buyers directly.</p>
      <button onClick={onRequireAuth} style={{ background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, cursor: "pointer" }}>Sign Up Free</button>
    </div>
  );

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
        photos: photoUrls, tags: [], user_id: user.id,
      }]);
      if (insertErr) throw new Error(insertErr.message);
      setSubmitted(true);
    } catch (e) { setError(e.message); }
    setSubmitting(false);
  };

  const reset = () => {
    setSubmitted(false); setStep(1); setPhotos([]); setError(null);
    setForm({ address: "", city: "", state: "", zip: "", price: "", beds: "", baths: "", sqft: "", type: "Single Family", description: "", seller_name: user?.user_metadata?.full_name || "", seller_email: user?.email || "", seller_phone: "" });
  };

  if (submitted) return (
    <div style={{ maxWidth: 520, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
      <h2 style={{ fontSize: 36, marginBottom: 12 }}>Your listing is live!</h2>
      <p style={{ color: "#666", lineHeight: 1.8, marginBottom: 28 }}>Buyers can now find and message you directly.</p>
      <button onClick={reset} style={{ background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, cursor: "pointer" }}>List Another Property</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>
      <h2 style={{ fontSize: 36, fontWeight: 400, marginBottom: 6 }}>List Your Home</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 28 }}>Sell directly to buyers. No realtor. No commission.</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {["Property Details", "Photos", "Pricing", "Contact"].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: step > i + 1 ? "var(--sage)" : step === i + 1 ? "var(--gold)" : "var(--warm)", color: step >= i + 1 ? "#fff" : "#aaa", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 5px", fontSize: 12, fontWeight: 600 }}>{step > i + 1 ? "v" : i + 1}</div>
            <div style={{ fontSize: 10, color: step === i + 1 ? "var(--gold)" : "#aaa" }}>{s}</div>
          </div>
        ))}
      </div>
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div><label style={lbl}>Street Address</label><input style={inp} value={form.address} onChange={e => update("address", e.target.value)} placeholder="123 Main Street" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><label style={lbl}>City</label><input style={inp} value={form.city} onChange={e => update("city", e.target.value)} placeholder="Austin" /></div>
            <div><label style={lbl}>State</label><input style={inp} value={form.state} onChange={e => update("state", e.target.value)} placeholder="TX" /></div>
            <div><label style={lbl}>ZIP</label><input style={inp} value={form.zip} onChange={e => update("zip", e.target.value)} placeholder="78701" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <div><label style={lbl}>Beds</label><input style={inp} type="number" value={form.beds} onChange={e => update("beds", e.target.value)} placeholder="3" /></div>
            <div><label style={lbl}>Baths</label><input style={inp} type="number" value={form.baths} onChange={e => update("baths", e.target.value)} placeholder="2" /></div>
            <div><label style={lbl}>Sq Ft</label><input style={inp} type="number" value={form.sqft} onChange={e => update("sqft", e.target.value)} placeholder="1800" /></div>
            <div><label style={lbl}>Type</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.type} onChange={e => update("type", e.target.value)}>
                <option>Single Family</option><option>Condo</option><option>Townhome</option><option>Multi-Family</option><option>Land</option>
              </select>
            </div>
          </div>
          <button onClick={() => setStep(2)} style={{ background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, cursor: "pointer" }}>Continue</button>
        </div>
      )}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <label htmlFor="photo-upload" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed var(--warm)", borderRadius: 14, padding: "30px 20px", cursor: "pointer", background: "var(--cream)" }}>
            <span style={{ fontSize: 34, marginBottom: 8 }}>📷</span>
            <span style={{ fontWeight: 500, fontSize: 14, marginBottom: 3 }}>Click to upload photos</span>
            <span style={{ fontSize: 12, color: "#aaa" }}>JPG, PNG, WEBP - Multiple allowed</span>
            <input id="photo-upload" type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => addPhotos(e.target.files)} />
          </label>
          {photos.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px,1fr))", gap: 8 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "4/3" }}>
                  <img src={p.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 11 }}>x</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 12, padding: "13px", fontSize: 14, cursor: "pointer" }}>Back</button>
            <button onClick={() => setStep(3)} style={{ flex: 2, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, cursor: "pointer" }}>Continue</button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div><label style={lbl}>Asking Price</label><input style={inp} type="number" value={form.price} onChange={e => update("price", e.target.value)} placeholder="485000" /></div>
          <div><label style={lbl}>Description</label><textarea style={{ ...inp, minHeight: 110, resize: "vertical" }} value={form.description} onChange={e => update("description", e.target.value)} placeholder="Describe your home..." /></div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(2)} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 12, padding: "13px", fontSize: 14, cursor: "pointer" }}>Back</button>
            <button onClick={() => setStep(4)} style={{ flex: 2, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, cursor: "pointer" }}>Continue</button>
          </div>
        </div>
      )}
      {step === 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div><label style={lbl}>Your Name</label><input style={inp} value={form.seller_name} onChange={e => update("seller_name", e.target.value)} placeholder="Jane Smith" /></div>
          <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.seller_email} onChange={e => update("seller_email", e.target.value)} placeholder="jane@email.com" /></div>
          <div><label style={lbl}>Phone</label><input style={inp} type="tel" value={form.seller_phone} onChange={e => update("seller_phone", e.target.value)} placeholder="(555) 123-4567" /></div>
          {error && <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 10, padding: "12px 16px", color: "var(--rust)", fontSize: 13 }}>{error}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(3)} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 12, padding: "13px", fontSize: 14, cursor: "pointer" }}>Back</button>
            <button onClick={publish} disabled={submitting} style={{ flex: 2, background: submitting ? "#999" : "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, cursor: submitting ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {submitting ? <Spinner /> : "Publish Listing"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileTab({ user, onRequireAuth }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!user) return;
    sb.from("listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setListings(data || []); setLoading(false); });
  }, [user]);

  const deleteListing = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    await sb.from("listings").delete().eq("id", id);
    setListings(prev => prev.filter(l => l.id !== id));
  };

  if (!user) return (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
      <h2 style={{ fontSize: 32, marginBottom: 12 }}>Your Profile</h2>
      <p style={{ color: "#888", lineHeight: 1.7, marginBottom: 28 }}>Sign in to manage your listings.</p>
      <button onClick={onRequireAuth} style={{ background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, cursor: "pointer" }}>Sign In</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36, background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16, padding: "24px 28px" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--sage)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff", fontWeight: 600 }}>
          {(user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 500 }}>{user.user_metadata?.full_name || "Your Account"}</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{user.email}</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 13, color: "#aaa" }}>{listings.length} listing{listings.length !== 1 ? "s" : ""}</div>
      </div>
      <h3 style={{ fontSize: 26, fontWeight: 400, marginBottom: 20 }}>My Listings</h3>
      {loading && <div style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>Loading...</div>}
      {!loading && listings.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px", color: "#aaa", background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16 }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>No listings yet</div>
          <div style={{ fontSize: 14 }}>Head to the Sell tab to list your first home.</div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {listings.map(l => <ListingCard key={l.id} listing={l} onClick={setSelected} onDelete={deleteListing} isOwner={true} />)}
      </div>
      <ListingModal listing={selected} onClose={() => setSelected(null)} onMessage={() => {}} onOffer={() => {}} user={user} />
    </div>
  );
}

function ValuationTab() {
  const [form, setForm] = useState({ address: "", beds: 3, baths: 2, sqft: 1800, year: 2005, condition: "Good", type: "Single Family" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "var(--cream)", fontSize: 14, outline: "none" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 500, color: "#888", marginBottom: 5, textTransform: "uppercase" };

  const estimate = async () => {
    setLoading(true); setResult(null);
    try {
      const text = await callClaude([{ role: "user", content: "You are a real estate valuation expert. Return ONLY valid JSON, no markdown. Property: " + (form.address || "Unknown") + ", Type: " + form.type + ", Beds: " + form.beds + ", Baths: " + form.baths + ", SqFt: " + form.sqft + ", Year: " + form.year + ", Condition: " + form.condition + ". Return: {\"low\":number,\"mid\":number,\"high\":number,\"pricePerSqft\":number,\"summary\":\"2-3 sentences\",\"tips\":[\"tip1\",\"tip2\",\"tip3\"]}" }]);
      setResult(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch {
      setResult({ low: 380000, mid: 435000, high: 490000, pricePerSqft: 241, summary: "Based on your inputs, this property sits in a competitive range.", tips: ["Stage key rooms before listing", "Price at mid-range to attract multiple offers", "Disclose all known issues upfront"] });
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>
      <h2 style={{ fontSize: 36, fontWeight: 400, marginBottom: 6 }}>Home Valuation</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 28 }}>Get an instant estimate for your home - no realtor required.</p>
      <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16, padding: "26px", marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={lbl}>Property Address</label><input style={inp} value={form.address} onChange={e => update("address", e.target.value)} placeholder="123 Main St, Austin TX" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><label style={lbl}>Beds</label><input style={inp} type="number" value={form.beds} onChange={e => update("beds", Number(e.target.value))} /></div>
            <div><label style={lbl}>Baths</label><input style={inp} type="number" value={form.baths} onChange={e => update("baths", Number(e.target.value))} /></div>
            <div><label style={lbl}>Sq Ft</label><input style={inp} type="number" value={form.sqft} onChange={e => update("sqft", Number(e.target.value))} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><label style={lbl}>Year Built</label><input style={inp} type="number" value={form.year} onChange={e => update("year", Number(e.target.value))} /></div>
            <div><label style={lbl}>Condition</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.condition} onChange={e => update("condition", e.target.value)}>
                <option>Excellent</option><option>Good</option><option>Fair</option><option>Needs Work</option>
              </select>
            </div>
            <div><label style={lbl}>Type</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.type} onChange={e => update("type", e.target.value)}>
                <option>Single Family</option><option>Condo</option><option>Townhome</option><option>Multi-Family</option>
              </select>
            </div>
          </div>
          <button onClick={estimate} disabled={loading} style={{ background: loading ? "#aaa" : "var(--rust)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {loading ? <><Spinner /> Analyzing your property...</> : "Get My Home Value"}
          </button>
        </div>
      </div>
      {result && (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
          <div style={{ background: "linear-gradient(135deg,var(--ink),#2d2010)", borderRadius: 16, padding: "26px", color: "#fff", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Estimated Value Range</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
              {[["Low", result.low, "#999"], ["Mid", result.mid, "var(--gold-light)"], ["High", result.high, "var(--mist)"]].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: c }}>{formatPrice(v)}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 14, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>{result.summary}</div>
            <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>~${result.pricePerSqft}/sqft</div>
          </div>
          <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16, padding: "22px 24px" }}>
            <div style={{ fontSize: 20, marginBottom: 14, fontWeight: 500 }}>Tips to Maximize Your Sale Price</div>
            {result.tips.map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <span style={{ background: "var(--sage)", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                <span style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContractsTab() {
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ buyer: "", seller: "", address: "", city: "", state: "", zip: "", price: "", closeDate: "", earnest: "", agentName: "", leaseMonths: "12", monthlyRent: "", deposit: "", leaseStart: "" });
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contractText, setContractText] = useState("");
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "var(--cream)", fontSize: 14, outline: "none" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 500, color: "#888", marginBottom: 5, textTransform: "uppercase" };

  const CONTRACT_TEMPLATES = [
    { id: 1, name: "Purchase & Sale Agreement", desc: "Comprehensive residential purchase contract including price, contingencies, closing date, and earnest money terms.", icon: "📋" },
    { id: 2, name: "Property Disclosure Statement", desc: "Seller disclosure of known material defects, systems condition, HOA details, and legal issues.", icon: "📝" },
    { id: 3, name: "Counteroffer Addendum", desc: "Formal counteroffer modifying the original offer price, terms, or contingencies.", icon: "🔄" },
    { id: 4, name: "Inspection Contingency Waiver", desc: "Buyer waives the right to a home inspection contingency, accepting the property in its current condition.", icon: "✅" },
    { id: 5, name: "Earnest Money Agreement", desc: "Defines earnest money amount, holder, deposit deadline, and conditions for return or forfeiture.", icon: "💰" },
    { id: 6, name: "As-Is Addendum", desc: "Seller sells property in its current condition with no repairs or credits. Buyer accepts all known and unknown defects.", icon: "🏚️" },
    { id: 7, name: "Lead Paint Disclosure", desc: "Federally required disclosure for homes built before 1978 regarding known lead-based paint hazards.", icon: "⚠️" },
    { id: 8, name: "Seller Financing Addendum", desc: "Terms for owner financing including loan amount, interest rate, payment schedule, and default provisions.", icon: "🏦" },
    { id: 9, name: "Residential Lease Agreement", desc: "Fixed-term lease covering rent, deposit, maintenance, and tenant obligations.", icon: "🔑" },
  ];

  const getPrompt = (template, f) => {
    const base = "Property: " + f.address + ", " + f.city + ", " + f.state + " " + f.zip + ". Buyer: " + (f.buyer || "_______________") + ". Seller: " + (f.seller || "_______________") + ". Purchase Price: $" + (f.price || "_______________") + ". Closing Date: " + (f.closeDate || "_______________") + ". Earnest Money: $" + (f.earnest || "_______________") + ".";
    const prompts = {
      "Purchase & Sale Agreement": "Generate a detailed professionally structured residential Purchase and Sale Agreement for use in the United States. " + base + " Include all of the following numbered sections with proper legal language: 1) Parties and Property Description, 2) Purchase Price and Payment Terms, 3) Earnest Money Deposit, 4) Financing Contingency, 5) Inspection Contingency, 6) Appraisal Contingency, 7) Title and Closing, 8) Possession Date, 9) Included and Excluded Items, 10) Condition of Property, 11) Closing Costs, 12) Default and Remedies, 13) Dispute Resolution, 14) Entire Agreement. End with signature blocks for both parties with date lines. Use clear plain-English legal language suitable for all US states. Do not use markdown.",
      "Property Disclosure Statement": "Generate a detailed Seller Property Disclosure Statement for US residential real estate. Seller: " + (f.seller || "_______________") + ". Property: " + f.address + ", " + f.city + ", " + f.state + " " + f.zip + ". Include disclosure questions with Yes, No, Unknown response options for: 1) Roof condition and age, 2) Foundation and structural issues, 3) Water intrusion or flooding history, 4) Plumbing systems, 5) Electrical systems, 6) HVAC systems and age, 7) Pest or termite history, 8) Environmental hazards, 9) HOA membership and fees, 10) Legal disputes or liens, 11) Permits and unpermitted work, 12) Neighborhood nuisances, 13) Any other known material defects. Include a seller certification statement and signature block. Use plain-English legal language suitable for all US states. Do not use markdown.",
      "Counteroffer Addendum": "Generate a formal Counteroffer Addendum for US residential real estate. " + base + " Include: 1) Reference to original offer date, 2) Modified purchase price, 3) Modified closing date, 4) Modified contingency terms, 5) Modified earnest money if applicable, 6) Any additional terms or conditions, 7) Expiration date and time of this counteroffer, 8) Statement that all other terms of original offer remain unchanged, 9) Signature blocks for both parties with date lines. Use plain-English legal language suitable for all US states. Do not use markdown.",
      "Inspection Contingency Waiver": "Generate a detailed Inspection Contingency Waiver for US residential real estate. " + base + " Include: 1) Clear statement that buyer voluntarily waives right to inspection contingency, 2) Acknowledgment that buyer accepts property in its current as-is condition, 3) Statement that seller makes no warranties about property condition, 4) Acknowledgment of all risks buyer assumes, 5) Statement that this waiver is voluntary and informed, 6) Statement that all other contract terms remain in full effect, 7) Signature blocks for buyer and seller with date lines. Use plain-English legal language suitable for all US states. Do not use markdown.",
      "Earnest Money Agreement": "Generate a detailed Earnest Money Agreement for US residential real estate. " + base + " Escrow agent: " + (f.agentName || "_______________") + ". Include: 1) Amount of earnest money deposit, 2) Deadline for deposit delivery, 3) Name and address of escrow holder, 4) Conditions under which earnest money is returned to buyer, 5) Conditions under which earnest money is forfeited to seller, 6) Instructions for disbursement in case of dispute, 7) Interest provisions, 8) Signature blocks for buyer, seller, and escrow holder with date lines. Use plain-English legal language suitable for all US states. Do not use markdown.",
      "As-Is Addendum": "Generate a detailed As-Is Property Addendum for US residential real estate. " + base + " Include: 1) Clear statement that property is sold in its current as-is condition, 2) Seller disclaimer of all warranties express or implied, 3) Buyer acknowledgment of property condition, 4) Statement that seller will make no repairs or provide any credits, 5) Buyer right to inspect but waiver of repair requests, 6) Acknowledgment that purchase price reflects as-is condition, 7) Survivability of this addendum through closing, 8) Signature blocks for both parties with date lines. Use plain-English legal language suitable for all US states. Do not use markdown.",
      "Lead Paint Disclosure": "Generate a Lead-Based Paint Disclosure form as required by federal law 42 USC 4852d for US residential real estate built before 1978. Property: " + f.address + ", " + f.city + ", " + f.state + " " + f.zip + ". Seller: " + (f.seller || "_______________") + ". Buyer: " + (f.buyer || "_______________") + ". Include: 1) Federal law disclosure statement explaining the requirement, 2) Seller disclosure of known lead-based paint hazards with checkbox options for known hazards, no known hazards, and unknown, 3) List of any records or reports available to seller, 4) Buyer acknowledgment of receiving EPA pamphlet Protect Your Family from Lead in Your Home, 5) Buyer 10-day inspection opportunity notice, 6) Agent certification if applicable, 7) Signature blocks for seller and buyer with dates. Use the standard federally required format. Do not use markdown.",
      "Seller Financing Addendum": "Generate a detailed Seller Financing Addendum for US residential real estate. " + base + " Include: 1) Principal loan amount, 2) Annual interest rate, 3) Term of loan in months and years, 4) Monthly payment amount including principal and interest, 5) Payment due date each month and grace period, 6) Late payment penalty amount and trigger, 7) Balloon payment terms if applicable, 8) Prepayment rights and any penalty, 9) Security interest and promissory note provisions, 10) Default definition and cure period, 11) Acceleration clause on default, 12) Due-on-sale clause, 13) Required insurance and property tax obligations, 14) Signature blocks for both parties with date lines. Use plain-English legal language suitable for all US states. Do not use markdown.",
      "Residential Lease Agreement": "Generate a detailed Residential Lease Agreement for use in the United States. Landlord: " + (f.seller || "_______________") + ". Tenant: " + (f.buyer || "_______________") + ". Property: " + f.address + ", " + f.city + ", " + f.state + " " + f.zip + ". Monthly Rent: $" + (f.monthlyRent || "_______________") + ". Security Deposit: $" + (f.deposit || "_______________") + ". Lease Start Date: " + (f.leaseStart || "_______________") + ". Lease Term: " + (f.leaseMonths || "12") + " months. Include all of the following numbered sections: 1) Parties and Property, 2) Lease Term and Renewal, 3) Rent Amount and Due Date, 4) Late Fees, 5) Security Deposit Terms and Return, 6) Utilities and Services, 7) Maintenance and Repairs, 8) Alterations and Improvements, 9) Pets Policy, 10) Smoking Policy, 11) Landlord Entry Rights, 12) Subletting Policy, 13) Termination and Notice Requirements, 14) Default and Remedies, 15) Governing Law, 16) Signature blocks for landlord and tenant with date lines. Use plain-English legal language suitable for all US states. Do not use markdown.",
    };
    return prompts[template.name] || "Generate a professional " + template.name + " for US residential real estate. " + base + " Use plain-English legal language suitable for all US states. Do not use markdown.";
  };

  const generate = async () => {
    setLoading(true); setContractText("");
    try {
      const text = await callClaude([{ role: "user", content: getPrompt(selected, form) }], 2000);
      setContractText(text);
    } catch (e) {
      setContractText("Error: " + e.message + ". Please try again.");
    }
    setGenerated(true); setLoading(false);
  };

  const isLease = selected?.name === "Residential Lease Agreement";
  const isLeadPaint = selected?.name === "Lead Paint Disclosure";
  const isEarnest = selected?.name === "Earnest Money Agreement";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
      <h2 style={{ fontSize: 36, fontWeight: 400, marginBottom: 6 }}>Document Center</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 28 }}>Professional real estate documents for US transactions. Always have a licensed attorney review before signing.</p>
      {!selected ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14 }}>
          {CONTRACT_TEMPLATES.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 14, padding: "22px", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--warm)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 6 }}>{c.name}</div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 10 }}>{c.desc}</div>
              <div style={{ fontSize: 12, color: "var(--gold)", fontWeight: 500 }}>Generate free</div>
            </div>
          ))}
        </div>
      ) : generated ? (
        <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16, padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 22 }}>{selected.name}</h3>
            <span style={{ background: "var(--sage)", color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 16 }}>Ready</span>
          </div>
          <div style={{ background: "#fffbf0", border: "1px solid var(--warm)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--rust)", marginBottom: 16 }}>
            Review carefully before signing. We recommend having a licensed real estate attorney review this document.
          </div>
          <div style={{ background: "var(--cream)", borderRadius: 10, padding: "20px", fontSize: 13, lineHeight: 2, color: "#444", whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", marginBottom: 20, maxHeight: 500, overflow: "auto" }}>{contractText}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setGenerated(false); setSelected(null); setContractText(""); }} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer" }}>Back</button>
            <button onClick={() => { const b = new Blob([contractText], { type: "text/plain" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = selected.name.replace(/\s/g, "_") + ".txt"; a.click(); }} style={{ flex: 2, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer" }}>Download Document</button>
          </div>
        </div>
      ) : (
        <div>
          <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14, marginBottom: 18 }}>Back to Templates</button>
          <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16, padding: "26px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <span style={{ fontSize: 34 }}>{selected.icon}</span>
              <div><h3 style={{ fontSize: 22, fontWeight: 500 }}>{selected.name}</h3><div style={{ fontSize: 13, color: "#888" }}>{selected.desc}</div></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={lbl}>{isLease ? "Tenant Name" : "Buyer Name"}</label><input style={inp} value={form.buyer} onChange={e => update("buyer", e.target.value)} placeholder="John Smith" /></div>
                <div><label style={lbl}>{isLease ? "Landlord Name" : "Seller Name"}</label><input style={inp} value={form.seller} onChange={e => update("seller", e.target.value)} placeholder="Jane Doe" /></div>
              </div>
              <div><label style={lbl}>Property Address</label><input style={inp} value={form.address} onChange={e => update("address", e.target.value)} placeholder="123 Main Street" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div><label style={lbl}>City</label><input style={inp} value={form.city} onChange={e => update("city", e.target.value)} placeholder="Austin" /></div>
                <div><label style={lbl}>State</label><input style={inp} value={form.state} onChange={e => update("state", e.target.value)} placeholder="TX" /></div>
                <div><label style={lbl}>ZIP</label><input style={inp} value={form.zip} onChange={e => update("zip", e.target.value)} placeholder="78701" /></div>
              </div>
              {!isLease && !isLeadPaint && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div><label style={lbl}>Purchase Price</label><input style={inp} value={form.price} onChange={e => update("price", e.target.value)} placeholder="485000" /></div>
                  <div><label style={lbl}>Earnest Money</label><input style={inp} value={form.earnest} onChange={e => update("earnest", e.target.value)} placeholder="5000" /></div>
                  <div><label style={lbl}>Closing Date</label><input style={inp} type="date" value={form.closeDate} onChange={e => update("closeDate", e.target.value)} /></div>
                </div>
              )}
              {isEarnest && <div><label style={lbl}>Escrow Agent Name</label><input style={inp} value={form.agentName} onChange={e => update("agentName", e.target.value)} placeholder="First American Title Co." /></div>}
              {isLease && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <div><label style={lbl}>Monthly Rent</label><input style={inp} value={form.monthlyRent} onChange={e => update("monthlyRent", e.target.value)} placeholder="2500" /></div>
                    <div><label style={lbl}>Security Deposit</label><input style={inp} value={form.deposit} onChange={e => update("deposit", e.target.value)} placeholder="2500" /></div>
                    <div><label style={lbl}>Lease Term (months)</label><input style={inp} type="number" value={form.leaseMonths} onChange={e => update("leaseMonths", e.target.value)} placeholder="12" /></div>
                  </div>
                  <div><label style={lbl}>Lease Start Date</label><input style={inp} type="date" value={form.leaseStart} onChange={e => update("leaseStart", e.target.value)} /></div>
                </>
              )}
              <div style={{ background: "var(--warm)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#666" }}>
                Documents are prepared for use across the United States. Always consult a licensed real estate attorney before signing.
              </div>
              <button onClick={generate} disabled={loading} style={{ background: loading ? "#aaa" : "var(--ink)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {loading ? <><Spinner /> Preparing your document... this takes about 15 seconds</> : "Generate Document"}
              </button>
            </div>
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
  const NAV_ITEMS = ["Browse", "Sell", "Offers", "Messages", "Valuation", "Contracts", "Profile", "Privacy", "Terms"];

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  const handleMessage = (listing) => { setMessageThread(listing); setTab("Messages"); };
  const handleOffer = (listing) => { setOfferListing(listing); };
  const handleLogout = async () => { await sb.auth.signOut(); setUser(null); setTab("Browse"); };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <style>{styles}</style>
      <header style={{ background: "var(--ink)", color: "#fff", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 62, position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🏡</span>
          <span style={{ fontSize: 22, fontWeight: 500 }}>DirectDeed</span>
          <span style={{ fontSize: 10, color: "var(--gold-light)", background: "rgba(212,160,23,0.15)", padding: "2px 9px", borderRadius: 16, marginLeft: 4 }}>No Realtors</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <nav style={{ display: "flex", gap: 4 }}>
            {NAV_ITEMS.map(n => (
              <button key={n} onClick={() => setTab(n)} style={{ background: tab === n ? "rgba(255,255,255,0.12)" : "none", border: tab === n ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent", color: tab === n ? "#fff" : "rgba(255,255,255,0.55)", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>
                {n}
              </button>
            ))}
          </nav>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.15)", margin: "0 8px" }} />
          <NotificationBell user={user} />
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--sage)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", fontWeight: 600 }}>
                {(user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase()}
              </div>
              <button onClick={handleLogout} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Log out</button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background: "var(--gold)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500, marginLeft: 8 }}>Sign In</button>
          )}
        </div>
      </header>

      {tab === "Browse" && (
        <div style={{ background: "linear-gradient(135deg,var(--ink) 0%,#3d2b0f 60%,var(--rust) 100%)", color: "#fff", padding: "60px 28px 68px", textAlign: "center" }}>
          <div style={{ fontSize: 50, fontWeight: 300, lineHeight: 1.15, marginBottom: 14 }}>Buy and Sell Without the Middleman</div>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>Connect buyers and sellers directly. Save the 5-6% commission.</p>
        </div>
      )}

      {tab === "Browse" && <BrowseTab onMessage={handleMessage} onOffer={handleOffer} user={user} />}
      {tab === "Sell" && <SellTab user={user} onRequireAuth={() => setShowAuth(true)} />}
      {tab === "Offers" && <OffersTab user={user} onRequireAuth={() => setShowAuth(true)} />}
      {tab === "Messages" && <MessagesTab newThread={messageThread} user={user} onRequireAuth={() => setShowAuth(true)} />}
      {tab === "Valuation" && <ValuationTab />}
      {tab === "Contracts" && <ContractsTab />}
      {tab === "Profile" && <ProfileTab user={user} onRequireAuth={() => setShowAuth(true)} />}
      {tab === "Privacy" && <LegalTab section="privacy" />}
      {tab === "Terms" && <LegalTab section="terms" />}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={setUser} />}
      {offerListing && <MakeOfferModal listing={offerListing} user={user} onClose={() => setOfferListing(null)} onRequireAuth={() => { setOfferListing(null); setShowAuth(true); }} />}

      <footer style={{ background: "var(--ink)", color: "rgba(255,255,255,0.35)", textAlign: "center", padding: "22px", fontSize: 11, marginTop: 60 }}>
        © 2026 Bondy Technologies LLC. All rights reserved. DirectDeed is not a licensed real estate brokerage. -
        <span onClick={() => setTab("Privacy")} style={{ cursor: "pointer", marginLeft: 6, textDecoration: "underline" }}>Privacy Policy</span> -
        <span onClick={() => setTab("Terms")} style={{ cursor: "pointer", marginLeft: 6, textDecoration: "underline" }}>Terms of Service</span>
      </footer>
    </div>
  );
}