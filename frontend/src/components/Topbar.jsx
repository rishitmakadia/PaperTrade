import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { stocksAPI } from "../api/index.js";
import PortfolioSwitcher from "./PortfolioSwitcher.jsx";

export default function Topbar({ title, onMenuClick }) {
  const { user, logout, notification } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const [time,        setTime]        = useState(new Date());
  const [marketOpen,  setMarketOpen]  = useState(false);
  const [tickerItems, setTickerItems] = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      setTime(now);
      // IST: UTC+5:30 → market 9:15–15:30 Mon–Fri
      const utcH = now.getUTCHours(), utcM = now.getUTCMinutes();
      const istMins = utcH * 60 + utcM + 330;
      const dayMins = istMins % (24*60);
      const day = now.getUTCDay();
      const isWeekday = day >= 1 && day <= 5;
      setMarketOpen(isWeekday && dayMins >= 555 && dayMins <= 930);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadTicker = async () => {
      try {
        const [stocks, indices] = await Promise.all([
          stocksAPI.all().catch(() => []),
          stocksAPI.indices().catch(() => []),
        ]);
        const idxItems = indices.map((i) => ({ symbol: i.name, price: i.value, changePercent: i.changePercent }));
        const stkItems = stocks.slice(0, 8).map((s) => ({ symbol: s.symbol, price: s.price, changePercent: s.changePercent }));
        setTickerItems([...idxItems, ...stkItems]);
      } catch {}
    };
    loadTicker();
    const iv = setInterval(loadTicker, 60000);
    return () => clearInterval(iv);
  }, [user]);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate("/login");
  };

  const fmt = (n) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const items = tickerItems.length ? tickerItems : [
    { symbol:"NIFTY 50",   price:22456.80, changePercent:0.55 },
    { symbol:"SENSEX",     price:73876.00, changePercent:0.56 },
    { symbol:"RELIANCE",   price:2847.35,  changePercent:1.50 },
    { symbol:"TCS",        price:3921.50,  changePercent:-0.73 },
    { symbol:"HDFCBANK",   price:1678.90,  changePercent:1.42 },
  ];

  return (
    <>
      <div className="ticker-tape">
        <div className="ticker-inner">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-symbol">{item.symbol}</span>
              <span className="ticker-price">₹{fmt(item.price || 0)}</span>
              <span className={(item.changePercent ?? 0) >= 0 ? "pos" : "neg"}>
                {(item.changePercent ?? 0) >= 0 ? "▲" : "▼"}{Math.abs(item.changePercent ?? 0).toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="topbar">
        <div className="topbar-left">
          <button className="hamburger-btn" onClick={onMenuClick} aria-label="Open menu">☰</button>
          <h2 className="topbar-title">{title}</h2>
        </div>
        
        <div className="topbar-right">
          {/* Market Status Pill */}
          <div className="pill-badge">
            <span className="badge-dot" style={{ background: marketOpen ? "var(--accent-green)" : "var(--accent-coral)" }} />
            <span>NSE {marketOpen ? "LIVE" : "CLOSED"}</span>
          </div>

          {/* Clock Pill */}
          <div className="pill-badge" style={{ display: "none" }} id="topbar-clock">
            {time.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
          </div>

          {/* Portfolio Switcher Dropdown */}
          <PortfolioSwitcher />

          {/* Day / Night Mode Toggle */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
            aria-label="Toggle theme"
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {/* User Profile Dropdown Pill */}
          <div className="topbar-user-dropdown-container" ref={userMenuRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="topbar-profile-pill"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              title="User menu"
            >
              <div
                className="avatar-circle"
                style={{
                  background: user?.avatarColor || "var(--accent-gold)",
                  width: 26,
                  height: 26,
                  fontSize: "0.76rem",
                }}
              >
                {user?.name?.charAt(0) || "U"}
              </div>
              <span className="topbar-profile-name">
                {user?.name || "Trader"}
              </span>
              <span style={{ fontSize: "0.65rem", opacity: 0.7, marginLeft: 2 }}>
                {userMenuOpen ? "▲" : "▼"}
              </span>
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="topbar-user-menu-dropdown">
                {/* Header Profile Summary */}
                <div className="topbar-user-menu-header">
                  <div
                    className="avatar-circle"
                    style={{
                      background: user?.avatarColor || "var(--accent-gold)",
                      width: 38,
                      height: 38,
                      fontSize: "1.1rem",
                      fontWeight: 800,
                    }}
                  >
                    {user?.name?.charAt(0) || "U"}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="topbar-user-menu-name">{user?.name || "Trader"}</div>
                    <div className="topbar-user-menu-email">{user?.email || "user@papertrade.local"}</div>
                  </div>
                </div>

                <div className="topbar-user-menu-divider" />

                {/* Menu Action Items */}
                <div className="topbar-user-menu-list">
                  <div
                    className="topbar-user-menu-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/profile");
                    }}
                  >
                    <span className="topbar-user-menu-icon">👤</span>
                    <span className="topbar-user-menu-label">Profile</span>
                  </div>

                  <div
                    className="topbar-user-menu-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate(user?.role === "admin" ? "/admin/settings" : "/settings");
                    }}
                  >
                    <span className="topbar-user-menu-icon">⚙️</span>
                    <span className="topbar-user-menu-label">Settings</span>
                  </div>

                  <div className="topbar-user-menu-divider" />

                  <div
                    className="topbar-user-menu-item topbar-user-menu-item-danger"
                    onClick={handleLogout}
                  >
                    <span className="topbar-user-menu-icon">🚪</span>
                    <span className="topbar-user-menu-label" style={{ color: "var(--accent-coral)" }}>
                      Log Out
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`} key={notification.id}>
          <span>{notification.type === "success" ? "✓" : notification.type === "error" ? "✕" : "ℹ"}</span>
          {notification.message}
        </div>
      )}
    </>
  );
}
