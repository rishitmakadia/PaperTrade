# PaperTrade — Spring Boot Backend

A layered, object-oriented **Spring Boot** backend for the **PaperTrade** personal paper-trading platform, migrated from Node.js/MongoDB to **Java 21**, **PostgreSQL**, **Spring Data JPA**, **Hibernate**, **Spring Security (JWT)**, and **Flyway**.

---

## 1. Technology Stack

- **Java 21**
- **Spring Boot 3.4.3**
  - Spring Web / MVC (REST Controllers)
  - Spring Data JPA + Hibernate
  - Spring Security (Stateless JWT Authentication & BCrypt)
  - Spring Validation (`jakarta.validation`)
  - Spring Scheduling (`@EnableScheduling`)
- **PostgreSQL** (Production & Development relational database)
- **Flyway** (Version-controlled schema migrations)
- **JJWT 0.12.6** (JSON Web Token signing and verification)
- **Lombok** (Boilerplate reduction)
- **H2 Database** (Isolated fast test execution)
- **JUnit 5 + MockMvc** (Unit and integration test suites)

---

## 2. Layered Architecture & Package Design

```
paper-trade/
├── pom.xml
├── src/main/resources/
│   ├── application.properties               # Main PostgreSQL, JWT, CORS, Flyway configuration
│   ├── application-test.properties          # Test profile using H2 database
│   └── db/migration/
│       └── V1__initial_schema.sql           # Flyway PostgreSQL DDL migration
└── src/main/java/com/ppt/papertrade/
    ├── PaperTradeApplication.java
    ├── config/
    │   ├── SecurityConfig.java              # Stateless JWT security, BCrypt, endpoint RBAC
    │   ├── WebMvcConfig.java                # CORS mapping for frontend dev servers
    │   ├── AppConfig.java                   # RestTemplate & scheduling beans
    │   └── DataInitializer.java            # Seeds demo accounts and stock symbols
    ├── security/
    │   ├── JwtTokenProvider.java            # Generates & validates JWT claims (7d expiry)
    │   ├── JwtAuthenticationFilter.java     # Extracts Bearer token & sets SecurityContext
    │   ├── CustomUserDetailsService.java    # Loads user by email or ID
    │   ├── UserPrincipal.java               # Spring Security UserDetails adapter
    │   └── JwtAuthenticationEntryPoint.java # Formats 401 Unauthorized JSON error response
    ├── marketdata/                          # Object-Oriented Live Data Providers
    │   ├── MarketDataService.java           # Live Market Data Interface
    │   ├── YahooMarketDataService.java      # Primary Yahoo Finance client with 60s cache
    │   └── MockMarketDataService.java       # Fallback 24/7 simulation provider
    ├── entity/                              # Relational JPA entities
    │   ├── User.java                        # Traders & Admins
    │   ├── Account.java                     # 1-to-1 virtual cash balance, total P&L
    │   ├── Stock.java                       # Master stock catalog (NSE)
    │   ├── Holding.java                     # User positions with weighted avg buy price
    │   ├── Trade.java                       # Immutable historical order log
    │   ├── WatchlistItem.java               # User stock watchlists
    │   ├── PriceAlert.java                  # Price threshold alerts (ABOVE / BELOW)
    │   ├── BacktestRun.java                 # Simulation run records
    │   ├── Role.java                        # USER, ADMIN
    │   ├── UserStatus.java                  # ACTIVE, INACTIVE
    │   ├── TradeType.java                   # BUY, SELL
    │   ├── OrderStatus.java                 # EXECUTED, CANCELLED, PENDING
    │   ├── OrderType.java                   # MARKET, LIMIT
    │   └── AlertCondition.java              # ABOVE, BELOW
    ├── repository/                          # Spring Data JPA repositories
    ├── service/                             # Business logic layer
    │   ├── AuthService.java & Impl
    │   ├── TradeService.java & Impl         # Transactional BUY/SELL execution
    │   ├── PortfolioService.java & Impl     # Holdings, equity curve replay, stats
    │   ├── WatchlistService.java & Impl
    │   ├── PriceAlertService.java & Impl
    │   ├── BacktestService.java & Impl      # SMA, EMA, RSI, MACD, Bollinger, S&R
    │   └── AdminService.java & Impl         # Platform analytics, user toggling
    ├── scheduler/
    │   └── PriceAlertScheduler.java         # Periodic background alert checking
    ├── controller/                          # REST HTTP endpoints
    │   ├── AuthController.java              # /api/auth
    │   ├── StockController.java             # /api/stocks
    │   ├── TradeController.java             # /api/trades
    │   ├── PortfolioController.java         # /api/portfolio
    │   ├── WatchlistController.java         # /api/watchlist
    │   ├── AlertController.java             # /api/alerts
    │   ├── BacktestController.java          # /api/backtest
    │   ├── AdminController.java             # /api/admin
    │   └── HealthController.java            # /api/health
    ├── dto/
    │   ├── request/                         # Request payloads with validation
    │   └── response/                        # Safe response DTOs with id and _id aliases
    └── exception/
        ├── GlobalExceptionHandler.java      # Central @RestControllerAdvice
        └── Custom Exception classes
```

