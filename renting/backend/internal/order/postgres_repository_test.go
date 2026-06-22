package order

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"io"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
)

func TestSQLRepositoryMigrate(t *testing.T) {
	db, dbDriver := newRecordingSQLDB(t, recordingSQLOptions{})
	repository := NewSQLRepository(db)

	if err := repository.Migrate(context.Background()); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	state := dbDriver.snapshot()
	if len(state.execCalls) != 1 {
		t.Fatalf("expected one exec call, got %d", len(state.execCalls))
	}
	if !strings.Contains(state.execCalls[0].query, "CREATE TABLE IF NOT EXISTS orders") {
		t.Fatalf("expected orders migration, got %q", state.execCalls[0].query)
	}
}

func TestSQLRepositoryMigrateReturnsExecError(t *testing.T) {
	execErr := errors.New("exec failed")
	db, _ := newRecordingSQLDB(t, recordingSQLOptions{execErr: execErr})
	repository := NewSQLRepository(db)

	if err := repository.Migrate(context.Background()); !errors.Is(err, execErr) {
		t.Fatalf("expected wrapped exec error, got %v", err)
	}
}

func TestSQLRepositoryListScansOrders(t *testing.T) {
	older := testOrder()
	newer := testOrder()
	newer.ID = "550e8400-e29b-41d4-a716-446655440002"
	newer.UserID = "user-456"
	newer.Contents = append(newer.Contents, testBook())

	db, dbDriver := newRecordingSQLDB(t, recordingSQLOptions{
		queryRows: [][]driver.Value{
			sqlOrderRow(t, newer),
			sqlOrderRow(t, older),
		},
	})
	repository := NewSQLRepository(db)

	got, err := repository.List(context.Background())
	if err != nil {
		t.Fatalf("list: %v", err)
	}

	if len(got) != 2 {
		t.Fatalf("expected 2 orders, got %d", len(got))
	}
	if got[0].ID != newer.ID || got[1].ID != older.ID {
		t.Fatalf("expected rows in driver order, got %+v", got)
	}
	if len(got[0].Contents) != 2 {
		t.Fatalf("expected JSON contents to round trip, got %+v", got[0].Contents)
	}

	state := dbDriver.snapshot()
	if len(state.queryCalls) != 1 {
		t.Fatalf("expected one query call, got %d", len(state.queryCalls))
	}
	if !strings.Contains(state.queryCalls[0].query, "ORDER BY placed_at DESC") {
		t.Fatalf("expected list query, got %q", state.queryCalls[0].query)
	}
}

func TestSQLRepositoryListReturnsQueryError(t *testing.T) {
	queryErr := errors.New("query failed")
	db, _ := newRecordingSQLDB(t, recordingSQLOptions{queryErr: queryErr})
	repository := NewSQLRepository(db)

	if _, err := repository.List(context.Background()); !errors.Is(err, queryErr) {
		t.Fatalf("expected wrapped query error, got %v", err)
	}
}

func TestSQLRepositoryListReturnsRowsError(t *testing.T) {
	rowsErr := errors.New("rows failed")
	db, _ := newRecordingSQLDB(t, recordingSQLOptions{
		queryRows: [][]driver.Value{sqlOrderRow(t, testOrder())},
		rowsErr:   rowsErr,
	})
	repository := NewSQLRepository(db)

	if _, err := repository.List(context.Background()); !errors.Is(err, rowsErr) {
		t.Fatalf("expected wrapped rows error, got %v", err)
	}
}

func TestSQLRepositoryListReturnsScanError(t *testing.T) {
	row := sqlOrderRow(t, testOrder())
	row[3] = []byte("{")
	db, _ := newRecordingSQLDB(t, recordingSQLOptions{queryRows: [][]driver.Value{row}})
	repository := NewSQLRepository(db)

	if _, err := repository.List(context.Background()); err == nil {
		t.Fatalf("expected scan error")
	}
}

