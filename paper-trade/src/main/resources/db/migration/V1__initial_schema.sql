-- =============================================================================
-- PaperTrade Initial Schema Migration (PostgreSQL)
-- Version: V1
-- Description: Core tables for users, accounts, stocks, holdings, trades,
--              watchlists, price alerts, and backtest runs.
-- =============================================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    avatar_color VARCHAR(20) DEFAULT '#00d4ff',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 2. Accounts table (1-to-1 with User)
CREATE TABLE IF NOT EXISTS accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    cash_balance NUMERIC(19, 4) NOT NULL DEFAULT 1000000.0000,
    initial_balance NUMERIC(19, 4) NOT NULL DEFAULT 1000000.0000,
    total_pnl NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    trade_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- 3. Stocks master table
CREATE TABLE IF NOT EXISTS stocks (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(30) NOT NULL UNIQUE,
    company_name VARCHAR(150) NOT NULL,
    exchange VARCHAR(20) NOT NULL DEFAULT 'NSE',
    sector VARCHAR(50) DEFAULT 'Other',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);

-- 4. Holdings (Open positions) table
CREATE TABLE IF NOT EXISTS holdings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(30) NOT NULL,
    company_name VARCHAR(150),
    quantity INT NOT NULL CHECK (quantity > 0),
    average_buy_price NUMERIC(19, 4) NOT NULL CHECK (average_buy_price > 0),
    sector VARCHAR(50) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_holdings_user_symbol UNIQUE (user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON holdings(symbol);

-- 5. Trades (Historical immutable transactions) table
CREATE TABLE IF NOT EXISTS trades (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(30) NOT NULL,
    company_name VARCHAR(150),
    trade_type VARCHAR(10) NOT NULL, -- BUY, SELL
    quantity INT NOT NULL CHECK (quantity > 0),
    execution_price NUMERIC(19, 4) NOT NULL CHECK (execution_price >= 0),
    total_value NUMERIC(19, 4) NOT NULL CHECK (total_value >= 0),
    realized_pnl NUMERIC(19, 4) DEFAULT 0.0000,
    status VARCHAR(20) NOT NULL DEFAULT 'EXECUTED', -- EXECUTED, CANCELLED, PENDING
    order_type VARCHAR(20) NOT NULL DEFAULT 'MARKET', -- MARKET, LIMIT
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trades_user_created ON trades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);

-- 6. Watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_watchlists_user_symbol UNIQUE (user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);

-- 7. Price Alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(30) NOT NULL,
    company_name VARCHAR(150),
    target_price NUMERIC(19, 4) NOT NULL CHECK (target_price > 0),
    condition VARCHAR(10) NOT NULL, -- above, below
    active BOOLEAN NOT NULL DEFAULT TRUE,
    triggered BOOLEAN NOT NULL DEFAULT FALSE,
    triggered_at TIMESTAMP WITH TIME ZONE,
    triggered_price NUMERIC(19, 4),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_active_triggered ON price_alerts(active, triggered);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON price_alerts(user_id);

-- 8. Backtest Runs history table
CREATE TABLE IF NOT EXISTS backtest_runs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    symbol VARCHAR(30) NOT NULL,
    strategy VARCHAR(50) NOT NULL,
    period VARCHAR(100),
    capital NUMERIC(19, 4) NOT NULL,
    total_return NUMERIC(10, 4),
    win_rate NUMERIC(10, 4),
    max_drawdown NUMERIC(10, 4),
    sharpe_ratio NUMERIC(10, 4),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_backtest_runs_user_id ON backtest_runs(user_id);
