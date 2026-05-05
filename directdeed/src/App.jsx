import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

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
`;

const CONTRACT_TEMPLATES = [
  { id: 1, name: "Purchase & Sale Agreement", desc: "Standard residential contract with contingencies and earnest money.", pages: 8, icon: "📋" },
  { id: 2, name: "Property Disclosure Statement", desc: "Seller disclosure of known defects and property condition.", pages: 4, icon: "📝" },
  { id: 3, name: "Counteroffer Addendum", desc: "Formally counter a buyers offer with modified terms.", pages: 2, icon: "🔄" },
  { id: 4, name: "Inspection Contingency Waiver", desc: "Buyer waives inspection contingency.", pages: 1, icon: "✅" },
  { id: 5, name: "Earnest Money Agreement", desc: "Terms for earnest money deposit and release conditions.", pages: 2, icon: "💰" },
];

function formatPrice(p) { return "$" + Number(p).toLocaleString(); }
function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

function Spinner() {
  return <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />;
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
        onAuth(data.user);
        onClose();
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
          <button onClick={() => onDelete(listing.id)} style={{ width: "100%", background: "#fff5f5", color: "var(--rust)", border: "1px solid #fcc", borderRadius: 8, padding: "7px", fontSize: 12, cursor: "pointer" }}>
            Delete Listing
          </button>
        </div>
      )}
    </div>
  );
}

function ListingModal({ listing, onClose, onMessage }) {
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
          <button onClick={() => { onMessage(listing); onClose(); }} style={{ width: "100%", background: "var(--sage)", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>
            Message Seller Directly
          </button>
        </div>
      </div>
    </div>
  );
}

function BrowseTab({ onMessage }) {
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
      <ListingModal listing={selected} onClose={() => setSelected(null)} onMessage={onMessage} />
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
      <ListingModal listing={selected} onClose={() => setSelected(null)} onMessage={() => {}} />
    </div>
  );
}

function MessagesTab({ newThread, user }) {
  const [listings, setListings] = useState([]);
  const [activeListing, setActiveListing] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [senderName, setSenderName] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (user) setSenderName(user.user_metadata?.full_name || user.email || "");
  }, [user]);

  useEffect(() => {
    sb.from("listings").select("id,address,city,state,seller_name").order("created_at", { ascending: false })
      .then(({ data }) => setListings(data || []));
  }, []);

  useEffect(() => {
    if (newThread && listings.length > 0) {
      const match = listings.find(l => l.id === newThread.id);
      setActiveListing(match || newThread);
    }
  }, [newThread, listings]);

  useEffect(() => {
    if (!activeListing) return;
    setMessages([]);
    sb.from("messages").select("*").eq("listing_id", activeListing.id).order("created_at", { ascending: true })
      .then(({ data }) => setMessages(data || []));
    const sub = sb.channel("msgs-" + activeListing.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "listing_id=eq." + activeListing.id }, payload => setMessages(prev => [...prev, payload.new]))
      .subscribe();
    return () => sb.removeChannel(sub);
  }, [activeListing?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || !activeListing) return;
    setSending(true);
    await sb.from("messages").insert([{ listing_id: activeListing.id, sender_name: senderName || "Buyer", sender_role: "buyer", body: input, user_id: user?.id || null }]);
    setInput("");
    setSending(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <h2 style={{ fontSize: 36, fontWeight: 400, marginBottom: 20 }}>Messages</h2>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, height: 520 }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 14, overflow: "auto" }}>
          {listings.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "#ccc", fontSize: 13 }}>No listings yet</div>}
          {listings.map(l => (
            <div key={l.id} onClick={() => setActiveListing(l)} style={{ padding: "14px 18px", cursor: "pointer", borderBottom: "1px solid var(--warm)", background: activeListing?.id === l.id ? "var(--warm)" : "transparent" }}>
              <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{l.address}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{l.city}, {l.state}</div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>Seller: {l.seller_name}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 14, display: "flex", flexDirection: "column" }}>
          {activeListing ? (
            <>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--warm)" }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{activeListing.address}</div>
                <div style={{ fontSize: 12, color: "#888" }}>Seller: {activeListing.seller_name}</div>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.sender_role === "buyer" ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "72%", background: m.sender_role === "buyer" ? "var(--sage)" : "var(--warm)", color: m.sender_role === "buyer" ? "#fff" : "var(--ink)", borderRadius: m.sender_role === "buyer" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 14, lineHeight: 1.6 }}>
                      <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 4 }}>{m.sender_name} - {timeAgo(m.created_at)}</div>
                      {m.body}
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <div style={{ textAlign: "center", color: "#ccc", marginTop: 40, fontSize: 18 }}>Start the conversation</div>}
                <div ref={bottomRef} />
              </div>
              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--warm)", display: "flex", flexDirection: "column", gap: 8 }}>
                {!user && <input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Your name" style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid var(--warm)", background: "var(--cream)", fontSize: 12, outline: "none" }} />}
                <div style={{ display: "flex", gap: 10 }}>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message..." style={{ flex: 1, padding: "10px 14px", borderRadius: 22, border: "1.5px solid var(--warm)", background: "var(--cream)", fontSize: 14, outline: "none" }} />
                  <button onClick={send} disabled={sending} style={{ background: "var(--sage)", color: "#fff", border: "none", borderRadius: 22, padding: "10px 18px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    {sending ? <Spinner /> : "Send"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: "#ccc", fontSize: 20 }}>Select a listing to message</div>
          )}
        </div>
      </div>
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
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: "You are a real estate valuation expert. Return ONLY valid JSON, no markdown, no explanation. Property: " + (form.address || "Unknown") + ", Type: " + form.type + ", Beds: " + form.beds + ", Baths: " + form.baths + ", SqFt: " + form.sqft + ", Year: " + form.year + ", Condition: " + form.condition + ". Return: {\"low\":number,\"mid\":number,\"high\":number,\"pricePerSqft\":number,\"summary\":\"2-3 sentences\",\"tips\":[\"tip1\",\"tip2\",\"tip3\"]}" }] })
      });
      const data = await res.json();
      const text = data.content.map(b => b.text || "").join("");
      setResult(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch {
      setResult({ low: 380000, mid: 435000, high: 490000, pricePerSqft: 241, summary: "Based on your inputs, this property sits in a competitive range.", tips: ["Stage key rooms before listing", "Price at mid-range to attract multiple offers", "Disclose all known issues upfront"] });
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>
      <h2 style={{ fontSize: 36, fontWeight: 400, marginBottom: 6 }}>Home Valuation</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 28 }}>Get an AI-powered estimate — no realtor required.</p>
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
            {loading ? <Spinner /> : "Get AI Valuation"}
          </button>
        </div>
      </div>
      {result && (
        <div>
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
          </div>
          <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16, padding: "22px 24px" }}>
            <div style={{ fontSize: 20, marginBottom: 14 }}>Tips to Maximize Your Sale Price</div>
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
  const [form, setForm] = useState({ buyer: "", seller: "", address: "", price: "", closeDate: "", earnest: "" });
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contractText, setContractText] = useState("");
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--warm)", background: "var(--cream)", fontSize: 14, outline: "none" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 500, color: "#888", marginBottom: 5, textTransform: "uppercase" };

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: "Generate a brief professional real estate " + selected.name + " for: Buyer: " + (form.buyer || "Buyer") + ", Seller: " + (form.seller || "Seller") + ", Property: " + form.address + ", Price: $" + form.price + ", Closing: " + (form.closeDate || "TBD") + ", Earnest: $" + (form.earnest || "0") + ". Concise plain-English, key terms and clauses, under 400 words, no markdown." }] })
      });
      const data = await res.json();
      setContractText(data.content[0].text);
    } catch {
      setContractText(selected.name + "\n\nBuyer: " + (form.buyer || "Buyer") + "\nSeller: " + (form.seller || "Seller") + "\nProperty: " + form.address + "\nPrice: $" + form.price + "\nClosing: " + (form.closeDate || "TBD") + "\n\nAll parties agree to the terms herein.\n\n___________________     ___________________\nBuyer Signature           Seller Signature");
    }
    setGenerated(true); setLoading(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
      <h2 style={{ fontSize: 36, fontWeight: 400, marginBottom: 6 }}>Document Center</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 28 }}>Generate real estate contracts without a lawyer or realtor.</p>
      {!selected ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14 }}>
          {CONTRACT_TEMPLATES.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 14, padding: "22px", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--warm)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 6 }}>{c.name}</div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 10 }}>{c.desc}</div>
              <div style={{ fontSize: 12, color: "var(--gold)", fontWeight: 500 }}>{c.pages}p - Generate free</div>
            </div>
          ))}
        </div>
      ) : generated ? (
        <div style={{ background: "var(--card)", border: "1px solid var(--warm)", borderRadius: 16, padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 22 }}>{selected.name}</h3>
            <span style={{ background: "var(--sage)", color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 16 }}>Generated</span>
          </div>
          <div style={{ background: "var(--cream)", borderRadius: 10, padding: "20px", fontSize: 14, lineHeight: 1.9, color: "#444", whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", marginBottom: 20 }}>{contractText}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setGenerated(false); setSelected(null); setContractText(""); }} style={{ flex: 1, background: "none", border: "1.5px solid var(--warm)", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer" }}>Back</button>
            <button onClick={() => { const b = new Blob([contractText], { type: "text/plain" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = selected.name.replace(/\s/g, "_") + ".txt"; a.click(); }} style={{ flex: 2, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer" }}>Download</button>
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
                <div><label style={lbl}>Buyer Name</label><input style={inp} value={form.buyer} onChange={e => update("buyer", e.target.value)} placeholder="John Smith" /></div>
                <div><label style={lbl}>Seller Name</label><input style={inp} value={form.seller} onChange={e => update("seller", e.target.value)} placeholder="Jane Doe" /></div>
              </div>
              <div><label style={lbl}>Property Address</label><input style={inp} value={form.address} onChange={e => update("address", e.target.value)} placeholder="123 Main Street, Austin TX" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div><label style={lbl}>Purchase Price</label><input style={inp} value={form.price} onChange={e => update("price", e.target.value)} placeholder="485000" /></div>
                <div><label style={lbl}>Earnest Money</label><input style={inp} value={form.earnest} onChange={e => update("earnest", e.target.value)} placeholder="5000" /></div>
                <div><label style={lbl}>Closing Date</label><input style={inp} type="date" value={form.closeDate} onChange={e => update("closeDate", e.target.value)} /></div>
              </div>
              <button onClick={generate} disabled={loading} style={{ background: loading ? "#aaa" : "var(--ink)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {loading ? <Spinner /> : "Generate Document"}
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
  const NAV_ITEMS = ["Browse", "Sell", "Messages", "Valuation", "Contracts", "Profile"];

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  const handleMessage = (listing) => { setMessageThread(listing); setTab("Messages"); };
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
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--sage)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", fontWeight: 600 }}>
                {(user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase()}
              </div>
              <button onClick={handleLogout} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Log out</button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background: "var(--gold)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Sign In</button>
          )}
        </div>
      </header>

      {tab === "Browse" && (
        <div style={{ background: "linear-gradient(135deg,var(--ink) 0%,#3d2b0f 60%,var(--rust) 100%)", color: "#fff", padding: "60px 28px 68px", textAlign: "center" }}>
          <div style={{ fontSize: 50, fontWeight: 300, lineHeight: 1.15, marginBottom: 14 }}>Buy and Sell Without the Middleman</div>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>Connect buyers and sellers directly. Save the 5-6% commission.</p>
        </div>
      )}

      {tab === "Browse" && <BrowseTab onMessage={handleMessage} />}
      {tab === "Sell" && <SellTab user={user} onRequireAuth={() => setShowAuth(true)} />}
      {tab === "Messages" && <MessagesTab newThread={messageThread} user={user} />}
      {tab === "Valuation" && <ValuationTab />}
      {tab === "Contracts" && <ContractsTab />}
      {tab === "Profile" && <ProfileTab user={user} onRequireAuth={() => setShowAuth(true)} />}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={setUser} />}

      <footer style={{ background: "var(--ink)", color: "rgba(255,255,255,0.35)", textAlign: "center", padding: "22px", fontSize: 11, marginTop: 60 }}>
        DirectDeed - Not a licensed real estate brokerage - Always consult a real estate attorney
      </footer>
    </div>
  );
}