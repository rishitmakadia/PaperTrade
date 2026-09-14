import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import CreatePortfolioModal from "./CreatePortfolioModal.jsx";

export default function PortfolioSwitcher() {
  const { portfolios, currentPortfolio, setCurrentPortfolio, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  if (!user || user.role === "admin") return null;

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div className="portfolio-switcher-container" ref={dropdownRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="portfolio-switcher-btn"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: 20,
          padding: "5px 12px",
          color: "var(--text-primary)",
          cursor: "pointer",
          fontSize: "0.82rem",
          fontWeight: 600,
          transition: "all 0.2s ease",
        }}
        title="Switch active portfolio"
      >
        <span style={{ fontSize: "0.9rem" }}>💼</span>
        <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {currentPortfolio?.name || "Main Portfolio"}
        </span>
        <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          className="portfolio-switcher-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 280,
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            zIndex: 1000,
            overflow: "hidden",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--border-color)",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--text-muted)",
              letterSpacing: "0.5px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>My Portfolios ({portfolios.length})</span>
            <span style={{ fontSize: "0.7rem", color: "var(--accent-cyan)" }}>Active Scoped</span>
          </div>

          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {portfolios.map((p) => {
              const isSelected = p.id === currentPortfolio?.id;
              const pnl = p.totalPnl ?? 0;
              const isPnlPos = pnl >= 0;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setCurrentPortfolio(p);
                    setOpen(false);
                  }}
                  style={{
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    background: isSelected ? "rgba(0, 212, 255, 0.08)" : "transparent",
                    borderLeft: isSelected ? "3px solid var(--accent-cyan)" : "3px solid transparent",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "var(--bg-tertiary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ overflow: "hidden", marginRight: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: "0.85rem",
                          color: isSelected ? "var(--accent-cyan)" : "var(--text-primary)",
                        }}
                      >
                        {p.name}
                      </span>
                      {p.isDefault && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            background: "rgba(255, 215, 0, 0.15)",
                            color: "var(--accent-gold)",
                            padding: "1px 5px",
                            borderRadius: 4,
                            fontWeight: 600,
                          }}
                        >
                          DEF
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                      Cash: ₹{fmt(p.cashBalance)}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      ₹{fmt(p.portfolioValue)}
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: isPnlPos ? "var(--accent-green)" : "var(--accent-coral)",
                      }}
                    >
                      {isPnlPos ? "+" : ""}₹{fmt(pnl)} ({((p.returnPercentage ?? 0)).toFixed(2)}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderTop: "1px solid var(--border-color)",
              background: "var(--bg-secondary)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setShowCreateModal(true);
              }}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px dashed var(--accent-cyan)",
                borderRadius: "var(--radius-sm)",
                color: "var(--accent-cyan)",
                padding: "7px 10px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 212, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span>+</span>
              <span>Create New Portfolio</span>
            </button>
          </div>
        </div>
      )}

      <CreatePortfolioModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
