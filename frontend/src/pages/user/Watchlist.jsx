import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import AppLayout from "../../components/AppLayout.jsx";
import BuySellModal from "../../components/BuySellModal.jsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { stocksAPI } from "../../api/index.js";
import { getMockStocks } from "../../data/mockStocks.js";
import { generateCandleData } from "../../data/mockData.jsx";

const MiniChart = ({ symbol, positive }) => {
  const data = generateCandleData(15, 1000).map((d) => ({ v: d.close }));
  const strokeColor = positive ? "var(--accent-green)" : "var(--accent-coral)";
  return (
    <ResponsiveContainer width={80} height={36}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={strokeColor} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default function Watchlist() {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  const navigate = useNavigate();
  const [stocks,       setStocks]       = useState([]);
  const [search,       setSearch]       = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStock, setSelected]   = useState(null);
  const [tradeType,    setTradeType]    = useState("BUY");
  const [activeTab,    setActiveTab]    = useState("watchlist");
  const [loading,      setLoading]      = useState(true);
  const searchRef = useRef(null);

  useEffect(() => {
    const load = () => stocksAPI.all();
    load().then(setStocks).catch(console.error).finally(() => setLoading(false));
    const iv = setInterval(() => load().then(setStocks).catch(console.error), 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search.length > 0
    ? stocks.filter((s) => s.symbol.includes(search.toUpperCase()) || s.name?.toLowerCase().includes(search.toLowerCase()))
    : [];

  const watchlistStocks = stocks.filter((s) => watchlist.includes(s.symbol));
  const displayStocks   = activeTab === "watchlist" ? watchlistStocks : stocks;

  const openTrade = (stock, type) => { setSelected(stock); setTradeType(type); };

  return (
    <AppLayout title="Watchlist & Market">
      <div className="page-body" style={{ paddingTop: 20 }}>

        {/* Search bar & tab bar header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={activeTab === "watchlist" ? "btn-pill-gold" : "btn-pill-ghost"}
              style={{ padding: "8px 18px", fontSize: "0.82rem" }}
              onClick={() => setActiveTab("watchlist")}
            >
              ⭐ My Watchlist ({watchlist.length})
            </button>
            <button
              className={activeTab === "all" ? "btn-pill-gold" : "btn-pill-ghost"}
              style={{ padding: "8px 18px", fontSize: "0.82rem" }}
              onClick={() => setActiveTab("all")}
            >
              All NSE Equities ({stocks.length})
            </button>
          </div>

          {/* Search bar */}
          <div style={{ position: "relative", width: "100%", maxWidth: 380 }} ref={searchRef}>
            <input
              type="text"
              placeholder="Search ticker to add to watchlist…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => search && setShowDropdown(true)}
              style={{ width: "100%", paddingLeft: 38, borderRadius: "var(--radius-pill)" }}
            />
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.9rem" }}>⌕</span>

            {showDropdown && filtered.length > 0 && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", zIndex: 100, maxHeight: 260, overflowY: "auto",
                boxShadow: "var(--shadow-lg)",
              }}>
                {filtered.map((s) => (
                  <div
                    key={s.symbol}
                    style={{ padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}
                    onClick={() => { addToWatchlist(s.symbol); setSearch(""); setShowDropdown(false); }}
                  >
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{s.symbol}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{s.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700 }}>₹{s.price.toLocaleString("en-IN")}</div>
                      <div className={s.changePercent >= 0 ? "pos" : "neg"} style={{ fontSize: "0.68rem", fontWeight: 600 }}>
                        {s.changePercent >= 0 ? "▲ +" : "▼ "}{s.changePercent?.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0", fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            ⟳ Loading live market telemetry…
          </div>
        ) : displayStocks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⭐</div>
            <p>Your watchlist is empty. Search for symbols above or switch to "All NSE Equities" to add stocks.</p>
          </div>
        ) : (
          <div className="card card-accent-gold" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Current Price</th>
                    <th>24h Change</th>
                    <th>Volume</th>
                    <th>52W Range</th>
                    <th>Intraday Trend</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayStocks.map((s) => (
                    <tr key={s.symbol}>
                      <td>
                        <div
                          style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)", cursor: "pointer" }}
                          onClick={() => navigate(`/stocks/${s.symbol}`)}
                        >
                          {s.symbol} <span style={{ color: "var(--accent-gold)", fontSize: "0.75rem" }}>↗</span>
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{s.sector}</div>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
                        ₹{s.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <div className={s.changePercent >= 0 ? "pos" : "neg"} style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700 }}>
                          {s.changePercent >= 0 ? "▲ +" : "▼ "}{s.changePercent?.toFixed(2)}%
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                          {s.change >= 0 ? "+" : ""}₹{s.change?.toFixed(2)}
                        </div>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {s.volume ?? "—"}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>
                        <span className="pos">₹{s.high?.toFixed(2) ?? "—"}</span>
                        <span style={{ color: "var(--text-muted)" }}> / </span>
                        <span className="neg">₹{s.low?.toFixed(2) ?? "—"}</span>
                      </td>
                      <td><MiniChart symbol={s.symbol} positive={(s.changePercent || 0) >= 0} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn-pill-green"
                            style={{ padding: "4px 12px", fontSize: "0.72rem" }}
                            onClick={() => openTrade(s, "BUY")}
                          >
                            ▲ Buy
                          </button>
                          <button
                            className="btn-pill-coral"
                            style={{ padding: "4px 12px", fontSize: "0.72rem" }}
                            onClick={() => openTrade(s, "SELL")}
                          >
                            ▼ Sell
                          </button>
                          {activeTab === "watchlist" ? (
                            <button
                              className="btn-pill-ghost"
                              style={{ padding: "4px 10px", fontSize: "0.72rem", color: "var(--accent-coral)" }}
                              onClick={() => removeFromWatchlist(s.symbol)}
                              title="Remove from watchlist"
                            >
                              ✕
                            </button>
                          ) : (
                            <button
                              className="btn-pill-ghost"
                              style={{ padding: "4px 10px", fontSize: "0.72rem", color: "var(--accent-gold)" }}
                              onClick={() => addToWatchlist(s.symbol)}
                              title="Add to watchlist"
                            >
                              ＋
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedStock && (
        <BuySellModal stock={selectedStock} defaultType={tradeType} onClose={() => setSelected(null)} />
      )}
    </AppLayout>
  );
}
