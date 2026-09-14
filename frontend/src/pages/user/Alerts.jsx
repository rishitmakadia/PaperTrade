import React, { useState, useEffect, useCallback } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { alertsAPI } from "../../api/index.js";
import { useAuth } from "../../context/AuthContext.jsx";

const NSE_SYMBOLS = [
  "RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK",
  "BHARTIARTL","WIPRO","SBIN","TATAMOTORS","MARUTI",
  "BAJFINANCE","SUNPHARMA","LT","ASIANPAINT","NESTLEIND",
];

export default function Alerts() {
  const { portfolios, currentPortfolio } = useAuth();
  const [alerts,             setAlerts]             = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [symbol,             setSymbol]             = useState("RELIANCE");
  const [price,              setPrice]              = useState("");
  const [condition,          setCondition]          = useState("above");
  const [saving,             setSaving]             = useState(false);
  const [msg,                setMsg]                = useState("");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(
    currentPortfolio?.id || (portfolios[0]?.id ?? "")
  );

  const loadAlerts = useCallback(async () => {
    try {
      const data = await alertsAPI.list();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading alerts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleCreate = async () => {
    if (!price) return setMsg("Enter a target price");
    setSaving(true);
    setMsg("");
    try {
      await alertsAPI.create(
        symbol,
        symbol,
        parseFloat(price),
        condition,
        selectedPortfolioId ? Number(selectedPortfolioId) : null
      );
      setMsg("✓ Alert created successfully!");
      setPrice("");
      loadAlerts();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setMsg("✕ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await alertsAPI.delete(id).catch(console.error);
    setAlerts((prev) => prev.filter((a) => (a.id || a._id) !== id));
  };

  const handleDismiss = async (id) => {
    await alertsAPI.dismiss(id).catch(console.error);
    setAlerts((prev) =>
      prev.map((a) => ((a.id || a._id) === id ? { ...a, active: false } : a))
    );
  };

  const active    = alerts.filter((a) => a.active && !a.triggered);
  const triggered = alerts.filter((a) => a.triggered);
  const inactive  = alerts.filter((a) => !a.active && !a.triggered);

  return (
    <AppLayout title="Price Alerts">
      <div className="page-body" style={{ paddingTop: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 18, alignItems: "start" }} className="backtest-layout">

          {/* Alert list column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Triggered alerts */}
            {triggered.length > 0 && (
              <div className="card card-accent-gold">
                <div className="card-header" style={{ marginBottom: 14 }}>
                  <div className="card-title" style={{ color: "var(--accent-gold)" }}>🔔 Triggered Notifications</div>
                  <span className="badge-pill badge-pill-gold">{triggered.length} TRIGGERED</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {triggered.map((a) => {
                    const alertId = a.id || a._id;
                    return (
                      <div
                        key={alertId}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "14px 18px", background: "rgba(246,201,68,0.08)", border: "1px solid rgba(246,201,68,0.25)",
                          borderRadius: "var(--radius-md)", flexWrap: "wrap", gap: 10,
                        }}
                      >
                        <div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>
                            {a.symbol} — Price crossed {a.condition} ₹{Number(a.targetPrice).toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            Triggered {a.triggeredAt ? new Date(a.triggeredAt).toLocaleString("en-IN") : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn-pill-ghost"
                            style={{ padding: "4px 14px", fontSize: "0.75rem" }}
                            onClick={() => handleDismiss(alertId)}
                          >
                            Dismiss
                          </button>
                          <button
                            className="btn-pill-ghost"
                            style={{ padding: "4px 12px", fontSize: "0.75rem", color: "var(--accent-coral)", borderColor: "rgba(255,94,77,0.3)" }}
                            onClick={() => handleDelete(alertId)}
                          >
                            ✕ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active alerts */}
            <div className="card card-accent-green">
              <div className="card-header" style={{ marginBottom: 16 }}>
                <div>
                  <h3 className="card-title">Active Price Monitors</h3>
                  <div className="card-subtitle">Real-time quote evaluation engine</div>
                </div>
                <span className="pill-badge pill-badge-green">{active.length} ACTIVE</span>
              </div>
              {loading ? (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", padding: "30px 0", textAlign: "center" }}>
                  Loading active alerts…
                </div>
              ) : active.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔔</div>
                  <p>No active price monitors. Configure target price alerts using the panel →</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {active.map((a) => {
                    const alertId = a.id || a._id;
                    return (
                      <div
                        key={alertId}
                        className="card-inner-green"
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "14px 18px", flexWrap: "wrap", gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: "50%", background: "var(--accent-green)",
                            boxShadow: "0 0 8px var(--accent-green)", flexShrink: 0,
                          }} />
                          <div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>
                              <span style={{ color: "var(--accent-green)" }}>{a.symbol}</span>
                              {" "}{a.condition === "above" ? "▲ above" : "▼ below"}{" "}
                              <span style={{ color: "var(--text-primary)" }}>₹{Number(a.targetPrice).toLocaleString("en-IN")}</span>
                            </div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                              Configured {new Date(a.createdAt).toLocaleDateString("en-IN")}
                            </div>
                          </div>
                        </div>
                        <button
                          className="btn-pill-ghost"
                          style={{ padding: "4px 12px", fontSize: "0.75rem", color: "var(--accent-coral)", borderColor: "rgba(255,94,77,0.3)" }}
                          onClick={() => handleDelete(alertId)}
                        >
                          ✕ Delete
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Past / dismissed */}
            {inactive.length > 0 && (
              <div className="card">
                <div className="card-header" style={{ marginBottom: 12 }}>
                  <div className="card-title" style={{ opacity: 0.6 }}>Dismissed History</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {inactive.map((a) => {
                    const alertId = a.id || a._id;
                    return (
                      <div
                        key={alertId}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "10px 14px", opacity: 0.5, background: "var(--bg-elevated)", borderRadius: "var(--radius-md)",
                        }}
                      >
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
                          {a.symbol} {a.condition} ₹{Number(a.targetPrice).toLocaleString("en-IN")}
                        </span>
                        <button
                          className="btn-pill-ghost"
                          style={{ padding: "2px 8px", fontSize: "0.7rem" }}
                          onClick={() => handleDelete(alertId)}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Create form card */}
          <div className="card card-accent-purple" style={{ position: "sticky", top: 80 }}>
            <div className="card-header" style={{ marginBottom: 18 }}>
              <div>
                <div className="card-title">New Price Trigger</div>
                <div className="card-subtitle">Automated target watcher</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {portfolios.length > 0 && (
                <div className="input-group">
                  <label className="input-label">Portfolio Scope</label>
                  <select
                    value={selectedPortfolioId}
                    onChange={(e) => setSelectedPortfolioId(e.target.value)}
                  >
                    {portfolios.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="input-group">
                <label className="input-label">Stock Symbol</label>
                <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                  {NSE_SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Condition</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="above">Price rises ABOVE target</option>
                  <option value="below">Price drops BELOW target</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Target Price (₹)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 3000"
                  step="0.05"
                  min="0"
                />
              </div>
              {msg && (
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.75rem", padding: "10px 14px", borderRadius: "var(--radius-md)",
                  background: msg.startsWith("✓") ? "rgba(133,227,158,0.1)" : "rgba(255,94,77,0.1)",
                  color: msg.startsWith("✓") ? "var(--accent-green)" : "var(--accent-coral)",
                  border: `1px solid ${msg.startsWith("✓") ? "rgba(133,227,158,0.25)" : "rgba(255,94,77,0.25)"}`,
                }}>{msg}</div>
              )}
              <button
                className="btn-pill-gold w-full"
                style={{ justifyContent: "center", padding: "12px 20px" }}
                onClick={handleCreate}
                disabled={saving}
              >
                {saving ? "Creating Alert…" : "🔔 Create Target Alert"}
              </button>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.6, marginTop: 4 }}>
                Alerts evaluate synchronously on trade execution and during background ticker poll cycles.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
