package order

import (
	"context"
	"database/sql"
	"errors"
	"reflect"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
)

func TestSQLRepositoryIntegrationOrderLifecycle(t *testing.T) {
	repository, _ := newPostgresRepository(t)
	ctx := context.Background()

	older := testOrder()
	older.ID = "550e8400-e29b-41d4-a716-446655440001"
	older.PlacedAt = time.Date(2026, 6, 21, 9, 0, 0, 0, time.UTC)
	older.RentEndsAt = older.PlacedAt.Add(RentDuration)

	newer := testOrder()
	newer.ID = "550e8400-e29b-41d4-a716-446655440002"
	newer.PlacedAt = time.Date(2026, 6, 22, 9, 0, 0, 0, time.UTC)
	newer.RentEndsAt = newer.PlacedAt.Add(RentDuration)
	newer.Contents = append(newer.Contents, testBook())
	newer.Contents[1].ID = "book-2"
	newer.Contents[1].ISBN = "9780132350884"
	newer.Contents[1].Title = "Clean Code"

	mustCreateOrder(ctx, t, repository, older)
	mustCreateOrder(ctx, t, repository, newer)

	orders := mustListOrders(ctx, t, repository)
	assertOrderOrdering(t, orders, newer, older)

	if !reflect.DeepEqual(orders[0].Contents, newer.Contents) {
		t.Fatalf("expected JSONB contents round trip, got %+v", orders[0].Contents)
	}

	got := mustGetOrder(ctx, t, repository, older.ID)
	assertOrderFields(t, got, older)

	older.UserID = "user-456"
	older.State = StateReadyForPickup
	older.Contents[0].Title = "Updated Go Services"

	updated := mustUpdateOrder(ctx, t, repository, older)

	if updated.UserID != older.UserID {
		t.Fatalf("expected user %q, got %q", older.UserID, updated.UserID)
	}
	if updated.State != older.State {
		t.Fatalf("expected state %q, got %q", older.State, updated.State)
	}

	got = mustGetOrder(ctx, t, repository, older.ID)

	if got.Contents[0].Title != "Updated Go Services" {
		t.Fatalf("expected updated contents, got %+v", got.Contents)
	}

	mustDeleteOrder(ctx, t, repository, older.ID)
	assertOrderNotFound(ctx, t, repository, older.ID)
}
func TestSQLRepositoryIntegrationNotFound(t *testing.T) {
	repository, _ := newPostgresRepository(t)
	ctx := context.Background()
	missingID := "550e8400-e29b-41d4-a716-446655440099"

	if _, err := repository.Get(ctx, missingID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected get not found, got %v", err)
	}
	missing := testOrder()
	missing.ID = missingID
	if _, err := repository.Update(ctx, missing); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected update not found, got %v", err)
	}
	if err := repository.Delete(ctx, missingID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected delete not found, got %v", err)
	}
}

func TestSQLRepositoryIntegrationDatabaseErrors(t *testing.T) {
	repository, db := newPostgresRepository(t)
	if err := db.Close(); err != nil {
		t.Fatalf("close database: %v", err)
	}

	ctx := context.Background()
	if err := repository.Migrate(ctx); err == nil {
		t.Fatalf("expected migrate to fail on closed database")
	}
	if _, err := repository.List(ctx); err == nil {
		t.Fatalf("expected list to fail on closed database")
	}
	if _, err := repository.Create(ctx, testOrder()); err == nil {
		t.Fatalf("expected create to fail on closed database")
	}
	if _, err := repository.Update(ctx, testOrder()); err == nil {
		t.Fatalf("expected update to fail on closed database")
	}
	if err := repository.Delete(ctx, testOrderID); err == nil {
		t.Fatalf("expected delete to fail on closed database")
	}
}

func newPostgresRepository(t *testing.T) (*SQLRepository, *sql.DB) {
	t.Helper()
	testcontainers.SkipIfProviderIsNotHealthy(t)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	container, err := postgres.Run(
		ctx,
		"postgres:16-alpine",
		postgres.WithDatabase("renting"),
		postgres.WithUsername("renting"),
		postgres.WithPassword("renting"),
		postgres.BasicWaitStrategies(),
		postgres.WithSQLDriver("pgx"),
	)
	if err != nil {
		t.Fatalf("start postgres container: %v", err)
	}
	testcontainers.CleanupContainer(t, container)

	connectionString, err := container.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatalf("get postgres connection string: %v", err)
	}

	db, err := sql.Open("pgx", connectionString)
	if err != nil {
		t.Fatalf("open postgres connection: %v", err)
	}
	t.Cleanup(func() {
		_ = db.Close()
	})

	if err := db.PingContext(ctx); err != nil {
		t.Fatalf("ping postgres: %v", err)
	}

	repository := NewSQLRepository(db)
	if err := repository.Migrate(ctx); err != nil {
		t.Fatalf("migrate postgres: %v", err)
	}

	return repository, db
}

func mustCreateOrder(ctx context.Context, t *testing.T, repo *SQLRepository, order Order) {
	t.Helper()

	if _, err := repo.Create(ctx, order); err != nil {
		t.Fatalf("create order %q: %v", order.ID, err)
	}
}

func mustListOrders(ctx context.Context, t *testing.T, repo *SQLRepository) []Order {
	t.Helper()

	orders, err := repo.List(ctx)
	if err != nil {
		t.Fatalf("list orders: %v", err)
	}

	return orders
}

func mustGetOrder(ctx context.Context, t *testing.T, repo *SQLRepository, id string) Order {
	t.Helper()

	order, err := repo.Get(ctx, id)
	if err != nil {
		t.Fatalf("get order %q: %v", id, err)
	}

	return order
}

func mustUpdateOrder(ctx context.Context, t *testing.T, repo *SQLRepository, order Order) Order {
	t.Helper()

	updated, err := repo.Update(ctx, order)
	if err != nil {
		t.Fatalf("update order %q: %v", order.ID, err)
	}

	return updated
}

func mustDeleteOrder(ctx context.Context, t *testing.T, repo *SQLRepository, id string) {
	t.Helper()

	if err := repo.Delete(ctx, id); err != nil {
		t.Fatalf("delete order %q: %v", id, err)
	}
}

func assertOrderNotFound(ctx context.Context, t *testing.T, repo *SQLRepository, id string) {
	t.Helper()

	_, err := repo.Get(ctx, id)
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func assertOrderOrdering(t *testing.T, orders []Order, newer, older Order) {
	t.Helper()

	if len(orders) != 2 {
		t.Fatalf("expected 2 orders, got %d", len(orders))
	}

	if orders[0].ID != newer.ID || orders[1].ID != older.ID {
		t.Fatalf("expected newest-first ordering, got %+v", orders)
	}
}

func assertOrderFields(t *testing.T, got, want Order) {
	t.Helper()

	if got.ID != want.ID {
		t.Fatalf("expected ID %q, got %q", want.ID, got.ID)
	}

	if got.UserID != want.UserID {
		t.Fatalf("expected UserID %q, got %q", want.UserID, got.UserID)
	}

	if got.State != want.State {
		t.Fatalf("expected State %q, got %q", want.State, got.State)
	}
}
