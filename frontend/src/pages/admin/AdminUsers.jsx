import React, { useState, useEffect } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { adminAPI } from "../../api/index.js";

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    adminAPI.users()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (user) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      const updated = await adminAPI.updateStatus(user._id, newStatus);
      setUsers((prev) => prev.map((u) => u._id === updated._id ? updated : u));
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = users.filter((u) => u.role === "user").reduce((s, u) => s + (u.balance || 0), 0);

  return (
    <AppLayout title="User Management">
      <div className="page-body" style={{ paddingTop: 20 }}>
        {/* Stat Cards */}
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <div className="card card-accent-gold" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Total Registered Users
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800 }}>
              {users.filter((u) => u.role !== "admin").length}
            </div>
          </div>

          <div className="card card-accent-green" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Active Accounts
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-green)" }}>
              {users.filter((u) => u.status === "active" && u.role !== "admin").length}
            </div>
          </div>

          <div className="card card-accent-coral" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Inactive Accounts
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-coral)" }}>
              {users.filter((u) => u.status === "inactive").length}
            </div>
          </div>

          <div className="card card-accent-blue" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Total Platform Liquidity
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800 }}>
              ₹{(totalBalance / 100000).toFixed(1)} Lakhs
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search accounts by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 380, borderRadius: "var(--radius-pill)" }}
          />
        </div>

        {/* Table card */}
        <div className="card card-accent-gold">
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="card-title">User Accounts Directory</h3>
              <div className="card-subtitle">Platform accounts and security status</div>
            </div>
            <span className="pill-badge pill-badge-gold">{filtered.length} Users</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Virtual Balance</th>
                  <th>Trades</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8}><div className="empty-state"><p>Loading users…</p></div></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><p>No users found matching query.</p></div></td></tr>
                ) : filtered.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>{u.name}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>{u.email}</td>
                    <td>
                      <span className={`badge-pill ${u.role === "admin" ? "badge-pill-gold" : "badge-pill-ghost"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>₹{(u.balance || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{u.trades || 0}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {new Date(u.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      <span className={`badge-pill ${u.status === "active" ? "badge-pill-green" : "badge-pill-coral"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      {u.role !== "admin" && (
                        <button
                          className={u.status === "active" ? "btn-pill-coral" : "btn-pill-green"}
                          style={{ padding: "4px 12px", fontSize: "0.72rem" }}
                          onClick={() => toggleStatus(u)}
                        >
                          {u.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
