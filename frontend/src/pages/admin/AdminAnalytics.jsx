import React, { useState, useEffect } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { adminAPI } from "../../api/index.js";
import { generatePortfolioHistory } from "../../data/mockData.jsx";

const SECTOR_DATA = [
  { name: "Banking & Financials", value: 28, color: "#F6C944" },
  { name: "Information Tech",    value: 22, color: "#85E39E" },
  { name: "Energy & Petrochem",   value: 18, color: "#FF5E4D" },
  { name: "Automobiles",          value: 12, color: "#6BA4FF" },
  { name: "Pharmaceuticals",     value: 10, color: "#B44DFF" },
  { name: "Consumer Goods",       value: 10, color: "#FF80DF" },
];

const signupData = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  signups: Math.floor(Math.random() * 8 + 1),
  trades:  Math.floor(Math.random() * 60 + 10),
}));

const retentionData = [
  { week: "W1", rate: 92 }, { week: "W2", rate: 85 }, { week: "W3", rate: 79 },
  { week: "W4", rate: 71 }, { week: "W6", rate: 64 }, { week: "W8", rate: 58 },
];

const volumeData = generatePortfolioHistory(60, 10000000);

export default function AdminAnalytics() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    adminAPI.users().then(setUsers).catch(console.error);
  }, []);

  const regularUsers = users.filter((u) => u.role !== "admin");
  const profitable   = regularUsers.filter((u) => (u.pnl || 0) > 0).length;
  const avgTrades    = regularUsers.length > 0 ? Math.round(regularUsers.reduce((s, u) => s + (u.trades || 0), 0) / regularUsers.length) : 0;
  const totalPnl     = regularUsers.reduce((s, u) => s + (u.pnl || 0), 0);

  return (
    <AppLayout title="Platform Analytics">
      <div className="page-body" style={{ paddingTop: 20 }}>
        {/* Stat Cards */}
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <div className="card card-accent-green" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Profitable Users
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-green)" }}>
              {profitable}/{regularUsers.length}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 4 }}>
              {regularUsers.length ? `${((profitable / regularUsers.length) * 100).toFixed(0)}% profitability rate` : "—"}
            </div>
          </div>

          <div className="card card-accent-gold" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Avg Trades Per User
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800 }}>
              {avgTrades}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 4 }}>
              Lifetime activity
            </div>
          </div>

          <div className={`card ${totalPnl >= 0 ? "card-accent-green" : "card-accent-coral"}`} style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Platform Net Return
            </div>
            <div className={totalPnl >= 0 ? "pos" : "neg"} style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800 }}>
              {totalPnl >= 0 ? "+" : ""}₹{(totalPnl / 100000).toFixed(1)}L
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 4 }}>
              Aggregate trader alpha
            </div>
          </div>

          <div className="card card-accent-purple" style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Avg Trading Session
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800 }}>
              24 mins
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 4 }}>
              Per active session
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card card-accent-green">
            <div className="card-header">
              <div>
                <h3 className="card-title">Platform Volume Telemetry (60d)</h3>
                <div className="card-subtitle">Aggregate liquidity flow</div>
              </div>
              <span className="pill-badge pill-badge-green">+18.4%</span>
            </div>
            <div className="chart-container" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="avGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--accent-green)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval={10} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000000).toFixed(1)}M`} width={65} />
                  <Tooltip formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Volume"]} contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, boxShadow: "var(--shadow-md)" }} />
                  <Area type="monotone" dataKey="value" stroke="var(--accent-green)" strokeWidth={2.5} fill="url(#avGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card card-accent-blue">
            <div className="card-header">
              <div>
                <h3 className="card-title">Signups vs Trade Activity (2025)</h3>
                <div className="card-subtitle">Platform adoption metrics</div>
              </div>
            </div>
            <div className="chart-container" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signupData} barGap={4} barSize={14} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} width={45} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, boxShadow: "var(--shadow-md)" }} />
                  <Legend wrapperStyle={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", paddingTop: 8 }} />
                  <Bar dataKey="signups" name="Signups" fill="var(--accent-gold)"  radius={[4,4,0,0]} />
                  <Bar dataKey="trades"  name="Trades"  fill="var(--accent-green)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card card-accent-purple">
            <div className="card-header">
              <div>
                <h3 className="card-title">Weekly Trader Retention</h3>
                <div className="card-subtitle">Cohort engagement curve</div>
              </div>
              <span className="pill-badge pill-badge-purple">COHORT</span>
            </div>
            <div className="chart-container" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={retentionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} domain={[0,100]} tickFormatter={(v) => `${v}%`} width={50} />
                  <Tooltip formatter={(v) => [`${v}%`, "Retention"]} contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, boxShadow: "var(--shadow-md)" }} />
                  <Line type="monotone" dataKey="rate" stroke="var(--accent-purple)" strokeWidth={2.5} dot={{ fill: "var(--accent-purple)", r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card card-accent-gold">
            <div className="card-header" style={{ marginBottom: 14 }}>
              <div>
                <h3 className="card-title">Sector Allocation Breakdown</h3>
                <div className="card-subtitle">Distribution by industry</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={SECTOR_DATA} cx="50%" cy="50%" innerRadius={38} outerRadius={65} dataKey="value" paddingAngle={3}>
                      {SECTOR_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                {SECTOR_DATA.map((s) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-secondary)" }}>{s.name}</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User performance overview */}
        <div className="card card-accent-gold">
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="card-title">User Account Performance</h3>
              <div className="card-subtitle">Balance & realized P&L directory</div>
            </div>
            <span className="pill-badge pill-badge-gold">⭐ ACCOUNTS</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Trader</th>
                  <th>Virtual Balance</th>
                  <th>Realized P&L</th>
                  <th>Executed Trades</th>
                </tr>
              </thead>
              <tbody>
                {[...regularUsers].sort((a, b) => (b.pnl || 0) - (a.pnl || 0)).map((u, i) => (
                  <tr key={u._id}>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: i === 0 ? "var(--accent-gold)" : i === 1 ? "var(--text-secondary)" : i === 2 ? "var(--accent-coral)" : "var(--text-muted)" }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: u.avatarColor || "var(--accent-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, color: "#000", fontSize: "0.85rem" }}>
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{u.name}</div>
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>₹{(u.balance || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    <td className={(u.pnl || 0) >= 0 ? "pos" : "neg"} style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {(u.pnl || 0) >= 0 ? "+" : ""}₹{Math.abs(u.pnl || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{u.trades || 0}</td>
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
