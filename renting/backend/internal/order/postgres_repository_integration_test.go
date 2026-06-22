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

	if _, err := repository.Create(ctx, older); err != nil {
		t.Fatalf("create older order: %v", err)
	}
	if _, err := repository.Create(ctx, newer); err != nil {
		t.Fatalf("create newer order: %v", err)
	}

	orders, err := repository.List(ctx)
	if err != nil {
		t.Fatalf("list orders: %v", err)
	}
	if len(orders) != 2 {
		t.Fatalf("expected 2 orders, got %d", len(orders))
	}
	if orders[0].ID != newer.ID || orders[1].ID != older.ID {
		t.Fatalf("expected orders newest first, got %+v", orders)
	}
	if !reflect.DeepEqual(orders[0].Contents, newer.Contents) {
		t.Fatalf("expected JSONB contents round trip, got %+v", orders[0].Contents)
	}

	got, err := repository.Get(ctx, older.ID)
	if err != nil {
		t.Fatalf("get older order: %v", err)
	}
	if got.ID != older.ID || got.UserID != older.UserID || got.State != older.State {
		t.Fatalf("unexpected fetched order: %+v", got)
	}

	older.UserID = "user-456"
	older.State = StateReadyForPickup
	older.Contents[0].Title = "Updated Go Services"
	updated, err := repository.Update(ctx, older)
	if err != nil {
		t.Fatalf("update older order: %v", err)
	}
	if updated.UserID != "user-456" || updated.State != StateReadyForPickup {
		t.Fatalf("unexpected updated order: %+v", updated)
	}

	got, err = repository.Get(ctx, older.ID)
	if err != nil {
		t.Fatalf("get updated order: %v", err)
	}
	if got.Contents[0].Title != "Updated Go Services" {
		t.Fatalf("expected updated contents, got %+v", got.Contents)
	}

	if err := repository.Delete(ctx, older.ID); err != nil {
		t.Fatalf("delete older order: %v", err)
	}
	if _, err := repository.Get(ctx, older.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected deleted order to be missing, got %v", err)
	}
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
