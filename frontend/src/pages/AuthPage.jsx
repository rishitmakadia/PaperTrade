import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const { login, signup } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mode, setMode]       = useState("login");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    let result;
    if (mode === "login") {
      result = await login(email, password);
    } else {
      if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
      result = await signup(name, email, password);
    }
    setLoading(false);
    if (result.success) {
      navigate(result.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-screen">
      {/* Top right theme toggle */}
      <div className="auth-theme-toggle">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
          aria-label="Toggle theme"
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Main Centered Split-Pane Modal */}
      <div className="auth-modal-card">
        
        {/* ─── LEFT PANE: Company / Brand Logo ─── */}
        <div className="auth-brand-pane">
          <div>
            {/* COMPANY LOGO & BRANDING PLACEHOLDER */}
            {/* Swap this orange 'P' container with an <img> or custom SVG logo whenever ready */}
            <div className="auth-logo-box">
              P
            </div>

            <div style={{ marginBottom: 8 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", margin: 0 }}>
                PaperTrade
              </h1>
            </div>

            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--accent-gold)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
              Private Portfolio Terminal
            </div>

            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              Institutional paper trading & simulation platform for private portfolio tracking, algorithm testing, and risk-free market execution.
            </p>
          </div>
        </div>

        {/* ─── RIGHT PANE: Sign In / Register ─── */}
        <div className="auth-form-pane">
          {/* Pill Tabs for Mode Switching */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            background: "var(--bg-card-inner)",
            padding: 4,
            borderRadius: "var(--radius-pill)",
            border: "1px solid var(--border)",
            marginBottom: 24
          }}>
            <button
              type="button"
              className="btn-pill"
              style={{
                padding: "8px 16px",
                fontSize: "0.82rem",
                background: mode === "login" ? "var(--accent-gold)" : "transparent",
                color: mode === "login" ? "var(--accent-gold-text)" : "var(--text-secondary)",
                boxShadow: mode === "login" ? "0 2px 8px rgba(246,201,68,0.2)" : "none",
              }}
              onClick={() => { setMode("login"); setError(""); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className="btn-pill"
              style={{
                padding: "8px 16px",
                fontSize: "0.82rem",
                background: mode === "signup" ? "var(--accent-gold)" : "transparent",
                color: mode === "signup" ? "var(--accent-gold-text)" : "var(--text-secondary)",
                boxShadow: mode === "signup" ? "0 2px 8px rgba(246,201,68,0.2)" : "none",
              }}
              onClick={() => { setMode("signup"); setError(""); }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "0.75rem" }}>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: "0.75rem" }}>Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: "0.75rem" }}>Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPass(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{
                background: "rgba(255,94,77,0.1)",
                border: "1px solid rgba(255,94,77,0.3)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.76rem",
                color: "var(--accent-coral)",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-pill btn-pill-gold"
              style={{ width: "100%", padding: "13px", fontSize: "0.92rem", marginTop: 8 }}
              disabled={loading}
            >
              {loading ? "Authenticating…" : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