func TestSQLRepositoryGetScansOrder(t *testing.T) {
	item := testOrder()
	db, dbDriver := newRecordingSQLDB(t, recordingSQLOptions{
		queryRows: [][]driver.Value{sqlOrderRow(t, item)},
	})
	repository := NewSQLRepository(db)

	got, err := repository.Get(context.Background(), item.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}

	if got.ID != item.ID || got.UserID != item.UserID || len(got.Contents) != len(item.Contents) {
		t.Fatalf("unexpected order: %+v", got)
	}

	state := dbDriver.snapshot()
	if len(state.queryCalls) != 1 {
		t.Fatalf("expected one query call, got %d", len(state.queryCalls))
	}
	if len(state.queryCalls[0].args) != 1 || state.queryCalls[0].args[0].Value != item.ID {
		t.Fatalf("expected id query argument, got %+v", state.queryCalls[0].args)
	}
}

func TestSQLRepositoryGetReturnsNotFound(t *testing.T) {
	db, _ := newRecordingSQLDB(t, recordingSQLOptions{})
	repository := NewSQLRepository(db)

	if _, err := repository.Get(context.Background(), testOrderID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected not found, got %v", err)
	}
}

func TestSQLRepositoryGetReturnsScanError(t *testing.T) {
	queryErr := errors.New("query failed")
	db, _ := newRecordingSQLDB(t, recordingSQLOptions{queryErr: queryErr})
	repository := NewSQLRepository(db)

	if _, err := repository.Get(context.Background(), testOrderID); !errors.Is(err, queryErr) {
		t.Fatalf("expected wrapped query error, got %v", err)
	}
}

func TestSQLRepositoryCreateExecutesInsert(t *testing.T) {
	item := testOrder()
	db, dbDriver := newRecordingSQLDB(t, recordingSQLOptions{})
	repository := NewSQLRepository(db)

	got, err := repository.Create(context.Background(), item)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if got.ID != item.ID {
		t.Fatalf("expected created order clone, got %+v", got)
	}

	state := dbDriver.snapshot()
	if len(state.execCalls) != 1 {
		t.Fatalf("expected one exec call, got %d", len(state.execCalls))
	}
	if !strings.Contains(state.execCalls[0].query, "INSERT INTO orders") {
		t.Fatalf("expected insert query, got %q", state.execCalls[0].query)
	}
	if len(state.execCalls[0].args) != 6 || state.execCalls[0].args[0].Value != item.ID {
		t.Fatalf("expected insert arguments, got %+v", state.execCalls[0].args)
	}
}

func TestSQLRepositoryCreateReturnsExecError(t *testing.T) {
	execErr := errors.New("insert failed")
	db, _ := newRecordingSQLDB(t, recordingSQLOptions{execErr: execErr})
	repository := NewSQLRepository(db)

	if _, err := repository.Create(context.Background(), testOrder()); !errors.Is(err, execErr) {
		t.Fatalf("expected wrapped exec error, got %v", err)
	}
}

func TestSQLRepositoryUpdateExecutesUpdate(t *testing.T) {
	item := testOrder()
	db, dbDriver := newRecordingSQLDB(t, recordingSQLOptions{rowsAffected: 1})
	repository := NewSQLRepository(db)

	got, err := repository.Update(context.Background(), item)
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if got.ID != item.ID {
		t.Fatalf("expected updated order clone, got %+v", got)
	}

	state := dbDriver.snapshot()
	if len(state.execCalls) != 1 {
		t.Fatalf("expected one exec call, got %d", len(state.execCalls))
	}
	if !strings.Contains(state.execCalls[0].query, "UPDATE orders") {
		t.Fatalf("expected update query, got %q", state.execCalls[0].query)
	}
}

func TestSQLRepositoryUpdateReturnsExecError(t *testing.T) {
	execErr := errors.New("update failed")
	db, _ := newRecordingSQLDB(t, recordingSQLOptions{execErr: execErr})
	repository := NewSQLRepository(db)

	if _, err := repository.Update(context.Background(), testOrder()); !errors.Is(err, execErr) {
		t.Fatalf("expected wrapped exec error, got %v", err)
	}
}

func TestSQLRepositoryUpdateReturnsRowsAffectedError(t *testing.T) {
	rowsAffectedErr := errors.New("rows affected failed")
	db, _ := newRecordingSQLDB(t, recordingSQLOptions{rowsAffectedErr: rowsAffectedErr})
	repository := NewSQLRepository(db)

	if _, err := repository.Update(context.Background(), testOrder()); !errors.Is(err, rowsAffectedErr) {
		t.Fatalf("expected wrapped rows affected error, got %v", err)
	}
}

