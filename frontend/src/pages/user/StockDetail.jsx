import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import AppLayout from "../../components/AppLayout.jsx";
import BuySellModal from "../../components/BuySellModal.jsx";
import { stocksAPI, alertsAPI, portfoliosAPI } from "../../api/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMockStocks, getMockHistory } from "../../data/mockStocks.js";

const PERIOD_DAYS = { "1W": 7, "1M": 30, "3M": 90, "1Y": 365 };

export default function StockDetail() {
  const { symbol } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { portfolios, currentPortfolio, addToWatchlist, removeFromWatchlist, watchlist, showNotification } = useAuth();

  // Active Portfolio for this stock detail view
  const urlPortId = searchParams.get("portfolioId");
  const [selectedPortId, setSelectedPortId] = useState(
    urlPortId ? Number(urlPortId) : (currentPortfolio?.id || portfolios[0]?.id || null)
  );

  // Sync state with URL or loaded portfolios
  useEffect(() => {
    if (urlPortId) {
      setSelectedPortId(Number(urlPortId));
    } else if (!selectedPortId && (currentPortfolio?.id || portfolios[0]?.id)) {
      const defaultId = currentPortfolio?.id || portfolios[0]?.id;
      setSelectedPortId(defaultId);
      setSearchParams({ portfolioId: String(defaultId) }, { replace: true });
    }
  }, [urlPortId, currentPortfolio, portfolios, selectedPortId, setSearchParams]);

  const targetPortfolio = useMemo(() => {
    return portfolios.find((p) => p.id === Number(selectedPortId)) || currentPortfolio || portfolios[0] || null;
  }, [portfolios, selectedPortId, currentPortfolio]);

  const [stock,         setStock]         = useState(null);
  const [chart,         setChart]         = useState([]);
  const [news,          setNews]          = useState([]);
  const [period,        setPeriod]        = useState("3M");
  const [tradeType,     setTradeType]     = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState("chart"); // chart | news | alerts

  // Portfolio-scoped data
  const [currentHolding, setCurrentHolding] = useState(null);
  const [orderHistory,   setOrderHistory]   = useState([]);
  const [loadingScoped,  setLoadingScoped]  = useState(false);

  // Alert form
  const [alerts,        setAlerts]        = useState([]);
  const [alertPrice,    setAlertPrice]    = useState("");
  const [alertCond,     setAlertCond]     = useState("above");
  const [alertSaving,   setAlertSaving]   = useState(false);

  const symUpper = symbol?.toUpperCase() || "";
  const inWatchlist = watchlist.includes(symUpper);

  // Handle switching target portfolio
  const handlePortfolioChange = (newId) => {
    const idNum = Number(newId);
    setSelectedPortId(idNum);
    setSearchParams({ portfolioId: String(idNum) });
  };

  // Load global stock quote & market telemetry
  const loadStockData = useCallback(async () => {
    if (!symUpper) return;
    try {
      const [s, h, n] = await Promise.all([
        stocksAPI.one(symUpper),
        stocksAPI.history(symUpper, period),
        stocksAPI.news(symUpper).catch(() => []),
      ]);
      setStock(s);
      setChart(h || []);
      setNews(n || []);
    } catch {
      const all = getMockStocks();
      const s = all.find((x) => x.symbol === symUpper) || all[0];
      setStock(s);
      setChart(getMockHistory(symUpper, period));
    }
  }, [symUpper, period]);

  // Load portfolio-scoped holding & order history
  const loadPortfolioData = useCallback(async () => {
    if (!selectedPortId || !symUpper) return;
    setLoadingScoped(true);
    try {
      const [holdings, trades] = await Promise.all([
        portfoliosAPI.holdings(selectedPortId).catch(() => []),
        portfoliosAPI.trades(selectedPortId, symUpper).catch(() => []),
      ]);

      const foundHolding = (holdings || []).find(
        (h) => h.symbol?.toUpperCase() === symUpper
      );
      setCurrentHolding(foundHolding || null);
      setOrderHistory(Array.isArray(trades) ? trades : []);
    } catch (err) {
      console.error("Failed to load portfolio-scoped stock telemetry:", err);
    } finally {
      setLoadingScoped(false);
    }
  }, [selectedPortId, symUpper]);

  // Load everything on mount or when stock/portfolio changes
  useEffect(() => {
    setLoading(true);
    Promise.all([loadStockData(), loadPortfolioData()]).finally(() => setLoading(false));
  }, [loadStockData, loadPortfolioData]);

  // Reload chart on timeframe period change
  useEffect(() => {
    if (!symUpper) return;
    stocksAPI
      .history(symUpper, period)
      .then((h) => setChart(h || []))
      .catch(() => setChart(getMockHistory(symUpper, period)));
  }, [symUpper, period]);

  // Alerts
  useEffect(() => {
    if (!symUpper) return;
    alertsAPI
      .list()
      .then((all) => setAlerts((all || []).filter((a) => a.symbol === symUpper)))
      .catch(() => {});
  }, [symUpper]);

  const createAlert = async () => {
    if (!alertPrice) return;
    setAlertSaving(true);
    try {
      const a = await alertsAPI.create(symUpper, stock?.name || symUpper, parseFloat(alertPrice), alertCond);
      setAlerts((prev) => [a, ...prev]);
      setAlertPrice("");
      showNotification(`Alert set: ${symUpper} ${alertCond} ₹${alertPrice}`, "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
    setAlertSaving(false);
  };

  const deleteAlert = async (id) => {
    await alertsAPI.delete(id);
    setAlerts((prev) => prev.filter((a) => (a.id || a._id) !== id));
    showNotification("Alert deleted", "info");
  };

  // Timestamp formatting
  const formatOrderTimestamp = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const datePart = d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timePart = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart}, ${timePart}`;
  };

  // Calculated Portfolio Analytics for this Stock
  const stats = useMemo(() => {
    const buyOrders = orderHistory.filter((t) => t.type === "BUY");
    const sellOrders = orderHistory.filter((t) => t.type === "SELL");

    const totalBuyQty = buyOrders.reduce((sum, t) => sum + (Number(t.qty) || 0), 0);
    const totalSellQty = sellOrders.reduce((sum, t) => sum + (Number(t.qty) || 0), 0);

    const totalBuyAmount = buyOrders.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const totalSellAmount = sellOrders.reduce((sum, t) => sum + (Number(t.total) || 0), 0);

    const weightedAvgBuy = totalBuyQty > 0 ? totalBuyAmount / totalBuyQty : 0;
    const weightedAvgSell = totalSellQty > 0 ? totalSellAmount / totalSellQty : 0;

    const totalRealizedPnl = sellOrders.reduce((sum, t) => sum + (Number(t.realizedPnl) || 0), 0);

    // Current position calculations
    const currentPrice = Number(stock?.price || 0);
    const hasHolding = currentHolding && currentHolding.qty > 0;
    const holdingQty = hasHolding ? Number(currentHolding.qty) : 0;
    const holdingAvgPrice = hasHolding ? Number(currentHolding.avgPrice) : 0;
    const investedVal = holdingQty * holdingAvgPrice;
    const currentVal = holdingQty * currentPrice;
    const unrealizedPnl = currentVal - investedVal;
    const unrealizedPct = holdingAvgPrice > 0 ? ((currentPrice - holdingAvgPrice) / holdingAvgPrice) * 100 : 0;

    const totalNetPnl = totalRealizedPnl + (hasHolding ? unrealizedPnl : 0);

    const winningTrades = sellOrders.filter((t) => (Number(t.realizedPnl) || 0) > 0).length;
    const losingTrades = sellOrders.filter((t) => (Number(t.realizedPnl) || 0) < 0).length;
    const winRate = sellOrders.length > 0 ? ((winningTrades / sellOrders.length) * 100).toFixed(1) : null;

    const firstTrade = orderHistory.length > 0 ? orderHistory[orderHistory.length - 1] : null;
    const lastTrade = orderHistory.length > 0 ? orderHistory[0] : null;

    return {
      totalOrders: orderHistory.length,
      buyOrdersCount: buyOrders.length,
      sellOrdersCount: sellOrders.length,
      totalBuyQty,
      totalSellQty,
      totalBuyAmount,
      totalSellAmount,
      weightedAvgBuy,
      weightedAvgSell,
      totalRealizedPnl,
      hasHolding,
      holdingQty,
      holdingAvgPrice,
      investedVal,
      currentVal,
      unrealizedPnl,
      unrealizedPct,
      totalNetPnl,
      winningTrades,
      losingTrades,
      winRate,
      firstTrade,
      lastTrade,
    };
  }, [orderHistory, currentHolding, stock]);

  if (loading || !stock) {
    return (
      <AppLayout title="Stock Detail">
        <div className="page-body" style={{ paddingTop: 40, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Loading {symbol} quotes and telemetry…
          </div>
        </div>
      </AppLayout>
    );
  }

  const priceChange = chart.length > 1
    ? (chart[chart.length - 1].close || chart[chart.length - 1].value) - (chart[0].close || chart[0].value)
    : 0;
  const pctChange = chart.length > 1 && (chart[0].close || chart[0].value) > 0
    ? (priceChange / (chart[0].close || chart[0].value)) * 100
    : 0;
  const chartColor = pctChange >= 0 ? "var(--accent-green)" : "var(--accent-coral)";

  return (
    <AppLayout title={`${stock.symbol} — ${stock.name}`}>
      <div className="page-body" style={{ paddingTop: 16 }}>

        {/* Top Breadcrumb & Portfolio Context Ribbon */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 18,
            padding: "12px 18px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {/* Back button & Stock Name */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="btn-pill btn-pill-ghost"
              style={{ padding: "6px 14px", fontSize: "0.78rem" }}
              onClick={() => window.close() || navigate("/portfolio")}
            >
              ← Back
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem", color: "var(--text-primary)" }}>
                {stock.symbol}
              </span>
              {stock.sector && <span className="pill-badge pill-badge-blue">{stock.sector}</span>}
            </div>
          </div>

          {/* Portfolio Selector Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                Active Portfolio:
              </span>
              <select
                className="form-input"
                value={selectedPortId || ""}
                onChange={(e) => handlePortfolioChange(e.target.value)}
                style={{
                  width: "auto",
                  padding: "6px 14px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-elevated)",
                }}
              >
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    💼 {p.name} {p.isDefault ? "(Default)" : ""} · Cash: ₹{Number(p.cashBalance || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </option>
                ))}
              </select>
            </div>

            {/* Watchlist Toggle Button */}
            <button
              className="btn-pill btn-pill-ghost"
              style={{
                padding: "6px 14px",
                fontSize: "0.78rem",
                color: inWatchlist ? "var(--accent-gold)" : "var(--text-secondary)",
                borderColor: inWatchlist ? "var(--accent-gold)" : "var(--border)",
              }}
              onClick={() => (inWatchlist ? removeFromWatchlist(symUpper, selectedPortId) : addToWatchlist(symUpper, selectedPortId))}
            >
              {inWatchlist ? "★ Watchlisted" : "☆ Add to Watchlist"}
            </button>
          </div>
        </div>

        {/* Live Market Hero Card */}
        <div className={`card ${stock.changePercent >= 0 ? "card-accent-green" : "card-accent-coral"}`} style={{ marginBottom: 18, padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: 4 }}>
                {stock.name} · {stock.exchange || "NSE"}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  ₹{Number(stock.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`badge-pill ${stock.changePercent >= 0 ? "badge-pill-green" : "badge-pill-coral"}`} style={{ fontSize: "0.9rem", padding: "4px 10px" }}>
                  {stock.changePercent >= 0 ? "▲ +" : "▼ "}{Math.abs(stock.changePercent ?? 0).toFixed(2)}% (₹{Math.abs(stock.change ?? 0).toFixed(2)})
                </span>
              </div>
            </div>

            {/* Quick Metrics & Trade Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--text-muted)", textAlign: "right" }}>
                <div>24h High: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>₹{stock.high?.toFixed(2) || "—"}</span></div>
                <div style={{ marginTop: 2 }}>24h Low: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>₹{stock.low?.toFixed(2) || "—"}</span></div>
                <div style={{ marginTop: 2 }}>Volume: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{stock.volume || "—"}</span></div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-pill-green"
                  style={{ padding: "8px 20px", fontSize: "0.84rem", fontWeight: 700 }}
                  onClick={() => setTradeType("BUY")}
                >
                  ▲ Buy {stock.symbol}
                </button>
                {stats.hasHolding && (
                  <button
                    className="btn-pill-coral"
                    style={{ padding: "8px 20px", fontSize: "0.84rem", fontWeight: 700 }}
                    onClick={() => setTradeType("SELL")}
                  >
                    ▼ Exit Position
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Position Status Section (Holding vs No Position) */}
        <div style={{ marginBottom: 20 }}>
          {stats.hasHolding ? (
            <div className="card card-accent-gold" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)", margin: 0 }}>
                    💼 Open Position in {targetPortfolio?.name || "Selected Portfolio"}
                  </h3>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                    Authoritative aggregate position currently active in this portfolio
                  </div>
                </div>
                <span className={`badge-pill ${stats.unrealizedPnl >= 0 ? "badge-pill-green" : "badge-pill-coral"}`}>
                  {stats.unrealizedPnl >= 0 ? "▲ +" : "▼ "}{Math.abs(stats.unrealizedPct).toFixed(2)}% Return
                </span>
              </div>

              {/* Position KPI Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
                <div style={{ background: "var(--bg-elevated)", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 4 }}>Position Qty</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    {stats.holdingQty} shares
                  </div>
                </div>

                <div style={{ background: "var(--bg-elevated)", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 4 }}>Avg Buy Price</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    ₹{stats.holdingAvgPrice.toFixed(2)}
                  </div>
                </div>

                <div style={{ background: "var(--bg-elevated)", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 4 }}>Invested Value</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    ₹{stats.investedVal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div style={{ background: "var(--bg-elevated)", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 4 }}>Current Market Value</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    ₹{stats.currentVal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div style={{ background: "var(--bg-elevated)", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 4 }}>Unrealized P&L</div>
                  <div className={stats.unrealizedPnl >= 0 ? "pos" : "neg"} style={{ fontFamily: "var(--font-mono)", fontSize: "1.15rem", fontWeight: 800 }}>
                    {stats.unrealizedPnl >= 0 ? "+" : ""}₹{stats.unrealizedPnl.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="card"
              style={{
                padding: "20px 24px",
                borderLeft: "3px solid var(--accent-cyan)",
                background: "var(--bg-card)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: "1.6rem" }}>💼</span>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
                      No Current Position in {targetPortfolio?.name || "Selected Portfolio"}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
                      You do not currently hold open shares of {stock.symbol} in this portfolio. All historical transactions and performance statistics remain preserved below.
                    </div>
                  </div>
                </div>
                <button
                  className="btn-pill btn-pill-gold"
                  style={{ padding: "8px 18px", fontSize: "0.82rem" }}
                  onClick={() => setTradeType("BUY")}
                >
                  + Buy {stock.symbol}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio-Scoped Trade Statistics & Performance Matrix */}
        <div className="card card-accent-blue" style={{ marginBottom: 20, padding: "20px 24px" }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)", margin: 0 }}>
              📊 Trading Analysis & Historical Performance
            </h3>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
              Comprehensive trade telemetry for {stock.symbol} exclusively within <strong>{targetPortfolio?.name || "Selected Portfolio"}</strong>
            </div>
          </div>

          <div className="grid-4" style={{ gap: 12 }}>
            <div style={{ background: "var(--bg-elevated)", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>Total Executed Orders</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)", marginTop: 4 }}>
                {stats.totalOrders}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: 2 }}>
                {stats.buyOrdersCount} Buys · {stats.sellOrdersCount} Sells
              </div>
            </div>

            <div style={{ background: "var(--bg-elevated)", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>Volume (Bought / Sold)</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)", marginTop: 4 }}>
                {stats.totalBuyQty} / {stats.totalSellQty}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: 2 }}>
                Bought: ₹{stats.totalBuyAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
            </div>

            <div style={{ background: "var(--bg-elevated)", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>Realized P&L (Sells)</div>
              <div className={stats.totalRealizedPnl >= 0 ? "pos" : "neg"} style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800, marginTop: 4 }}>
                {stats.totalRealizedPnl >= 0 ? "+" : ""}₹{stats.totalRealizedPnl.toFixed(2)}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: 2 }}>
                {stats.sellOrdersCount > 0 ? `${stats.winningTrades} wins / ${stats.losingTrades} losses` : "No exits executed yet"}
              </div>
            </div>

            <div style={{ background: "var(--bg-elevated)", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>Combined Net P&L</div>
              <div className={stats.totalNetPnl >= 0 ? "pos" : "neg"} style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800, marginTop: 4 }}>
                {stats.totalNetPnl >= 0 ? "+" : ""}₹{stats.totalNetPnl.toFixed(2)}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: 2 }}>
                Win Rate: {stats.winRate ? `${stats.winRate}%` : "—"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: 12, fontSize: "0.74rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            <div>
              Weighted Avg Buy: <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>₹{stats.weightedAvgBuy > 0 ? stats.weightedAvgBuy.toFixed(2) : "—"}</span>
              {"  ·  "}
              Weighted Avg Sell: <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>₹{stats.weightedAvgSell > 0 ? stats.weightedAvgSell.toFixed(2) : "—"}</span>
            </div>
            <div>
              First Trade: <span style={{ color: "var(--text-primary)" }}>{stats.firstTrade ? formatOrderTimestamp(stats.firstTrade.createdAt) : "—"}</span>
              {"  ·  "}
              Latest Trade: <span style={{ color: "var(--text-primary)" }}>{stats.lastTrade ? formatOrderTimestamp(stats.lastTrade.createdAt) : "—"}</span>
            </div>
          </div>
        </div>

        {/* Main Detail Tabs (Chart, News, Alerts) */}
        <div className="tab-nav" style={{ marginBottom: 18 }}>
          {[
            { id: "chart", label: "📈 Price Chart & Execution Overlay" },
            { id: "news", label: `📰 Market News (${news.length})` },
            { id: "alerts", label: `🔔 Price Alerts (${alerts.length})` },
          ].map((t) => (
            <button
              key={t.id}
              className={`tab-btn ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* CHART TAB */}
        {tab === "chart" && (
          <div className="card card-accent-blue" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h3 className="card-title">{stock.symbol} Market Price Trajectory</h3>
                <div className="card-subtitle">
                  Historical candles with your {targetPortfolio?.name} execution points
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {Object.keys(PERIOD_DAYS).map((p) => (
                  <button
                    key={p}
                    className={period === p ? "btn-pill-gold" : "btn-pill-ghost"}
                    style={{ padding: "4px 12px", fontSize: "0.74rem" }}
                    onClick={() => setPeriod(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="chart-container" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stockDetailGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" tickFormatter={(d) => d?.slice(5) || d} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={(v) => `₹${v}`} width={65} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12, boxShadow: "var(--shadow-md)" }}
                    formatter={(v) => [`₹${Number(v).toFixed(2)}`, "Market Price"]}
                  />
                  <Area type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2.5} fill="url(#stockDetailGrad)" dot={false} activeDot={{ r: 5, fill: chartColor }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* NEWS TAB */}
        {tab === "news" && (
          <div className="card card-accent-blue" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 800 }}>Latest Market News</h3>
            </div>
            {news.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📰</div><p>No recent news found for {symbol}.</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {news.map((n, i) => (
                  <a
                    key={i}
                    href={n.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block", padding: "16px 0",
                      borderBottom: i < news.length - 1 ? "1px solid var(--border)" : "none",
                      textDecoration: "none", transition: "var(--transition)",
                    }}
                  >
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 6, lineHeight: 1.5 }}>
                      {n.title}
                    </div>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--accent-gold)", fontWeight: 700 }}>
                        {n.publisher}
                      </span>
                      {n.time && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>{new Date(n.time).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-dim)", marginLeft: "auto" }}>↗ Open Article</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ALERTS TAB */}
        {tab === "alerts" && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div>
                <div className="card-title">Price Target Alerts</div>
                <div className="card-subtitle">Receive instant notification when {symbol} crosses your trigger threshold</div>
              </div>
            </div>

            {/* Create alert box */}
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: 20 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 14 }}>
                Current market price: <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>₹{stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div className="input-group" style={{ minWidth: 140 }}>
                  <label className="input-label">Condition</label>
                  <select value={alertCond} onChange={(e) => setAlertCond(e.target.value)}>
                    <option value="above">Price rises ABOVE</option>
                    <option value="below">Price drops BELOW</option>
                  </select>
                </div>
                <div className="input-group" style={{ minWidth: 160 }}>
                  <label className="input-label">Target Price (₹)</label>
                  <input
                    type="number"
                    value={alertPrice}
                    onChange={(e) => setAlertPrice(e.target.value)}
                    placeholder={stock.price.toFixed(2)}
                    min="0.01"
                    step="0.05"
                  />
                </div>
                <button className="btn-pill-gold" onClick={createAlert} disabled={alertSaving || !alertPrice}>
                  {alertSaving ? "Setting…" : "＋ Set Alert"}
                </button>
              </div>
            </div>

            {/* Alert list */}
            {alerts.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🔔</div><p>No alerts set for {symbol}. Create your first alert above.</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {alerts.map((a) => {
                  const alertId = a.id || a._id;
                  return (
                    <div key={alertId} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 18px", borderRadius: "var(--radius-md)",
                      background: a.triggered ? "rgba(133,227,158,0.06)" : "var(--bg-elevated)",
                      border: a.triggered ? "1px solid rgba(133,227,158,0.25)" : "1px solid var(--border)",
                      flexWrap: "wrap", gap: 12,
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 700 }}>
                            {a.condition === "above" ? "▲" : "▼"} ₹{Number(a.targetPrice).toLocaleString("en-IN")}
                          </span>
                          <span className={`badge-pill ${a.triggered ? "badge-pill-green" : "badge-pill-gold"}`}>
                            {a.triggered ? "✓ Triggered" : "● Active"}
                          </span>
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          {a.triggered
                            ? `Hit ₹${Number(a.triggeredPrice || 0).toLocaleString("en-IN")} on ${new Date(a.triggeredAt).toLocaleDateString("en-IN")}`
                            : `Alert triggers when price goes ${a.condition} ₹${Number(a.targetPrice).toLocaleString("en-IN")}`}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {a.triggered && (
                          <button
                            className="btn-pill-ghost"
                            style={{ padding: "4px 12px", fontSize: "0.72rem" }}
                            onClick={() => alertsAPI.reset(alertId).then(() => setAlerts((prev) => prev.map((x) => ((x.id || x._id) === alertId ? { ...x, triggered: false, active: true } : x))))}
                          >
                            ↺ Reset
                          </button>
                        )}
                        <button
                          className="btn-pill-ghost"
                          style={{ padding: "4px 12px", fontSize: "0.72rem", color: "var(--accent-coral)", borderColor: "rgba(255,94,77,0.3)" }}
                          onClick={() => deleteAlert(alertId)}
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Complete Order History Table Card */}
        <div className="card card-accent-gold" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)", margin: 0 }}>
                📜 {stock.symbol} Executed Order History
              </h3>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                All immutable historical trade records in <strong>{targetPortfolio?.name || "Selected Portfolio"}</strong> ({orderHistory.length} total)
              </div>
            </div>

            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--accent-gold)", fontWeight: 600 }}>
              {orderHistory.length} {orderHistory.length === 1 ? "order record" : "order records"}
            </span>
          </div>

          {loadingScoped ? (
            <div style={{ textAlign: "center", padding: "30px 0", fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Loading trade ledger for {stock.symbol}…
            </div>
          ) : orderHistory.length === 0 ? (
            <div className="empty-state" style={{ padding: "30px 0" }}>
              <div className="empty-icon">📋</div>
              <p>No historical trades recorded for {stock.symbol} in {targetPortfolio?.name || "this portfolio"}.</p>
              <button className="btn-pill btn-pill-gold" style={{ marginTop: 10 }} onClick={() => setTradeType("BUY")}>
                Execute First Buy Order →
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Execution Price</th>
                    <th>Total Value</th>
                    <th>Realized P&L</th>
                    <th>Status</th>
                    <th>Order ID</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {orderHistory.map((o) => (
                    <tr key={o.id || o._id || o.symbol + o.createdAt}>
                      <td>
                        <span className={`badge-pill ${o.type === "BUY" ? "badge-pill-green" : "badge-pill-coral"}`}>
                          {o.type === "BUY" ? "▲ BUY" : "▼ SELL"}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        {o.qty} {o.qty === 1 ? "share" : "shares"}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>
                        ₹{Number(o.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
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
                        {o.type === "SELL" && o.realizedPnl != null
                          ? `${Number(o.realizedPnl) >= 0 ? "+" : ""}₹${Number(o.realizedPnl).toFixed(2)}`
                          : "—"}
                      </td>
                      <td>
                        <span className="badge-pill badge-pill-green">
                          ✓ {o.status || "EXECUTED"}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        #{o.id || o._id || "—"}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {formatOrderTimestamp(o.createdAt || o.executedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {tradeType && (
        <BuySellModal
          stock={stock}
          defaultType={tradeType}
          onClose={() => setTradeType(null)}
          onTradeSuccess={() => {
            loadStockData();
            loadPortfolioData();
          }}
        />
      )}
    </AppLayout>
  );
}
