package main

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/example/bookstore/renting/backend/internal/config"
	"github.com/example/bookstore/renting/backend/internal/order"
)

func TestBuildRepositoryUsesMemoryWithoutDatabaseURL(t *testing.T) {
	repository, closeRepository, err := buildRepository(config.Config{})
	if err != nil {
		t.Fatalf("build repository: %v", err)
	}
	closeRepository()

	if _, ok := repository.(*order.MemoryRepository); !ok {
		t.Fatalf("expected memory repository, got %T", repository)
	}
}

func TestBuildRepositoryUsesSQLRepositoryWithoutAutoMigrate(t *testing.T) {
	dbDriver := registerRecordingDriver(t, recordingDriverOptions{})

	repository, closeRepository, err := buildRepository(config.Config{
		DatabaseDriver: dbDriver.name,
		DatabaseURL:    "renting-test-dsn",
		AutoMigrate:    false,
	})
	if err != nil {
		t.Fatalf("build repository: %v", err)
	}
	closeRepository()

	if _, ok := repository.(*order.SQLRepository); !ok {
		t.Fatalf("expected SQL repository, got %T", repository)
	}

	state := dbDriver.snapshot()
	if state.opened != 1 {
		t.Fatalf("expected one database connection, got %d", state.opened)
	}
	if state.dsn != "renting-test-dsn" {
		t.Fatalf("expected configured DSN, got %q", state.dsn)
	}
	if state.pinged != 1 {
		t.Fatalf("expected one ping, got %d", state.pinged)
	}
	if len(state.execQueries) != 0 {
		t.Fatalf("expected no migration queries, got %d", len(state.execQueries))
	}
	if state.closed != 1 {
		t.Fatalf("expected repository close to close database connection, got %d", state.closed)
	}
}

func TestBuildRepositoryAutoMigratesSQLRepository(t *testing.T) {
	dbDriver := registerRecordingDriver(t, recordingDriverOptions{})

	repository, closeRepository, err := buildRepository(config.Config{
		DatabaseDriver: dbDriver.name,
		DatabaseURL:    "renting-test-dsn",
		AutoMigrate:    true,
	})
	if err != nil {
		t.Fatalf("build repository: %v", err)
	}
	closeRepository()

	if _, ok := repository.(*order.SQLRepository); !ok {
		t.Fatalf("expected SQL repository, got %T", repository)
	}

	state := dbDriver.snapshot()
	if len(state.execQueries) != 1 {
		t.Fatalf("expected one migration query, got %d", len(state.execQueries))
	}
	if !strings.Contains(state.execQueries[0], "CREATE TABLE IF NOT EXISTS orders") {
		t.Fatalf("expected orders migration query, got %q", state.execQueries[0])
	}
	if state.closed != 1 {
		t.Fatalf("expected repository close to close database connection, got %d", state.closed)
	}
}

func TestBuildRepositoryReturnsOpenDatabaseError(t *testing.T) {
	_, closeRepository, err := buildRepository(config.Config{
		DatabaseDriver: "renting-missing-driver",
		DatabaseURL:    "renting-test-dsn",
	})
	if err == nil {
		t.Fatalf("expected open database error")
	}
	if closeRepository != nil {
		t.Fatalf("expected no close function on open error")
	}
	if !strings.Contains(err.Error(), "open database") {
		t.Fatalf("expected open database context, got %v", err)
	}
}

func TestBuildRepositoryReturnsPingError(t *testing.T) {
	pingErr := errors.New("ping failed")
	dbDriver := registerRecordingDriver(t, recordingDriverOptions{pingErr: pingErr})

	_, closeRepository, err := buildRepository(config.Config{
		DatabaseDriver: dbDriver.name,
		DatabaseURL:    "renting-test-dsn",
	})
	if err == nil {
		t.Fatalf("expected ping error")
	}
	if closeRepository != nil {
		t.Fatalf("expected no close function on ping error")
	}
	if !errors.Is(err, pingErr) {
		t.Fatalf("expected wrapped ping error, got %v", err)
	}

	state := dbDriver.snapshot()
	if state.closed == 0 {
		t.Fatalf("expected failed connection to be closed")
	}
}

func TestBuildRepositoryReturnsMigrationError(t *testing.T) {
	migrateErr := errors.New("migration failed")
	dbDriver := registerRecordingDriver(t, recordingDriverOptions{execErr: migrateErr})

	_, closeRepository, err := buildRepository(config.Config{
		DatabaseDriver: dbDriver.name,
		DatabaseURL:    "renting-test-dsn",
		AutoMigrate:    true,
	})
	if err == nil {
		t.Fatalf("expected migration error")
	}
	if closeRepository != nil {
		t.Fatalf("expected no close function on migration error")
	}
	if !errors.Is(err, migrateErr) {
		t.Fatalf("expected wrapped migration error, got %v", err)
	}

	state := dbDriver.snapshot()
	if len(state.execQueries) != 1 {
		t.Fatalf("expected one attempted migration query, got %d", len(state.execQueries))
	}
	if state.closed == 0 {
		t.Fatalf("expected failed migration connection to be closed")
	}
}

