import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  const [email, setEmail] = useState("admin@vehicle.com");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState("");

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDebug("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    try {
      setDebug("Connecting to " + API_URL + "/auth/login ...");
      const loggedInUser = await login(email.trim().toLowerCase(), password);
      setDebug("Server response: " + JSON.stringify({ success: true, user: loggedInUser }));

      if (String(loggedInUser?.role || "").trim().toLowerCase() !== "admin") {
        logout();
        setError(
          "Access denied. This portal is for administrators only. Your role: " +
            (loggedInUser?.role || "unknown")
        );
        return;
      }

      navigate("/admin", { replace: true });
    } catch (err) {
      const response = err?.response?.data;
      setError(response?.message || "Network error: " + err.message);
      if (response) {
        setDebug("Server response: " + JSON.stringify(response));
      } else {
        setDebug("Could not reach server at " + API_URL);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Admin Login</h1>
        <p style={styles.sub}>Use administrator credentials to access the dashboard.</p>

        {error ? <div className="alert alert-error">{error}</div> : null}
        {debug ? <div style={styles.debug}>{debug}</div> : null}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setDebug("");
              }}
              placeholder="admin@vehicle.com"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={styles.passwordWrap}>
              <input
                type={showPw ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                  setDebug("");
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={styles.toggle}
                disabled={loading}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Access Admin Dashboard"}
          </button>
        </form>

        <a href="/login" style={styles.back}>Back to User Login</a>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background:
      "radial-gradient(circle at 20% 10%, rgba(232,64,28,0.08), transparent 40%), var(--bg-primary)"
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    background: "var(--bg-card)",
    padding: "24px"
  },
  title: {
    margin: 0,
    marginBottom: "8px"
  },
  sub: {
    marginTop: 0,
    marginBottom: "16px",
    color: "var(--text-secondary)"
  },
  debug: {
    padding: "10px 12px",
    marginBottom: "12px",
    background: "rgba(59,130,246,0.12)",
    border: "1px solid rgba(59,130,246,0.35)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "var(--text-primary)",
    wordBreak: "break-word"
  },
  passwordWrap: {
    position: "relative"
  },
  toggle: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "var(--text-secondary)",
    cursor: "pointer"
  },
  back: {
    marginTop: "14px",
    display: "inline-block",
    color: "var(--text-secondary)"
  }
};
