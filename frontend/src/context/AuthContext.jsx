import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI, portfoliosAPI, watchlistAPI, tradesAPI } from "../api/index.js";

const AuthContext = createContext(null);

const ACTIVE_PORTFOLIO_KEY = "am_active_portfolio_id";

export const AuthProvider = ({ children }) => {
  const [user,             setUser]             = useState(null);
  const [portfolios,       setPortfolios]       = useState([]);
  const [currentPortfolio, setCurrentPortfolio] = useState(null);
  const [balance,          setBalance]          = useState(0);
  const [watchlist,        setWatchlist]        = useState([]);
  const [notification,     setNotification]     = useState(null);
  const [loading,          setLoading]          = useState(true);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // Fetch portfolios and select active
  const refreshPortfolios = useCallback(async (preferredId = null) => {
    try {
      const list = await portfoliosAPI.list();
      setPortfolios(list);

      const savedId = preferredId || Number(localStorage.getItem(ACTIVE_PORTFOLIO_KEY));
      let active = list.find((p) => p.id === savedId);
      if (!active) {
        active = list.find((p) => p.isDefault) || list[0] || null;
      }

      setCurrentPortfolio(active);
      if (active) {
        setBalance(active.cashBalance ?? active.portfolioValue ?? 0);
        localStorage.setItem(ACTIVE_PORTFOLIO_KEY, String(active.id));
        // load watchlist for active portfolio
        try {
          const wl = await watchlistAPI.get(active.id);
          setWatchlist(Array.isArray(wl) ? wl.map((i) => i.symbol || i) : []);
        } catch (_) {
          setWatchlist([]);
        }
      }
      return list;
    } catch (err) {
      console.error("Failed to load portfolios:", err);
      return [];
    }
  }, []);

  // Switch active portfolio
  const switchPortfolio = useCallback(async (portfolioOrId) => {
    const id = typeof portfolioOrId === "object" ? portfolioOrId.id : Number(portfolioOrId);
    localStorage.setItem(ACTIVE_PORTFOLIO_KEY, String(id));
    
    // Find in existing list first for instant UI response
    setPortfolios((prevList) => {
      const found = prevList.find((p) => p.id === id);
      if (found) {
        setCurrentPortfolio(found);
        setBalance(found.cashBalance ?? found.portfolioValue ?? 0);
      }
      return prevList;
    });

    // Fetch full watchlist and fresh stats
    try {
      const wl = await watchlistAPI.get(id);
      setWatchlist(Array.isArray(wl) ? wl.map((i) => i.symbol || i) : []);
    } catch (_) {}
  }, []);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem("am_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authAPI.me()
      .then(async ({ user }) => {
        setUser(user);
        await refreshPortfolios();
      })
      .catch(() => {
        localStorage.removeItem("am_token");
        localStorage.removeItem(ACTIVE_PORTFOLIO_KEY);
      })
      .finally(() => setLoading(false));
  }, [refreshPortfolios]);

  // Auth
  const login = async (email, password) => {
    try {
      const { token, user } = await authAPI.login(email, password);
      localStorage.setItem("am_token", token);
      setUser(user);
      await refreshPortfolios();
      return { success: true, role: user.role };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const { token, user } = await authAPI.signup(name, email, password);
      localStorage.setItem("am_token", token);
      setUser(user);
      await refreshPortfolios();
      return { success: true, role: user.role };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setPortfolios([]);
    setCurrentPortfolio(null);
    setBalance(0);
    setWatchlist([]);
    localStorage.removeItem("am_token");
    localStorage.removeItem(ACTIVE_PORTFOLIO_KEY);
  };

  // Update profile
  const updateProfile = async (data) => {
    try {
      const { user: updated } = await authAPI.updateProfile(data);
      setUser(updated);
      await refreshPortfolios();
      showNotification("Profile updated successfully!", "success");
      return { success: true };
    } catch (err) {
      showNotification(err.message, "error");
      return { success: false, error: err.message };
    }
  };

  // Create new portfolio
  const createPortfolio = async (portfolioData) => {
    try {
      const created = await portfoliosAPI.create(portfolioData);
      await refreshPortfolios(created.id);
      showNotification(`Portfolio "${created.name}" created successfully!`, "success");
      return { success: true, portfolio: created };
    } catch (err) {
      showNotification(err.message, "error");
      return { success: false, error: err.message };
    }
  };

  // Update portfolio details
  const updatePortfolio = async (portfolioId, data) => {
    try {
      const updated = await portfoliosAPI.update(portfolioId, data);
      await refreshPortfolios(portfolioId);
      showNotification("Portfolio updated successfully!", "success");
      return { success: true, portfolio: updated };
    } catch (err) {
      showNotification(err.message, "error");
      return { success: false, error: err.message };
    }
  };

  // Archive / Delete portfolio
  const archivePortfolio = async (portfolioId) => {
    try {
      await portfoliosAPI.archive(portfolioId);
      await refreshPortfolios();
      showNotification("Portfolio deleted successfully", "info");
      return { success: true };
    } catch (err) {
      showNotification(err.message, "error");
      return { success: false, error: err.message };
    }
  };

  // Reset portfolio
  const resetPortfolio = async (newBalance, targetPortfolioId = null) => {
    const portId = targetPortfolioId || currentPortfolio?.id;
    try {
      if (portId) {
        await portfoliosAPI.reset(portId, newBalance);
      } else {
        await authAPI.resetPortfolio(newBalance);
      }
      await refreshPortfolios(portId);
      showNotification(
        `Portfolio reset! Fresh start with ₹${Number(newBalance).toLocaleString("en-IN")}`,
        "success"
      );
      return { success: true };
    } catch (err) {
      showNotification(err.message, "error");
      return { success: false, error: err.message };
    }
  };

  // Watchlist scoped to current portfolio
  const addToWatchlist = async (symbol, targetPortfolioId = null) => {
    const portId = targetPortfolioId || currentPortfolio?.id;
    if (watchlist.includes(symbol)) return;
    try {
      const updated = await watchlistAPI.add(symbol, portId);
      setWatchlist((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]));
      showNotification(`${symbol} added to watchlist`, "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const removeFromWatchlist = async (symbol, targetPortfolioId = null) => {
    const portId = targetPortfolioId || currentPortfolio?.id;
    try {
      await watchlistAPI.remove(symbol, portId);
      setWatchlist((prev) => prev.filter((s) => s !== symbol));
      showNotification(`${symbol} removed from watchlist`, "info");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  // Execute trade scoped to target or current portfolio
  const executeTrade = async (
    symbol,
    type,
    qty,
    price,
    name = "",
    orderType = "MARKET",
    sector = "",
    targetPortfolioId = null
  ) => {
    const portId = targetPortfolioId || currentPortfolio?.id;
    try {
      const res = await tradesAPI.execute(symbol, name, type, qty, price, orderType, sector, portId);
      if (res.balance !== undefined) {
        setBalance(res.balance);
      }
      await refreshPortfolios(portId);
      showNotification(
        `${type} ${qty} × ${symbol} @ ₹${Number(price).toLocaleString("en-IN")} executed!`,
        "success"
      );
      return true;
    } catch (err) {
      showNotification(err.message, "error");
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        portfolios,
        currentPortfolio,
        setCurrentPortfolio: switchPortfolio,
        refreshPortfolios,
        createPortfolio,
        updatePortfolio,
        archivePortfolio,
        balance,
        watchlist,
        notification,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        resetPortfolio,
        addToWatchlist,
        removeFromWatchlist,
        showNotification,
        executeTrade,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
