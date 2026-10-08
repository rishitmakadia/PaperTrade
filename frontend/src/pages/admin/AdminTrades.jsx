import React, { useState, useEffect } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { adminAPI } from "../../api/index.js";

export default function AdminTrades() {
  const [trades,  setTrades]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("ALL");

  const loadTrades = () => {
    setLoading(true);
    adminAPI.trades()
      .then((data) => {
        setTrades(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTrades();
  }, []);

  const filtered = trades.filter((t) => {
    const matchesFilter = filter === "ALL" || t.type === filter;
    const traderName = t.userName || t.userId?.name || "";
    const traderEmail = t.userEmail || t.userId?.email || "";
    const portName = t.portfolioName || "";
    const symbol = t.symbol || "";

    const matchesSearch =
      symbol.toLowerCase().includes(search.toLowerCase()) ||
      traderName.toLowerCase().includes(search.toLowerCase()) ||
      traderEmail.toLowerCase().includes(search.toLowerCase()) ||
      portName.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const totalBuy  = trades.filter((t) => t.type === "BUY").reduce((s, t) => s + (Number(t.total) || 0), 0);
  const totalSell = trades.filter((t) => t.type === "SELL").reduce((s, t) => s + (Number(t.total) || 0), 0);
  const totalPnl  = trades.filter((t) => t.type === "SELL").reduce((s, t) => s + (Number(t.realizedPnl) || 0), 0);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleExportCsv = () => {
    if (trades.length === 0) return;
    const headers = ["Order ID", "Trader Name", "Trader Email", "Portfolio", "Symbol", "Company", "Type", "Qty", "Price", "Total Turnover", "Realized P&L", "Status", "Order Type", "Execution Time"];
    const rows = filtered.map(t => [
      t.id || t._id || "",
      `"${t.userName || t.userId?.name || "Trader"}"`,
      `"${t.userEmail || t.userId?.email || ""}"`,
      `"${t.portfolioName || "Main"}"`,
      t.symbol || "",
      `"${t.name || ""}"`,
      t.type || "",
      t.qty || 0,
      Number(t.price || 0).toFixed(2),
      Number(t.total || 0).toFixed(2),
      Number(t.realizedPnl || 0).toFixed(2),
      t.status || "EXECUTED",
      t.orderType || "MARKET",
      `"${t.createdAt ? new Date(t.createdAt).toISOString() : ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `all_platform_trades_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout title="All Platform Trades">
      <div className="page-body" style={{ paddingTop: 20 }}>
        {/* Stat Cards */}
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <div className="card card-accent-gold" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Total Executed Trades
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800 }}>
              {trades.length}
            </div>
          </div>

          <div className="card card-accent-green" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Buy Transactions
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-green)" }}>
              {trades.filter((t) => t.type === "BUY").length}
            </div>
          </div>

          <div className="card card-accent-coral" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Sell Transactions
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-coral)" }}>
              {trades.filter((t) => t.type === "SELL").length}
            </div>
          </div>

          <div className="card card-accent-blue" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Cumulative Turnover
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800 }}>
              ₹{((totalBuy + totalSell) / 100000).toFixed(1)}L
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", minWidth: 280 }}>
              <input
                type="text"
                placeholder="Search ticker, trader, or portfolio…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ borderRadius: "var(--radius-pill)", paddingLeft: 34 }}
              />
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                🔍
              </span>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              {["ALL", "BUY", "SELL"].map((f) => (
                <button
                  key={f}
                  className={filter === f ? (f === "BUY" ? "btn-pill-green" : f === "SELL" ? "btn-pill-coral" : "btn-pill-gold") : "btn-pill-ghost"}
                  style={{ padding: "6px 14px", fontSize: "0.75rem" }}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--text-muted)" }}>
              {filtered.length} of {trades.length} trades
            </span>

            <button
              className="btn-pill-ghost"
              style={{ padding: "6px 12px", fontSize: "0.74rem" }}
              onClick={loadTrades}
              title="Refresh trade ledger"
            >
              ↻ Refresh
            </button>

            <button
              className="btn-pill-ghost"
              style={{ padding: "6px 12px", fontSize: "0.74rem", color: "var(--accent-gold)", borderColor: "rgba(246,201,68,0.3)" }}
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* Trades Table Card */}
        <div className="card card-accent-blue">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Trader</th>
                  <th>Portfolio</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Execution Price</th>
                  <th>Total Turnover</th>
                  <th>Realized P&L</th>
                  <th>Status</th>
                  <th>Execution Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty-state" style={{ padding: "40px 0" }}>
                        <p>Loading live trade history…</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty-state" style={{ padding: "40px 0" }}>
                        <div className="empty-icon">📋</div>
                        <p>No trades found matching query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((t, idx) => {
                    const traderName = t.userName || t.userId?.name || "Trader";
                    const traderEmail = t.userEmail || t.userId?.email || "";
                    const isBuy = t.type === "BUY";
                    const pnl = Number(t.realizedPnl || 0);

                    return (
                      <tr key={t.id || t._id || idx}>
                        {/* Trader */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: "var(--accent-gold)",
                                color: "#000",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: "0.75rem",
                                fontFamily: "var(--font-display)",
                                flexShrink: 0,
                              }}
                            >
                              {traderName[0]?.toUpperCase() || "T"}
                            </div>
                            <div>
                              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                                {traderName}
                              </div>
                              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                                {traderEmail}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Portfolio */}
                        <td>
                          <span
                            style={{
                              fontSize: "0.74rem",
                              fontWeight: 600,
                              background: "var(--bg-elevated)",
                              border: "1px solid var(--border)",
                              padding: "3px 8px",
                              borderRadius: 4,
                              color: "var(--accent-cyan)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {t.portfolioName || "Main Portfolio"}
                          </span>
                        </td>

                        {/* Symbol */}
                        <td>
                          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
                            {t.symbol}
                          </div>
                          {t.name && (
                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", maxWidth: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {t.name}
                            </div>
                          )}
                        </td>

                        {/* Type */}
                        <td>
                          <span className={`badge-pill ${isBuy ? "badge-pill-green" : "badge-pill-coral"}`}>
                            {isBuy ? "▲ BUY" : "▼ SELL"}
                          </span>
                        </td>

                        {/* Qty */}
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                          {t.qty}
                        </td>

                        {/* Execution Price */}
                        <td style={{ fontFamily: "var(--font-mono)" }}>
                          ₹{Number(t.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Total Turnover */}
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
                          ₹{Number(t.total || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </td>

                        {/* Realized P&L */}
                        <td
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            color: isBuy ? "var(--text-muted)" : pnl >= 0 ? "var(--accent-green)" : "var(--accent-coral)",
                          }}
                        >
                          {!isBuy && t.realizedPnl != null
                            ? `${pnl >= 0 ? "+" : ""}₹${pnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "—"}
                        </td>

                        {/* Status */}
                        <td>
                          <span className="badge-pill badge-pill-green" style={{ fontSize: "0.68rem" }}>
                            ✓ {t.status || "EXECUTED"}
                          </span>
                        </td>

                        {/* Execution Time */}
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {formatDateTime(t.createdAt || t.executedAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Volume Footer */}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 16, display: "flex", gap: 32, paddingLeft: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 2 }}>Gross Buy Volume</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-green)" }}>
                ₹{totalBuy.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 2 }}>Gross Sell Volume</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-coral)" }}>
                ₹{totalSell.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 2 }}>Platform Realized P&L</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", fontWeight: 700, color: totalPnl >= 0 ? "var(--accent-green)" : "var(--accent-coral)" }}>
                {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