---

## 3. Database Schema & Relational Model

The database uses a normalized PostgreSQL schema with Flyway migrations (`V1__initial_schema.sql`).

```
 +------------------+           1 : 1           +----------------------+
 |      users       | ------------------------> |       accounts       |
 |------------------|                           |----------------------|
 | id (PK)          |                           | id (PK)              |
 | name             |                           | user_id (FK, Unique) |
 | email (Unique)   |                           | cash_balance         |
 | password_hash    |                           | initial_balance      |
 | role (USER/ADMIN)|                           | total_pnl            |
 | status           |                           | trade_count          |
 | avatar_color     |                           +----------------------+
 +------------------+
          |
          | 1 : N
          +-----------------+-------------------+-------------------+
          |                 |                   |                   |
          v                 v                   v                   v
 +-----------------+ +-----------------+ +-----------------+ +--------------------+
 |    holdings     | |     trades      | |   watchlists    | |    price_alerts    |
 |-----------------| |-----------------| |-----------------| |--------------------|
 | id (PK)         | | id (PK)         | | id (PK)         | | id (PK)            |
 | user_id (FK)    | | user_id (FK)    | | user_id (FK)    | | user_id (FK)       |
 | symbol          | | symbol          | | symbol          | | symbol             |
 | quantity        | | trade_type      | +-----------------+ | target_price       |
 | avg_buy_price   | | quantity        |                     | condition (ABOVE/  |
 | sector          | | execution_price |                     |            BELOW)  |
 +-----------------+ | total_value     |                     | active             |
                     | realized_pnl    |                     | triggered          |
                     | status          |                     | triggered_price    |
                     +-----------------+                     +--------------------+
```

### Key Schema Constraints
- `users.email` is case-insensitively unique.
- `accounts.user_id` is unique (strict 1-to-1 relationship).
- `holdings(user_id, symbol)` has a compound unique constraint — a user has at most one holding per stock symbol.
- `watchlists(user_id, symbol)` has a compound unique constraint.
- Financial monetary columns (`cash_balance`, `execution_price`, `average_buy_price`, `total_value`, `realized_pnl`, `target_price`) use `NUMERIC(19, 4)` in PostgreSQL and `BigDecimal` in Java.

---

## 4. Environment Variables & Configuration

The application is configured in `application.properties` with fallback defaults for local development:

| Environment Variable | Default Value | Description |
|---|---|---|
| `PORT` | `5000` | HTTP server port |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/papertrade` | PostgreSQL JDBC connection URL |
| `DATABASE_USERNAME` | `postgres` | PostgreSQL username |
| `DATABASE_PASSWORD` | `postgres` | PostgreSQL password |
| `JWT_SECRET` | `404E635266556A586E...` | Secret key for signing JWTs (256-bit min) |
| `JWT_EXPIRATION_MS` | `604800000` (7 days) | Token expiration in milliseconds |
| `FRONTEND_URL` | `http://localhost:5173,http://localhost:4173` | Allowed CORS origins |
| `MARKET_DATA_MODE` | `live` | `live` (Yahoo Finance) or `mock` (Simulated) |
| `ALERT_SCHEDULER_ENABLED`| `true` | Enable/disable background alert checks |
| `ALERT_SCHEDULER_INTERVAL_MS`| `60000` (60s) | Polling interval for price alert scheduler |

---

## 5. How to Run the Spring Boot Backend

### Prerequisites
- **Java 21**
- **PostgreSQL 14+** running locally (or remote) with database `papertrade` created:
  ```bash
  psql -U postgres -c "CREATE DATABASE papertrade;"
  ```

### Run Locally with Maven Wrapper
```bash
cd paper-trade
./mvnw spring-boot:run
```

### Run with Custom Environment Variables
```bash
DATABASE_URL="jdbc:postgresql://localhost:5432/papertrade" \
DATABASE_USERNAME="postgres" \
DATABASE_PASSWORD="yourpassword" \
PORT=5000 \
./mvnw spring-boot:run
```

### Run Automated Tests
```bash
cd paper-trade
./mvnw clean test
```

### Build Production JAR
```bash
./mvnw clean package -DskipTests=false
java -jar target/paper-trade-0.0.1-SNAPSHOT.jar
```

---

## 6. Seed Accounts (Auto-Initialized on First Run)