func TestSQLRepositoryUpdateReturnsNotFound(t *testing.T) {
	db, _ := newRecordingSQLDB(t, recordingSQLOptions{rowsAffected: 0})
	repository := NewSQLRepository(db)

	if _, err := repository.Update(context.Background(), testOrder()); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected not found, got %v", err)
	}
}

func TestSQLRepositoryDeleteExecutesDelete(t *testing.T) {
	db, dbDriver := newRecordingSQLDB(t, recordingSQLOptions{rowsAffected: 1})
	repository := NewSQLRepository(db)

	if err := repository.Delete(context.Background(), testOrderID); err != nil {
		t.Fatalf("delete: %v", err)
	}

	state := dbDriver.snapshot()
	if len(state.execCalls) != 1 {
		t.Fatalf("expected one exec call, got %d", len(state.execCalls))
	}
	if !strings.Contains(state.execCalls[0].query, "DELETE FROM orders") {
		t.Fatalf("expected delete query, got %q", state.execCalls[0].query)
	}
	if len(state.execCalls[0].args) != 1 || state.execCalls[0].args[0].Value != testOrderID {
		t.Fatalf("expected delete id argument, got %+v", state.execCalls[0].args)
	}
}

func TestSQLRepositoryDeleteReturnsExecError(t *testing.T) {
	execErr := errors.New("delete failed")
	db, _ := newRecordingSQLDB(t, recordingSQLOptions{execErr: execErr})
	repository := NewSQLRepository(db)

	if err := repository.Delete(context.Background(), testOrderID); !errors.Is(err, execErr) {
		t.Fatalf("expected wrapped exec error, got %v", err)
	}
}

func TestSQLRepositoryDeleteReturnsRowsAffectedError(t *testing.T) {
	rowsAffectedErr := errors.New("rows affected failed")
	db, _ := newRecordingSQLDB(t, recordingSQLOptions{rowsAffectedErr: rowsAffectedErr})
	repository := NewSQLRepository(db)

	if err := repository.Delete(context.Background(), testOrderID); !errors.Is(err, rowsAffectedErr) {
		t.Fatalf("expected wrapped rows affected error, got %v", err)
	}
}

func TestSQLRepositoryDeleteReturnsNotFound(t *testing.T) {
	db, _ := newRecordingSQLDB(t, recordingSQLOptions{rowsAffected: 0})
	repository := NewSQLRepository(db)

	if err := repository.Delete(context.Background(), testOrderID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected not found, got %v", err)
	}
}

func TestScanOrderReturnsScannerError(t *testing.T) {
	scanErr := errors.New("scan failed")
	_, err := scanOrder(scannerFunc(func(...any) error {
		return scanErr
	}))
	if !errors.Is(err, scanErr) {
		t.Fatalf("expected scan error, got %v", err)
	}
}

type scannerFunc func(...any) error

func (f scannerFunc) Scan(dest ...any) error {
	return f(dest...)
}

func sqlOrderRow(t *testing.T, item Order) []driver.Value {
	t.Helper()

	contents, err := json.Marshal(item.Contents)
	if err != nil {
		t.Fatalf("marshal contents: %v", err)
	}

	return []driver.Value{
		item.ID,
		item.UserID,
		item.PlacedAt,
		contents,
		item.RentEndsAt,
		string(item.State),
	}
}

type recordingSQLOptions struct {
	execErr         error
	queryErr        error
	rowsAffected    int64
	rowsAffectedErr error
	queryRows       [][]driver.Value
	rowsErr         error
}

type recordingSQLCall struct {
	query string
	args  []driver.NamedValue
}

type recordingSQLState struct {
	execCalls  []recordingSQLCall
	queryCalls []recordingSQLCall
}

type recordingSQLDriver struct {
	name string

	execErr         error
	queryErr        error
	rowsAffected    int64
	rowsAffectedErr error
	queryRows       [][]driver.Value
	rowsErr         error

	mu         sync.Mutex
	execCalls  []recordingSQLCall
	queryCalls []recordingSQLCall
}

var recordingSQLDriverID atomic.Uint64

