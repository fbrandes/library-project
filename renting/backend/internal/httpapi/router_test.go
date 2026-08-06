package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/example/bookstore/renting/backend/internal/order"
)

func TestRouterHealthAndCORS(t *testing.T) {
	router := newTestRouter()

	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	router.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}
	if response.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Fatalf("expected CORS header")
	}

	optionsResponse := httptest.NewRecorder()
	optionsRequest := httptest.NewRequest(http.MethodOptions, "/orders", nil)
	router.ServeHTTP(optionsResponse, optionsRequest)
	if optionsResponse.Code != http.StatusNoContent {
		t.Fatalf("expected options 204, got %d", optionsResponse.Code)
	}
}

func TestRouterOrderLifecycle(t *testing.T) {
	router := newTestRouter()
	input := order.Input{
		UserID:   "user-123",
		Contents: []order.Book{testBook()},
	}

	createdResponse := performJSON(router, http.MethodPost, "/orders", input)
	if createdResponse.Code != http.StatusCreated {
		t.Fatalf("expected create 201, got %d: %s", createdResponse.Code, createdResponse.Body.String())
	}

	var created order.Order
	if err := json.NewDecoder(createdResponse.Body).Decode(&created); err != nil {
		t.Fatalf("decode created: %v", err)
	}
	if created.RentEndsAt.Sub(created.PlacedAt) != order.RentDuration {
		t.Fatalf("expected rent duration")
	}

	listResponse := performJSON(router, http.MethodGet, "/orders", nil)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected list 200, got %d", listResponse.Code)
	}

	getResponse := performJSON(router, http.MethodGet, "/orders/"+created.ID, nil)
	if getResponse.Code != http.StatusOK {
		t.Fatalf("expected get 200, got %d", getResponse.Code)
	}

	input.State = order.StateProcessed
	updateResponse := performJSON(router, http.MethodPut, "/orders/"+created.ID, input)
	if updateResponse.Code != http.StatusOK {
		t.Fatalf("expected update 200, got %d", updateResponse.Code)
	}

	deleteResponse := performJSON(router, http.MethodDelete, "/orders/"+created.ID, nil)
	if deleteResponse.Code != http.StatusNoContent {
		t.Fatalf("expected delete 204, got %d", deleteResponse.Code)
	}

	missingResponse := performJSON(router, http.MethodGet, "/orders/"+created.ID, nil)
	if missingResponse.Code != http.StatusNotFound {
		t.Fatalf("expected missing 404, got %d", missingResponse.Code)
	}
}

func TestRouterBadRequests(t *testing.T) {
	router := newTestRouter()

	invalidJSON := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/orders", bytes.NewBufferString("{"))
	router.ServeHTTP(invalidJSON, request)
	if invalidJSON.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid json 400, got %d", invalidJSON.Code)
	}

	invalidPayload := performJSON(router, http.MethodPost, "/orders", order.Input{})
	if invalidPayload.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid payload 400, got %d", invalidPayload.Code)
	}

	invalidID := performJSON(router, http.MethodGet, "/orders/bad", nil)
	if invalidID.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid id 400, got %d", invalidID.Code)
	}
}

func TestRouterServiceErrors(t *testing.T) {
	validOrderID := "550e8400-e29b-41d4-a716-446655440000"
	validInput := order.Input{
		UserID:   "user-123",
		Contents: []order.Book{testBook()},
	}

	listRouter := NewRouter(order.NewService(&failingRepository{listErr: errors.New("list failed")}, nil))
	listResponse := performJSON(listRouter, http.MethodGet, "/orders", nil)
	if listResponse.Code != http.StatusInternalServerError {
		t.Fatalf("expected list 500, got %d", listResponse.Code)
	}

	updateRouter := NewRouter(order.NewService(&failingRepository{getErr: order.ErrNotFound}, nil))
	updateResponse := performJSON(updateRouter, http.MethodPut, "/orders/"+validOrderID, validInput)
	if updateResponse.Code != http.StatusNotFound {
		t.Fatalf("expected update 404, got %d", updateResponse.Code)
	}

	invalidUpdateJSON := httptest.NewRecorder()
	invalidUpdateRequest := httptest.NewRequest(http.MethodPut, "/orders/"+validOrderID, bytes.NewBufferString("{"))
	updateRouter.ServeHTTP(invalidUpdateJSON, invalidUpdateRequest)
	if invalidUpdateJSON.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid update json 400, got %d", invalidUpdateJSON.Code)
	}

	deleteRouter := NewRouter(order.NewService(&failingRepository{deleteErr: order.ErrNotFound}, nil))
	deleteResponse := performJSON(deleteRouter, http.MethodDelete, "/orders/"+validOrderID, nil)
	if deleteResponse.Code != http.StatusNotFound {
		t.Fatalf("expected delete 404, got %d", deleteResponse.Code)
	}
}

func newTestRouter() http.Handler {
	now := time.Date(2026, 6, 22, 9, 0, 0, 0, time.UTC)
	service := order.NewService(order.NewMemoryRepository(), func() time.Time { return now })
	return NewRouter(service)
}

func performJSON(router http.Handler, method string, path string, body any) *httptest.ResponseRecorder {
	var payload bytes.Buffer
	if body != nil {
		if err := json.NewEncoder(&payload).Encode(body); err != nil {
			slog.Error("failed to write JSON response", "err", err)
		}
	}

	request := httptest.NewRequest(method, path, &payload)
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	return response
}

func testBook() order.Book {
	return order.Book{
		ISBN:  "9780134685991",
		Title: "Effective Go Services",
		Author: order.Author{
			FirstName: "Ada",
			LastName:  "Lovelace",
			Bio:       "Computer pioneer.",
		},
		Pages: 300,
		Publisher: order.Publisher{
			Name: "Engineering Press",
			Address: order.Address{
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
		Type:            order.BookTypeHardcover,
	}
}

type failingRepository struct {
	listErr   error
	getErr    error
	createErr error
	updateErr error
	deleteErr error
}

func (r *failingRepository) List(context.Context) ([]order.Order, error) {
	return nil, r.listErr
}

func (r *failingRepository) Get(context.Context, string) (order.Order, error) {
	if r.getErr != nil {
		return order.Order{}, r.getErr
	}
	return order.Order{}, order.ErrNotFound
}

func (r *failingRepository) Create(_ context.Context, item order.Order) (order.Order, error) {
	if r.createErr != nil {
		return order.Order{}, r.createErr
	}
	return item, nil
}

func (r *failingRepository) Update(_ context.Context, item order.Order) (order.Order, error) {
	if r.updateErr != nil {
		return order.Order{}, r.updateErr
	}
	return item, nil
}

func (r *failingRepository) Delete(context.Context, string) error {
	return r.deleteErr
}
