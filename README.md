# Private Portfolio Terminal

A modern, full-stack paper trading terminal and personal portfolio management system built for Indian stock markets (NSE & BSE).

Powered by **Spring Boot 3 + PostgreSQL** on the backend and **React + Vite** on the frontend, streaming real-time and closing market quotes directly from **Yahoo Finance**.

---

## 🌟 Key Highlights

- 💼 **Isolated Multi-Portfolio Architecture**: Create and manage multiple distinct trading portfolios (e.g. Swing Trading, Long-Term, Growth, High-Risk) with dedicated virtual capital, independent cash balances, and separate trade logs.
- 📈 **Indian Equities & Live Market Feed**: Streams real-time prices, day high/low ranges, volume, and closing data for NSE/BSE equities via Yahoo Finance.
- 🔍 **Dynamic Stock Search**: Search any Indian company (e.g. `RELIANCE`, `TCS`, `ZOMATO`/`ETERNAL`, `TATAPOWER`, `IRFC`) with instant quote lookup and full directory integration.
- ✏️ **Order Price Override**: Customize/edit execution prices directly in the order modal (using the ✏️ pen icon) for custom price execution, limit testing, and off-market trading.
- 📊 **Portfolio Telemetry & Analytics**: Real-time unrealized/realized P&L, overall net worth, equity curves, sector exposure distribution, and trade history.
- ⟳ **Quantitative Strategy Backtester**: Test historical algorithmic trading strategies (SMA Crossover, EMA, RSI Momentum, MACD, Bollinger Bands, Support/Resistance) on historical market data.
- 🔔 **Price Alerts**: Set target price threshold notifications for your watched stocks.
- 🛡️ **Institutional Admin Console**: Manage users, inspect system-wide transactions, and monitor platform telemetry.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Java 21, Spring Boot 3.4.x, Spring Data JPA / Hibernate, Spring Security + JWT, Flyway Migrations |
| **Database** | PostgreSQL (`papertrade` database) |
| **Market Data** | Yahoo Finance API (v8 Chart & Quote streams with caching) |
| **Frontend** | React 18, Vite 5, Recharts, React Router v6, Custom Vanilla CSS Design System |

---

## 🚀 Quick Start

For detailed first-time setup, port conflict resolution, database configuration, and running instructions, refer to:

👉 **[PROJECT_RUN.md](./PROJECT_RUN.md)**

### Fast Launch:

```bash
# 1. Start PostgreSQL (Database: papertrade)

# 2. Start Backend (Terminal 1)
cd paper-trade
./mvnw spring-boot:run

# 3. Start Frontend (Terminal 2)
cd frontend
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5001/api](http://localhost:5001/api)
- **Backend Health**: [http://localhost:5001/actuator/health](http://localhost:5001/actuator/health)

---

