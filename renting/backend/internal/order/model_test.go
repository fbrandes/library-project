package order

import (
	"errors"
	"strings"
	"testing"
	"time"
)

const testOrderID = "550e8400-e29b-41d4-a716-446655440000"

func testBook() Book {
	return Book{
		ID:    "book-1",
		ISBN:  "9780134685991",
		Title: "Effective Go Services",
		Author: Author{
			FirstName: "Ada",
			LastName:  "Lovelace",
			Bio:       "Computer pioneer.",
		},
		Pages: 300,
		Publisher: Publisher{
			Name: "Engineering Press",
			Address: Address{
				Street:  "Main Street 1",
				ZipCode: "02116",
				City:    "Boston",
			},
		},
		Genres:          []string{"Programming"},
		Language:        "English",
		Summary:         "A practical book.",
		PublicationDate: "2026-01-01",
		Edition:         1,
		Type:            BookTypeHardcover,
	}
}

func testOrder() Order {
	placedAt := time.Date(2026, 6, 22, 9, 0, 0, 0, time.UTC)
	return Order{
		ID:         testOrderID,
		UserID:     "user-123",
		PlacedAt:   placedAt,
		Contents:   []Book{testBook()},
		RentEndsAt: placedAt.Add(RentDuration),
		State:      StatePlaced,
	}
}

func TestOrderStateNormalizeValidAndActiveRental(t *testing.T) {
	if StatePlaced.Normalize() != StatePlaced {
		t.Fatalf("expected already-normalized state to stay unchanged")
	}
	if State(" picked_up ").Normalize() != StatePickedUp {
		t.Fatalf("expected state normalization to trim and uppercase")
	}
	if !State("processed").Valid() {
		t.Fatalf("expected processed to be valid")
	}
	if State("missing").Valid() {
		t.Fatalf("expected missing to be invalid")
	}
	if StateCompleted.ActiveRental() {
		t.Fatalf("completed orders should not be active rentals")
	}
	if !StateLateForReturn.ActiveRental() {
		t.Fatalf("late orders should still be active rentals")
	}
}

func TestBookTypeValid(t *testing.T) {
	for _, bookType := range []BookType{BookTypeSoftcover, BookTypeHardcover, BookTypeEbook, BookType("ebook")} {
		if !bookType.Valid() {
			t.Fatalf("expected %q to be valid", bookType)
		}
	}

	if BookType("AUDIO").Valid() {
		t.Fatalf("expected AUDIO to be invalid")
	}
}

func TestOrderInputValidateDefaultsState(t *testing.T) {
	input := Input{
		UserID:   " user-123 ",
		Contents: []Book{testBook()},
	}

	if err := input.Validate(StatePlaced); err != nil {
		t.Fatalf("expected valid input: %v", err)
	}

	normalized := input.Normalize(StatePlaced)
	if normalized.UserID != "user-123" {
		t.Fatalf("expected trimmed user id, got %q", normalized.UserID)
	}
	if normalized.State != StatePlaced {
		t.Fatalf("expected default placed state, got %q", normalized.State)
	}
}

func TestOrderInputValidateReportsProblems(t *testing.T) {
	input := Input{
		UserID: " ",
		Contents: []Book{{
			ISBN:    "",
			Title:   "",
			Pages:   0,
			Genres:  nil,
			Edition: 0,
			Type:    BookType("BAD"),
		}},
		State: State("BAD"),
	}

	err := input.Validate(StatePlaced)
	if !errors.Is(err, ErrInvalidOrder) {
		t.Fatalf("expected ErrInvalidOrder, got %v", err)
	}
	if !strings.Contains(err.Error(), "userId is required") {
		t.Fatalf("expected validation message, got %q", err.Error())
	}
}

func TestOrderValidate(t *testing.T) {
	if err := testOrder().Validate(); err != nil {
		t.Fatalf("expected valid order: %v", err)
	}

	invalid := testOrder()
	invalid.ID = "bad"
	invalid.RentEndsAt = invalid.PlacedAt.Add(-time.Hour)
	invalid.State = "BAD"

	err := invalid.Validate()
	if !errors.Is(err, ErrInvalidOrder) {
		t.Fatalf("expected ErrInvalidOrder, got %v", err)
	}
	if !strings.Contains(err.Error(), "rentEndsAt must be after placedAt") {
		t.Fatalf("expected rentEndsAt problem, got %q", err.Error())
	}
}

func TestCloneCopiesContents(t *testing.T) {
	original := testOrder()
	cloned := Clone(original)

	cloned.Contents[0].Title = "Changed"

	if original.Contents[0].Title == "Changed" {
		t.Fatalf("expected clone to copy contents slice")
	}
}
