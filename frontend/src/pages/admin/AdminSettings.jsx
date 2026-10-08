import React, { useState, useEffect } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const SETTINGS_STORAGE_KEY = "papertrade_platform_settings";

const DEFAULT_SETTINGS = {
  platformName: "PaperTrade",
  defaultBalance: 1000000,
  maxLeverage: 5,
  marketOpen: "09:15",
  marketClose: "15:30",
  slippageBps: "0",
  allowSignups: true,
  maintenanceMode: false,
  emailNotifications: true,
  autoApproveOrders: true,
  liveMarketFeed: true,
};

export default function AdminSettings() {
  const { showNotification } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error("Failed to parse settings:", e);
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
      if (showNotification) {
        showNotification("Platform configurations saved successfully!", "success");
      }
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    }
  };

  const handleDiscard = () => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
      if (showNotification) {
        showNotification("Changes discarded.", "info");
      }
    } catch (err) {
      setSettings(DEFAULT_SETTINGS);
    }
  };

  const toggle = (key) => setSettings((s) => ({ ...s, [key]: !s[key] }));

  // Custom Toggle Switch
  const SwitchToggle = ({ active, onToggle, label }) => (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      onClick={onToggle}
      style={{
        width: 46,
        height: 26,
        borderRadius: 14,
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        background: active ? "var(--accent-gold)" : "var(--bg-elevated)",
        border: active ? "1px solid var(--accent-gold)" : "1px solid var(--border)",
        position: "relative",
        padding: 0,
        outline: "none",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: active ? "#0c0d12" : "var(--text-muted)",
          position: "absolute",
          top: 2,
          left: active ? 22 : 3,
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );

  return (
    <AppLayout title="Platform Settings">
      <div className="page-body" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <div style={{ maxWidth: 840, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Header Description */}
          <div style={{ marginBottom: 4 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.4rem", color: "var(--text-primary)", margin: "0 0 6px 0" }}>
              Brokerage & Platform Administration
            </h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              Configure global simulation parameters, exchange trading sessions, leverage policies, and system-wide feature flags.
            </p>
          </div>

          {/* ─── CARD 1: GENERAL PLATFORM ENGINE ─── */}
          <div className="card card-accent-gold" style={{ padding: "24px 28px" }}>
            <div className="card-header" style={{ marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
              <div>
                <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1.1rem" }}>
                  <span>⚙️</span> General Platform Engine
                </div>
                <div className="card-subtitle" style={{ marginTop: 2 }}>
                  Global virtual brokerage configurations and exchange market hours
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Row 1: Brand Name + Default Balance */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Platform Brand Name</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 400 }}>Title & Nav logo</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.platformName}
                    onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    placeholder="e.g. PaperTrade"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Default Virtual Balance (₹)</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 400 }}>Initial trader seed</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={settings.defaultBalance}
                    min={10000}
                    step={50000}
                    onChange={(e) => setSettings({ ...settings, defaultBalance: Number(e.target.value) })}
                    placeholder="1000000"
                  />
                </div>
              </div>

              {/* Row 2: Market Open & Close Times */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Market Open Time (IST)</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--accent-gold)", fontWeight: 400 }}>NSE Opening</span>
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={settings.marketOpen}
                    onChange={(e) => setSettings({ ...settings, marketOpen: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Market Close Time (IST)</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--accent-coral)", fontWeight: 400 }}>NSE Closing</span>
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={settings.marketClose}
                    onChange={(e) => setSettings({ ...settings, marketClose: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 3: Leverage Multiplier & Slippage */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Maximum Leverage Multiplier (x)</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 400 }}>Intraday multiplier</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    min={1}
                    max={20}
                    value={settings.maxLeverage}
                    onChange={(e) => setSettings({ ...settings, maxLeverage: Number(e.target.value) })}
                    placeholder="5"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Simulated Slippage & Brokerage</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 400 }}>Execution model</span>
                  </label>
                  <select
                    className="form-select"
                    value={settings.slippageBps}
                    onChange={(e) => setSettings({ ...settings, slippageBps: e.target.value })}
                    style={{ background: "var(--bg-card-inner)", cursor: "pointer" }}
                  >
                    <option value="0">0 bps — Zero Brokerage (Exact Quote Fill)</option>
                    <option value="5">5 bps — 0.05% Institutional Spread</option>
                    <option value="10">10 bps — 0.10% Retail Slippage</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ─── CARD 2: SYSTEM FEATURE FLAGS ─── */}
          <div className="card card-accent-blue" style={{ padding: "24px 28px" }}>
            <div className="card-header" style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
              <div>
                <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1.1rem" }}>
                  <span>🎛</span> System Feature Flags & Policies
                </div>
                <div className="card-subtitle" style={{ marginTop: 2 }}>
                  Control runtime capabilities, automated executions, and user onboarding
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                {
                  key: "allowSignups",
                  icon: "👥",
                  label: "Allow New User Registrations",
                  desc: "Permits public visitors to register and create new simulated paper trading portfolios",
                },
                {
                  key: "maintenanceMode",
                  icon: "🚧",
                  label: "Maintenance Mode",
                  desc: "Suspends active trade execution across all standard users while keeping analytics read-only",
                },
                {
                  key: "emailNotifications",
                  icon: "✉️",
                  label: "Order Execution & Alert Emails",
                  desc: "Dispatches automated notification emails when price trigger targets or limit orders are reached",
                },
                {
                  key: "autoApproveOrders",
                  icon: "⚡",
                  label: "Instant Order Settlement",
                  desc: "Simulates instantaneous broker market fills against current real-time bid/ask quotes",
                },
                {
                  key: "liveMarketFeed",
                  icon: "📡",
                  label: "Live Yahoo Market Data Feeds",
                  desc: "Polls continuous live market data streams during active NSE market hours",
                },
              ].map(({ key, icon, label, desc }, idx, arr) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 0",
                    borderBottom: idx === arr.length - 1 ? "none" : "1px solid var(--border)",
                    gap: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: settings[key] ? "rgba(246, 201, 68, 0.12)" : "var(--bg-elevated)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.86rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>
                        {label}
                      </div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.76rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                        {desc}
                      </div>
                    </div>
                  </div>

                  <SwitchToggle active={settings[key]} onToggle={() => toggle(key)} label={label} />
                </div>
              ))}
            </div>
          </div>

          {/* ─── CARD 3: DANGER ZONE ─── */}
          <div className="card card-accent-coral" style={{ padding: "24px 28px" }}>
            <div className="card-header" style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,94,77,0.2)" }}>
              <div>
                <div className="card-title" style={{ color: "var(--accent-coral)", display: "flex", alignItems: "center", gap: 8, fontSize: "1.1rem" }}>
                  <span>⚠️</span> Platform Operations Danger Zone
                </div>
                <div className="card-subtitle" style={{ marginTop: 2 }}>
                  High-privilege administrative actions with irreversible platform-wide effects
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              <div style={{ background: "rgba(255,94,77,0.06)", border: "1px solid rgba(255,94,77,0.2)", borderRadius: "var(--radius-md)", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-coral)", marginBottom: 4 }}>
                    ↺ Reset All User Balances
                  </div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    Resets every trader's default portfolio cash balance back to ₹{Number(settings.defaultBalance).toLocaleString("en-IN")}.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-pill-coral"
                  style={{ fontSize: "0.76rem", padding: "8px 14px", width: "100%" }}
                  onClick={() =>
                    setConfirmModal({
                      title: "Reset All User Balances?",
                      message: "This will reset the primary cash balances of all registered traders to the default seed capital. This action cannot be reversed.",
                      actionLabel: "Confirm Balance Reset",
                      onConfirm: () => {
                        if (showNotification) showNotification("All trader accounts reset to default virtual balance.", "info");
                        setConfirmModal(null);
                      },
                    })
                  }
                >
                  ↺ Reset Balances
                </button>
              </div>

              <div style={{ background: "rgba(255,94,77,0.06)", border: "1px solid rgba(255,94,77,0.2)", borderRadius: "var(--radius-md)", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-coral)", marginBottom: 4 }}>
                    ✕ Purge Trade Ledger History
                  </div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    Permanently flushes executed simulated trade history across all test accounts.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-pill-coral"
                  style={{ fontSize: "0.76rem", padding: "8px 14px", width: "100%" }}
                  onClick={() =>
                    setConfirmModal({
                      title: "Purge All Trade Ledger History?",
                      message: "Are you sure you want to flush all historical executed trade records? This cannot be undone.",
                      actionLabel: "Purge Trade History",
                      onConfirm: () => {
                        if (showNotification) showNotification("Historical trade records purge completed.", "info");
                        setConfirmModal(null);
                      },
                    })
                  }
                >
                  ✕ Purge Trade History
                </button>
              </div>

              <div style={{ background: "rgba(255,94,77,0.06)", border: "1px solid rgba(255,94,77,0.2)", borderRadius: "var(--radius-md)", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-coral)", marginBottom: 4 }}>
                    ⊘ Suspend Inactive Traders
                  </div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    Marks dormant accounts with zero trade activity in the past 60 days as Inactive.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-pill-ghost"
                  style={{ fontSize: "0.76rem", padding: "8px 14px", width: "100%", color: "var(--accent-coral)", borderColor: "rgba(255,94,77,0.3)" }}
                  onClick={() =>
                    setConfirmModal({
                      title: "Suspend Inactive Accounts?",
                      message: "All user accounts with no trading activity will have their status changed to Inactive.",
                      actionLabel: "Suspend Accounts",
                      onConfirm: () => {
                        if (showNotification) showNotification("Inactive accounts status updated to suspended.", "info");
                        setConfirmModal(null);
                      },
                    })
                  }
                >
                  ⊘ Suspend Inactive
                </button>
              </div>
            </div>
          </div>

          {/* ─── ACTION TOOLBAR ─── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 4,
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem", color: "var(--text-muted)" }}>
              {saved ? (
                <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>✓ All changes active & saved</span>
              ) : (
                "Unsaved changes will apply locally until published"
              )}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                className="btn-pill btn-pill-ghost"
                style={{ padding: "8px 18px", fontSize: "0.82rem" }}
                onClick={handleDiscard}
              >
                Discard Changes
              </button>

              <button
                type="button"
                className={saved ? "btn-pill btn-pill-green" : "btn-pill btn-pill-gold"}
                style={{ padding: "8px 22px", fontSize: "0.82rem", minWidth: 210 }}
                onClick={handleSave}
              >
                {saved ? "✓ Settings Saved!" : "Save Platform Configurations"}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ fontSize: "1.6rem" }}>⚠️</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.15rem", color: "var(--accent-coral)", margin: 0 }}>
                {confirmModal.title}
              </h3>
            </div>

            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 20px 0" }}>
              {confirmModal.message}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="btn-pill btn-pill-ghost"
                onClick={() => setConfirmModal(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-pill-coral"
                onClick={confirmModal.onConfirm}
                disabled={actionLoading}
                style={{ padding: "8px 18px", fontSize: "0.82rem" }}
              >
                {confirmModal.actionLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
