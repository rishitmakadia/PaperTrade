import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";

const TICKER_ITEMS = [
  { sym: "RELIANCE", price: "₹2,847.30", chg: "+1.24%" },
  { sym: "TCS",      price: "₹3,512.75", chg: "+0.87%" },
  { sym: "INFY",     price: "₹1,623.40", chg: "-0.43%" },
  { sym: "HDFCBANK", price: "₹1,789.55", chg: "+2.11%" },
  { sym: "WIPRO",    price: "₹478.20",   chg: "-0.92%" },
  { sym: "BAJFINANCE",price:"₹6,934.10", chg: "+3.05%" },
  { sym: "SBIN",     price: "₹812.65",   chg: "+1.53%" },
  { sym: "TATAMOTORS",price:"₹924.45",   chg: "-0.64%" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const [emailInput, setEmailInput] = useState("");

  const handleStart = (e) => {
    if (e) e.preventDefault();
    navigate("/login");
  };

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", color: "var(--text-primary)", display: "flex", flexDirection: "column" }}>
      {/* ── Top Header ── */}
      <header style={{
        height: 72, borderBottom: "1px solid var(--border)",
        background: "var(--bg-surface)", position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(16px, 5vw, 48px)", backdropFilter: "blur(12px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => navigate("/")}>
          <div className="logo-badge-icon">P</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem", lineHeight: 1 }}>PaperTrade</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>// RISK-FREE TERMINAL</div>
          </div>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: 28 }} className="desktop-only">
          <a href="#features" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.86rem", fontWeight: 600 }}>Features</a>
          <a href="#workflow" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.86rem", fontWeight: 600 }}>Workflow</a>
          <a href="#comparison" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.86rem", fontWeight: 600 }}>Why PaperTrade</a>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Theme Toggle */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
            aria-label="Toggle theme"
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          <button className="btn-pill btn-pill-ghost" onClick={() => navigate("/login")}>
            Sign In
          </button>
          <button className="btn-pill btn-pill-gold" onClick={() => navigate("/login")}>
            View Terminal →
          </button>
        </div>
      </header>

      {/* ── Ticker Tape ── */}
      <div className="ticker-tape">
        <div className="ticker-inner">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-symbol">{item.sym}</span>
              <span className="ticker-price">{item.price}</span>
              <span className={item.chg.startsWith("+") ? "pos" : "neg"}>
                {item.chg}
              </span>
            </span>
          ))}
        </div>
      </div>

      <main style={{ flex: 1, padding: "clamp(32px, 6vw, 64px) clamp(16px, 6vw, 64px)", maxWidth: 1320, width: "100%", margin: "0 auto" }}>
        {/* ── Hero Headline ── */}
        <div style={{ textAlign: "center", maxWidth: 960, margin: "0 auto 56px" }}>
          <div style={{ display: "inline-flex", marginBottom: 20 }}>
            <span className="pill-badge pill-badge-gold">
              <span className="badge-dot" />
              NSE / BSE PAPER TRADING PLATFORM · ₹10,00,000 VIRTUAL CAPITAL
            </span>
          </div>

          <h1 style={{
            fontFamily: "var(--font-editorial)",
            fontSize: "clamp(2.4rem, 6vw, 4.6rem)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}>
            TRADE THE REAL <span style={{ color: "var(--accent-gold)" }}>MARKETS</span> WITH <span style={{ color: "var(--accent-coral)" }}>ZERO RISK</span>
          </h1>

          <p style={{
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            color: "var(--text-secondary)",
            maxWidth: 720,
            margin: "0 auto 36px",
            lineHeight: 1.6
          }}>
            PaperTrade delivers institutional-grade real-time market data, algorithmic backtesting, and instant order execution. Master your edge before putting real capital on the line.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <button className="btn-pill btn-pill-gold" style={{ padding: "14px 32px", fontSize: "1rem" }} onClick={handleStart}>
              Explore Terminal →
            </button>
            <button className="btn-pill btn-pill-ghost" style={{ padding: "14px 28px", fontSize: "1rem" }} onClick={() => navigate("/login")}>
              Try Demo Account
            </button>
          </div>
        </div>

        {/* ── Two Hero Feature Cards (Inspired by Screenshot 1) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginBottom: 72 }}>
          {/* Card 1: Trader Performance Profile */}
          <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span className="pill-badge pill-badge-gold">
                  <span className="badge-dot" /> Live · NSE Stream · Yahoo Finance
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  TODAY
                </span>
              </div>

              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, marginBottom: 8 }}>
                Trader Performance Profile
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 24, lineHeight: 1.5 }}>
                Aggregated from tick-by-tick paper orders, weighted average buy costs, and verified P&L performance metrics.
              </p>

              {/* Nested Inner Widget */}
              <div className="card-inner" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--accent-coral)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                    T1
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>trader.alpha-01</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>acct: 0x97b3...e2a:22 · Virtual Cash</div>
                  </div>
                </div>

                {/* 3 Metric Inset Chips */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                  <div className="metric-box">
                    <span className="metric-box-label">WIN RATE</span>
                    <span className="metric-box-value">78%</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-box-label">PROFIT FACTOR</span>
                    <span className="metric-box-value">2.41</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-box-label">SHARPE</span>
                    <span className="metric-box-value">1.85</span>
                  </div>
                </div>

                {/* Terminal Executions list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "var(--accent-green)" }}>●</span>
                    <span style={{ color: "var(--text-secondary)" }}>Executed BUY #001: 50 RELIANCE @ ₹2,840</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "var(--accent-green)" }}>●</span>
                    <span style={{ color: "var(--text-secondary)" }}>Executed BUY #002: 25 TCS @ ₹3,510</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "var(--text-muted)" }}>●</span>
                    <span style={{ color: "var(--text-secondary)" }}>Triggered Alert #003: INFY Breakout</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                Execution Engine · Zero Risk
              </span>
              <button className="btn-pill btn-pill-gold" onClick={() => navigate("/login")}>
                Browse terminal →
              </button>
            </div>
          </div>

          {/* Card 2: Virtual Capital Engine */}
          <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span className="pill-badge pill-badge-coral">
                  <span className="badge-dot" /> Demo Mode
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  INSTANT ACCESS
                </span>
              </div>

              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-coral)", marginBottom: 8 }}>
                Virtual Portfolio Engine
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 24, lineHeight: 1.5 }}>
                Simulate real-world trading capital with transactional order safety, automated price alerts, and strategy replay.
              </p>

              {/* Nested Inner Widget */}
              <div className="card-inner" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--accent-gold)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                      ₹
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>Virtual Account</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>Tier 1 · Pro Trader</div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase" }}>PORTFOLIO SCORE</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-coral)" }}>
                      842<span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/1000</span>
                    </div>
                  </div>
                </div>

                {/* 3 Metric Inset Chips */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                  <div className="metric-box">
                    <span className="metric-box-label">STARTING CAPITAL</span>
                    <span className="metric-box-value">₹10L</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-box-label">DAY RETURN</span>
                    <span className="metric-box-value" style={{ color: "var(--accent-green)" }}>+4.8%</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-box-label">ORDER TYPE</span>
                    <span className="metric-box-value" style={{ fontSize: "1rem" }}>Instant</span>
                  </div>
                </div>

                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  Rebuilt equity curve in 0.04s · 15 NSE stocks · 6 strategies
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                Full Sandbox · Unlimited Resets
              </span>
              <button className="btn-pill btn-pill-gold" onClick={() => navigate("/login")}>
                Try the live demo →
              </button>
            </div>
          </div>
        </div>

        {/* ── Workflow Steps (Inspired by Screenshot 2) ── */}
        <section id="workflow" style={{ marginBottom: 72 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              From live tick to executed order · Zero financial friction
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {/* Step 1: Soft Purple / Lavender Card */}
            <div style={{
              background: "var(--accent-purple)",
              color: "var(--accent-purple-text)",
              borderRadius: "var(--radius-card)",
              padding: 24,
              display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 180,
              boxShadow: "0 8px 24px rgba(196,161,255,0.2)"
            }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 700, marginBottom: 12, opacity: 0.8 }}>①</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 800, color: "var(--accent-purple-text)", marginBottom: 8 }}>Live Market Stream</h3>
                <p style={{ fontSize: "0.82rem", lineHeight: 1.5, opacity: 0.9 }}>
                  Yahoo Finance integration streams real-time NSE/BSE quotes, candles, and market depth.
                </p>
              </div>
            </div>

            {/* Step 2: Green Solid Card */}
            <div style={{
              background: "var(--accent-green)",
              color: "var(--accent-green-text)",
              borderRadius: "var(--radius-card)",
              padding: 24,
              display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 180,
              boxShadow: "0 8px 24px rgba(133,227,158,0.2)"
            }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 700, marginBottom: 12, opacity: 0.8 }}>②</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 800, color: "var(--accent-green-text)", marginBottom: 8 }}>Virtual Execution</h3>
                <p style={{ fontSize: "0.82rem", lineHeight: 1.5, opacity: 0.9 }}>
                  Place BUY and SELL orders with weighted-average cost basis and instant balance settlement.
                </p>
              </div>
            </div>

            {/* Step 3: Blue Solid Card */}
            <div style={{
              background: "var(--accent-blue)",
              color: "var(--accent-blue-text)",
              borderRadius: "var(--radius-card)",
              padding: 24,
              display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 180,
              boxShadow: "0 8px 24px rgba(107,164,255,0.2)"
            }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 700, marginBottom: 12, opacity: 0.8 }}>③</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 800, color: "var(--accent-blue-text)", marginBottom: 8 }}>Strategy Backtesting</h3>
                <p style={{ fontSize: "0.82rem", lineHeight: 1.5, opacity: 0.9 }}>
                  Simulate SMA, RSI, MACD, and Bollinger Bands over historical OHLC candles in seconds.
                </p>
              </div>
            </div>

            {/* Step 4: Yellow Solid Card */}
            <div style={{
              background: "var(--accent-gold)",
              color: "var(--accent-gold-text)",
              borderRadius: "var(--radius-card)",
              padding: 24,
              display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 180,
              boxShadow: "0 8px 24px rgba(246,201,68,0.2)"
            }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 700, marginBottom: 12, opacity: 0.8 }}>④</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 800, color: "var(--accent-gold-text)", marginBottom: 8 }}>Capital Growth</h3>
                <p style={{ fontSize: "0.82rem", lineHeight: 1.5, opacity: 0.9 }}>
                  Track 30-day equity curves, realized gains, and automated price threshold alerts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Comparison Section (Inspired by Screenshot 2) ── */}
        <section id="comparison" style={{ marginBottom: 72 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "center" }}>
            {/* Left Title */}
            <div>
              <h2 style={{
                fontFamily: "var(--font-editorial)",
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                marginBottom: 20
              }}>
                TRADERS HAVE NO SECOND CHANCES WITH <span style={{ color: "var(--accent-gold)" }}>REAL MONEY</span>
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                Every real-world trading error costs hard-earned savings. PaperTrade gives you an authentic arena to hone technical analysis, discipline, and execution without losing a rupee.
              </p>
            </div>

            {/* Right Split Comparison Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {/* Without Paper Trading Card */}
              <div className="card" style={{ padding: 24 }}>
                <h4 style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
                  WITHOUT PAPER TRADING
                </h4>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  <li>• High financial losses while testing strategies.</li>
                  <li>• Emotional panic leading to early exits.</li>
                  <li>• No historical backtest validation.</li>
                  <li>• Hard capital is locked behind costly mistakes.</li>
                </ul>
              </div>

              {/* With PaperTrade Coral Card */}
              <div style={{
                background: "var(--accent-coral)",
                color: "var(--accent-coral-text)",
                borderRadius: "var(--radius-card)",
                padding: 24,
                boxShadow: "0 8px 30px rgba(255,94,77,0.3)"
              }}>
                <h4 style={{ fontFamily: "var(--font-mono)", fontSize: "0.84rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16, color: "#ffffff" }}>
                  WITH PAPERTRADE
                </h4>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, fontSize: "0.82rem", lineHeight: 1.4, opacity: 0.95 }}>
                  <li>• ₹10,00,000 virtual capital with instant resets.</li>
                  <li>• Real NSE market prices and live charting.</li>
                  <li>• Full backtest engine (SMA, RSI, MACD).</li>
                  <li>• Zero financial risk while building confidence.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Yellow Banner CTA (Inspired by Screenshot 1) ── */}
        <section style={{
          background: "var(--accent-gold)",
          color: "var(--accent-gold-text)",
          borderRadius: "var(--radius-card)",
          padding: "clamp(32px, 6vw, 64px)",
          marginBottom: 48,
          boxShadow: "0 12px 40px rgba(246,201,68,0.25)"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32, alignItems: "center" }}>
            <div>
              <h2 style={{
                fontFamily: "var(--font-editorial)",
                fontSize: "clamp(2rem, 4.5vw, 3.6rem)",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
                marginBottom: 16,
                color: "#0f172a"
              }}>
                TRUST THE DATA <span style={{ color: "var(--accent-coral)" }}>THAT WORKS.</span>
              </h2>
              <p style={{ fontSize: "1rem", color: "#334155", maxWidth: 480, lineHeight: 1.5 }}>
                Join thousands of traders building their edge on India's premier paper trading platform. Free forever.
              </p>
            </div>

            <div>
              <form onSubmit={handleStart} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 380 }}>
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  style={{
                    padding: "14px 20px",
                    borderRadius: "var(--radius-pill)",
                    background: "rgba(255,255,255,0.45)",
                    border: "1px solid rgba(0,0,0,0.15)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    outline: "none"
                  }}
                />
                <button
                  type="submit"
                  className="btn-pill btn-pill-coral"
                  style={{ padding: "14px 24px", fontSize: "0.95rem" }}
                >
                  Request free access →
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg-surface)",
        padding: "36px clamp(16px, 5vw, 48px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        fontSize: "0.78rem",
        color: "var(--text-muted)",
        fontFamily: "var(--font-mono)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>PaperTrade</span>
          <span>· Real-time paper trading simulator</span>
        </div>
        <div>
          © {new Date().getFullYear()} PaperTrade Labs. For educational and simulation purposes only.
        </div>
      </footer>
    </div>
  );
}