func newRecordingSQLDB(t *testing.T, opts recordingSQLOptions) (*sql.DB, *recordingSQLDriver) {
	t.Helper()

	dbDriver := &recordingSQLDriver{
		name:            "renting-order-recording-" + strings.ToLower(t.Name()) + "-" + strconv.FormatUint(recordingSQLDriverID.Add(1), 10),
		execErr:         opts.execErr,
		queryErr:        opts.queryErr,
		rowsAffected:    opts.rowsAffected,
		rowsAffectedErr: opts.rowsAffectedErr,
		queryRows:       opts.queryRows,
		rowsErr:         opts.rowsErr,
	}
	sql.Register(dbDriver.name, dbDriver)

	db, err := sql.Open(dbDriver.name, "renting-test-dsn")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() {
		_ = db.Close()
	})

	return db, dbDriver
}

func (d *recordingSQLDriver) Open(string) (driver.Conn, error) {
	return &recordingSQLConn{driver: d}, nil
}

func (d *recordingSQLDriver) snapshot() recordingSQLState {
	d.mu.Lock()
	defer d.mu.Unlock()

	return recordingSQLState{
		execCalls:  append([]recordingSQLCall(nil), d.execCalls...),
		queryCalls: append([]recordingSQLCall(nil), d.queryCalls...),
	}
}

type recordingSQLConn struct {
	driver *recordingSQLDriver
}

func (c *recordingSQLConn) Prepare(string) (driver.Stmt, error) {
	return nil, errors.New("prepare is not implemented")
}

func (c *recordingSQLConn) Close() error {
	return nil
}

func (c *recordingSQLConn) Begin() (driver.Tx, error) {
	return nil, errors.New("transactions are not implemented")
}

func (c *recordingSQLConn) ExecContext(_ context.Context, query string, args []driver.NamedValue) (driver.Result, error) {
	c.driver.mu.Lock()
	c.driver.execCalls = append(c.driver.execCalls, recordingSQLCall{
		query: query,
		args:  append([]driver.NamedValue(nil), args...),
	})
	c.driver.mu.Unlock()

	if c.driver.execErr != nil {
		return nil, c.driver.execErr
	}
	return recordingSQLResult{
		affected:    c.driver.rowsAffected,
		affectedErr: c.driver.rowsAffectedErr,
	}, nil
}

func (c *recordingSQLConn) QueryContext(_ context.Context, query string, args []driver.NamedValue) (driver.Rows, error) {
	c.driver.mu.Lock()
	c.driver.queryCalls = append(c.driver.queryCalls, recordingSQLCall{
		query: query,
		args:  append([]driver.NamedValue(nil), args...),
	})
	rows := cloneDriverRows(c.driver.queryRows)
	rowsErr := c.driver.rowsErr
	c.driver.mu.Unlock()

	if c.driver.queryErr != nil {
		return nil, c.driver.queryErr
	}
	return &recordingSQLRows{rows: rows, rowsErr: rowsErr}, nil
}

type recordingSQLResult struct {
	affected    int64
	affectedErr error
}

func (r recordingSQLResult) LastInsertId() (int64, error) {
	return 0, errors.New("last insert id is not supported")
}

func (r recordingSQLResult) RowsAffected() (int64, error) {
	if r.affectedErr != nil {
		return 0, r.affectedErr
	}
	return r.affected, nil
}

type recordingSQLRows struct {
	rows    [][]driver.Value
	rowsErr error
	index   int
}

func (r *recordingSQLRows) Columns() []string {
	return []string{"id", "user_id", "placed_at", "contents", "rent_ends_at", "state"}
}

func (r *recordingSQLRows) Close() error {
	return nil
}

func (r *recordingSQLRows) Next(dest []driver.Value) error {
	if r.index < len(r.rows) {
		copy(dest, r.rows[r.index])
		r.index++
		return nil
	}
	if r.rowsErr != nil {
		err := r.rowsErr
		r.rowsErr = nil
		return err
	}
	return io.EOF
}

func cloneDriverRows(rows [][]driver.Value) [][]driver.Value {
	cloned := make([][]driver.Value, len(rows))
	for i := range rows {
		cloned[i] = append([]driver.Value(nil), rows[i]...)
	}
	return cloned
}
