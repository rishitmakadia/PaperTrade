import React, { useState, useEffect, useCallback, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import AppLayout from "../../components/AppLayout.jsx";
import BuySellModal from "../../components/BuySellModal.jsx";
import { stocksAPI } from "../../api/index.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMockStocks, getMockHistory, searchMockStocks } from "../../data/mockStocks.js";
import { useTheme } from "../../context/ThemeContext.jsx";

const SECTORS = ["All", "Banking", "IT", "Energy", "Auto", "Pharma", "Consumer", "FMCG", "Telecom", "Infrastructure", "NBFC"];

export default function Market() {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [stocks,         setStocks]         = useState([]);
  const [remoteResults,  setRemoteResults]  = useState([]);
  const [search,         setSearch]         = useState("");
  const [selectedSector, setSelectedSector] = useState("All");
  const [selectedStock,  setSelectedStock]  = useState(null);
  const [modalStock,     setModalStock]     = useState(null);
  const [tradeType,      setTradeType]      = useState("BUY");
  const [chartData,      setChartData]      = useState([]);
  const [period,         setPeriod]         = useState("3M");
  const [loading,        setLoading]        = useState(true);
  const [chartLoading,   setChartLoading]   = useState(false);
  const [isSearching,    setIsSearching]    = useState(false);
  const [page,           setPage]           = useState(1);
  const pageSize = 5; // Show few stocks (5 per page) for a clean, focused view

  const intervalRef = useRef(null);

  const loadStocks = useCallback(async () => {
    try {
      const data = await stocksAPI.all();
      setStocks((prev) => {
        if (prev.length === 0) return data;
        const map = new Map();
        data.forEach((d) => map.set(d.symbol, d));
        prev.forEach((p) => {
          if (!map.has(p.symbol)) map.set(p.symbol, p);
        });
        return Array.from(map.values());
      });
      if (!selectedStock) setSelectedStock(data[0]);
    } catch (err) {
      console.error("Failed to load stocks:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStock]);

  useEffect(() => {
    setLoading(true);
    loadStocks();
    intervalRef.current = setInterval(loadStocks, 60000);
    return () => clearInterval(intervalRef.current);
  }, [loadStocks]);

  // Dynamic Remote Search on Yahoo Finance for Indian Equities
  const triggerRemoteSearch = useCallback(async (queryText) => {
    const trimmed = (queryText || "").trim();
    if (!trimmed) {
      setRemoteResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await stocksAPI.search(trimmed);
      if (Array.isArray(results) && results.length > 0) {
        setRemoteResults(results);
        setStocks((prev) => {
          const map = new Map();
          // First add existing stocks
          prev.forEach((item) => map.set(item.symbol.toUpperCase(), item));
          // Merge or update with fresh searched stock quotes
          results.forEach((item) => map.set(item.symbol.toUpperCase(), item));
          return Array.from(map.values());
        });
        if (results[0]) {
          setSelectedStock(results[0]);
        }
      } else {
        setRemoteResults([]);
      }
    } catch (err) {
      console.error("Dynamic stock search failed:", err);
      setRemoteResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search trigger
  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed) {
      setRemoteResults([]);
      return;
    }
    const timer = setTimeout(() => {
      triggerRemoteSearch(trimmed);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, triggerRemoteSearch]);

  // Load chart data when selected stock changes
  useEffect(() => {
    if (!selectedStock) return;
    setChartLoading(true);
    stocksAPI.history(selectedStock.symbol, period)
      .then(setChartData)
      .catch(() => setChartData(getMockHistory(selectedStock.symbol, period)))
      .finally(() => setChartLoading(false));
  }, [selectedStock?.symbol, period]);

  // Filter stocks - combining local inventory and active remote search results
  const filteredStocks = (() => {
    const query = search.trim().toUpperCase();
    if (!query) {
      return stocks.filter((s) =>
        selectedSector === "All" ||
        (s.sector && s.sector.toLowerCase() === selectedSector.toLowerCase())
      );
    }

    const combinedMap = new Map();

    // 1. Direct results returned by Yahoo Finance search
    remoteResults.forEach((s) => {
      if (s?.symbol) combinedMap.set(s.symbol.toUpperCase(), s);
    });

    // 2. Any stock in inventory matching ticker, name, or sector
    stocks.forEach((s) => {
      const matchesQuery =
        s.symbol.toUpperCase().includes(query) ||
        (s.name && s.name.toUpperCase().includes(query)) ||
        (s.companyName && s.companyName.toUpperCase().includes(query)) ||
        (s.sector && s.sector.toUpperCase().includes(query));
      if (matchesQuery) {
        combinedMap.set(s.symbol.toUpperCase(), s);
      }
    });

    let list = Array.from(combinedMap.values());
    if (selectedSector !== "All") {
      list = list.filter((s) => s.sector && s.sector.toLowerCase() === selectedSector.toLowerCase());
    }
    return list;
  })();

  // Pagination for "show few"
  const totalPages = Math.ceil(filteredStocks.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const displayedStocks = search.trim()
    ? filteredStocks // If searching, show all matching results
    : filteredStocks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenTrade = (stock, type, e) => {
    if (e) e.stopPropagation();
    setModalStock(stock);
    setTradeType(type);
  };

  const handleToggleWatchlist = (symbol, e) => {
    if (e) e.stopPropagation();
    if (watchlist.includes(symbol)) {
      removeFromWatchlist(symbol);
    } else {
      addToWatchlist(symbol);
    }
  };

  const activeStock = selectedStock
    ? (stocks.find((s) => s.symbol === selectedStock.symbol) || selectedStock)
    : displayedStocks[0];

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <AppLayout title="Market Overview">
      <div className="page-body" style={{ paddingTop: 18 }}>
        {/* Live Indian Market Telemetry Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 18px",
            borderRadius: "var(--radius-lg)",
            marginBottom: 20,
            background: "rgba(133,227,158,0.08)",
            border: "1px solid rgba(133,227,158,0.22)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.2rem" }}>🌐</span>
            <div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)", marginRight: 8 }}>
                LIVE NSE &amp; BSE DATA FEED
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                Streaming quotes from Yahoo Finance. You can also click ✏️ in the trade modal to enter custom execution prices.
              </span>
            </div>
          </div>
          <span className="badge-pill badge-pill-green" style={{ flexShrink: 0 }}>
            ● NSE LIVE
          </span>
        </div>

        {/* Search & Sector Toolbar */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "18px 20px",
            marginBottom: 22,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Search Input Bar with Remote Yahoo Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              triggerRemoteSearch(search);
            }}
            style={{ position: "relative", width: "100%" }}
          >
            <span
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "1.1rem",
                color: isSearching ? "var(--accent-cyan)" : "var(--text-muted)",
                pointerEvents: "none",
              }}
            >
              {isSearching ? "⏳" : "⌕"}
            </span>
            <input
              type="text"
              placeholder="Search Indian stocks by ticker or company name (e.g. RELIANCE, TCS, ZOMATO, TATAPOWER, ADANIENT, IRFC)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: "100%",
                padding: "12px 110px 12px 44px",
                borderRadius: "var(--radius-pill)",
                background: "var(--bg-elevated)",
                border: isSearching ? "1px solid var(--accent-cyan)" : "1px solid var(--border)",
                fontSize: "0.92rem",
                fontFamily: "var(--font-sans)",
                color: "var(--text-primary)",
                transition: "all 0.2s ease",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isSearching && (
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--accent-cyan)",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                  }}
                >
                  Searching…
                </span>
              )}
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setRemoteResults([]); }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    padding: "4px 8px",
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          {/* Sector Filter Chips */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", marginRight: 4, flexShrink: 0 }}>
              Sectors:
            </span>
            {SECTORS.map((sec) => {
              const isSelected = selectedSector === sec;
              return (
                <button
                  key={sec}
                  onClick={() => {
                    setSelectedSector(sec);
                    setPage(1);
                  }}
                  style={{
                    background: isSelected ? "var(--accent-cyan)" : "var(--bg-elevated)",
                    color: isSelected ? "#000000" : "var(--text-secondary)",
                    border: isSelected ? "none" : "1px solid var(--border)",
                    borderRadius: 20,
                    padding: "5px 14px",
                    fontSize: "0.76rem",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  {sec}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Grid: Stock List on Left / Top + Interactive Selected Telemetry & Chart */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
          {/* Stock List Card */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--bg-elevated)",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.1rem" }}>📈</span>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem" }}>
                  Equities Directory ({filteredStocks.length} Available)
                </div>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {search ? `Showing ${displayedStocks.length} matching stocks` : `Showing ${displayedStocks.length} of ${filteredStocks.length} stocks`}
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "50px 0", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Loading live equities…
              </div>
            ) : displayedStocks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 0", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>🔍</div>
                <p style={{ fontSize: "0.9rem" }}>No stocks found matching "{search}".</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 14 }}>
                  <button
                    className="btn-order-buy"
                    onClick={() => triggerRemoteSearch(search)}
                    style={{ padding: "8px 18px", fontSize: "0.82rem" }}
                  >
                    🔍 Search Yahoo Finance for "{search}"
                  </button>
                  <button
                    className="btn-pill"
                    onClick={() => { setSearch(""); setRemoteResults([]); setSelectedSector("All"); }}
                    style={{ fontSize: "0.82rem" }}
                  >
                    Reset Search
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {displayedStocks.map((s) => {
                  const isPos = (s.changePercent ?? 0) >= 0;
                  const isSelected = selectedStock?.symbol === s.symbol;
                  const inWatchlist = watchlist.includes(s.symbol);

                  return (
                    <div
                      key={s.symbol}
                      onClick={() => setSelectedStock(s)}
                      style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid var(--border)",
                        background: isSelected ? "rgba(0, 212, 255, 0.05)" : "transparent",
                        borderLeft: isSelected ? "4px solid var(--accent-cyan)" : "4px solid transparent",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 16,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "var(--bg-elevated)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* Left: Symbol & Name */}
                      <div style={{ minWidth: 180, flex: "1 1 180px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "1.1rem",
                              fontWeight: 800,
                              color: "var(--text-primary)",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/stocks/${s.symbol}`);
                            }}
                            title="Click to view full detail"
                          >
                            {s.symbol}
                          </span>
                          <span className="pill-badge pill-badge-blue" style={{ fontSize: "0.68rem" }}>
                            {s.sector || "NSE"}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: 3 }}>
                          {s.name || s.companyName || s.symbol}
                        </div>
                      </div>

                      {/* Middle: Live Price & 24h Change */}
                      <div style={{ textAlign: "right", minWidth: 140, flex: "0 1 160px" }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>
                          ₹{fmt(s.price)}
                        </div>
                        <div
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            color: isPos ? "var(--accent-green)" : "var(--accent-coral)",
                            marginTop: 2,
                          }}
                        >
                          {isPos ? "▲ +" : "▼ "}{Math.abs(s.changePercent ?? 0).toFixed(2)}%
                          {s.change !== undefined && (
                            <span style={{ fontSize: "0.7rem", opacity: 0.85, marginLeft: 4 }}>
                              ({isPos ? "+" : ""}₹{Math.abs(s.change).toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: The 3 Action Buttons on the Side */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          flexWrap: "nowrap",
                        }}
                      >
                        <button
                          type="button"
                          className="btn-order-buy"
                          onClick={(e) => handleOpenTrade(s, "BUY", e)}
                          title={`Place Buy order for ${s.symbol}`}
                        >
                          ▲ Buy Order
                        </button>

                        <button
                          type="button"
                          className="btn-order-sell"
                          onClick={(e) => handleOpenTrade(s, "SELL", e)}
                          title={`Place Sell order for ${s.symbol}`}
                        >
                          ▼ Sell Order
                        </button>

                        <button
                          type="button"
                          className="btn-order-watchlist"
                          onClick={(e) => handleToggleWatchlist(s.symbol, e)}
                          title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                          style={{
                            background: inWatchlist ? "#d97706" : "#f59e0b",
                            opacity: inWatchlist ? 0.9 : 1,
                          }}
                        >
                          {inWatchlist ? "★ Watchlist" : "⭐ Watchlist"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls for "Show Few" */}
            {!search && totalPages > 1 && (
              <div
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--bg-elevated)",
                }}
              >
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  Page {currentPage} of {totalPages}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn-pill-ghost"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: "4px 14px", fontSize: "0.78rem", opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    ← Previous
                  </button>
                  <button
                    className="btn-pill-ghost"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ padding: "4px 14px", fontSize: "0.78rem", opacity: currentPage === totalPages ? 0.5 : 1 }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Chart Preview for Selected Stock */}
          {activeStock && (
            <div className="card card-accent-blue" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1.4rem",
                        fontWeight: 800,
                        cursor: "pointer",
                        color: "var(--text-primary)",
                      }}
                      onClick={() => navigate(`/stocks/${activeStock.symbol}`)}
                    >
                      {activeStock.symbol} <span style={{ fontSize: "0.9rem", color: "var(--accent-cyan)" }}>↗</span>
                    </h3>
                    <span className="pill-badge pill-badge-blue">{activeStock.sector}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {activeStock.name || activeStock.companyName}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800 }}>
                      ₹{fmt(activeStock.price)}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        color: (activeStock.changePercent ?? 0) >= 0 ? "var(--accent-green)" : "var(--accent-coral)",
                      }}
                    >
                      {(activeStock.changePercent ?? 0) >= 0 ? "▲ +" : "▼ "}{Math.abs(activeStock.changePercent ?? 0).toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Chart Period Switcher & Quick Actions */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 4, background: "var(--bg-elevated)", padding: "3px", borderRadius: 20 }}>
                    {["1W", "1M", "3M", "1Y"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        style={{
                          background: period === p ? "var(--accent-gold)" : "transparent",
                          color: period === p ? "#000000" : "var(--text-secondary)",
                          border: "none",
                          borderRadius: 16,
                          padding: "4px 10px",
                          fontSize: "0.72rem",
                          fontWeight: period === p ? 700 : 500,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn-order-buy"
                    style={{ padding: "6px 14px", fontSize: "0.78rem" }}
                    onClick={(e) => handleOpenTrade(activeStock, "BUY", e)}
                  >
                    ▲ Buy Order
                  </button>

                  <button
                    type="button"
                    className="btn-order-sell"
                    style={{ padding: "6px 14px", fontSize: "0.78rem" }}
                    onClick={(e) => handleOpenTrade(activeStock, "SELL", e)}
                  >
                    ▼ Sell Order
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div style={{ height: 240, width: "100%" }}>
                {chartLoading ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: "0.82rem", fontFamily: "var(--font-mono)" }}>
                    Loading chart feed…
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="marketStockGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isDark ? "#85e39e" : "#10b981"} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={isDark ? "#85e39e" : "#10b981"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        tickFormatter={(d) => d?.slice(5) || d}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${Number(v).toFixed(0)}`}
                        width={70}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                        formatter={(v) => [`₹${Number(v).toFixed(2)}`, "Price"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="close"
                        stroke={isDark ? "#85e39e" : "#10b981"}
                        strokeWidth={2.2}
                        fill="url(#marketStockGrad)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {modalStock && (
        <BuySellModal
          stock={modalStock}
          defaultType={tradeType}
          onClose={() => setModalStock(null)}
          onTradeSuccess={loadStocks}
        />
      )}
    </AppLayout>
  );
}
