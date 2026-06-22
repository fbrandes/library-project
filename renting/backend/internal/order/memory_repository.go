package order

import (
	"context"
	"sort"
	"sync"
)

type MemoryRepository struct {
	mu     sync.RWMutex
	orders map[string]Order
}

func NewMemoryRepository(seed ...Order) *MemoryRepository {
	repository := &MemoryRepository{
		orders: make(map[string]Order, len(seed)),
	}

	for _, item := range seed {
		repository.orders[item.ID] = Clone(item)
	}

	return repository
}

func (r *MemoryRepository) List(context.Context) ([]Order, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	orders := make([]Order, 0, len(r.orders))
	for _, item := range r.orders {
		orders = append(orders, Clone(item))
	}

	sort.SliceStable(orders, func(left, right int) bool {
		return orders[left].PlacedAt.After(orders[right].PlacedAt)
	})

	return orders, nil
}

func (r *MemoryRepository) Get(_ context.Context, id string) (Order, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	item, ok := r.orders[id]
	if !ok {
		return Order{}, ErrNotFound
	}

	return Clone(item), nil
}

func (r *MemoryRepository) Create(_ context.Context, item Order) (Order, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.orders[item.ID] = Clone(item)
	return Clone(item), nil
}

func (r *MemoryRepository) Update(_ context.Context, item Order) (Order, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.orders[item.ID]; !ok {
		return Order{}, ErrNotFound
	}

	r.orders[item.ID] = Clone(item)
	return Clone(item), nil
}

func (r *MemoryRepository) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.orders[id]; !ok {
		return ErrNotFound
	}

	delete(r.orders, id)
	return nil
}
