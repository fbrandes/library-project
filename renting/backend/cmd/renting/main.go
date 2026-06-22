package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/example/bookstore/renting/backend/internal/config"
	"github.com/example/bookstore/renting/backend/internal/httpapi"
	"github.com/example/bookstore/renting/backend/internal/order"
	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	if err := run(config.Load(), signal.Notify); err != nil {
		log.Fatal(err)
	}
}

func run(cfg config.Config, notify func(chan<- os.Signal, ...os.Signal)) error {
	return runWithServer(cfg, notify, func(server *http.Server) error {
		return server.ListenAndServe()
	})
}

func runWithServer(
	cfg config.Config,
	notify func(chan<- os.Signal, ...os.Signal),
	listenAndServe func(*http.Server) error,
) error {
	repository, closeRepository, err := buildRepository(cfg)
	if err != nil {
		return err
	}
	defer closeRepository()

	service := order.NewService(repository, time.Now)
	server := &http.Server{
		Addr:              cfg.Addr,
		Handler:           httpapi.NewRouter(service),
		ReadHeaderTimeout: 5 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		log.Printf("renting service listening on %s", cfg.Addr)
		errCh <- listenAndServe(server)
	}()

	shutdownCh := make(chan os.Signal, 1)
	notify(shutdownCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errCh:
		if !errors.Is(err, http.ErrServerClosed) {
			return fmt.Errorf("server failed: %w", err)
		}
	case <-shutdownCh:
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(ctx); err != nil {
			return fmt.Errorf("server shutdown failed: %w", err)
		}
	}

	return nil
}

func buildRepository(cfg config.Config) (order.Repository, func(), error) {
	if cfg.DatabaseURL == "" {
		log.Print("RENTING_DATABASE_URL is not set; using in-memory order storage")
		return order.NewMemoryRepository(), func() {}, nil
	}

	db, err := sql.Open(cfg.DatabaseDriver, cfg.DatabaseURL)
	if err != nil {
		return nil, nil, fmt.Errorf("open database: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, nil, fmt.Errorf("connect database: %w", err)
	}

	repository := order.NewSQLRepository(db)
	if cfg.AutoMigrate {
		if err := repository.Migrate(ctx); err != nil {
			_ = db.Close()
			return nil, nil, fmt.Errorf("migrate database: %w", err)
		}
	}

	return repository, func() {
		if err := db.Close(); err != nil {
			log.Printf("close database: %v", err)
		}
	}, nil
}
