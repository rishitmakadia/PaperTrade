-- =============================================================================
-- PaperTrade Multi-Portfolio Architecture Migration (PostgreSQL)
-- Version: V2
-- Description: Creates portfolios table, migrates accounts, holdings, trades,
--              watchlists, price alerts, and backtest runs to be portfolio-scoped.
-- =============================================================================

-- 1. Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    initial_capital NUMERIC(19, 4) NOT NULL DEFAULT 1000000.0000,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_portfolios_user_name UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_status ON portfolios(user_id, status);

-- 2. Populate default portfolios for all existing users from their accounts
INSERT INTO portfolios (user_id, name, description, initial_capital, status, is_default, created_at, updated_at)
SELECT 
    u.id, 
    'Main Portfolio', 
    'Primary paper trading portfolio', 
    COALESCE(a.initial_balance, 1000000.0000), 
    'ACTIVE', 
    TRUE, 
    COALESCE(u.created_at, CURRENT_TIMESTAMP), 
    CURRENT_TIMESTAMP
FROM users u
LEFT JOIN accounts a ON a.user_id = u.id
ON CONFLICT (user_id, name) DO NOTHING;

-- 3. Add portfolio_id column to accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS portfolio_id BIGINT;

UPDATE accounts a
SET portfolio_id = p.id
FROM portfolios p
WHERE p.user_id = a.user_id AND p.is_default = TRUE;

-- Fallback for any accounts where is_default might not have matched
UPDATE accounts a
SET portfolio_id = (SELECT p.id FROM portfolios p WHERE p.user_id = a.user_id LIMIT 1)
WHERE a.portfolio_id IS NULL;

-- Make portfolio_id NOT NULL and add foreign key / unique constraint
ALTER TABLE accounts ALTER COLUMN portfolio_id SET NOT NULL;
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_user_id_key;
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_user_id_fkey;
ALTER TABLE accounts ADD CONSTRAINT fk_accounts_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE;
ALTER TABLE accounts ADD CONSTRAINT uq_accounts_portfolio UNIQUE (portfolio_id);
CREATE INDEX IF NOT EXISTS idx_accounts_portfolio_id ON accounts(portfolio_id);

-- Optional: drop user_id from accounts or keep it for backward read; dropping to maintain 1-to-1 with portfolio
ALTER TABLE accounts DROP COLUMN IF EXISTS user_id;

-- 4. Update holdings to belong to portfolio
ALTER TABLE holdings ADD COLUMN IF NOT EXISTS portfolio_id BIGINT;

UPDATE holdings h
SET portfolio_id = p.id
FROM portfolios p
WHERE p.user_id = h.user_id AND p.is_default = TRUE;

UPDATE holdings h
SET portfolio_id = (SELECT p.id FROM portfolios p WHERE p.user_id = h.user_id LIMIT 1)
WHERE h.portfolio_id IS NULL;

-- Remove orphan holdings if user had no portfolio
DELETE FROM holdings WHERE portfolio_id IS NULL;

ALTER TABLE holdings ALTER COLUMN portfolio_id SET NOT NULL;
ALTER TABLE holdings DROP CONSTRAINT IF EXISTS uq_holdings_user_symbol;
ALTER TABLE holdings DROP CONSTRAINT IF EXISTS holdings_user_id_fkey;
ALTER TABLE holdings DROP COLUMN IF EXISTS user_id;

ALTER TABLE holdings ADD CONSTRAINT fk_holdings_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE;
ALTER TABLE holdings ADD CONSTRAINT uq_holdings_portfolio_symbol UNIQUE (portfolio_id, symbol);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_symbol ON holdings(portfolio_id, symbol);

-- 5. Update trades to belong to portfolio
ALTER TABLE trades ADD COLUMN IF NOT EXISTS portfolio_id BIGINT;

UPDATE trades t
SET portfolio_id = p.id
FROM portfolios p
WHERE p.user_id = t.user_id AND p.is_default = TRUE;

UPDATE trades t
SET portfolio_id = (SELECT p.id FROM portfolios p WHERE p.user_id = t.user_id LIMIT 1)
WHERE t.portfolio_id IS NULL;

DELETE FROM trades WHERE portfolio_id IS NULL;

ALTER TABLE trades ALTER COLUMN portfolio_id SET NOT NULL;
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_user_id_fkey;
ALTER TABLE trades DROP COLUMN IF EXISTS user_id;

ALTER TABLE trades ADD CONSTRAINT fk_trades_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_trades_portfolio_created ON trades(portfolio_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_portfolio_symbol ON trades(portfolio_id, symbol);

-- 6. Update watchlists to belong to portfolio
ALTER TABLE watchlists ADD COLUMN IF NOT EXISTS portfolio_id BIGINT;

UPDATE watchlists w
SET portfolio_id = p.id
FROM portfolios p
WHERE p.user_id = w.user_id AND p.is_default = TRUE;

UPDATE watchlists w
SET portfolio_id = (SELECT p.id FROM portfolios p WHERE p.user_id = w.user_id LIMIT 1)
WHERE w.portfolio_id IS NULL;

DELETE FROM watchlists WHERE portfolio_id IS NULL;

ALTER TABLE watchlists ALTER COLUMN portfolio_id SET NOT NULL;
ALTER TABLE watchlists DROP CONSTRAINT IF EXISTS uq_watchlists_user_symbol;
ALTER TABLE watchlists DROP CONSTRAINT IF EXISTS watchlists_user_id_fkey;
ALTER TABLE watchlists DROP COLUMN IF EXISTS user_id;

ALTER TABLE watchlists ADD CONSTRAINT fk_watchlists_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE;
ALTER TABLE watchlists ADD CONSTRAINT uq_watchlists_portfolio_symbol UNIQUE (portfolio_id, symbol);
CREATE INDEX IF NOT EXISTS idx_watchlists_portfolio_id ON watchlists(portfolio_id);

-- 7. Update price_alerts to belong to portfolio
ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS portfolio_id BIGINT;

UPDATE price_alerts pa
SET portfolio_id = p.id
FROM portfolios p
WHERE p.user_id = pa.user_id AND p.is_default = TRUE;

UPDATE price_alerts pa
SET portfolio_id = (SELECT p.id FROM portfolios p WHERE p.user_id = pa.user_id LIMIT 1)
WHERE pa.portfolio_id IS NULL;

DELETE FROM price_alerts WHERE portfolio_id IS NULL;

ALTER TABLE price_alerts ALTER COLUMN portfolio_id SET NOT NULL;
ALTER TABLE price_alerts DROP CONSTRAINT IF EXISTS price_alerts_user_id_fkey;
ALTER TABLE price_alerts DROP COLUMN IF EXISTS user_id;

ALTER TABLE price_alerts ADD CONSTRAINT fk_price_alerts_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_price_alerts_portfolio_id ON price_alerts(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_portfolio_active ON price_alerts(portfolio_id, active, triggered);

-- 8. Add optional portfolio_id to backtest_runs
ALTER TABLE backtest_runs ADD COLUMN IF NOT EXISTS portfolio_id BIGINT;
ALTER TABLE backtest_runs ADD CONSTRAINT fk_backtest_runs_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_backtest_runs_portfolio_id ON backtest_runs(portfolio_id);
