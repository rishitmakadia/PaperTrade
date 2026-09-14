import React, { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import AppLayout from "../../components/AppLayout.jsx";
import { useNavigate } from "react-router-dom";
import BuySellModal from "../../components/BuySellModal.jsx";
import CreatePortfolioModal from "../../components/CreatePortfolioModal.jsx";
import { portfoliosAPI, stocksAPI } from "../../api/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function Portfolio() {
  const { portfolios, currentPortfolio, setCurrentPortfolio, resetPortfolio } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [positions,       setPositions]       = useState([]);
  const [stocks,          setStocks]          = useState([]);
  const [selectedStock,   setSelectedStock]   = useState(null);
  const [tradeType,       setTradeType]       = useState("BUY");
  const [search,          setSearch]          = useState("");
  const [sortBy,          setSortBy]          = useState("latest");
  const [loading,         setLoading]         = useState(true);
  const [equityCurve,     setEquityCurve]     = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal,  setShowResetModal]  = useState(false);
  const [resetBalance,    setResetBalance]    = useState("1000000");
  const [resetting,       setResetting]       = useState(false);

  const activePortId = currentPortfolio?.id;

  const loadData = useCallback(async () => {
    if (!activePortId) return;
    setLoading(true);
    try {
      const [pos, stkList, eq] = await Promise.all([
        portfoliosAPI.holdings(activePortId).catch(() => []),
        stocksAPI.all().catch(() => []),
        portfoliosAPI.equity(activePortId, 60).catch(() => []),
      ]);
      setPositions(pos || []);
      setStocks(stkList || []);
      setEquityCurve(eq || []);
    } catch (err) {
      console.error("Error loading portfolio data:", err);
    } finally {
      setLoading(false);
    }
  }, [activePortId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fmtDate = (iso) => {
    if (!iso) return { date: "—", time: "—" };
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-IN"),
      time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const enriched = positions.map((p) => {
    const live = stocks.find((s) => s.symbol === p.symbol);
    const currentPrice = live?.price ?? p.avgPrice;
    const value = currentPrice * p.qty;
    const pnl = (currentPrice - p.avgPrice) * p.qty;
    const pnlPercent = p.avgPrice > 0 ? ((currentPrice - p.avgPrice) / p.avgPrice) * 100 : 0;
    return { ...p, currentPrice, value, pnl, pnlPercent, sector: live?.sector || p.sector };
  });

  const sorted = [...enriched].sort((a, b) => {
    if (sortBy === "latest") {
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      return timeB - timeA;
    }
    return (b[sortBy] ?? 0) - (a[sortBy] ?? 0);
  });

  const filteredHoldings = sorted.filter((p) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      p.symbol?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      p.sector?.toLowerCase().includes(q)
    );
  });

  const totalInvested = enriched.reduce((s, p) => s + p.avgPrice * p.qty, 0);
  const totalHoldingsValue = enriched.reduce((s, p) => s + p.value, 0);
  const unrealizedPnl = totalHoldingsValue - totalInvested;
  const cashBalance = currentPortfolio?.cashBalance ?? 0;
  const totalNetWorth = totalHoldingsValue + cashBalance;
  const initialCap = currentPortfolio?.initialCapital ?? 1000000;
  const totalPnl = totalNetWorth - initialCap;
  const returnPct = initialCap > 0 ? ((totalPnl / initialCap) * 100).toFixed(2) : "0.00";

  const pnlBars = enriched.map((p) => ({
    name: p.symbol,
    pnl: parseFloat(p.pnl.toFixed(2)),
    fill: p.pnl >= 0 ? "var(--accent-green)" : "var(--accent-coral)",
  }));

  const openModal = (p, type) => {
    const live = stocks.find((s) => s.symbol === p.symbol);
    setSelectedStock(
      live || {
        symbol: p.symbol,
        name: p.name,
        price: p.currentPrice,
        sector: p.sector,
        changePercent: 0,
        change: 0,
        high: p.currentPrice,
        low: p.currentPrice,
        volume: "N/A",
      }
    );
    setTradeType(type);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const capNum = parseFloat(resetBalance);
    if (isNaN(capNum) || capNum < 1000) return;
    setResetting(true);
    await resetPortfolio(capNum, activePortId);
    setResetting(false);
    setShowResetModal(false);
    loadData();
  };

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <AppLayout title={currentPortfolio ? `Portfolio: ${currentPortfolio.name}` : "Portfolio"}>
      <div className="page-body" style={{ paddingTop: 16 }}>
        {/* Portfolio Switcher Ribbon */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
            padding: "12px 18px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {portfolios.map((p) => {
              const isActive = p.id === activePortId;
              return (
                <button
                  key={p.id}
                  onClick={() => setCurrentPortfolio(p)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 20,
                    background: isActive ? "var(--accent-cyan)" : "var(--bg-elevated)",
                    color: isActive ? "#000" : "var(--text-primary)",
                    border: isActive ? "none" : "1px solid var(--border)",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>💼</span>
                  <span>{p.name}</span>
                  {p.isDefault && (
                    <span
                      style={{
                        fontSize: "0.65rem",
                        background: isActive ? "rgba(0,0,0,0.15)" : "var(--bg-tertiary)",
                        padding: "2px 6px",
                        borderRadius: 10,
                        marginLeft: 2,
                      }}
                    >
                      Default
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="btn-pill btn-pill-gold"
              onClick={() => setShowCreateModal(true)}
              style={{ padding: "7px 14px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 6 }}
            >
              <span>+</span> New Portfolio
            </button>
            <button
              className="btn-pill btn-pill-coral"
              onClick={() => {
                setResetBalance(String(initialCap));
                setShowResetModal(true);
              }}
              style={{ padding: "7px 14px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 6 }}
            >
              <span>🔄</span> Reset
            </button>
          </div>
        </div>

        {/* Portfolio Stats Row */}
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <div className="card card-accent-gold" style={{ padding: "20px 22px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Portfolio Net Worth
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              ₹{fmt(totalNetWorth)}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 6 }}>
              Cash: ₹{fmt(cashBalance)} · Holdings: ₹{fmt(totalHoldingsValue)}
            </div>
          </div>

          <div className="card card-accent-blue" style={{ padding: "20px 22px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Invested Capital
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              ₹{fmt(totalInvested)}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 6 }}>
              {enriched.length} Active Positions
            </div>
          </div>

          <div className="card card-accent-purple" style={{ padding: "20px 22px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Initial Capital
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              ₹{fmt(initialCap)}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 6 }}>
              Starting seed allocation
            </div>
          </div>

          <div className={`card ${totalPnl >= 0 ? "card-accent-green" : "card-accent-coral"}`} style={{ padding: "20px 22px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Total Portfolio Return
            </div>
            <div className={totalPnl >= 0 ? "pos" : "neg"} style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              {totalPnl >= 0 ? "+" : ""}₹{fmt(totalPnl)}
            </div>
            <div style={{ marginTop: 6 }}>
              <span className={`badge-pill ${totalPnl >= 0 ? "badge-pill-green" : "badge-pill-coral"}`}>
                {totalPnl >= 0 ? "▲ +" : "▼ "}{returnPct}% Overall
              </span>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card card-accent-blue">
            <div className="card-header">
              <div>
                <h3 className="card-title">Portfolio Equity Trajectory</h3>
                <div className="card-subtitle">60-day historical net portfolio equity for {currentPortfolio?.name}</div>
              </div>
              <span className={`pill-badge ${totalPnl >= 0 ? "pill-badge-green" : "pill-badge-coral"}`}>
                {totalPnl >= 0 ? "+" : ""}{returnPct}%
              </span>
            </div>
            <div className="chart-container" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-gold)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--accent-gold)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval={10} tickFormatter={(d) => d?.slice(5) || d} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} width={65} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, boxShadow: "var(--shadow-md)" }}
                    formatter={(v) => [`₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "Portfolio Equity"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--accent-gold)" strokeWidth={2.5} fill="url(#eqGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`card ${unrealizedPnl >= 0 ? "card-accent-green" : "card-accent-coral"}`}>
            <div className="card-header">
              <div>
                <h3 className="card-title">P&L by Position</h3>
                <div className="card-subtitle">Unrealized return per asset in this portfolio</div>
              </div>
            </div>
            <div className="chart-container" style={{ height: 220 }}>
              {pnlBars.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pnlBars} barSize={26} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} width={65} />
                    <Tooltip
                      formatter={(v) => [`₹${Number(v).toFixed(2)}`, "Unrealized P&L"]}
                      contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, boxShadow: "var(--shadow-md)" }}
                    />
                    <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                      {pnlBars.map((b, i) => (
                        <Cell key={i} fill={b.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state" style={{ height: "100%" }}>
                  <div className="empty-icon">📊</div>
                  <p>No open positions in {currentPortfolio?.name || "this portfolio"}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Holdings table card */}
        <div className="card card-accent-gold">
          <div className="card-header" style={{ marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 className="card-title">{currentPortfolio?.name} Holdings</h3>
              <div className="card-subtitle">
                {filteredHoldings.length} {filteredHoldings.length === 1 ? "active position" : "active positions"} in this portfolio · Click a stock to open Trading Detail in a new tab
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              {/* Search Box */}
              <div style={{ position: "relative", minWidth: 200 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search holdings (symbol, name)…"
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

              {/* Sort selector */}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  Sort by:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ width: "auto", padding: "6px 12px", fontSize: "0.78rem" }}
                >
                  <option value="latest">Latest First</option>
                  <option value="value">Total Value</option>
                  <option value="pnl">Unrealized P&L</option>
                  <option value="pnlPercent">P&L %</option>
                  <option value="qty">Quantity</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Loading portfolio ledger…
            </div>
          ) : positions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💼</div>
              <p>No holdings in this portfolio yet. Execute trades to build your position ledger.</p>
              <button className="btn-pill btn-pill-gold" onClick={() => navigate("/market")} style={{ marginTop: 12 }}>
                Explore Equities →
              </button>
            </div>
          ) : filteredHoldings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>No holdings match "{search}".</p>
              <button className="btn-pill btn-pill-ghost" onClick={() => setSearch("")} style={{ marginTop: 12 }}>
                Clear Search
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Qty</th>
                    <th>Avg Buy Price</th>
                    <th>Current Price</th>
                    <th>Invested</th>
                    <th>Current Value</th>
                    <th>Unrealized P&L</th>
                    <th>Return</th>
                    <th>Timestamp</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHoldings.map((p) => {
                    const { date, time } = fmtDate(p.updatedAt || p.createdAt);

                    return (
                      <tr key={p.symbol}>
                        <td>
                          <a
                            href={`/stocks/${p.symbol}?portfolioId=${activePortId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              textDecoration: "none",
                              color: "inherit",
                              cursor: "pointer",
                            }}
                            title={`Open ${p.symbol} Trading Detail in a new tab`}
                          >
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
                                  {p.symbol}
                                </span>
                                <span style={{ color: "var(--accent-cyan)", fontSize: "0.74rem", opacity: 0.85 }}>↗</span>
                              </div>
                              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{p.name}</div>
                            </div>
                          </a>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{p.qty}</td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>₹{p.avgPrice.toFixed(2)}</td>
                        <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: 600 }}>₹{p.currentPrice.toFixed(2)}</td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>₹{(p.avgPrice * p.qty).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>₹{p.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                        <td className={p.pnl >= 0 ? "pos" : "neg"} style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                          {p.pnl >= 0 ? "+" : ""}₹{p.pnl.toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge-pill ${p.pnlPercent >= 0 ? "badge-pill-green" : "badge-pill-coral"}`}>
                            {p.pnlPercent >= 0 ? "▲ +" : "▼ "}{Math.abs(p.pnlPercent).toFixed(2)}%
                          </span>
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontFamily: "var(--font-mono)" }}>
                          <div>{date}</div>
                          <div style={{ color: "var(--text-dim)", fontSize: "0.68rem" }}>{time}</div>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="btn-pill-green"
                              style={{ padding: "4px 12px", fontSize: "0.72rem" }}
                              onClick={() => openModal(p, "BUY")}
                            >
                              ▲ Buy
                            </button>
                            <button
                              className="btn-pill-coral"
                              style={{ padding: "4px 12px", fontSize: "0.72rem" }}
                              onClick={() => openModal(p, "SELL")}
                            >
                              ▼ Exit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 16, display: "flex", justifyContent: "flex-end", gap: 24, flexWrap: "wrap" }}>
            {[
              ["Total Invested", `₹${totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "neutral"],
              ["Holdings Value", `₹${totalHoldingsValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "neutral"],
              ["Unrealized P&L", `${unrealizedPnl >= 0 ? "+" : ""}₹${unrealizedPnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, unrealizedPnl >= 0 ? "pos" : "neg"],
            ].map(([k, v, cls]) => (
              <div key={k} style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 2 }}>{k}</div>
                <div className={cls} style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedStock && (
        <BuySellModal
          stock={selectedStock}
          defaultType={tradeType}
          onClose={() => setSelectedStock(null)}
          onTradeSuccess={loadData}
        />
      )}

      <CreatePortfolioModal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); loadData(); }} />

      {/* Reset Portfolio Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1.2rem", color: "var(--accent-coral)" }}>⚠️</span>
                <h3 style={{ margin: 0, fontWeight: 700 }}>Reset Portfolio: {currentPortfolio?.name}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowResetModal(false)}>✕</button>
            </div>

            <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 16 }}>
              This will close all open holdings and wipe trades <strong>only for "{currentPortfolio?.name}"</strong>. Other portfolios will not be affected.
            </p>

            <form onSubmit={handleResetSubmit}>
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 6 }}>
                  New Initial Capital (₹)
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={resetBalance}
                  onChange={(e) => setResetBalance(e.target.value)}
                  min="1000"
                  step="1000"
                  required
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowResetModal(false)}
                  disabled={resetting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: "var(--accent-coral)", color: "#fff" }}
                  disabled={resetting}
                >
                  {resetting ? "Resetting…" : "Confirm Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
