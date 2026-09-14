import React, { useState } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import CreatePortfolioModal from "../../components/CreatePortfolioModal.jsx";

const Toggle = ({ val, onToggle, size = "md" }) => {
  const w = size === "lg" ? 52 : 42;
  const h = size === "lg" ? 28 : 24;
  const d = size === "lg" ? 20 : 16;
  return (
    <div
      onClick={onToggle}
      style={{
        width: w, height: h, borderRadius: h / 2, cursor: "pointer",
        transition: "var(--transition)",
        background: val ? "var(--accent-gold)" : "var(--bg-elevated)",
        border: val ? "1px solid var(--accent-gold)" : "1px solid var(--border)",
        position: "relative", flexShrink: 0,
      }}
    >
      <div style={{
        width: d, height: d, borderRadius: "50%", background: val ? "#0c0d12" : "var(--text-muted)",
        position: "absolute", top: (h - d) / 2, transition: "var(--transition)",
        left: val ? w - d - (h - d) / 2 : (h - d) / 2,
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
      }} />
    </div>
  );
};

export default function UserSettings() {
  const {
    portfolios,
    currentPortfolio,
    setCurrentPortfolio,
    archivePortfolio,
    resetPortfolio,
  } = useAuth();

  // Balance / portfolio
  const [resetBalance,   setResetBalance]   = useState(1000000);
  const [confirmReset,   setConfirmReset]   = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Prefs
  const [notifications, setNotifications]  = useState(true);
  const [soundFX,       setSoundFX]        = useState(false);
  const [compactMode,   setCompactMode]    = useState(false);

  const handleResetCurrentPortfolio = async () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    if (currentPortfolio?.id) {
      await resetPortfolio(resetBalance, currentPortfolio.id);
    }
    setConfirmReset(false);
  };

  const handleDeletePortfolio = async (portId, portName) => {
    if (window.confirm(`Are you sure you want to delete portfolio "${portName}"? All its holdings and trades will be permanently deleted.`)) {
      await archivePortfolio(portId);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <AppLayout title="Settings & Portfolio Management">
      <div className="page-body" style={{ paddingTop: 20 }}>
        <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* ── YAHOO FINANCE LIVE DATA FEED STATUS CARD ── */}
          <div className="card card-accent-green">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: "1.4rem" }}>🌐</span>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 800 }}>
                    Yahoo Finance Market Data Feed
                  </div>
                  <span className="badge-pill badge-pill-green">
                    ● ACTIVE LIVE FEED
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Real-time equity market data stream powered by Yahoo Finance for Indian Equities (NSE &amp; BSE). Provides live and historical prices, market capitalization, high/low intraday ranges, and trading volumes.
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(133,227,158,0.12)", border: "1px solid rgba(133,227,158,0.3)", borderRadius: "var(--radius-pill)", padding: "4px 12px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-green)", display: "inline-block", boxShadow: "0 0 8px var(--accent-green)" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", fontWeight: 700, color: "var(--accent-green)" }}>
                    CONNECTED
                  </span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  Exchange: NSE India / BSE
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginTop: 16 }}>
              {[
                { label: "PROVIDER", value: "Yahoo Finance v8" },
                { label: "MARKET", value: "NSE / BSE (India)" },
                { label: "CURRENCY", value: "INR (₹)" },
                { label: "PRICE OVERRIDE", value: "✏️ Enabled in Order" },
              ].map(({ label, value }) => (
                <div key={label} className="metric-box" style={{ padding: "10px 14px" }}>
                  <div className="metric-box-label" style={{ fontSize: "0.65rem" }}>{label}</div>
                  <div className="metric-box-value" style={{ fontSize: "0.84rem", color: "var(--text-primary)" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── MULTI-PORTFOLIO MANAGER CARD ── */}
          <div className="card card-accent-gold">
            <div className="card-header" style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 className="card-title">Portfolios Management</h3>
                <div className="card-subtitle">Manage isolated paper trading portfolios and capital allocations</div>
              </div>
              <button
                className="btn-pill"
                onClick={() => setShowCreateModal(true)}
                style={{
                  fontSize: "0.78rem",
                  background: "rgba(0, 212, 255, 0.15)",
                  border: "1px solid var(--accent-cyan)",
                  color: "var(--accent-cyan)",
                }}
              >
                + Create Portfolio
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {portfolios.map((p) => {
                const isCurrent = p.id === currentPortfolio?.id;
                const pnl = p.totalPnl ?? 0;
                const isPos = pnl >= 0;

                return (
                  <div
                    key={p.id}
                    style={{
                      background: isCurrent ? "rgba(0, 212, 255, 0.06)" : "var(--bg-elevated)",
                      border: isCurrent ? "1.5px solid var(--accent-cyan)" : "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{p.name}</span>
                        {p.isDefault && (
                          <span className="pill-badge pill-badge-gold" style={{ fontSize: "0.65rem" }}>
                            Default
                          </span>
                        )}
                        {isCurrent && (
                          <span className="pill-badge pill-badge-blue" style={{ fontSize: "0.65rem" }}>
                            Active
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                        Capital: ₹{fmt(p.initialCapital)} · Cash: ₹{fmt(p.cashBalance)} · P&L:{" "}
                        <span style={{ color: isPos ? "var(--accent-green)" : "var(--accent-coral)", fontWeight: 700 }}>
                          {isPos ? "+" : ""}₹{fmt(pnl)} ({((p.returnPercentage ?? 0)).toFixed(2)}%)
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      {!isCurrent && (
                        <button
                          className="btn-pill-ghost"
                          style={{ padding: "4px 12px", fontSize: "0.75rem" }}
                          onClick={() => setCurrentPortfolio(p)}
                        >
                          Select Active
                        </button>
                      )}
                      {!p.isDefault && (
                        <button
                          className="btn-pill-ghost"
                          style={{ padding: "4px 10px", fontSize: "0.75rem", color: "var(--accent-coral)", borderColor: "rgba(255,94,77,0.3)" }}
                          onClick={() => handleDeletePortfolio(p.id, p.name)}
                          title="Delete this portfolio"
                        >
                          ✕ Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── PREFERENCES ── */}
          <div className="card card-accent-blue">
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div>
                <h3 className="card-title">Trading Preferences</h3>
                <div className="card-subtitle">Platform notifications & sound telemetry</div>
              </div>
            </div>
            {[
              { label: "Order Execution Alerts", desc: "Display instant push notifications upon filled trades", val: notifications, set: setNotifications },
              { label: "Sound Effects",         desc: "Play subtle audio cues on successful trade confirmation", val: soundFX,       set: setSoundFX },
              { label: "High Density Layout",    desc: "Compact padding for multi-monitor market monitoring", val: compactMode,   set: setCompactMode },
            ].map(({ label, desc, val, set }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{desc}</div>
                </div>
                <Toggle val={val} onToggle={() => set(!val)} />
              </div>
            ))}
          </div>

          {/* ── DANGER ZONE ── */}
          <div className="card card-accent-coral">
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div>
                <div className="card-title" style={{ color: "var(--accent-coral)" }}>⚠ Danger Zone</div>
                <div className="card-subtitle">Irreversible actions and single portfolio resets</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "rgba(255,94,77,0.06)", border: "1px solid rgba(255,94,77,0.2)", borderRadius: "var(--radius-md)", padding: "18px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", fontWeight: 700, color: "var(--accent-coral)", marginBottom: 4 }}>
                  ↺ Reset Active Portfolio ({currentPortfolio?.name || "Main"})
                </div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: 14 }}>
                  Clears all open positions and resets virtual cash balance only for "{currentPortfolio?.name}". Other portfolios remain intact.
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div className="input-group" style={{ minWidth: 160 }}>
                    <label className="input-label">Reset Balance (₹)</label>
                    <input type="number" value={resetBalance} min={1000} step={100000} onChange={(e) => setResetBalance(e.target.value)} />
                  </div>
                  <button
                    className="btn-pill-coral"
                    onClick={handleResetCurrentPortfolio}
                  >
                    {confirmReset ? `⚠ Confirm Reset for "${currentPortfolio?.name}"?` : `↺ Reset "${currentPortfolio?.name}"`}
                  </button>
                  {confirmReset && (
                    <button className="btn-pill-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <CreatePortfolioModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </AppLayout>
  );
}
