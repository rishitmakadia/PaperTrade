import React, { useState, useEffect } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { adminAPI } from "../../api/index.js";
import { useAuth } from "../../context/AuthContext.jsx";

const AVATAR_COLORS = [
  "#00d4ff",
  "#00ff88",
  "#b44dff",
  "#ffd700",
  "#ff6b35",
  "#ff3366",
  "#38bdf8",
  "#4ade80",
];

export default function AdminUsers() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  // Modals state
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "user",
    status: "active",
    balance: "",
    avatarColor: "#00d4ff",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete loading state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadUsers = () => {
    setLoading(true);
    adminAPI.users()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleStatus = async (user) => {
    const userId = user.id || user._id;
    const newStatus = user.status === "active" ? "inactive" : "active";
    setTogglingId(userId);

    try {
      const updated = await adminAPI.updateStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => ((u.id || u._id) === userId ? { ...u, status: updated.status || newStatus } : u))
      );
      if (viewUser && (viewUser.id || viewUser._id) === userId) {
        setViewUser((prev) => ({ ...prev, status: updated.status || newStatus }));
      }
    } catch (err) {
      alert("Failed to update status: " + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenEdit = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "user",
      status: user.status || "active",
      balance: user.balance !== undefined ? user.balance : "",
      avatarColor: user.avatarColor || "#00d4ff",
    });
    setEditError("");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    setEditError("");

    const userId = editUser.id || editUser._id;
    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        status: editForm.status,
        balance: editForm.balance !== "" ? Number(editForm.balance) : undefined,
        avatarColor: editForm.avatarColor,
      };

      const updated = await adminAPI.updateUser(userId, payload);
      setUsers((prev) =>
        prev.map((u) => ((u.id || u._id) === userId ? { ...u, ...updated } : u))
      );
      if (viewUser && (viewUser.id || viewUser._id) === userId) {
        setViewUser({ ...viewUser, ...updated });
      }
      setEditUser(null);
    } catch (err) {
      setEditError(err.message || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteUser) return;
    const userId = deleteUser.id || deleteUser._id;
    setDeleteLoading(true);
    setDeleteError("");

    try {
      await adminAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => (u.id || u._id) !== userId));
      if (viewUser && (viewUser.id || viewUser._id) === userId) {
        setViewUser(null);
      }
      setDeleteUser(null);
    } catch (err) {
      setDeleteError(err.message || "Failed to delete user account");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = users.filter((u) => u.role === "user").reduce((s, u) => s + (Number(u.balance) || 0), 0);
  const activeCount = users.filter((u) => u.status === "active" && u.role !== "admin").length;
  const inactiveCount = users.filter((u) => u.status === "inactive").length;

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
              {activeCount}
            </div>
          </div>

          <div className="card card-accent-coral" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Inactive Accounts
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-coral)" }}>
              {inactiveCount}
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

        {/* Search & Actions Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 380 }}>
            <input
              type="text"
              placeholder="Search accounts by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ borderRadius: "var(--radius-pill)", paddingLeft: 36 }}
            />
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              🔍
            </span>
          </div>

          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> accounts
          </div>
        </div>

        {/* Table card */}
        <div className="card card-accent-gold">
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="card-title">User Accounts Directory</h3>
              <div className="card-subtitle">Manage trader access, permissions, and accounts</div>
            </div>
            <span className="pill-badge pill-badge-gold">{filtered.length} Users</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Trader</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Virtual Balance</th>
                  <th>Trades</th>
                  <th>Joined Date</th>
                  <th>Status Toggle</th>
                  <th style={{ textAlign: "right", paddingRight: 20 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state" style={{ padding: "40px 0" }}>
                        <p>Loading users…</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state" style={{ padding: "40px 0" }}>
                        <p>No users found matching query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const uId = u.id || u._id;
                    const isSelf = currentAdmin && ((currentAdmin.id || currentAdmin._id) === uId || currentAdmin.email === u.email);
                    const isActive = u.status === "active";
                    const isToggling = togglingId === uId;

                    return (
                      <tr key={uId}>
                        {/* Name + Avatar */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: u.avatarColor || "var(--accent-gold)",
                                color: "#000",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: "0.82rem",
                                fontFamily: "var(--font-display)",
                                flexShrink: 0,
                              }}
                            >
                              {(u.name || "U")[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
                                {u.name}
                              </div>
                              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                                #{uId}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                          {u.email}
                        </td>

                        {/* Role */}
                        <td>
                          <span className={`badge-pill ${u.role === "admin" ? "badge-pill-gold" : "badge-pill-ghost"}`}>
                            {u.role}
                          </span>
                        </td>

                        {/* Virtual Balance */}
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
                          ₹{Number(u.balance || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </td>

                        {/* Trades */}
                        <td style={{ fontFamily: "var(--font-mono)" }}>
                          {u.trades || 0}
                        </td>

                        {/* Joined Date */}
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}
                        </td>

                        {/* Inactive / Active Toggle Switch */}
                        <td>
                          <button
                            type="button"
                            onClick={() => !isToggling && toggleStatus(u)}
                            disabled={isToggling}
                            title={isActive ? "Click to deactivate account" : "Click to activate account"}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              background: isActive ? "rgba(0, 255, 136, 0.1)" : "rgba(255, 94, 77, 0.1)",
                              border: `1px solid ${isActive ? "rgba(0, 255, 136, 0.3)" : "rgba(255, 94, 77, 0.3)"}`,
                              padding: "4px 10px",
                              borderRadius: 20,
                              cursor: isToggling ? "wait" : "pointer",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: isActive ? "var(--accent-green)" : "var(--accent-coral)",
                                boxShadow: isActive ? "0 0 6px var(--accent-green)" : "0 0 6px var(--accent-coral)",
                              }}
                            />
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                color: isActive ? "var(--accent-green)" : "var(--accent-coral)",
                                textTransform: "capitalize",
                              }}
                            >
                              {isToggling ? "…" : u.status}
                            </span>
                          </button>
                        </td>

                        {/* Three Action Options: View / Edit / Delete */}
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {/* 1. View Option */}
                            <button
                              className="btn-pill-ghost"
                              style={{ padding: "4px 10px", fontSize: "0.72rem" }}
                              onClick={() => setViewUser(u)}
                              title="View full account details"
                            >
                              👁 View
                            </button>

                            {/* 2. Edit Option */}
                            <button
                              className="btn-pill-ghost"
                              style={{ padding: "4px 10px", fontSize: "0.72rem", color: "var(--accent-gold)", borderColor: "rgba(246,201,68,0.3)" }}
                              onClick={() => handleOpenEdit(u)}
                              title="Edit user details and balance"
                            >
                              ✏️ Edit
                            </button>

                            {/* 3. Delete Option */}
                            <button
                              className="btn-pill-ghost"
                              style={{
                                padding: "4px 10px",
                                fontSize: "0.72rem",
                                color: isSelf ? "var(--text-muted)" : "var(--accent-coral)",
                                borderColor: isSelf ? "var(--border)" : "rgba(255,94,77,0.3)",
                                opacity: isSelf ? 0.5 : 1,
                                cursor: isSelf ? "not-allowed" : "pointer",
                              }}
                              disabled={isSelf}
                              onClick={() => !isSelf && setDeleteUser(u)}
                              title={isSelf ? "Cannot delete your own account" : "Delete user account"}
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── 1. VIEW USER MODAL ─── */}
        {viewUser && (
          <div className="modal-overlay" onClick={() => setViewUser(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      background: viewUser.avatarColor || "var(--accent-gold)",
                      color: "#000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "1.2rem",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {(viewUser.name || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem", color: "var(--text-primary)", margin: 0 }}>
                      {viewUser.name}
                    </h3>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {viewUser.email}
                    </div>
                  </div>
                </div>
                <button
                  className="btn-pill-ghost"
                  style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                  onClick={() => setViewUser(null)}
                >
                  ✕
                </button>
              </div>

              {/* Badges Ribbon */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <span className={`badge-pill ${viewUser.role === "admin" ? "badge-pill-gold" : "badge-pill-ghost"}`}>
                  Role: {viewUser.role?.toUpperCase()}
                </span>
                <span className={`badge-pill ${viewUser.status === "active" ? "badge-pill-green" : "badge-pill-coral"}`}>
                  Status: {viewUser.status?.toUpperCase()}
                </span>
                <span className="badge-pill badge-pill-ghost">
                  ID: #{viewUser.id || viewUser._id}
                </span>
              </div>

              {/* Detail Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                <div style={{ background: "var(--bg-elevated)", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Virtual Balance
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", marginTop: 4 }}>
                    ₹{Number(viewUser.balance || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div style={{ background: "var(--bg-elevated)", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Realized P&L
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      color: Number(viewUser.pnl || 0) >= 0 ? "var(--accent-green)" : "var(--accent-coral)",
                      marginTop: 4,
                    }}
                  >
                    {Number(viewUser.pnl || 0) >= 0 ? "+" : ""}₹{Number(viewUser.pnl || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div style={{ background: "var(--bg-elevated)", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Executed Trades
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", marginTop: 4 }}>
                    {viewUser.trades || 0}
                  </div>
                </div>

                <div style={{ background: "var(--bg-elevated)", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Active Portfolios
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 800, color: "var(--accent-gold)", marginTop: 4 }}>
                    {viewUser.portfoliosCount || 1}
                  </div>
                </div>
              </div>

              {/* Timestamp Info */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginBottom: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>Registered On</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                    {viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleString("en-IN") : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>Last Updated</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                    {viewUser.updatedAt ? new Date(viewUser.updatedAt).toLocaleString("en-IN") : "—"}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="btn-pill btn-pill-ghost"
                  onClick={() => setViewUser(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-pill btn-pill-gold"
                  onClick={() => {
                    const u = viewUser;
                    setViewUser(null);
                    handleOpenEdit(u);
                  }}
                >
                  ✏️ Edit User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── 2. EDIT USER MODAL ─── */}
        {editUser && (
          <div className="modal-overlay" onClick={() => !editLoading && setEditUser(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem", color: "var(--text-primary)", margin: 0 }}>
                  ✏️ Edit Account — {editUser.name}
                </h3>
                <button
                  className="btn-pill-ghost"
                  style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                  onClick={() => !editLoading && setEditUser(null)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Name */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                    />
                  </div>

                  {/* Role & Status Row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: "0.75rem" }}>System Role</label>
                      <select
                        className="form-input"
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        style={{ background: "var(--bg-elevated)", cursor: "pointer" }}
                      >
                        <option value="user">USER (Trader)</option>
                        <option value="admin">ADMIN (Administrator)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: "0.75rem" }}>Account Status</label>
                      <select
                        className="form-input"
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        style={{ background: "var(--bg-elevated)", cursor: "pointer" }}
                      >
                        <option value="active">ACTIVE</option>
                        <option value="inactive">INACTIVE</option>
                      </select>
                    </div>
                  </div>

                  {/* Virtual Cash Balance */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>Virtual Cash Balance (₹)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={editForm.balance}
                      onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
                      placeholder="e.g. 1000000"
                    />
                  </div>

                  {/* Avatar Accent Color */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>Avatar Accent Color</label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
                      {AVATAR_COLORS.map((c) => (
                        <div
                          key={c}
                          onClick={() => setEditForm({ ...editForm, avatarColor: c })}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: c,
                            cursor: "pointer",
                            border: editForm.avatarColor === c ? "2px solid #fff" : "2px solid transparent",
                            transform: editForm.avatarColor === c ? "scale(1.2)" : "scale(1)",
                            transition: "all 0.15s ease",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {editError && (
                    <div style={{
                      background: "rgba(255,94,77,0.1)",
                      border: "1px solid rgba(255,94,77,0.3)",
                      borderRadius: "var(--radius-md)",
                      padding: "8px 12px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.74rem",
                      color: "var(--accent-coral)",
                    }}>
                      ⚠ {editError}
                    </div>
                  )}

                  {/* Buttons */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn-pill btn-pill-ghost"
                      onClick={() => setEditUser(null)}
                      disabled={editLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-pill btn-pill-gold"
                      disabled={editLoading}
                    >
                      {editLoading ? "Saving Changes…" : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── 3. DELETE USER CONFIRMATION MODAL ─── */}
        {deleteUser && (
          <div className="modal-overlay" onClick={() => !deleteLoading && setDeleteUser(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: "1.8rem" }}>⚠️</div>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.15rem", color: "var(--accent-coral)", margin: 0 }}>
                    Delete Account Confirmation
                  </h3>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Irreversible administrative action
                  </div>
                </div>
              </div>

              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 16px 0" }}>
                Are you sure you want to permanently delete <strong>{deleteUser.name}</strong> (<code>{deleteUser.email}</code>)?
                <br /><br />
                This will delete all portfolios, order ledger histories, and holdings linked to this trader.
              </p>

              {deleteError && (
                <div style={{
                  background: "rgba(255,94,77,0.1)",
                  border: "1px solid rgba(255,94,77,0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "8px 12px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.74rem",
                  color: "var(--accent-coral)",
                  marginBottom: 16,
                }}>
                  ⚠ {deleteError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="btn-pill btn-pill-ghost"
                  onClick={() => setDeleteUser(null)}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-pill-coral"
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  style={{ padding: "8px 18px", fontSize: "0.82rem" }}
                >
                  {deleteLoading ? "Deleting Account…" : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
