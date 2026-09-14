import React, { useState } from "react";
import AppLayout from "../../components/AppLayout.jsx";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    platformName: "PaperTrade",
    defaultBalance: 1000000,
    maxLeverage: 5,
    marketOpen: "09:15",
    marketClose: "15:30",
    allowSignups: true,
    maintenanceMode: false,
    emailNotifications: true,
    autoApproveOrders: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const Toggle = ({ val, onToggle }) => (
    <div
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "var(--transition)",
        background: val ? "var(--accent-gold)" : "var(--bg-elevated)",
        border: val ? "1px solid var(--accent-gold)" : "1px solid var(--border)",
        position: "relative",
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: val ? "#0c0d12" : "var(--text-muted)",
        position: "absolute", top: 2, transition: "var(--transition)",
        left: val ? 22 : 2,
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
      }} />
    </div>
  );

  return (
    <AppLayout title="Platform Settings">
      <div className="page-body" style={{ paddingTop: 20 }}>
        <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* General */}
          <div className="card card-accent-gold">
            <div className="card-header" style={{ marginBottom: 20 }}>
              <div>
                <div className="card-title">General Platform Engine</div>
                <div className="card-subtitle">Global brokerage and liquidity configurations</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Platform Brand Name</label>
                  <input value={settings.platformName} onChange={e => setSettings(s => ({ ...s, platformName: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Default Virtual Balance (₹)</label>
                  <input type="number" value={settings.defaultBalance} onChange={e => setSettings(s => ({ ...s, defaultBalance: e.target.value }))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Market Open Time (IST)</label>
                  <input type="time" value={settings.marketOpen} onChange={e => setSettings(s => ({ ...s, marketOpen: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Market Close Time (IST)</label>
                  <input type="time" value={settings.marketClose} onChange={e => setSettings(s => ({ ...s, marketClose: e.target.value }))} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Maximum Leverage Multiplier (x)</label>
                <input type="number" value={settings.maxLeverage} min={1} max={20} onChange={e => setSettings(s => ({ ...s, maxLeverage: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="card card-accent-purple">
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div>
                <div className="card-title">System Feature Flags</div>
                <div className="card-subtitle">Control runtime subsystems & permissions</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { key: "allowSignups",        label: "Allow New User Registrations",  desc: "Permit new traders to create paper trading accounts" },
                { key: "maintenanceMode",     label: "Maintenance Mode",             desc: "Suspends trading operations across all standard users" },
                { key: "emailNotifications",  label: "Order Execution Emails",        desc: "Dispatches transactional emails for executed limit orders" },
                { key: "autoApproveOrders",   label: "Instant Order Settlement",      desc: "Simulates instantaneous broker fills at current bid/ask" },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{desc}</div>
                  </div>
                  <Toggle val={settings[key]} onToggle={() => toggle(key)} />
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card card-accent-coral">
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div>
                <div className="card-title" style={{ color: "var(--accent-coral)" }}>⚠ Platform Operations Danger Zone</div>
                <div className="card-subtitle">Global irreversible administrator overrides</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn-pill-coral" style={{ fontSize: "0.78rem" }}>
                ↺ Reset All User Balances
              </button>
              <button className="btn-pill-coral" style={{ fontSize: "0.78rem" }}>
                ✕ Purge All Trade History
              </button>
              <button className="btn-pill-ghost" style={{ fontSize: "0.78rem", color: "var(--accent-coral)", borderColor: "rgba(255,94,77,0.3)" }}>
                ⊘ Suspend Inactive Users
              </button>
            </div>
          </div>

          {/* Save toolbar */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 4 }}>
            <button className="btn-pill-ghost">Discard Changes</button>
            <button className={saved ? "btn-pill-green" : "btn-pill-gold"} onClick={handleSave}>
              {saved ? "✓ Settings Saved!" : "Save Platform Configurations"}
            </button>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
