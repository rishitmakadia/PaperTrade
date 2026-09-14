import React, { useState, useEffect } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { adminAPI } from "../../api/index.js";

export default function AdminTrades() {
  const [trades,  setTrades]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("ALL");

  useEffect(() => {
    adminAPI.trades()
      .then(setTrades)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = trades.filter((t) =>
    (filter === "ALL" || t.type === filter) &&
    (t.symbol?.toLowerCase().includes(search.toLowerCase()) ||
     (t.userName || t.userId?.name)?.toLowerCase().includes(search.toLowerCase()) ||
     t.portfolioName?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalBuy  = trades.filter((t) => t.type === "BUY").reduce((s, t) => s + (Number(t.total) || 0), 0);
  const totalSell = trades.filter((t) => t.type === "SELL").reduce((s, t) => s + (Number(t.total) || 0), 0);

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
            <input
              type="text"
              placeholder="Search ticker, trader, or portfolio…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 300, borderRadius: "var(--radius-pill)" }}
            />
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
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>
            {filtered.length} matched trades
          </span>
        </div>

        {/* Trades Table */}
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
                  <th>Execution Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8}><div className="empty-state"><p>Loading trade history…</p></div></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">📋</div><p>No trades found.</p></div></td></tr>
                ) : filtered.map((t, idx) => (
                  <tr key={t.id || t._id || idx}>
                    <td>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {t.userName || t.userId?.name || "—"}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                        {t.userEmail || t.userId?.email || ""}
                      </div>
                    </td>
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
                        {t.portfolioName || "Main"}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>{t.symbol}</td>
                    <td>
                      <span className={`badge-pill ${t.type === "BUY" ? "badge-pill-green" : "badge-pill-coral"}`}>
                        {t.type === "BUY" ? "▲ BUY" : "▼ SELL"}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{t.qty}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>₹{Number(t.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>₹{Number(t.total || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 16, display: "flex", gap: 32, paddingLeft: 12 }}>
            {[
              ["Gross Buy Volume", `₹${totalBuy.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "pos"],
              ["Gross Sell Volume", `₹${totalSell.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "neg"],
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
