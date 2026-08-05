package order

import (
	"errors"
	"fmt"
	"strings"
	"time"
)

const RentDuration = 14 * 24 * time.Hour

var (
	ErrInvalidID    = errors.New("invalid order id")
	ErrInvalidOrder = errors.New("invalid order")
	ErrNotFound     = errors.New("order not found")
)

type OrderState string

const (
	StatePlaced         OrderState = "PLACED"
	StateProcessed      OrderState = "PROCESSED"
	StateReadyForPickup OrderState = "READY_FOR_PICKUP"
	StatePickedUp       OrderState = "PICKED_UP"
	StateReturned       OrderState = "RETURNED"
	StateCompleted      OrderState = "COMPLETED"
	StateLateForReturn  OrderState = "LATE_FOR_RETURN"
)

var validOrderStates = map[OrderState]struct{}{
	StatePlaced:         {},
	StateProcessed:      {},
	StateReadyForPickup: {},
	StatePickedUp:       {},
	StateReturned:       {},
	StateCompleted:      {},
	StateLateForReturn:  {},
}

type Address struct {
	Street  string `json:"street"`
	ZipCode string `json:"zipCode"`
	City    string `json:"city"`
}

type Publisher struct {
	Name    string  `json:"name"`
	Address Address `json:"address"`
}

type Author struct {
	FirstName  string `json:"firstname"`
	MiddleName string `json:"middlename"`
	LastName   string `json:"lastname"`
	Bio        string `json:"bio"`
}

type BookType string

const (
	BookTypeSoftcover BookType = "SOFTCOVER"
	BookTypeHardcover BookType = "HARDCOVER"
	BookTypeEbook     BookType = "EBOOK"
)

type Book struct {
	ID              string    `json:"id,omitempty"`
	ISBN            string    `json:"isbn"`
	Title           string    `json:"title"`
	Author          Author    `json:"author"`
	Pages           int       `json:"pages"`
	Publisher       Publisher `json:"publisher"`
	Genres          []string  `json:"genres"`
	Language        string    `json:"language"`
	Summary         string    `json:"summary"`
	PublicationDate string    `json:"publicationDate"`
	Edition         int       `json:"edition"`
	Type            BookType  `json:"type"`
}

type Order struct {
	ID         string     `json:"id"`
	UserID     string     `json:"userId"`
	PlacedAt   time.Time  `json:"placedAt"`
	Contents   []Book     `json:"contents"`
	RentEndsAt time.Time  `json:"rentEndsAt"`
	State      OrderState `json:"state"`
}

type OrderInput struct {
	UserID   string     `json:"userId"`
	Contents []Book     `json:"contents"`
	State    OrderState `json:"state,omitempty"`
}

type ValidationError struct {
	Problems []string
}

func (e ValidationError) Error() string {
	return fmt.Sprintf("%v: %s", ErrInvalidOrder, strings.Join(e.Problems, "; "))
}

func (e ValidationError) Unwrap() error {
	return ErrInvalidOrder
}

func (s OrderState) Normalize() OrderState {
	return OrderState(strings.ToUpper(strings.TrimSpace(string(s))))
}

func (s OrderState) Valid() bool {
	_, ok := validOrderStates[s.Normalize()]
	return ok
}

func (s OrderState) ActiveRental() bool {
	switch s.Normalize() {
	case StateReturned, StateCompleted:
		return false
	default:
		return s.Valid()
	}
}

func (input OrderInput) Normalize(defaultState OrderState) OrderInput {
	normalized := input
	normalized.UserID = strings.TrimSpace(input.UserID)
	normalized.State = input.State.Normalize()
	if normalized.State == "" {
		normalized.State = defaultState
	}
	return normalized
}

func (input OrderInput) Validate(defaultState OrderState) error {
	normalized := input.Normalize(defaultState)
	var problems []string

	if normalized.UserID == "" {
		problems = append(problems, "userId is required")
	}
	if len(normalized.Contents) == 0 {
		problems = append(problems, "contents must contain at least one book")
	}
	if !normalized.State.Valid() {
		problems = append(problems, "state is invalid")
	}

	for index, book := range normalized.Contents {
		problems = append(problems, validateBook(book, index)...)
	}

	if len(problems) > 0 {
		return ValidationError{Problems: problems}
	}
	return nil
}

func (order Order) Validate() error {
	var problems []string

	if err := ValidateID(order.ID); err != nil {
		problems = append(problems, "id must be a UUID")
	}
	if strings.TrimSpace(order.UserID) == "" {
		problems = append(problems, "userId is required")
	}
	if order.PlacedAt.IsZero() {
		problems = append(problems, "placedAt is required")
	}
	if order.RentEndsAt.IsZero() {
		problems = append(problems, "rentEndsAt is required")
	}
	if order.RentEndsAt.Before(order.PlacedAt) {
		problems = append(problems, "rentEndsAt must be after placedAt")
	}
	if len(order.Contents) == 0 {
		problems = append(problems, "contents must contain at least one book")
	}
	if !order.State.Valid() {
		problems = append(problems, "state is invalid")
	}

	for index, book := range order.Contents {
		problems = append(problems, validateBook(book, index)...)
	}

	if len(problems) > 0 {
		return ValidationError{Problems: problems}
	}
	return nil
}

func validateBook(book Book, index int) []string {
	var problems []string
	prefix := fmt.Sprintf("contents[%d]", index)

	required := map[string]string{
		"isbn":                      book.ISBN,
		"title":                     book.Title,
		"author.firstname":          book.Author.FirstName,
		"author.lastname":           book.Author.LastName,
		"author.bio":                book.Author.Bio,
		"publisher.name":            book.Publisher.Name,
		"publisher.address.city":    book.Publisher.Address.City,
		"publisher.address.zipCode": book.Publisher.Address.ZipCode,
		"publisher.address.street":  book.Publisher.Address.Street,
		"language":                  book.Language,
		"summary":                   book.Summary,
		"publicationDate":           book.PublicationDate,
	}

	for field, value := range required {
		if strings.TrimSpace(value) == "" {
			problems = append(problems, fmt.Sprintf("%s.%s is required", prefix, field))
		}
	}

	if book.Pages < 1 {
		problems = append(problems, fmt.Sprintf("%s.pages must be greater than 0", prefix))
	}
	if book.Edition < 1 {
		problems = append(problems, fmt.Sprintf("%s.edition must be greater than 0", prefix))
	}
	if len(book.Genres) == 0 {
		problems = append(problems, fmt.Sprintf("%s.genres must contain at least one genre", prefix))
	}
	if !book.Type.Valid() {
		problems = append(problems, fmt.Sprintf("%s.type is invalid", prefix))
	}

	return problems
}

func (t BookType) Valid() bool {
	switch BookType(strings.ToUpper(strings.TrimSpace(string(t)))) {
	case BookTypeSoftcover, BookTypeHardcover, BookTypeEbook:
		return true
	default:
		return false
	}
}

func Clone(order Order) Order {
	cloned := order
	cloned.Contents = append([]Book(nil), order.Contents...)
	return cloned
}
