package order

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestServiceCreateSetsOrderFields(t *testing.T) {
	ctx := context.Background()
	now := time.Date(2026, 6, 22, 9, 30, 45, 99, time.UTC)
	service := NewService(NewMemoryRepository(), func() time.Time { return now })

	created, err := service.Create(ctx, OrderInput{
		UserID:   "user-123",
		Contents: []Book{testBook()},
	})
	if err != nil {
		t.Fatalf("create order: %v", err)
	}

	if err := ValidateID(created.ID); err != nil {
		t.Fatalf("expected valid id: %v", err)
	}
	if created.PlacedAt.Nanosecond() != 0 {
		t.Fatalf("expected placedAt to be truncated to seconds")
	}
	if created.RentEndsAt.Sub(created.PlacedAt) != RentDuration {
		t.Fatalf("expected rent duration of two weeks")
	}
	if created.State != StatePlaced {
		t.Fatalf("expected placed state")
	}
}

func TestServiceCreateRejectsInvalidInput(t *testing.T) {
	service := NewService(NewMemoryRepository(), nil)

	if _, err := service.Create(context.Background(), OrderInput{}); err == nil {
		t.Fatalf("expected invalid order")
	}
}

func TestServiceCreateReturnsRepositoryError(t *testing.T) {
	createErr := errors.New("create failed")
	service := NewService(&stubRepository{createErr: createErr}, func() time.Time {
		return time.Date(2026, 6, 22, 9, 30, 45, 0, time.UTC)
	})

	_, err := service.Create(context.Background(), OrderInput{
		UserID:   "user-123",
		Contents: []Book{testBook()},
	})
	if !errors.Is(err, createErr) {
		t.Fatalf("expected repository error, got %v", err)
	}
}

func TestServiceListDelegatesToRepository(t *testing.T) {
	repository := &stubRepository{list: []Order{testOrder()}}
	service := NewService(repository, nil)

	orders, err := service.List(context.Background())
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(orders) != 1 || orders[0].ID != testOrderID {
		t.Fatalf("unexpected orders: %+v", orders)
	}
}

func TestServiceListReturnsRepositoryError(t *testing.T) {
	listErr := errors.New("list failed")
	service := NewService(&stubRepository{listErr: listErr}, nil)

	_, err := service.List(context.Background())
	if !errors.Is(err, listErr) {
		t.Fatalf("expected repository error, got %v", err)
	}
}

func TestServiceGetValidatesID(t *testing.T) {
	service := NewService(NewMemoryRepository(), nil)

	if _, err := service.Get(context.Background(), "bad"); err != ErrInvalidID {
		t.Fatalf("expected invalid id, got %v", err)
	}
}

func TestServiceGetReturnsRepositoryError(t *testing.T) {
	getErr := errors.New("get failed")
	service := NewService(&stubRepository{getErr: getErr}, nil)

	_, err := service.Get(context.Background(), testOrderID)
	if !errors.Is(err, getErr) {
		t.Fatalf("expected repository error, got %v", err)
	}
}

func TestServiceUpdatePreservesPlacementDates(t *testing.T) {
	ctx := context.Background()
	repository := NewMemoryRepository(testOrder())
	service := NewService(repository, nil)

	updated, err := service.Update(ctx, testOrderID, OrderInput{
		UserID:   "user-456",
		Contents: []Book{testBook()},
		State:    StateReadyForPickup,
	})
	if err != nil {
		t.Fatalf("update order: %v", err)
	}

	if updated.UserID != "user-456" {
		t.Fatalf("expected updated user")
	}
	if updated.State != StateReadyForPickup {
		t.Fatalf("expected ready state")
	}
	if !updated.PlacedAt.Equal(testOrder().PlacedAt) {
		t.Fatalf("expected placedAt to be preserved")
	}
	if !updated.RentEndsAt.Equal(testOrder().RentEndsAt) {
		t.Fatalf("expected rentEndsAt to be preserved")
	}
}

