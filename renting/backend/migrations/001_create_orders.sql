CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    placed_at TIMESTAMPTZ NOT NULL,
    contents JSONB NOT NULL,
    rent_ends_at TIMESTAMPTZ NOT NULL,
    state TEXT NOT NULL
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_state ON orders (state);
