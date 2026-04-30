import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

// ─── PASSWORD STRENGTH ────────────────────────────────────────────────────────
function pwStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "#1e1e26", checks: [] };
  const checks = [
    { label: "8+ characters",        ok: pw.length >= 8 },
    { label: "Uppercase (A-Z)",       ok: /[A-Z]/.test(pw) },
    { label: "Lowercase (a-z)",       ok: /[a-z]/.test(pw) },
    { label: "Number (0-9)",          ok: /[0-9]/.test(pw) },
    { label: "Symbol (!@#$%^&*...)",  ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter(c => c.ok).length;
  const meta  = [
    { label: "",            color: "#1e1e26" },
    { label: "Very Weak",   color: "#ef4444" },
    { label: "Weak",        color: "#f97316" },
    { label: "Fair",        color: "#eab308" },
    { label: "Strong",      color: "#22c55e" },
    { label: "Very Strong", color: "#10b981" },
  ];
  return { score, ...meta[score], checks };
}

function StrengthBar({ pw, show }) {
  const { score, label, color, checks } = pwStrength(pw);
  if (!show || !pw) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= score ? color : "#1e1e26",
            transition: "background 0.3s, transform 0.2s",
            transform: i <= score ? "scaleY(1.6)" : "scaleY(1)",
          }} />
        ))}
      </div>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 8 }}>
          {score <= 2 ? "🔴" : score === 3 ? "🟡" : "🟢"} {label}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 8px" }}>
        {checks.map(c => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11,
                                      color: c.ok ? "#22c55e" : "#555566", transition: "color 0.2s" }}>
            <span style={{ fontWeight: 900, fontSize: 10 }}>{c.ok ? "✓" : "○"}</span>
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────
function validateLogin(f) {
  const e = {};
  if (!f.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Valid email required";
  if (!f.password || f.password.length < 6) e.password = "Password required (min 6 chars)";
  return e;
}

function validateRegister(f) {
  const e = {};
  const phone = String(f.phone || "").trim().replace(/[\s\-()]/g, "");
  const isSriLankanPhone = /^(?:\+94|94|0)7\d{8}$/.test(phone);
  if (!f.name || f.name.trim().length < 2) e.name = "Name must be at least 2 characters";
  if (!f.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Valid email required";
  if (!phone) e.phone = "phone number is required";
  else if (!isSriLankanPhone) e.phone = "Use valid Sri Lanka mobile (0771234567 or +94771234567)";
  const { score } = pwStrength(f.password);
  if (!f.password)    e.password = "Password is required";
  else if (score < 3) e.password = "Too weak — add uppercase, number and symbol";
  if (!f.confirmPassword) e.confirmPassword = "Please confirm your password";
  else if (f.password !== f.confirmPassword) e.confirmPassword = "Passwords do not match";
  return e;
}

function Err({ msg }) {
  if (!msg) return null;
  return <div style={{ color:"#ef4444", fontSize:12, marginTop:5 }}>⚠ {msg}</div>;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const navigate      = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode]     = useState("login");
  const [loading, setLoading] = useState(false);
  const [serverErr, setServerErr] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPw, setShowPw]   = useState(false);
  const [showCPw, setShowCPw] = useState(false);

  const BLANK = { name:"", email:"", password:"", confirmPassword:"", role:"buyer", phone:"" };
  const [form, setForm] = useState(BLANK);
  // Always hold latest form in a ref so handleSubmit is never stale
  const formRef = useRef(form);
  formRef.current = form;

  const change = (e) => {
    const { name, value } = e.target;
    const next = { ...formRef.current, [name]: value };
    setForm(next);
    setServerErr("");
    if (touched[name]) {
      const errs = mode === "login" ? validateLogin(next) : validateRegister(next);
      setErrors(p => ({ ...p, [name]: errs[name] || "" }));
    }
  };

  const blur = (e) => {
    const { name } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    const errs = mode === "login" ? validateLogin(formRef.current) : validateRegister(formRef.current);
    setErrors(p => ({ ...p, [name]: errs[name] || "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerErr("");

    const cur  = formRef.current;            // read latest form synchronously
    const errs = mode === "login" ? validateLogin(cur) : validateRegister(cur);
    const fields = mode === "login"
      ? ["email", "password"]
      : ["name", "email", "phone", "password", "confirmPassword"];

    setTouched(Object.fromEntries(fields.map(f => [f, true])));
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;  // stop if invalid

    setLoading(true);
    try {
      let userData;
      if (mode === "login") {
        userData = await login(cur.email.trim().toLowerCase(), cur.password);
      } else {
        userData = await register({
          name:  cur.name.trim(),
          email: cur.email.trim().toLowerCase(),
          password: cur.password,
          role:  cur.role,
          phone: cur.phone.trim(),
        });
      }

      toast.success("Welcome, " + userData.name + "!");

      // Hard redirect — bypasses React Router state timing completely
      const dest = userData.role === "admin"
        ? "/admin"
        : userData.role === "delivery_management"
          ? "/admin/dashboard"
          : ["service_provider", "insurance"].includes(userData.role)
            ? "/provider-dashboard"
            : "/marketplace";
      window.location.href = dest;

    } catch (err) {
      setServerErr(
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        err?.response?.data?.error ||
        "Login failed - check your credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m); setErrors({}); setTouched({}); setServerErr(""); setForm(BLANK);
  };

  const bdr = (f) => ({
    borderColor: touched[f] ? (errors[f] ? "#ef4444" : "#22c55e") : undefined,
    transition: "border-color 0.2s",
  });

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .auth-in { animation: fadeUp 0.25s ease; }
        .pw-eye  { position:absolute; right:12px; top:50%; transform:translateY(-50%);
                   background:none; border:none; cursor:pointer; color:#555566; font-size:15px; padding:4px; }
        .pw-eye:hover { color:#f0f0f5; }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div style={S.left}>
        <div style={{ padding:"60px", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:56 }}>
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <path d="M6 18L8 12H24L26 18V24H6V18Z" fill="#e8401c" opacity="0.9"/>
              <path d="M8 12L11 6H21L24 12" stroke="#e8401c" strokeWidth="1.5" fill="none"/>
              <circle cx="10" cy="24" r="3" fill="#e8401c"/>
              <circle cx="22" cy="24" r="3" fill="#e8401c"/>
              <path d="M6 18H26" stroke="#ff5533" strokeWidth="1"/>
            </svg>
            <span style={{ fontFamily:"var(--font-display)", fontSize:26, letterSpacing:"0.2em", color:"#f0f0f5" }}>VEHICLE INTELLIGENT</span>
          </div>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:66, lineHeight:0.92,
                       letterSpacing:"0.02em", color:"#f0f0f5", marginBottom:22 }}>
            THE FUTURE<br />OF VEHICLE<br />COMMERCE
          </h1>
          <p style={{ fontSize:15, color:"#888899", lineHeight:1.7, maxWidth:330, marginBottom:44 }}>
            A unified intelligent platform for buying, selling, and managing vehicles.
          </p>
          <div style={{ display:"flex", gap:32 }}>
            {[["12K+","VEHICLES"],["3.4K","SELLERS"],["98%","SATISFACTION"]].map(([n,l]) => (
              <div key={l}>
                <div style={{ fontFamily:"var(--font-display)", fontSize:30, color:"#e8401c", letterSpacing:"0.05em" }}>{n}</div>
                <div style={{ fontSize:10, color:"#555566", fontWeight:700, letterSpacing:"0.15em" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={S.right}>
        <div style={{ width:"100%", maxWidth:440 }}>

          {/* Tab switcher */}
          <div style={{ display:"flex", background:"#1e1e26", borderRadius:8, padding:4, marginBottom:28, border:"1px solid #2a2a35" }}>
            {["login","register"].map(t => (
              <button key={t} onClick={() => switchMode(t)}
                style={{ flex:1, padding:"10px", border:"none", borderRadius:6,
                         fontFamily:"var(--font-body)", fontSize:13, fontWeight:600, cursor:"pointer",
                         transition:"all 0.2s",
                         background: mode===t ? "#16161c" : "transparent",
                         color:      mode===t ? "#f0f0f5" : "#555566",
                         boxShadow:  mode===t ? "0 1px 8px rgba(0,0,0,0.4)" : "none" }}>
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <div className="auth-in" key={mode}>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:34, letterSpacing:"0.03em", marginBottom:4 }}>
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p style={{ color:"#888899", fontSize:14, marginBottom:24 }}>
              {mode === "login" ? "Sign in to access your dashboard" : "Join the vehicle marketplace today"}
            </p>
          </div>

          {/* Server error */}
          {serverErr && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
                          background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.35)",
                          borderRadius:8, color:"#fca5a5", fontSize:14, marginBottom:18 }}>
              ⚠ {serverErr}
            </div>
          )}

          <form onSubmit={submit} noValidate>

            {/* Register-only fields */}
            {mode === "register" && (<>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input name="name" className="form-input" value={form.name}
                  onChange={change} onBlur={blur} placeholder="John Anderson" style={bdr("name")} />
                <Err msg={touched.name && errors.name} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input name="phone" className="form-input" value={form.phone}
                  onChange={change} onBlur={blur} placeholder="+94771234567" style={bdr("phone")} inputMode="tel" />
                <Err msg={touched.phone && errors.phone} />
              </div>
              <div className="form-group">
                <label className="form-label">Account Type *</label>
                <select name="role" className="form-select" value={form.role} onChange={change}>
                  <option value="buyer">🛒 Buyer — Browse and purchase vehicles</option>
                  <option value="seller">🏪 Seller — List and sell vehicles</option>
                </select>
              </div>
            </>)}

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input name="email" type="email" className="form-input" value={form.email}
                onChange={change} onBlur={blur} placeholder="your@email.com" style={bdr("email")} />
              <Err msg={touched.email && errors.email} />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position:"relative" }}>
                <input name="password" type={showPw ? "text" : "password"} className="form-input"
                  value={form.password} onChange={change} onBlur={blur}
                  placeholder={mode === "register" ? "Create a strong password" : "••••••••"}
                  style={{ ...bdr("password"), paddingRight:42 }} />
                <button type="button" className="pw-eye" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                  {showPw ? "" : "👁"}
                </button>
              </div>
              <Err msg={touched.password && errors.password} />
              <StrengthBar pw={form.password} show={mode === "register"} />
            </div>

            {/* Confirm password — register only */}
            {mode === "register" && (
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <div style={{ position:"relative" }}>
                  <input name="confirmPassword" type={showCPw ? "text" : "password"} className="form-input"
                    value={form.confirmPassword} onChange={change} onBlur={blur}
                    placeholder="Repeat your password"
                    style={{ ...bdr("confirmPassword"), paddingRight:42 }} />
                  <button type="button" className="pw-eye" onClick={() => setShowCPw(p => !p)} tabIndex={-1}>
                    {showCPw ? "" : ""}
                  </button>
                </div>
                <Err msg={touched.confirmPassword && errors.confirmPassword} />
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <div style={{ fontSize:12, color:"#22c55e", marginTop:5 }}>✓ Passwords match</div>
                )}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ width:"100%", marginTop:12, padding:"13px", border:"none", borderRadius:8,
                       background: loading ? "#b83214" : "#e8401c", color:"#fff",
                       fontFamily:"var(--font-body)", fontSize:15, fontWeight:700,
                       cursor: loading ? "not-allowed" : "pointer",
                       display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                       transition:"background 0.2s" }}>
              {loading && <span style={{ width:18, height:18, border:"2px solid rgba(255,255,255,0.3)",
                                         borderTopColor:"#fff", borderRadius:"50%",
                                         animation:"spin 0.8s linear infinite", display:"inline-block" }} />}
              {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>

          {/* Switch mode link */}
          <p style={{ textAlign:"center", marginTop:20, fontSize:14, color:"#555566" }}>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => switchMode(mode === "login" ? "register" : "login")}
              style={{ background:"none", border:"none", color:"#e8401c", fontFamily:"var(--font-body)",
                       fontSize:14, fontWeight:600, cursor:"pointer", marginLeft:6 }}>
              {mode === "login" ? "Register" : "Sign In"}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}

const S = {
  page: { display:"flex", minHeight:"100vh", background:"#0a0a0c" },
  left: {
    flex:"0 0 46%",
    background:"linear-gradient(135deg,#0d0d11 0%,#13131a 50%,#1a0c08 100%)",
    borderRight:"1px solid #1e1e26",
    display:"flex", alignItems:"center", overflow:"hidden",
  },
  right: {
    flex:1, display:"flex", alignItems:"center",
    justifyContent:"center", padding:"32px 24px", overflowY:"auto",
  },
};
