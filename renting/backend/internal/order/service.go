package order

import (
	"context"
	"fmt"
	"time"
)

type Repository interface {
	List(context.Context) ([]Order, error)
	Get(context.Context, string) (Order, error)
	Create(context.Context, Order) (Order, error)
	Update(context.Context, Order) (Order, error)
	Delete(context.Context, string) error
}

type Clock func() time.Time

type Service struct {
	repository Repository
	clock      Clock
}

func NewService(repository Repository, clock Clock) *Service {
	if clock == nil {
		clock = time.Now
	}

	return &Service{
		repository: repository,
		clock:      clock,
	}
}

func (s *Service) List(ctx context.Context) ([]Order, error) {
	return s.repository.List(ctx)
}

func (s *Service) Get(ctx context.Context, id string) (Order, error) {
	if err := ValidateID(id); err != nil {
		return Order{}, err
	}
	return s.repository.Get(ctx, id)
}

func (s *Service) Create(ctx context.Context, input Input) (Order, error) {
	if err := input.Validate(StatePlaced); err != nil {
		return Order{}, err
	}

	id, err := NewUUID()
	if err != nil {
		return Order{}, err
	}

	normalized := input.Normalize(StatePlaced)
	placedAt := s.clock().UTC().Truncate(time.Second)
	created := Order{
		ID:         id,
		UserID:     normalized.UserID,
		PlacedAt:   placedAt,
		Contents:   append([]Book(nil), normalized.Contents...),
		RentEndsAt: placedAt.Add(RentDuration),
		State:      normalized.State,
	}

	if err := created.Validate(); err != nil {
		return Order{}, err
	}

	return s.repository.Create(ctx, created)
}

func (s *Service) Update(ctx context.Context, id string, input Input) (Order, error) {
	if err := ValidateID(id); err != nil {
		return Order{}, err
	}

	existing, err := s.repository.Get(ctx, id)
	if err != nil {
		return Order{}, err
	}

	defaultState := existing.State
	if input.State != "" {
		defaultState = input.State.Normalize()
	}
	if err := input.Validate(defaultState); err != nil {
		return Order{}, err
	}

	normalized := input.Normalize(defaultState)
	updated := Order{
		ID:         existing.ID,
		UserID:     normalized.UserID,
		PlacedAt:   existing.PlacedAt,
		Contents:   append([]Book(nil), normalized.Contents...),
		RentEndsAt: existing.RentEndsAt,
		State:      normalized.State,
	}

	if err := updated.Validate(); err != nil {
		return Order{}, fmt.Errorf("updated order: %w", err)
	}

	return s.repository.Update(ctx, updated)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	if err := ValidateID(id); err != nil {
		return err
	}
	return s.repository.Delete(ctx, id)
}
