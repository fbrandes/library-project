# Renting Backend

Go HTTP API for rental orders. The request and response models mirror `../../api/spec/renting.yml`, which embeds book payloads from `../../api/spec/bookinfo.yml`.

Run locally:

```sh
go test ./...
go run ./cmd/renting
```

Set `RENTING_DATABASE_URL` to use PostgreSQL through the `database/sql` repository. The backend registers the `pgx` PostgreSQL driver, so the default `RENTING_DATABASE_DRIVER=pgx` compose configuration works with the service binary.
