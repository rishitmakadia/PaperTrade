import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const UserNavItems = [
  { icon: "📊", label: "Dashboard",   path: "/dashboard" },
  { icon: "⭐", label: "Watchlist",   path: "/watchlist" },
  { icon: "💼", label: "Portfolio",   path: "/portfolio" },
  { icon: "📋", label: "Orders",      path: "/orders" },
  { icon: "🧪", label: "Backtesting", path: "/backtest" },
  { icon: "📈", label: "Market",      path: "/market" },
  { icon: "🔔", label: "Alerts",     path: "/alerts" },
];

const AdminNavItems = [
  { icon: "📊", label: "Overview",  path: "/admin" },
  { icon: "👥", label: "Users",     path: "/admin/users" },
  { icon: "📋", label: "Trades",    path: "/admin/trades" },
  { icon: "📈", label: "Analytics", path: "/admin/analytics" },
  { icon: "⚙️", label: "Settings",  path: "/admin/settings" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isAdmin   = user?.role === "admin";
  const navItems  = isAdmin ? AdminNavItems : UserNavItems;

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <>
      <div className={`sidebar-overlay${isOpen ? " visible" : ""}`} onClick={onClose} aria-hidden="true" />

      <aside className={`sidebar${isOpen ? " open" : ""}`}>
        <div className="sidebar-logo">
          <div className="logo-wrap" onClick={() => handleNav(isAdmin ? "/admin" : "/dashboard")} style={{ cursor: "pointer" }}>
            <div className="logo-badge-icon">P</div>
            <div>
              <div className="logo-text-title">PaperTrade</div>
              <div className="logo-sub-tag">{isAdmin ? "Admin Console" : "Virtual Terminal"}</div>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">✕</button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.map((item) => (
            <div
              key={item.path}
              className={`nav-item${location.pathname === item.path ? " active" : ""}`}
              onClick={() => handleNav(item.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleNav(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}

          {/* Account section with Settings and Profile at bottom */}
          {!isAdmin && (
            <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <div className="nav-section-label">Account</div>
              <div
                className={`nav-item${location.pathname === "/settings" ? " active" : ""}`}
                onClick={() => handleNav("/settings")}
                role="button"
                tabIndex={0}
              >
                <span className="nav-icon">⚙️</span>
                <span>Settings</span>
              </div>
              <div
                className={`nav-item${location.pathname === "/profile" ? " active" : ""}`}
                onClick={() => handleNav("/profile")}
                role="button"
                tabIndex={0}
              >
                <span className="nav-icon">👤</span>
                <span>Profile</span>
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
