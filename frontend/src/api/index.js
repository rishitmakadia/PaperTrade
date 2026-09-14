const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

async function request(method, path, body = null) {
  const token = localStorage.getItem("am_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const api = {
  get:    (path)       => request("GET",    path),
  post:   (path, body) => request("POST",   path, body),
  patch:  (path, body) => request("PATCH",  path, body),
  delete: (path)       => request("DELETE", path),
};

export const authAPI = {
  login:          (email, password)       => api.post("/auth/login",  { email, password }),
  signup:         (name, email, password) => api.post("/auth/signup", { name, email, password }),
  me:             ()                      => api.get("/auth/me"),
  updateProfile:  (data)                  => api.patch("/auth/profile", data),
  resetPortfolio: (balance)               => api.post("/auth/reset-portfolio", { balance }),
};

export const dashboardAPI = {
  get: () => api.get("/dashboard"),
};

export const portfoliosAPI = {
  list:        ()                 => api.get("/portfolios"),
  get:         (id)               => api.get(`/portfolios/${id}`),
  create:      (data)             => api.post("/portfolios", data),
  update:      (id, data)         => api.patch(`/portfolios/${id}`, data),
  archive:     (id)               => api.delete(`/portfolios/${id}`),
  reset:       (id, initialCapital) => api.post(`/portfolios/${id}/reset`, { initialCapital }),
  holdings:    (id)               => api.get(`/portfolios/${id}/holdings`),
  trades:      (id, symbol = null) => api.get(`/portfolios/${id}/trades${symbol ? `?symbol=${encodeURIComponent(symbol)}` : ""}`),
  equity:      (id, days = 30)    => api.get(`/portfolios/${id}/equity?days=${days}`),
  stats:       (id)               => api.get(`/portfolios/${id}/stats`),
  performance: (id)               => api.get(`/portfolios/${id}/performance`),
  executeTrade:(id, body)         => api.post(`/portfolios/${id}/trades`, body),
  exportCSV:   (id) => {
    const token = localStorage.getItem("am_token");
    const link  = document.createElement("a");
    const urlEndpoint = id ? `${BASE}/portfolios/${id}/export` : `${BASE}/trades/export`;
    fetch(urlEndpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `trades_${id ? `portfolio_${id}_` : ""}${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      });
  },
};

export const stocksAPI = {
  all:     ()               => api.get("/stocks"),
  search:  (query)          => api.get(`/stocks/search?q=${encodeURIComponent(query)}`),
  indices: ()               => api.get("/stocks/indices"),
  one:     (symbol)         => api.get(`/stocks/${symbol}`),
  history: (symbol, period) => api.get(`/stocks/${symbol}/history?period=${period}`),
  news:    (symbol)         => api.get(`/stocks/${symbol}/news`),
};

export const tradesAPI = {
  list:    (portfolioId = null) =>
    portfolioId ? api.get(`/portfolios/${portfolioId}/trades`) : api.get("/trades"),
  execute: (symbol, name, type, qty, price, orderType, sector, portfolioId = null) => {
    if (portfolioId) {
      return api.post(`/portfolios/${portfolioId}/trades`, { symbol, name, type, qty, price, orderType, sector });
    }
    return api.post("/trades", { symbol, name, type, qty, price, orderType, sector });
  },
  exportCSV: (portfolioId = null) => {
    portfoliosAPI.exportCSV(portfolioId);
  },
};

export const portfolioAPI = {
  positions: (portfolioId = null) =>
    portfolioId ? api.get(`/portfolios/${portfolioId}/holdings`) : api.get("/portfolio"),
  equity:    (days = 30, portfolioId = null) =>
    portfolioId ? api.get(`/portfolios/${portfolioId}/equity?days=${days}`) : api.get(`/portfolio/equity?days=${days}`),
  stats:     (portfolioId = null) =>
    portfolioId ? api.get(`/portfolios/${portfolioId}/stats`) : api.get("/portfolio/stats"),
};

export const watchlistAPI = {
  get:    (portfolioId = null) =>
    portfolioId ? api.get(`/watchlist?portfolioId=${portfolioId}`) : api.get("/watchlist"),
  add:    (symbol, portfolioId = null) =>
    portfolioId ? api.post(`/watchlist/${symbol}?portfolioId=${portfolioId}`) : api.post(`/watchlist/${symbol}`),
  remove: (symbol, portfolioId = null) =>
    portfolioId ? api.delete(`/watchlist/${symbol}?portfolioId=${portfolioId}`) : api.delete(`/watchlist/${symbol}`),
};

export const alertsAPI = {
  list:    (portfolioId = null) =>
    portfolioId ? api.get(`/alerts?portfolioId=${portfolioId}`) : api.get("/alerts"),
  create:  (symbol, name, targetPrice, condition, portfolioId = null) =>
    api.post("/alerts", { symbol, name, targetPrice, condition, portfolioId }),
  delete:  (id) => api.delete(`/alerts/${id}`),
  reset:   (id) => api.patch(`/alerts/${id}/reset`),
  dismiss: (id) => api.patch(`/alerts/${id}/reset`), // alias
};

export const adminAPI = {
  stats:        ()           => api.get("/admin/stats"),
  users:        ()           => api.get("/admin/users"),
  trades:       ()           => api.get("/admin/trades"),
  updateStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
};