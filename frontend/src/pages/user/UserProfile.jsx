import React, { useState } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const AVATAR_COLORS = [
  "#F6C944", "#FF5E4D", "#85E39E", "#6BA4FF", "#B44DFF", "#FF80DF",
  "#4facfe", "#43e97b", "#f093fb", "#ffd700",
];

export default function UserProfile() {
  const { user, portfolios, updateProfile } = useAuth();

  // Profile fields
  const [name,        setName]        = useState(user?.name  || "");
  const [email,       setEmail]       = useState(user?.email || "");
  const [curPass,     setCurPass]     = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [confPass,    setConfPass]    = useState("");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || "#F6C944");
  const [saving,      setSaving]      = useState(false);
  const [profileMsg,  setProfileMsg]  = useState("");

  const handleProfileSave = async (e) => {
    if (e) e.preventDefault();
    if (newPass && newPass !== confPass) {
      setProfileMsg("New passwords do not match");
      return;
    }
    if (newPass && newPass.length < 6) {
      setProfileMsg("New password must be at least 6 characters");
      return;
    }
    setSaving(true);
    setProfileMsg("");
    const payload = { name, email, avatarColor };
    if (newPass) {
      payload.currentPassword = curPass;
      payload.newPassword = newPass;
    }
    const result = await updateProfile(payload);
    setSaving(false);
    if (result.success) {
      setProfileMsg("✓ Profile saved successfully!");
      setCurPass("");
      setNewPass("");
      setConfPass("");
    } else {
      setProfileMsg("✕ " + (result.error || "Failed to update profile"));
    }
  };

  return (
    <AppLayout title="Trader Profile">
      <div className="page-body" style={{ paddingTop: 20 }}>
        <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* ── PROFILE HEADER HERO CARD ── */}
          <div className="card card-accent-gold" style={{ padding: "24px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  background: avatarColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-display)",
                  fontSize: "1.9rem",
                  fontWeight: 800,
                  color: "#0c0d12",
                  boxShadow: `0 0 24px ${avatarColor}66`,
                  flexShrink: 0,
                }}
              >
                {name?.charAt(0) || "U"}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", fontWeight: 800 }}>
                    {name || "Trader"}
                  </h2>
                  <span className="pill-badge pill-badge-blue">
                    {user?.role === "admin" ? "ADMIN" : "TRADER"}
                  </span>
                  <span className="pill-badge pill-badge-green">ACTIVE</span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {email || "user@papertrade.local"}
                </div>
              </div>
            </div>
          </div>

          {/* ── EDIT PERSONAL DETAILS CARD ── */}
          <div className="card card-accent-purple">
            <div className="card-header" style={{ marginBottom: 20 }}>
              <div>
                <h3 className="card-title">Personal Information</h3>
                <div className="card-subtitle">Manage your trader identity and profile accent</div>
              </div>
            </div>

            {/* Avatar color picker */}
            <div style={{ marginBottom: 22 }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Identity Avatar Accent
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                {AVATAR_COLORS.map((c) => (
                  <div
                    key={c}
                    onClick={() => setAvatarColor(c)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: c,
                      cursor: "pointer",
                      border: avatarColor === c ? "2px solid white" : "2px solid transparent",
                      boxShadow: avatarColor === c ? `0 0 14px ${c}` : "none",
                      transform: avatarColor === c ? "scale(1.15)" : "scale(1)",
                      transition: "var(--transition)",
                    }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            <div className="grid-2" style={{ gap: 14, marginBottom: 14 }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 16 }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.74rem",
                  color: "var(--text-muted)",
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                Change Password <span style={{ opacity: 0.6, fontWeight: 400 }}>(leave blank to retain current password)</span>
              </div>
              <div className="grid-2" style={{ gap: 14, marginBottom: 12 }}>
                <div className="input-group">
                  <label className="input-label">Current Password</label>
                  <input
                    type="password"
                    value={curPass}
                    onChange={(e) => setCurPass(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="input-group" style={{ maxWidth: "50%", marginBottom: 18 }}>
                <label className="input-label">Confirm New Password</label>
                <input
                  type="password"
                  value={confPass}
                  onChange={(e) => setConfPass(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {profileMsg && (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  marginBottom: 16,
                  background: profileMsg.startsWith("✓")
                    ? "rgba(133,227,158,0.1)"
                    : "rgba(255,94,77,0.1)",
                  border: `1px solid ${
                    profileMsg.startsWith("✓")
                      ? "rgba(133,227,158,0.25)"
                      : "rgba(255,94,77,0.25)"
                  }`,
                  color: profileMsg.startsWith("✓")
                    ? "var(--accent-green)"
                    : "var(--accent-coral)",
                }}
              >
                {profileMsg}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className="btn-pill-gold"
                onClick={handleProfileSave}
                disabled={saving}
              >
                {saving ? "Saving Changes…" : "Save Profile Details"}
              </button>
            </div>
          </div>

          {/* ── ACCOUNT TELEMETRY CARD ── */}
          <div className="card card-accent-green">
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div>
                <h3 className="card-title">Account Telemetry</h3>
                <div className="card-subtitle">User credentials and platform audit metadata</div>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
              }}
            >
              {[
                { label: "USER ID", value: user?.id ? String(user.id).padStart(6, "0") : (user?._id?.slice(-8).toUpperCase() || "N/A") },
                { label: "ROLE", value: user?.role === "admin" ? "Administrator" : "Standard Trader" },
                { label: "STATUS", value: user?.status || "active" },
                { label: "PORTFOLIOS", value: portfolios.length },
                { label: "TOTAL TRADES", value: user?.trades || 0 },
                { label: "REALIZED P&L", value: `${(user?.pnl || 0) >= 0 ? "+" : ""}₹${Math.abs(user?.pnl || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` },
              ].map(({ label, value }) => (
                <div key={label} className="metric-box">
                  <div className="metric-box-label">{label}</div>
                  <div className="metric-box-value" style={{ fontSize: "0.9rem" }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
