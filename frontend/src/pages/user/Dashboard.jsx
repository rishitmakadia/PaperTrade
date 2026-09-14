import React, { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { stocksAPI, dashboardAPI, portfolioAPI } from "../../api/index.js";
import { getMockStocks } from "../../data/mockStocks.js";
import CreatePortfolioModal from "../../components/CreatePortfolioModal.jsx";

const SECTOR_COLORS = {
  Banking: "#6ba4ff", IT: "#85e39e", Energy: "#f6c944", Auto: "#ff5e4d",
  Pharma: "#a78bfa", Telecom: "#f43f5e", NBFC: "#38bdf8", Infrastructure: "#10b981",
  Consumer: "#fb923c", FMCG: "#f59e0b", Other: "#94a3b8",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-bright)",
      borderRadius: "var(--radius-md)",
      padding: "10px 14px",
      boxShadow: "var(--shadow-card)",
      fontFamily: "var(--font-mono)"
    }}>
      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "0.95rem", color: "var(--accent-green)", fontWeight: 700 }}>
        ₹{payload[0]?.value?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user, currentPortfolio, setCurrentPortfolio, portfolios } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [dashboardData,   setDashboardData]   = useState(null);
  const [stocks,          setStocks]          = useState([]);
  const [indices,         setIndices]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [dash, sList, idxList] = await Promise.all([
        dashboardAPI.get().catch(() => null),
        stocksAPI.all().catch(() => []),
        stocksAPI.indices().catch(() => []),
      ]);
      setDashboardData(dash);
      setStocks(sList || []);
      setIndices(idxList || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 30000);
    return () => clearInterval(iv);
  }, [loadData]);

  // Derive metrics
  const overallCapital = dashboardData?.overallCapital ?? 0;
  const overallCash = dashboardData?.overallCash ?? 0;
  const overallNetWorth = dashboardData?.overallPortfolioValue ?? overallCapital;
  const overallInvested = dashboardData?.overallInvestedValue ?? 0;
  const overallRealizedPnl = dashboardData?.overallRealizedPnl ?? 0;
  const overallUnrealizedPnl = dashboardData?.overallUnrealizedPnl ?? 0;
  const overallTotalPnl = dashboardData?.overallTotalPnl ?? 0;
  const overallReturn = dashboardData?.overallReturnPercentage ?? 0;
  const aggregatedEquity = dashboardData?.aggregatedEquityCurve ?? [];
  const recentTrades = dashboardData?.recentTrades ?? [];
  const portfolioSummaries = dashboardData?.portfolioSummaries ?? portfolios;

  const gainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 4);
  const losers  = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 4);

  const displayIndices = indices.length > 0 ? indices : [
    { name: "NIFTY 50",   value: 22450.30, changePercent: 0.54 },
    { name: "SENSEX",     value: 73890.15, changePercent: 0.48 },
    { name: "NIFTY BANK", value: 47920.80, changePercent: 0.82 },
  ];

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <AppLayout title="Overall Dashboard">
      <div className="page-body">
        {/* Welcome Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)", fontWeight: 800 }}>
              Good {new Date().getHours() < 12 ? "Morning" : "Afternoon"}, {user?.name?.split(" ")[0] || "Trader"} 👋
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 4, fontFamily: "var(--font-mono)" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              {" · "}
              <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>
                {portfolioSummaries.length} Portfolio{portfolioSummaries.length === 1 ? "" : "s"} Managed
              </span>
              {" · Real-Time Market Feed"}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn-pill"
              onClick={() => setShowCreateModal(true)}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--accent-cyan)",
                color: "var(--accent-cyan)",
              }}
            >
              + New Portfolio
            </button>
            <button className="btn-pill btn-pill-gold" onClick={() => navigate("/market")}>
              Trade Stocks →
            </button>
          </div>
        </div>

        {/* Indices Strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
          {displayIndices.map((idx) => (
            <div key={idx.name} className="card card-accent-blue" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  {idx.name}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.18rem", fontWeight: 800, marginTop: 2 }}>
                  {typeof idx.value === "number" ? idx.value.toLocaleString("en-IN") : idx.value}
                </div>
              </div>
              {typeof idx.changePercent === "number" && (
                <span className={`pill-badge ${idx.changePercent >= 0 ? "pill-badge-green" : "pill-badge-coral"}`}>
                  {idx.changePercent >= 0 ? "▲" : "▼"} {Math.abs(idx.changePercent).toFixed(2)}%
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 4 Isolated Color-Coded Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16, marginBottom: 24 }}>
          {/* Card 1: Combined Net Worth (Purple Accent) */}
          <div className="card card-accent-purple" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                Combined Net Worth
              </span>
              <span className="pill-badge pill-badge-purple">All Portfolios</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
              ₹{fmt(overallNetWorth)}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--text-secondary)" }}>
              Invested: ₹{fmt(overallInvested)} · Capital: ₹{fmt(overallCapital)}
            </div>
          </div>

          {/* Card 2: Total Combined P&L (Dynamic Green / Coral Accent) */}
          <div className={`card ${overallTotalPnl >= 0 ? "card-accent-green" : "card-accent-coral"}`} style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                Combined Total P&L
              </span>
              <span className={`pill-badge ${overallTotalPnl >= 0 ? "pill-badge-green" : "pill-badge-coral"}`}>
                {overallTotalPnl >= 0 ? "+" : ""}{overallReturn.toFixed(2)}%
              </span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", fontWeight: 800, color: overallTotalPnl >= 0 ? "var(--accent-green)" : "var(--accent-coral)", marginBottom: 4 }}>
              {overallTotalPnl >= 0 ? "+" : ""}₹{fmt(overallTotalPnl)}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--text-secondary)" }}>
              Realized: ₹{fmt(overallRealizedPnl)} · Unrealized: ₹{fmt(overallUnrealizedPnl)}
            </div>
          </div>

          {/* Card 3: Total Portfolios & Positions (Blue Accent) */}
          <div className="card card-accent-blue" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                Portfolios & Holdings
              </span>
              <span className="pill-badge pill-badge-blue">Diversity</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", fontWeight: 800, color: "var(--accent-cyan)", marginBottom: 4 }}>
              {portfolioSummaries.length} Portfolios
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--text-secondary)" }}>
              {dashboardData?.totalHoldingsCount ?? 0} active stock positions held
            </div>
          </div>

          {/* Card 4: Total Liquid Cash (Gold Accent) */}
          <div className="card card-accent-gold" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                Combined Cash
              </span>
              <span className="pill-badge pill-badge-gold">Liquid</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", fontWeight: 800, color: "var(--accent-gold)", marginBottom: 4 }}>
              ₹{fmt(overallCash)}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--text-secondary)" }}>
              Total unallocated trading funds
            </div>
          </div>
        </div>

        {/* Section: My Portfolios Cards Grid */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800 }}>
                My Portfolios ({portfolioSummaries.length})
              </h2>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Each portfolio is an independent trading entity with dedicated cash balance and isolated holdings.
              </p>
            </div>
            <button
              className="btn-pill"
              onClick={() => setShowCreateModal(true)}
              style={{
                fontSize: "0.78rem",
                background: "rgba(0, 212, 255, 0.1)",
                border: "1px solid var(--accent-cyan)",
                color: "var(--accent-cyan)",
              }}
            >
              + Create Portfolio
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {portfolioSummaries.map((p) => {
              const isCurrent = p.id === currentPortfolio?.id;
              const pnl = p.totalPnl ?? 0;
              const isPos = pnl >= 0;

              return (
                <div
                  key={p.id}
                  className={`card ${isCurrent ? "card-accent-blue" : ""}`}
                  style={{
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    background: isCurrent ? "var(--bg-surface)" : "var(--bg-card)",
                    border: isCurrent ? "2px solid var(--accent-cyan)" : "1px solid var(--border)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: "1.1rem" }}>💼</span>
                          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.08rem", fontWeight: 700 }}>
                            {p.name}
                          </h3>
                        </div>
                        {p.description && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 3 }}>
                            {p.description}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {p.isDefault && (
                          <span className="pill-badge pill-badge-gold" style={{ fontSize: "0.68rem" }}>
                            Default
                          </span>
                        )}
                        {isCurrent && (
                          <span className="pill-badge pill-badge-blue" style={{ fontSize: "0.68rem" }}>
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div
                      className="card-inner"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                        padding: "12px",
                        marginBottom: 16,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          PORTFOLIO VALUE
                        </div>
                        <div style={{ fontSize: "1.05rem", fontWeight: 800, fontFamily: "var(--font-display)", marginTop: 2 }}>
                          ₹{fmt(p.portfolioValue)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          TOTAL P&L
                        </div>
                        <div
                          style={{
                            fontSize: "1.05rem",
                            fontWeight: 800,
                            fontFamily: "var(--font-mono)",
                            color: isPos ? "var(--accent-green)" : "var(--accent-coral)",
                            marginTop: 2,
                          }}
                        >
                          {isPos ? "+" : ""}₹{fmt(pnl)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          CASH BALANCE
                        </div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, fontFamily: "var(--font-mono)", marginTop: 2 }}>
                          ₹{fmt(p.cashBalance)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          RETURN
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            color: isPos ? "var(--accent-green)" : "var(--accent-coral)",
                            marginTop: 2,
                          }}
                        >
                          {isPos ? "+" : ""}{(p.returnPercentage ?? 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn-pill"
                      style={{
                        flex: 1,
                        fontSize: "0.78rem",
                        background: isCurrent ? "var(--accent-cyan)" : "var(--bg-elevated)",
                        color: isCurrent ? "#000" : "var(--text-primary)",
                        fontWeight: 700,
                        border: isCurrent ? "none" : "1px solid var(--border)",
                      }}
                      onClick={() => {
                        setCurrentPortfolio(p);
                        navigate("/portfolio");
                      }}
                    >
                      View Details →
                    </button>
                    {!isCurrent && (
                      <button
                        className="btn-pill"
                        style={{
                          fontSize: "0.78rem",
                          background: "var(--bg-card-inner)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border)",
                        }}
                        onClick={() => setCurrentPortfolio(p)}
                        title="Set as current active trading portfolio"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick Add Card */}
            <div
              onClick={() => setShowCreateModal(true)}
              style={{
                minHeight: 200,
                border: "2px dashed var(--border-bright)",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                cursor: "pointer",
                background: "rgba(255,255,255,0.01)",
                transition: "all 0.2s ease",
                padding: 20,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-cyan)";
                e.currentTarget.style.background = "rgba(0, 212, 255, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-bright)";
                e.currentTarget.style.background = "rgba(255,255,255,0.01)";
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(0, 212, 255, 0.1)",
                  color: "var(--accent-cyan)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                }}
              >
                +
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Create New Portfolio</div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", textAlign: "center" }}>
                Allocate fresh capital & track a separate strategy
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Market Movers Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, marginBottom: 24 }}>
          {/* Aggregated Equity Trajectory */}
          <div className="card card-accent-blue" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 800 }}>Combined Equity Trajectory</h3>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Aggregated wealth progression across all portfolios
                </p>
              </div>
              <span className="pill-badge pill-badge-green">
                {overallTotalPnl >= 0 ? "+" : ""}{overallReturn.toFixed(2)}%
              </span>
            </div>

            <div style={{ height: 210, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aggregatedEquity} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aggEquityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isDark ? "#85e39e" : "#10b981"} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={isDark ? "#85e39e" : "#10b981"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    tickLine={false}
                    axisLine={false}
                    interval={5}
                    tickFormatter={(d) => d?.slice(5) || d}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={isDark ? "#85e39e" : "#10b981"}
                    strokeWidth={2.5}
                    fill="url(#aggEquityGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Gainers & Losers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Gainers */}
            <div className="card card-accent-green" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>📈 Gainers</span>
                <span className="pill-badge pill-badge-green" style={{ fontSize: "0.68rem" }}>Bullish</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {gainers.map((s) => (
                  <div
                    key={s.symbol}
                    onClick={() => navigate(`/stocks/${s.symbol}`)}
                    className="card-inner-green"
                    style={{ padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.82rem" }}>{s.symbol}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{s.sector || "NSE"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>₹{s.price?.toFixed(2)}</div>
                      <div className="pos" style={{ fontSize: "0.72rem", fontWeight: 700 }}>+{s.changePercent?.toFixed(2)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Losers */}
            <div className="card card-accent-coral" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>📉 Losers</span>
                <span className="pill-badge pill-badge-coral" style={{ fontSize: "0.68rem" }}>Bearish</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {losers.map((s) => (
                  <div
                    key={s.symbol}
                    onClick={() => navigate(`/stocks/${s.symbol}`)}
                    className="card-inner-coral"
                    style={{ padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.82rem" }}>{s.symbol}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{s.sector || "NSE"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>₹{s.price?.toFixed(2)}</div>
                      <div className="neg" style={{ fontSize: "0.72rem", fontWeight: 700 }}>{s.changePercent?.toFixed(2)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trades Across All Portfolios */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 800 }}>
                Recent Multi-Portfolio Trades
              </h3>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Latest executed orders across all active portfolios
              </p>
            </div>
            <button className="btn-pill" onClick={() => navigate("/orders")} style={{ fontSize: "0.78rem" }}>
              View All Orders →
            </button>
          </div>

          {recentTrades.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: 6 }}>📋</div>
              <p style={{ fontSize: "0.85rem" }}>No trades executed across portfolios yet.</p>
            </div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Portfolio</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Realized P&L</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.slice(0, 8).map((t) => (
                    <tr key={t.id || t.symbol + t.createdAt}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{t.symbol}</div>
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
                          {t.portfolioName || "Portfolio"}
                        </span>
                      </td>
                      <td>
                        <span className={`pill-badge ${t.type === "BUY" ? "pill-badge-green" : "pill-badge-coral"}`}>
                          {t.type}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{t.qty}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>₹{Number(t.price).toFixed(2)}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>₹{Number(t.total).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                      <td
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          color: (t.realizedPnl ?? 0) >= 0 ? "var(--accent-green)" : "var(--accent-coral)",
                        }}
                      >
                        {(t.realizedPnl ?? 0) !== 0
                          ? `${(t.realizedPnl ?? 0) >= 0 ? "+" : ""}₹${Number(t.realizedPnl).toFixed(2)}`
                          : "—"}
                      </td>
                      <td>
                        <span className="pill-badge pill-badge-blue" style={{ fontSize: "0.7rem" }}>
                          {t.status || "EXECUTED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CreatePortfolioModal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); loadData(); }} />
    </AppLayout>
  );
}
