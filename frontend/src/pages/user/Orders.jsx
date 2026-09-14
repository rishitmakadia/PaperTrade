import React, { useState, useEffect, useCallback } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { tradesAPI, portfoliosAPI } from "../../api/index.js";
import { useAuth } from "../../context/AuthContext.jsx";

const STATUS_BADGES = {
  EXECUTED: "badge-pill-green",
  PENDING: "badge-pill-gold",
  CANCELLED: "badge-pill-coral",
};

export default function Orders() {
  const { portfolios, currentPortfolio } = useAuth();
  const [orders,             setOrders]             = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [filter,             setFilter]             = useState("ALL");
  const [typeFilter,         setTypeFilter]         = useState("ALL");
  const [search,             setSearch]             = useState("");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("ALL");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const portId = selectedPortfolioId === "ALL" ? null : Number(selectedPortfolioId);
      const data = await tradesAPI.list(portId);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPortfolioId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filtered = orders
    .filter((o) => {
      const matchStatus = filter === "ALL" || o.status === filter;
      const matchType = typeFilter === "ALL" || o.type === typeFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        o.symbol?.toLowerCase().includes(q) ||
        o.portfolioName?.toLowerCase().includes(q) ||
        (o.name && o.name.toLowerCase().includes(q));
      return matchStatus && matchType && matchSearch;
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const stats = {
    total:    orders.length,
    executed: orders.filter((o) => o.status === "EXECUTED").length,
    pending:  orders.filter((o) => o.status === "PENDING").length,
    buyVol:   orders.filter((o) => o.type === "BUY").reduce((s, o) => s + (Number(o.total) || 0), 0),
    sellVol:  orders.filter((o) => o.type === "SELL").reduce((s, o) => s + (Number(o.total) || 0), 0),
  };

  const fmtDate = (iso) => {
    if (!iso) return { date: "—", time: "—" };
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-IN"),
      time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const handleExport = () => {
    const portId = selectedPortfolioId === "ALL" ? null : Number(selectedPortfolioId);
    tradesAPI.exportCSV(portId);
  };

  return (
    <AppLayout title="Orders & Trade Ledger">
      <div className="page-body" style={{ paddingTop: 20 }}>
        {/* Metric Cards */}
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <div className="card card-accent-gold" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Total Orders
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {stats.total}
            </div>
          </div>

          <div className="card card-accent-green" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Executed Orders
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-green)" }}>
              {stats.executed}
            </div>
          </div>

          <div className="card card-accent-purple" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Pending Fill
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-gold)" }}>
              {stats.pending}
            </div>
          </div>

          <div className="card card-accent-blue" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Gross Turnover
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>
              ₹{(stats.buyVol + stats.sellVol).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Search Input */}
            <div style={{ position: "relative", minWidth: 200 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search orders (symbol)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: "6px 12px 6px 30px",
                  fontSize: "0.78rem",
                  borderRadius: 8,
                  width: "100%",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              >
                🔍
              </span>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    padding: 2,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="divider-v" style={{ height: 24 }} />

            {/* Portfolio Filter Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Portfolio:</span>
              <select
                className="form-input"
                value={selectedPortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                style={{ width: "auto", padding: "6px 12px", fontSize: "0.78rem", fontWeight: 600 }}
              >
                <option value="ALL">All Portfolios</option>
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="divider-v" style={{ height: 24 }} />

            {/* Status pills */}
            <div style={{ display: "flex", gap: 6 }}>
              {["ALL", "EXECUTED", "PENDING", "CANCELLED"].map((f) => (
                <button
                  key={f}
                  className={filter === f ? "btn-pill-gold" : "btn-pill-ghost"}
                  style={{ padding: "6px 14px", fontSize: "0.75rem" }}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="divider-v" style={{ height: 24 }} />

            {/* Type pills */}
            <div style={{ display: "flex", gap: 6 }}>
              {["ALL", "BUY", "SELL"].map((f) => (
                <button
                  key={f}
                  className={typeFilter === f ? (f === "BUY" ? "btn-pill-green" : f === "SELL" ? "btn-pill-coral" : "btn-pill-gold") : "btn-pill-ghost"}
                  style={{ padding: "6px 14px", fontSize: "0.75rem" }}
                  onClick={() => setTypeFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>
              {filtered.length} matching trades
            </span>
            <button
              className="btn-pill-ghost"
              style={{ padding: "6px 16px", fontSize: "0.78rem" }}
              onClick={handleExport}
            >
              ⬇ Export Ledger CSV
            </button>
          </div>
        </div>

        {/* Orders Table Card */}
        <div className="card card-accent-blue">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Portfolio</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Execution Price</th>
                  <th>Total Value</th>
                  <th>Realized P&L</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9}><div className="empty-state"><p>Loading order ledger…</p></div></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">📋</div><p>No orders match the current filters.</p></div></td></tr>
                ) : filtered.map((o) => {
                  const { date, time } = fmtDate(o.createdAt);

                  return (
                    <tr key={o.id || o._id || o.symbol + o.createdAt}>
                      <td>
                        <span
                          style={{
                            fontSize: "0.76rem",
                            fontWeight: 600,
                            background: "var(--bg-tertiary)",
                            padding: "3px 8px",
                            borderRadius: 4,
                            color: "var(--accent-cyan)",
                          }}
                        >
                          {o.portfolioName || "Main"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
                          {o.symbol}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-pill ${o.type === "BUY" ? "badge-pill-green" : "badge-pill-coral"}`}>
                          {o.type === "BUY" ? "▲ BUY" : "▼ SELL"}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{o.qty}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>₹{Number(o.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
                        ₹{Number(o.total || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>
                      <td
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          color: (o.realizedPnl ?? 0) >= 0 ? "var(--accent-green)" : "var(--accent-coral)",
                        }}
                      >
                        {(o.realizedPnl ?? 0) !== 0
                          ? `${(o.realizedPnl ?? 0) >= 0 ? "+" : ""}₹${Number(o.realizedPnl).toFixed(2)}`
                          : "—"}
                      </td>
                      <td>
                        <span className={`badge-pill ${STATUS_BADGES[o.status] || "badge-pill-ghost"}`}>
                          {o.status === "EXECUTED" ? "✓ " : o.status === "PENDING" ? "⟳ " : "✕ "}{o.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontFamily: "var(--font-mono)" }}>
                        <div>{date}</div>
                        <div style={{ color: "var(--text-dim)", fontSize: "0.68rem" }}>{time}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 16, display: "flex", gap: 32, paddingLeft: 12, flexWrap: "wrap" }}>
            {[
              ["Buy Volume", `₹${stats.buyVol.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "pos"],
              ["Sell Volume", `₹${stats.sellVol.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "neg"],
              ["Net Capital Flow", `₹${Math.abs(stats.buyVol - stats.sellVol).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "neutral"],
            ].map(([k, v, cls]) => (
              <div key={k}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 2 }}>{k}</div>
                <div className={cls} style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
