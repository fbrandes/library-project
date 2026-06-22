package order

import (
	"context"
	"testing"
	"time"
)

func TestMemoryRepositoryListSortsNewestFirstAndClones(t *testing.T) {
	older := testOrder()
	older.ID = "550e8400-e29b-41d4-a716-446655440001"
	older.PlacedAt = time.Date(2026, 6, 21, 9, 0, 0, 0, time.UTC)
	newer := testOrder()
	newer.ID = "550e8400-e29b-41d4-a716-446655440002"
	newer.PlacedAt = time.Date(2026, 6, 22, 9, 0, 0, 0, time.UTC)

	repository := NewMemoryRepository(older, newer)
	orders, err := repository.List(context.Background())
	if err != nil {
		t.Fatalf("list orders: %v", err)
	}
	if orders[0].ID != newer.ID {
		t.Fatalf("expected newest first, got %q", orders[0].ID)
	}

	orders[0].Contents[0].Title = "Changed"
	stored, err := repository.Get(context.Background(), newer.ID)
	if err != nil {
		t.Fatalf("get order: %v", err)
	}
	if stored.Contents[0].Title == "Changed" {
		t.Fatalf("expected list to return clones")
	}
}

func TestMemoryRepositoryCreateUpdateAndDelete(t *testing.T) {
	ctx := context.Background()
	repository := NewMemoryRepository()
	item := testOrder()

	created, err := repository.Create(ctx, item)
	if err != nil {
		t.Fatalf("create order: %v", err)
	}
	if created.ID != item.ID {
		t.Fatalf("expected created order id")
	}

	item.State = StateProcessed
	updated, err := repository.Update(ctx, item)
	if err != nil {
		t.Fatalf("update order: %v", err)
	}
	if updated.State != StateProcessed {
		t.Fatalf("expected processed state")
	}

	if err := repository.Delete(ctx, item.ID); err != nil {
		t.Fatalf("delete order: %v", err)
	}
	if _, err := repository.Get(ctx, item.ID); err != ErrNotFound {
		t.Fatalf("expected not found after delete, got %v", err)
	}
}

func TestMemoryRepositoryNotFound(t *testing.T) {
	ctx := context.Background()
	repository := NewMemoryRepository()

	if _, err := repository.Get(ctx, testOrderID); err != ErrNotFound {
		t.Fatalf("expected get not found, got %v", err)
	}
	if _, err := repository.Update(ctx, testOrder()); err != ErrNotFound {
		t.Fatalf("expected update not found, got %v", err)
	}
	if err := repository.Delete(ctx, testOrderID); err != ErrNotFound {
		t.Fatalf("expected delete not found, got %v", err)
	}
}
