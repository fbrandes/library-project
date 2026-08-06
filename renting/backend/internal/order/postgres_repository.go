package order

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
)

type SQLRepository struct {
	db *sql.DB
}

func NewSQLRepository(db *sql.DB) *SQLRepository {
	return &SQLRepository{db: db}
}

func (r *SQLRepository) Migrate(ctx context.Context) error {
	_, err := r.db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS orders (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			placed_at TIMESTAMPTZ NOT NULL,
			contents JSONB NOT NULL,
			rent_ends_at TIMESTAMPTZ NOT NULL,
			state TEXT NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
		CREATE INDEX IF NOT EXISTS idx_orders_state ON orders(state);
	`)
	if err != nil {
		return fmt.Errorf("migrate orders: %w", err)
	}
	return nil
}

func (r *SQLRepository) List(ctx context.Context) ([]Order, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, placed_at, contents, rent_ends_at, state
		FROM orders
		ORDER BY placed_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("list orders: %w", err)
	}
	defer rows.Close()

	orders := make([]Order, 0)
	for rows.Next() {
		item, err := scanOrder(rows)
		if err != nil {
			return nil, err
		}
		orders = append(orders, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list orders rows: %w", err)
	}

	return orders, nil
}

func (r *SQLRepository) Get(ctx context.Context, id string) (Order, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, user_id, placed_at, contents, rent_ends_at, state
		FROM orders
		WHERE id = $1
	`, id)

	item, err := scanOrder(row)
	if errors.Is(err, sql.ErrNoRows) {
		return Order{}, ErrNotFound
	}
	if err != nil {
		return Order{}, err
	}

	return item, nil
}

func (r *SQLRepository) Create(ctx context.Context, item Order) (Order, error) {
	contents, err := json.Marshal(item.Contents)
	if err != nil {
		return Order{}, fmt.Errorf("marshal order contents: %w", err)
	}

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO orders (id, user_id, placed_at, contents, rent_ends_at, state)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, item.ID, item.UserID, item.PlacedAt, string(contents), item.RentEndsAt, item.State)
	if err != nil {
		return Order{}, fmt.Errorf("create order: %w", err)
	}

	return Clone(item), nil
}

func (r *SQLRepository) Update(ctx context.Context, item Order) (Order, error) {
	contents, err := json.Marshal(item.Contents)
	if err != nil {
		return Order{}, fmt.Errorf("marshal order contents: %w", err)
	}

	result, err := r.db.ExecContext(ctx, `
		UPDATE orders
		SET user_id = $2, contents = $3, rent_ends_at = $4, state = $5
		WHERE id = $1
	`, item.ID, item.UserID, string(contents), item.RentEndsAt, item.State)
	if err != nil {
		return Order{}, fmt.Errorf("update order: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return Order{}, fmt.Errorf("update order rows affected: %w", err)
	}
	if affected == 0 {
		return Order{}, ErrNotFound
	}

	return Clone(item), nil
}

func (r *SQLRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM orders WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete order: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("delete order rows affected: %w", err)
	}
	if affected == 0 {
		return ErrNotFound
	}

	return nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanOrder(scanner rowScanner) (Order, error) {
	var item Order
	var contents []byte
	var state string

	if err := scanner.Scan(
		&item.ID,
		&item.UserID,
		&item.PlacedAt,
		&contents,
		&item.RentEndsAt,
		&state,
	); err != nil {
		return Order{}, err
	}

	item.State = State(state)

	if err := json.Unmarshal(contents, &item.Contents); err != nil {
		return Order{}, fmt.Errorf("unmarshal order contents: %w", err)
	}

	return item, nil
}
