import AppLayout from "../../components/AppLayout.jsx";
import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { BACKTESTING_STRATEGIES, generateBacktestResult } from "../../data/mockData.jsx";

const NSE_SYMBOLS = [
  { symbol: "RELIANCE",   name: "Reliance Industries Ltd" },
  { symbol: "TCS",        name: "Tata Consultancy Services" },
  { symbol: "HDFCBANK",   name: "HDFC Bank Ltd" },
  { symbol: "INFY",       name: "Infosys Ltd" },
  { symbol: "ICICIBANK",  name: "ICICI Bank Ltd" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd" },
  { symbol: "WIPRO",      name: "Wipro Ltd" },
  { symbol: "SBIN",       name: "State Bank of India" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd" },
  { symbol: "MARUTI",     name: "Maruti Suzuki India" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd" },
  { symbol: "SUNPHARMA",  name: "Sun Pharmaceutical" },
  { symbol: "LT",         name: "Larsen & Toubro Ltd" },
  { symbol: "ASIANPAINT", name: "Asian Paints Ltd" },
  { symbol: "NESTLEIND",  name: "Nestle India Ltd" },
];

export default function Backtest() {
  const [form, setForm] = useState({
    strategy: BACKTESTING_STRATEGIES[0],
    symbol: "RELIANCE",
    startDate: "2023-01-01",
    endDate: "2024-01-01",
    capital: 100000,
    stopLoss: 2,
    targetProfit: 4,
  });
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1800));
    setResult(generateBacktestResult(form.strategy, form.symbol, form.startDate, form.endDate, Number(form.capital)));
    setLoading(false);
    setActiveTab("overview");
  };

  const CustomTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px", boxShadow: "var(--shadow-md)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", color: "var(--accent-gold)", fontWeight: 700 }}>
          ₹{payload[0]?.value?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        </div>
      </div>
    );
  };

  return (
    <AppLayout title="Strategy Backtesting">
      <div className="page-body" style={{ paddingTop: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "min(360px, 100%) 1fr", gap: 18, alignItems: "start" }} className="backtest-layout">

          {/* Config Panel */}
          <div className="card card-accent-purple" style={{ position: "sticky", top: 80 }}>
            <div className="card-header" style={{ marginBottom: 18 }}>
              <div>
                <h3 className="card-title">Strategy Configuration</h3>
                <div className="card-subtitle">Backtest parameters & constraints</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="input-group">
                <label className="input-label">Algorithmic Strategy</label>
                <select value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })}>
                  {BACKTESTING_STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Equity Symbol</label>
                <select value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}>
                  {NSE_SYMBOLS.map((s) => <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>)}
                </select>
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Initial Portfolio Capital (₹)</label>
                <input type="number" value={form.capital} onChange={(e) => setForm({ ...form, capital: e.target.value })} min={10000} step={10000} />
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Stop Loss (%)</label>
                  <input type="number" value={form.stopLoss} onChange={(e) => setForm({ ...form, stopLoss: e.target.value })} min={0.5} max={10} step={0.5} />
                </div>
                <div className="input-group">
                  <label className="input-label">Target Profit (%)</label>
                  <input type="number" value={form.targetProfit} onChange={(e) => setForm({ ...form, targetProfit: e.target.value })} min={1} max={20} step={0.5} />
                </div>
              </div>

              <button
                className="btn-pill-gold w-full"
                style={{ justifyContent: "center", padding: "12px 20px", marginTop: 6 }}
                onClick={handleRun}
                disabled={loading}
              >
                {loading ? "⟳ Simulating Historical Ticks..." : "⚡ Execute Backtest Engine"}
              </button>

              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "14px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--accent-gold)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Strategy Logic
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {form.strategy.includes("SMA")      && "Enters long when fast SMA crosses above slow SMA. Exits on downward cross or trailing stop."}
                  {form.strategy.includes("EMA")      && "Applies exponential weightings for rapid signal response to trend changes."}
                  {form.strategy.includes("RSI")      && "Buys when RSI < 30 (oversold bounce), exits when RSI > 70 (overbought)."}
                  {form.strategy.includes("MACD")     && "Executes on MACD signal line crossovers with momentum histogram confirmation."}
                  {form.strategy.includes("Bollinger")&& "Mean reversion system buying lower envelope touches and exiting at upper boundary."}
                  {form.strategy.includes("Support")  && "Calculates key price pivot levels and enters on high-volume breakout candles."}
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div>
            {!result && !loading && (
              <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 450, textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>⚡</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
                  Ready to Simulate Strategy
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: 360, lineHeight: 1.6 }}>
                  Select an algorithmic strategy and asset on the left panel, then run the simulation to compute returns, Sharpe ratio, and drawdowns.
                </p>
              </div>
            )}

            {loading && (
              <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 450, gap: 16, padding: "40px 20px" }}>
                <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: 6 }}>
                    Backtesting {form.strategy}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Iterating historical OHLCV bars for {form.symbol}…
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Result header banner */}
                <div className="card card-accent-gold">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800 }}>
                        {result.strategy}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                        {form.symbol} · {form.startDate} → {form.endDate}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span className={`badge-pill ${parseFloat(result.totalReturn) >= 0 ? "badge-pill-green" : "badge-pill-coral"}`} style={{ fontSize: "0.88rem", padding: "6px 18px" }}>
                        {parseFloat(result.totalReturn) >= 0 ? "▲ +" : "▼ "}{Math.abs(result.totalReturn)}% Net Return
                      </span>
                      <span className="badge-pill badge-pill-gold" style={{ fontSize: "0.85rem", padding: "6px 16px" }}>
                        {result.winRate}% Win Rate
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stat cards row */}
                <div className="grid-4">
                  <div className="card card-accent-blue" style={{ padding: "18px 20px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      Total Trades
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800 }}>
                      {result.trades}
                    </div>
                  </div>

                  <div className={`card ${parseFloat(result.winRate) >= 50 ? "card-accent-green" : "card-accent-coral"}`} style={{ padding: "18px 20px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      Win Rate
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, color: parseFloat(result.winRate) >= 50 ? "var(--accent-green)" : "var(--accent-coral)" }}>
                      {result.winRate}%
                    </div>
                  </div>

                  <div className="card card-accent-coral" style={{ padding: "18px 20px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      Max Drawdown
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-coral)" }}>
                      -{result.maxDrawdown}%
                    </div>
                  </div>

                  <div className="card card-accent-gold" style={{ padding: "18px 20px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      Sharpe Ratio
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, color: parseFloat(result.sharpe) >= 1 ? "var(--accent-green)" : "var(--accent-gold)" }}>
                      {result.sharpe}
                    </div>
                  </div>
                </div>

                {/* Capital Comparison */}
                <div className="grid-2">
                  <div className="card" style={{ padding: "18px 20px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 4 }}>
                      INITIAL CAPITAL
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800 }}>
                      ₹{Number(form.capital).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className={`card ${parseFloat(result.totalReturn) >= 0 ? "card-accent-green" : "card-accent-coral"}`} style={{ padding: "18px 20px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 4 }}>
                      SIMULATED FINAL CAPITAL
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: parseFloat(result.totalReturn) >= 0 ? "var(--accent-green)" : "var(--accent-coral)" }}>
                      ₹{result.finalCapital?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className={activeTab === "overview" ? "btn-pill-gold" : "btn-pill-ghost"}
                    style={{ padding: "8px 18px", fontSize: "0.82rem" }}
                    onClick={() => setActiveTab("overview")}
                  >
                    ⟳ Equity Curve
                  </button>
                  <button
                    className={activeTab === "trades" ? "btn-pill-gold" : "btn-pill-ghost"}
                    style={{ padding: "8px 18px", fontSize: "0.82rem" }}
                    onClick={() => setActiveTab("trades")}
                  >
                    ◎ Executed Trade Log ({result.trades})
                  </button>
                </div>

                {activeTab === "overview" && (
                  <div className="card card-accent-blue">
                    <div className="card-header" style={{ marginBottom: 14 }}>
                      <div>
                        <h3 className="card-title">Equity Growth Trajectory</h3>
                        <div className="card-subtitle">Simulated account balance over timeline</div>
                      </div>
                    </div>
                    <div className="chart-container" style={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={result.equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={parseFloat(result.totalReturn) >= 0 ? "var(--accent-green)" : "var(--accent-coral)"} stopOpacity={0.25} />
                              <stop offset="95%" stopColor={parseFloat(result.totalReturn) >= 0 ? "var(--accent-green)" : "var(--accent-coral)"} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval={10} tickFormatter={(d) => d.slice(5)} />
                          <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} width={70} />
                          <Tooltip content={<CustomTip />} />
                          <ReferenceLine y={Number(form.capital)} stroke="var(--text-dim)" strokeDasharray="4 4" />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={parseFloat(result.totalReturn) >= 0 ? "var(--accent-green)" : "var(--accent-coral)"}
                            strokeWidth={2.5}
                            fill="url(#btGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-dim)", textAlign: "center", marginTop: 8 }}>
                      Dashed line represents initial capital base (₹{Number(form.capital).toLocaleString("en-IN")})
                    </div>
                  </div>
                )}

                {activeTab === "trades" && (
                  <div className="card card-accent-purple">
                    <div className="card-header" style={{ marginBottom: 14 }}>
                      <h3 className="card-title">Backtest Trade Ledger</h3>
                      <span className="pill-badge pill-badge-gold">{result.trades} Executed Signals</span>
                    </div>
                    <div className="table-wrap" style={{ maxHeight: 380, overflowY: "auto" }}>
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Type</th>
                            <th>Entry Price</th>
                            <th>Exit Price</th>
                            <th>P&L</th>
                            <th>Outcome</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.tradeLog?.map((t) => (
                            <tr key={t.id}>
                              <td style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>#{t.id}</td>
                              <td><span className={`pill-badge ${t.type === "BUY" ? "pill-badge-green" : "pill-badge-coral"}`} style={{ fontSize: "0.68rem" }}>{t.type}</span></td>
                              <td style={{ fontFamily: "var(--font-mono)" }}>₹{t.entryPrice}</td>
                              <td style={{ fontFamily: "var(--font-mono)" }}>₹{t.exitPrice}</td>
                              <td className={t.pnl >= 0 ? "pos" : "neg"} style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                                {t.pnl >= 0 ? "+" : ""}₹{t.pnl?.toFixed(2)}
                              </td>
                              <td>
                                <span className={`pill-badge ${t.result === "WIN" ? "pill-badge-green" : "pill-badge-coral"}`}>
                                  {t.result}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