| Email | Password | Role | Initial Balance | Watchlist |
|---|---|---|---|---|
| `krunal@example.com` | `password123` | `USER` | ₹12,47,832.50 | RELIANCE, TCS, HDFCBANK, INFY |
| `Shubham@example.com` | `password123` | `USER` | ₹8,76,540.00 | ICICIBANK, WIPRO |
| `Vraj@example.com` | `password123` | `USER` | ₹15,89,200.00 | SBIN, TATAMOTORS |
| `Raj@example.com` | `password123` | `USER` | ₹21,34,500.00 | MARUTI, BAJFINANCE |
| `Mayur@example.com` | `password123` | `USER` (Inactive)| ₹5,43,000.00 | — |
| `admin@alphametrics.in` | `admin123` | `ADMIN` | ₹0.00 | — |

---

## 7. Complete List of Implemented REST APIs

### Authentication (`/api/auth`)
- `POST /api/auth/signup` — Register new user (returns JWT token and safe user profile).
- `POST /api/auth/login` — Authenticate user (returns JWT token and safe user profile).
- `GET /api/auth/me` — Get current logged-in user profile.
- `PATCH /api/auth/profile` — Update name, email, password, avatar color, or virtual balance.
- `POST /api/auth/reset-portfolio` — Reset portfolio (wipes positions & trades, resets balance).

### Stocks & Market Data (`/api/stocks`)
- `GET /api/stocks` — Real-time quotes for all active NSE stocks (cached for 60s).
- `GET /api/stocks/indices` — Real-time index quotes (NIFTY 50, SENSEX, NIFTY BANK).
- `GET /api/stocks/{symbol}` — Detailed quote and statistics for a single stock.
- `GET /api/stocks/{symbol}/history?period=1W|1M|3M|1Y` — Historical OHLCV candle data.
- `GET /api/stocks/{symbol}/news` — Latest news articles for a stock.

### Trades & Order Execution (`/api/trades`)
- `GET /api/trades` — User's trade history sorted by execution date descending.
- `POST /api/trades` — Atomically execute BUY or SELL order with cash balance and holding validation.
- `GET /api/trades/export` — Download trade history as CSV file (`trades_YYYY-MM-DD.csv`).

### Portfolio (`/api/portfolio`)
- `GET /api/portfolio` — Current open holdings with quantity, average buy price, and sector.
- `GET /api/portfolio/equity?days=30` — Reconstructed historical equity curve data points.
- `GET /api/portfolio/stats` — Day P&L, today's buy/sell order counts, and total trade count.

### Watchlist (`/api/watchlist`)
- `GET /api/watchlist` — User's watchlist stock symbols array.
- `POST /api/watchlist/{symbol}` — Add stock symbol to user's watchlist.
- `DELETE /api/watchlist/{symbol}` — Remove stock symbol from user's watchlist.

### Price Alerts (`/api/alerts`)
- `GET /api/alerts` — List user's active and triggered price alerts.
- `POST /api/alerts` — Create price alert (`symbol`, `targetPrice`, `condition: above/below`).
- `DELETE /api/alerts/{id}` — Delete price alert.
- `PATCH /api/alerts/{id}/reset` — Reset/re-arm a triggered price alert.

### Backtesting Simulator (`/api/backtest`)
- `POST /api/backtest` — Simulate algorithmic strategies on historical candles (`SMA`, `EMA`, `RSI`, `MACD`, `Bollinger`, `S&R`). Returns Total Return, Win Rate, Max Drawdown, Sharpe Ratio, and simulated trade log.

### Admin Panel (`/api/admin`) *(Requires ROLE_ADMIN)*
- `GET /api/admin/stats` — Platform overview metrics (total users, active users, total trades, platform volume, new signups this month).
- `GET /api/admin/users` — List all platform users with account balances and trade activity.
- `PATCH /api/admin/users/{id}/status` — Activate or deactivate user account (`{ status: "active" | "inactive" }`).
- `GET /api/admin/trades` — List all executed trades platform-wide with user details.

### System Health
- `GET /api/health` — Public health check status (`{ "status": "ok", "app": "PaperTrade", "time": "..." }`).

---

## 8. Financial Precision & Calculations

### Weighted Average Buy Price (BUY)
$$\text{NewAvgPrice} = \frac{(\text{CurrentQty} \times \text{CurrentAvgPrice}) + (\text{NewQty} \times \text{ExecutionPrice})}{\text{CurrentQty} + \text{NewQty}}$$

### Realized P&L (SELL)
$$\text{RealizedPnL} = (\text{ExecutionPrice} - \text{HoldingAvgBuyPrice}) \times \text{SoldQty}$$

### Unrealized P&L (Mark-to-Market)
$$\text{UnrealizedPnL} = (\text{CurrentLivePrice} - \text{HoldingAvgBuyPrice}) \times \text{HoldingQty}$$

---

## 9. Feature Removed

As requested, **Leaderboard functionality has been completely removed**:
- No `/api/leaderboard` route
- No leaderboard entities, tables, repositories, or services
- No ranking queries or leaderboard calculations in admin analytics
