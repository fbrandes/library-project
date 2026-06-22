package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/example/bookstore/renting/backend/internal/order"
)

type Handler struct {
	service *order.Service
}

func NewRouter(service *order.Service) http.Handler {
	handler := &Handler{service: service}
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", handler.health)
	mux.HandleFunc("GET /orders", handler.listOrders)
	mux.HandleFunc("POST /orders", handler.createOrder)
	mux.HandleFunc("GET /orders/{id}", handler.getOrder)
	mux.HandleFunc("PUT /orders/{id}", handler.updateOrder)
	mux.HandleFunc("DELETE /orders/{id}", handler.deleteOrder)

	return withCORS(mux)
}

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) listOrders(w http.ResponseWriter, r *http.Request) {
	orders, err := h.service.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "unable to list orders")
		return
	}

	writeJSON(w, http.StatusOK, orders)
}

func (h *Handler) getOrder(w http.ResponseWriter, r *http.Request) {
	item, err := h.service.Get(r.Context(), r.PathValue("id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) createOrder(w http.ResponseWriter, r *http.Request) {
	input, ok := decodeOrderInput(w, r)
	if !ok {
		return
	}

	created, err := h.service.Create(r.Context(), input)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, created)
}

func (h *Handler) updateOrder(w http.ResponseWriter, r *http.Request) {
	input, ok := decodeOrderInput(w, r)
	if !ok {
		return
	}

	updated, err := h.service.Update(r.Context(), r.PathValue("id"), input)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, updated)
}

func (h *Handler) deleteOrder(w http.ResponseWriter, r *http.Request) {
	if err := h.service.Delete(r.Context(), r.PathValue("id")); err != nil {
		writeServiceError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func decodeOrderInput(w http.ResponseWriter, r *http.Request) (order.OrderInput, bool) {
	defer r.Body.Close()

	var input order.OrderInput
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON payload")
		return order.OrderInput{}, false
	}

	return input, true
}

func writeServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, order.ErrInvalidID):
		writeError(w, http.StatusBadRequest, "invalid order id")
	case errors.Is(err, order.ErrNotFound):
		writeError(w, http.StatusNotFound, "order not found")
	case errors.Is(err, order.ErrInvalidOrder):
		writeError(w, http.StatusBadRequest, err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "unexpected error")
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"message": message})
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
