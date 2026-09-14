import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import AppLayout from "../../components/AppLayout.jsx";
import { adminAPI } from "../../api/index.js";

const dailyTrades = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  trades: Math.floor(Math.random() * 40 + 5),
  volume: Math.floor(Math.random() * 5000000 + 500000),
}));

export default function AdminDashboard() {
  const [stats,        setStats]        = useState(null);
  const [users,        setUsers]        = useState([]);
  const [trades,       setTrades]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [platformData, setPlatformData] = useState([]);

  useEffect(() => {
    Promise.all([adminAPI.stats(), adminAPI.users(), adminAPI.trades()])
      .then(([s, u, t]) => {
        setStats(s); setUsers(u); setTrades(t);
        // Build 14-day volume from trades
        const now = new Date();
        const vol = Array.from({ length: 14 }, (_, i) => {
          const d = new Date(now); d.setDate(d.getDate() - (13 - i));
          const ds = d.toISOString().split("T")[0];
          const dayTrades = t.filter(tr => tr.createdAt?.startsWith(ds));
          return {
            date: ds.slice(5),
            trades: dayTrades.length,
            value: dayTrades.reduce((acc, tr) => acc + (tr.total || 0), 0),
          };
        });
        setPlatformData(vol);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const recentUsers  = users.filter((u) => u.role !== "admin").slice(0, 5);
  const recentTrades = trades.slice(0, 6);

  return (
    <AppLayout title="Admin Overview">
      <div className="page-body" style={{ paddingTop: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Platform Overview & Operations
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 4 }}>
            PaperTrade Admin Console · Real-time broker telemetry and user ledger
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <div className="card card-accent-gold" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Total Registered Users
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800 }}>
              {loading ? "…" : stats?.totalUsers}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 4 }}>
              {stats?.activeUsers ?? "…"} active traders
            </div>
          </div>

          <div className="card card-accent-green" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Platform Trades
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-green)" }}>
              {loading ? "…" : stats?.totalTrades}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 4 }}>
              Executed all-time
            </div>
          </div>

          <div className="card card-accent-blue" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Aggregate Volume
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {loading ? "…" : `₹${((stats?.totalVolume || 0) / 100000).toFixed(1)}L`}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 4 }}>
              All order values
            </div>
          </div>

          <div className="card card-accent-purple" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              New Signups (MTD)
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800 }}>
              {loading ? "…" : stats?.newUsersThisMonth}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 4 }}>
              Current month growth
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card card-accent-green">
            <div className="card-header">
              <div>
                <h3 className="card-title">Platform Daily Volume</h3>
                <div className="card-subtitle">14-day trade turnover</div>
              </div>
              <span className="pill-badge pill-badge-green">14-DAY</span>
            </div>
            <div className="chart-container" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={platformData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--accent-green)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} width={65} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, boxShadow: "var(--shadow-md)" }}
                    formatter={(v) => [`₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "Volume"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--accent-green)" strokeWidth={2.5} fill="url(#pvGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card card-accent-gold">
            <div className="card-header">
              <div>
                <h3 className="card-title">Trade Frequency Distribution</h3>
                <div className="card-subtitle">Daily transaction executions</div>
              </div>
              <span className="pill-badge pill-badge-gold">ACTIVITY</span>
            </div>
            <div className="chart-container" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrades} barSize={20} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} width={45} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, boxShadow: "var(--shadow-md)" }}
                  />
                  <Bar dataKey="trades" radius={[6, 6, 0, 0]} fill="var(--accent-gold)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent tables */}
        <div className="grid-2">
          {/* Recent Users */}
          <div className="card card-accent-purple">
            <div className="card-header" style={{ marginBottom: 14 }}>
              <div>
                <h3 className="card-title">Recent Registrations</h3>
                <div className="card-subtitle">Latest platform accounts</div>
              </div>
              <span className="pill-badge pill-badge-purple">{recentUsers.length}</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Trades</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u) => (
                    <tr key={u._id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{u.name}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)" }}>{u.email}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{u.trades || 0}</td>
                      <td>
                        <span className={`pill-badge ${u.status === "active" ? "pill-badge-green" : "pill-badge-coral"}`}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="card card-accent-blue">
            <div className="card-header" style={{ marginBottom: 14 }}>
              <div>
                <h3 className="card-title">Recent Order Executions</h3>
                <div className="card-subtitle">Live ledger trades</div>
              </div>
              <span className="pill-badge pill-badge-green">{recentTrades.length}</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Symbol</th>
                    <th>Type</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((t) => (
                    <tr key={t._id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-muted)" }}>{t.userId?.name || "—"}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>{t.symbol}</td>
                      <td>
                        <span className={`badge-pill ${t.type === "BUY" ? "badge-pill-green" : "badge-pill-coral"}`}>
                          {t.type}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>₹{t.total?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
