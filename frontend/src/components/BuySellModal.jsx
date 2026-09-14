import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { portfoliosAPI } from "../api/index.js";

export default function BuySellModal({ stock, defaultType = "BUY", onClose, onTradeSuccess }) {
  const { portfolios, currentPortfolio, executeTrade } = useAuth();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(
    currentPortfolio?.id || (portfolios[0]?.id ?? "")
  );
  const [type,           setType]           = useState(defaultType);
  const [qty,            setQty]            = useState(1);
  const [orderType,      setOrderType]      = useState("MARKET");
  const [editedPrice,    setEditedPrice]    = useState(stock?.price || 0);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [limitPrice,     setLimitPrice]     = useState(stock?.price || 0);
  const [submitting,     setSubmitting]     = useState(false);
  const [holdingQty,     setHoldingQty]     = useState(0);
  const [loadingHolding, setLoadingHolding] = useState(false);

  const targetPort = portfolios.find((p) => p.id === Number(selectedPortfolioId)) || currentPortfolio;
  const portCash = targetPort?.cashBalance ?? 0;

  // Fetch holding quantity of this stock in the selected portfolio
  useEffect(() => {
    if (!selectedPortfolioId || !stock?.symbol) return;
    let isMounted = true;
    setLoadingHolding(true);
    portfoliosAPI
      .holdings(selectedPortfolioId)
      .then((holdings) => {
        if (!isMounted) return;
        const h = holdings?.find(
          (item) => item.symbol?.toUpperCase() === stock.symbol?.toUpperCase()
        );
        setHoldingQty(h ? h.qty : 0);
      })
      .catch(() => {
        if (isMounted) setHoldingQty(0);
      })
      .finally(() => {
        if (isMounted) setLoadingHolding(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedPortfolioId, stock?.symbol]);

  const isCustomPrice = Math.abs((Number(editedPrice) || 0) - (stock?.price || 0)) > 0.001;
  const execPrice = orderType === "MARKET" ? (Number(editedPrice) || stock?.price || 0) : limitPrice;
  const numQty    = parseInt(qty) || 0;
  const total     = numQty * execPrice;

  const hasEnoughCash   = total <= portCash && numQty > 0;
  const hasEnoughShares = holdingQty > 0 && numQty > 0 && numQty <= holdingQty;
  const isValidTrade    = type === "BUY" ? hasEnoughCash : hasEnoughShares;

  const handleSubmit = async () => {
    if (!isValidTrade || numQty <= 0) return;
    setSubmitting(true);
    const success = await executeTrade(
      stock.symbol,
      type,
      numQty,
      execPrice,
      stock.name || stock.symbol,
      orderType,
      stock.sector || "",
      Number(selectedPortfolioId)
    );
    setSubmitting(false);
    if (success) {
      if (onTradeSuccess) onTradeSuccess();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 800 }}>{stock?.symbol}</h3>
              {stock?.sector && <span className="pill-badge pill-badge-blue">{stock.sector}</span>}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem", color: "var(--text-muted)" }}>{stock?.name}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              color: "var(--text-muted)", width: 32, height: 32, borderRadius: "50%",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.9rem"
            }}
          >
            ✕
          </button>
        </div>

        {/* Live / Editable Price Surface with Pen Button */}
        <div
          className="card-inner"
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px",
            border: isCustomPrice ? "1px solid var(--accent-gold)" : "1px solid var(--border)",
            background: isCustomPrice ? "rgba(245, 158, 11, 0.05)" : "var(--bg-card-inner)",
          }}
        >
          <div style={{ flex: 1 }}>
            {isEditingPrice ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800 }}>₹</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  value={editedPrice}
                  onChange={(e) => setEditedPrice(parseFloat(e.target.value) || 0)}
                  className="form-input"
                  style={{ width: 140, fontWeight: 700, fontSize: "1.1rem", padding: "4px 8px" }}
                  autoFocus
                />
                <button
                  className="btn-pill-gold"
                  style={{ padding: "5px 12px", fontSize: "0.72rem" }}
                  onClick={() => setIsEditingPrice(false)}
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    ₹{Number(editedPrice).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={() => setIsEditingPrice(true)}
                    className="btn-pill-ghost"
                    title="Edit execution price (Simulation/Custom)"
                    style={{
                      padding: "2px 8px",
                      fontSize: "0.7rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s ease",
                    }}
                  >
                    ✏️ <span style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>Edit</span>
                  </button>
                  {isCustomPrice && (
                    <span
                      onClick={() => setEditedPrice(stock?.price || 0)}
                      title="Reset to live market price"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.68rem",
                        color: "var(--accent-gold)",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      ↺ Reset Live
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }} className={stock?.changePercent >= 0 ? "pos" : "neg"}>
                    {stock?.changePercent >= 0 ? "▲" : "▼"} {Math.abs(stock?.changePercent ?? 0).toFixed(2)}%
                  </div>
                  {isCustomPrice && (
                    <span className="pill-badge pill-badge-amber" style={{ fontSize: "0.64rem" }}>
                      Custom Execution Price
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0 }}>
            <div>H: ₹{stock?.high?.toFixed(2) || "—"} / L: ₹{stock?.low?.toFixed(2) || "—"}</div>
            <div style={{ marginTop: 2 }}>Vol: {stock?.volume || "—"}</div>
          </div>
        </div>

        {/* Portfolio Selector */}
        {portfolios.length > 0 && (
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Target Portfolio</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.74rem" }}>
                Cash: ₹{Number(portCash).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </label>
            <select
              className="form-input"
              value={selectedPortfolioId}
              onChange={(e) => setSelectedPortfolioId(e.target.value)}
              style={{ cursor: "pointer", fontWeight: 600 }}
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Cash: ₹{Number(p.cashBalance || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Order Type Pill Tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            className="btn-pill"
            onClick={() => setType("BUY")}
            style={{
              background: type === "BUY" ? "var(--accent-green)" : "var(--bg-elevated)",
              color: type === "BUY" ? "var(--accent-green-text)" : "var(--text-secondary)",
              border: type === "BUY" ? "none" : "1px solid var(--border)",
              boxShadow: type === "BUY" ? "0 4px 14px rgba(133,227,158,0.3)" : "none",
            }}
          >
            ▲ BUY
          </button>
          <button
            type="button"
            className="btn-pill"
            onClick={() => setType("SELL")}
            style={{
              background: type === "SELL" ? "var(--accent-coral)" : "var(--bg-elevated)",
              color: type === "SELL" ? "var(--accent-coral-text)" : "var(--text-secondary)",
              border: type === "SELL" ? "none" : "1px solid var(--border)",
              boxShadow: type === "SELL" ? "0 4px 14px rgba(255,94,77,0.3)" : "none",
            }}
          >
            ▼ SELL
          </button>
        </div>

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="form-label">Execution Mode</label>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {["MARKET", "LIMIT"].map((o) => (
                <button
                  key={o}
                  type="button"
                  className="btn-pill"
                  style={{
                    padding: "6px 16px", fontSize: "0.76rem",
                    background: orderType === o ? "var(--accent-gold)" : "var(--bg-card-inner)",
                    color: orderType === o ? "var(--accent-gold-text)" : "var(--text-secondary)",
                    border: orderType === o ? "none" : "1px solid var(--border)",
                  }}
                  onClick={() => setOrderType(o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {orderType === "LIMIT" && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Limit Price (₹)</label>
              <input
                type="number"
                className="form-input"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                min="0.01"
                step="0.05"
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Quantity</label>
              {type === "SELL" && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Available: </span>
                  <span style={{ fontWeight: 700, color: holdingQty > 0 ? "var(--accent-green)" : "var(--accent-coral)" }}>
                    {loadingHolding ? "Checking…" : `${holdingQty} shares`}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="number"
                className="form-input"
                value={qty}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setQty(isNaN(val) ? "" : Math.max(1, val));
                }}
                min="1"
                style={{ flex: 1 }}
              />

              {type === "SELL" && holdingQty > 0 && (
                <div style={{ display: "flex", gap: 4 }}>
                  {[
                    { label: "25%", val: Math.max(1, Math.floor(holdingQty * 0.25)) },
                    { label: "50%", val: Math.max(1, Math.floor(holdingQty * 0.5)) },
                    { label: "Max", val: holdingQty },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      className="btn-pill-ghost"
                      style={{
                        padding: "6px 10px",
                        fontSize: "0.72rem",
                        fontWeight: numQty === btn.val ? 700 : 500,
                        borderColor: numQty === btn.val ? "var(--accent-coral)" : "var(--border)",
                        color: numQty === btn.val ? "var(--accent-coral)" : "var(--text-secondary)",
                      }}
                      onClick={() => setQty(btn.val)}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trade Summary Inset */}
          <div className="card-inner" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--text-muted)" }}>Order Value</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "0.98rem", fontWeight: 700, color: "var(--text-primary)" }}>
                ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {type === "BUY" ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--text-muted)" }}>
                  {targetPort?.name || "Portfolio"} Cash
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 600, color: hasEnoughCash ? "var(--accent-green)" : "var(--accent-coral)" }}>
                  ₹{Number(portCash).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--text-muted)" }}>
                  {targetPort?.name || "Portfolio"} Holdings
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 600, color: holdingQty > 0 ? "var(--accent-green)" : "var(--accent-coral)" }}>
                  {loadingHolding ? "Checking…" : `${holdingQty} ${holdingQty === 1 ? "share" : "shares"}`}
                </span>
              </div>
            )}
          </div>

          {/* Validation Warning Messages */}
          {type === "BUY" && !hasEnoughCash && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem", color: "var(--accent-coral)", textAlign: "center", fontWeight: 600 }}>
              ⚠ Insufficient portfolio cash (Available: ₹{Number(portCash).toLocaleString("en-IN")})
            </div>
          )}

          {type === "SELL" && !loadingHolding && holdingQty === 0 && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem", color: "var(--accent-coral)", textAlign: "center", fontWeight: 600 }}>
              ⚠ "{targetPort?.name || "Portfolio"}" does not hold any shares of {stock?.symbol}
            </div>
          )}

          {type === "SELL" && !loadingHolding && holdingQty > 0 && numQty > holdingQty && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem", color: "var(--accent-coral)", textAlign: "center", fontWeight: 600 }}>
              ⚠ Insufficient shares: You only hold {holdingQty} shares in {targetPort?.name || "Portfolio"}
            </div>
          )}

          <button
            className={`btn-pill ${type === "BUY" ? "btn-pill-gold" : "btn-pill-coral"}`}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "0.94rem",
              marginTop: 4,
              opacity: !isValidTrade || submitting || loadingHolding ? 0.6 : 1,
              cursor: !isValidTrade || submitting || loadingHolding ? "not-allowed" : "pointer",
            }}
            onClick={handleSubmit}
            disabled={!isValidTrade || submitting || loadingHolding}
          >
            {submitting
              ? "Executing trade…"
              : loadingHolding
              ? "Verifying holdings…"
              : type === "BUY"
              ? !hasEnoughCash
                ? "Insufficient Cash"
                : `Buy ${numQty || 0} × ${stock?.symbol} →`
              : holdingQty === 0
              ? "No Shares to Sell"
              : numQty > holdingQty
              ? `Max Available: ${holdingQty} Shares`
              : `Sell ${numQty || 0} × ${stock?.symbol} →`}
          </button>
        </div>
      </div>
    </div>
  );
}