func TestBuildRepositoryCloseLogsDatabaseCloseError(t *testing.T) {
	dbDriver := registerRecordingDriver(t, recordingDriverOptions{closeErr: errors.New("close failed")})

	_, closeRepository, err := buildRepository(config.Config{
		DatabaseDriver: dbDriver.name,
		DatabaseURL:    "renting-test-dsn",
	})
	if err != nil {
		t.Fatalf("build repository: %v", err)
	}
	closeRepository()

	state := dbDriver.snapshot()
	if state.closed != 1 {
		t.Fatalf("expected repository close to close database connection, got %d", state.closed)
	}
}

func TestRunReturnsListenError(t *testing.T) {
	listenErr := errors.New("listen failed")
	err := runWithServer(
		config.Config{Addr: "bad-address"},
		func(chan<- os.Signal, ...os.Signal) {},
		func(*http.Server) error {
			return listenErr
		},
	)
	if err == nil {
		t.Fatalf("expected listen error")
	}
	if !errors.Is(err, listenErr) {
		t.Fatalf("expected wrapped listen error, got %v", err)
	}
	if !strings.Contains(err.Error(), "server failed") {
		t.Fatalf("expected server failure context, got %v", err)
	}
}

func TestRunReturnsRepositoryBuildError(t *testing.T) {
	err := run(config.Config{
		DatabaseDriver: "renting-missing-driver",
		DatabaseURL:    "renting-test-dsn",
	}, func(chan<- os.Signal, ...os.Signal) {})
	if err == nil {
		t.Fatalf("expected repository build error")
	}
	if !strings.Contains(err.Error(), "open database") {
		t.Fatalf("expected open database context, got %v", err)
	}
}

func TestRunStopsOnShutdownSignal(t *testing.T) {
	ready := make(chan struct{})
	shutdown := make(chan struct{})

	err := runWithServer(
		config.Config{Addr: "127.0.0.1:0"},
		func(shutdownCh chan<- os.Signal, _ ...os.Signal) {
			<-ready
			shutdownCh <- os.Interrupt
		},
		func(server *http.Server) error {
			server.RegisterOnShutdown(func() {
				close(shutdown)
			})
			close(ready)
			<-shutdown
			return http.ErrServerClosed
		},
	)
	if err != nil {
		t.Fatalf("run: %v", err)
	}
}

type recordingDriverOptions struct {
	pingErr  error
	execErr  error
	closeErr error
}

type recordingState struct {
	opened      int
	closed      int
	pinged      int
	dsn         string
	execQueries []string
}

type recordingDriver struct {
	name string

	pingErr  error
	execErr  error
	closeErr error

	mu          sync.Mutex
	opened      int
	closed      int
	pinged      int
	dsn         string
	execQueries []string
}

var recordingDriverID atomic.Uint64

func registerRecordingDriver(t *testing.T, opts recordingDriverOptions) *recordingDriver {
	t.Helper()

	dbDriver := &recordingDriver{
		name:     "renting-recording-" + strconv.FormatUint(recordingDriverID.Add(1), 10),
		pingErr:  opts.pingErr,
		execErr:  opts.execErr,
		closeErr: opts.closeErr,
	}
	sql.Register(dbDriver.name, dbDriver)

	return dbDriver
}

func (d *recordingDriver) Open(name string) (driver.Conn, error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	d.opened++
	d.dsn = name

	return &recordingConn{driver: d}, nil
}

func (d *recordingDriver) snapshot() recordingState {
	d.mu.Lock()
	defer d.mu.Unlock()

	return recordingState{
		opened:      d.opened,
		closed:      d.closed,
		pinged:      d.pinged,
		dsn:         d.dsn,
		execQueries: append([]string(nil), d.execQueries...),
	}
}

type recordingConn struct {
	driver *recordingDriver
}

func (c *recordingConn) Prepare(string) (driver.Stmt, error) {
	return nil, errors.New("prepare is not implemented")
}

func (c *recordingConn) Close() error {
	c.driver.mu.Lock()
	defer c.driver.mu.Unlock()

	c.driver.closed++
	return c.driver.closeErr
}

func (c *recordingConn) Begin() (driver.Tx, error) {
	return nil, errors.New("transactions are not implemented")
}

func (c *recordingConn) Ping(context.Context) error {
	c.driver.mu.Lock()
	defer c.driver.mu.Unlock()

	c.driver.pinged++
	return c.driver.pingErr
}

func (c *recordingConn) ExecContext(_ context.Context, query string, _ []driver.NamedValue) (driver.Result, error) {
	c.driver.mu.Lock()
	defer c.driver.mu.Unlock()

	c.driver.execQueries = append(c.driver.execQueries, query)
	if c.driver.execErr != nil {
		return nil, c.driver.execErr
	}

	return driver.RowsAffected(0), nil
}
