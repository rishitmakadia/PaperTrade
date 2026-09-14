import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function CreatePortfolioModal({ isOpen, onClose }) {
  const { createPortfolio } = useAuth();
  const [name,           setName]           = useState("");
  const [description,    setDescription]    = useState("");
  const [initialCapital, setInitialCapital] = useState("1000000");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a portfolio name");
      return;
    }
    const capNum = parseFloat(initialCapital);
    if (isNaN(capNum) || capNum < 1000) {
      setError("Initial capital must be at least ₹1,000");
      return;
    }

    setLoading(true);
    setError("");
    const res = await createPortfolio({
      name: name.trim(),
      description: description.trim() || null,
      initialCapital: capNum,
    });
    setLoading(false);

    if (res.success) {
      setName("");
      setDescription("");
      setInitialCapital("1000000");
      onClose();
    } else {
      setError(res.error || "Failed to create portfolio");
    }
  };

  const presetCapitals = [
    { label: "₹1 Lakh", val: "100000" },
    { label: "₹5 Lakhs", val: "500000" },
    { label: "₹10 Lakhs", val: "1000000" },
    { label: "₹25 Lakhs", val: "2500000" },
    { label: "₹1 Crore", val: "10000000" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.3rem" }}>💼</span>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Create New Portfolio</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{
            background: "rgba(255, 68, 85, 0.12)",
            border: "1px solid var(--accent-coral)",
            color: "var(--accent-coral)",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            marginBottom: 16,
            fontSize: "0.85rem",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 6 }}>
              Portfolio Name *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Swing Trades, Long Term, High Risk Tech"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 6 }}>
              Description (Optional)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Bluechip dividend focus or short-term momentum"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={255}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 6 }}>
              Initial Virtual Capital (₹) *
            </label>
            <input
              type="number"
              className="form-input"
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
              min="1000"
              step="1000"
              required
            />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {presetCapitals.map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setInitialCapital(p.val)}
                  style={{
                    background: initialCapital === p.val ? "rgba(0, 212, 255, 0.2)" : "var(--bg-tertiary)",
                    border: initialCapital === p.val ? "1px solid var(--accent-cyan)" : "1px solid var(--border-color)",
                    color: initialCapital === p.val ? "var(--accent-cyan)" : "var(--text-secondary)",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: 120 }}
            >
              {loading ? "Creating..." : "Create Portfolio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