func TestServiceUpdateDefaultsExistingState(t *testing.T) {
	ctx := context.Background()
	existing := testOrder()
	existing.State = StateProcessed
	service := NewService(NewMemoryRepository(existing), nil)

	updated, err := service.Update(ctx, existing.ID, OrderInput{
		UserID:   existing.UserID,
		Contents: existing.Contents,
	})
	if err != nil {
		t.Fatalf("update order: %v", err)
	}
	if updated.State != StateProcessed {
		t.Fatalf("expected existing state to be retained")
	}
}

func TestServiceUpdateReturnsRepositoryGetError(t *testing.T) {
	getErr := errors.New("get failed")
	service := NewService(&stubRepository{getErr: getErr}, nil)

	_, err := service.Update(context.Background(), testOrderID, OrderInput{
		UserID:   "user-123",
		Contents: []Book{testBook()},
	})
	if !errors.Is(err, getErr) {
		t.Fatalf("expected repository error, got %v", err)
	}
}

func TestServiceUpdateRejectsInvalidInputAfterLoadingExistingOrder(t *testing.T) {
	service := NewService(&stubRepository{get: testOrder()}, nil)

	_, err := service.Update(context.Background(), testOrderID, OrderInput{})
	if !errors.Is(err, ErrInvalidOrder) {
		t.Fatalf("expected invalid order, got %v", err)
	}
}

func TestServiceUpdateReturnsInvalidUpdatedOrder(t *testing.T) {
	existing := testOrder()
	existing.RentEndsAt = existing.PlacedAt.Add(-time.Hour)
	service := NewService(&stubRepository{get: existing}, nil)

	_, err := service.Update(context.Background(), testOrderID, OrderInput{
		UserID:   "user-123",
		Contents: []Book{testBook()},
		State:    StatePlaced,
	})
	if !errors.Is(err, ErrInvalidOrder) {
		t.Fatalf("expected invalid updated order, got %v", err)
	}
}

func TestServiceUpdateReturnsRepositoryUpdateError(t *testing.T) {
	updateErr := errors.New("update failed")
	service := NewService(&stubRepository{get: testOrder(), updateErr: updateErr}, nil)

	_, err := service.Update(context.Background(), testOrderID, OrderInput{
		UserID:   "user-123",
		Contents: []Book{testBook()},
		State:    StateProcessed,
	})
	if !errors.Is(err, updateErr) {
		t.Fatalf("expected repository error, got %v", err)
	}
}

func TestServiceDeleteValidatesID(t *testing.T) {
	service := NewService(NewMemoryRepository(), nil)

	if err := service.Delete(context.Background(), "bad"); err != ErrInvalidID {
		t.Fatalf("expected invalid id, got %v", err)
	}
}

func TestServiceDeleteReturnsRepositoryError(t *testing.T) {
	deleteErr := errors.New("delete failed")
	service := NewService(&stubRepository{deleteErr: deleteErr}, nil)

	err := service.Delete(context.Background(), testOrderID)
	if !errors.Is(err, deleteErr) {
		t.Fatalf("expected repository error, got %v", err)
	}
}

type stubRepository struct {
	list      []Order
	listErr   error
	get       Order
	getErr    error
	createErr error
	updateErr error
	deleteErr error
}

func (r *stubRepository) List(context.Context) ([]Order, error) {
	if r.listErr != nil {
		return nil, r.listErr
	}
	return r.list, nil
}

func (r *stubRepository) Get(context.Context, string) (Order, error) {
	if r.getErr != nil {
		return Order{}, r.getErr
	}
	return r.get, nil
}

func (r *stubRepository) Create(_ context.Context, item Order) (Order, error) {
	if r.createErr != nil {
		return Order{}, r.createErr
	}
	return item, nil
}

func (r *stubRepository) Update(_ context.Context, item Order) (Order, error) {
	if r.updateErr != nil {
		return Order{}, r.updateErr
	}
	return item, nil
}

func (r *stubRepository) Delete(context.Context, string) error {
	return r.deleteErr
}
