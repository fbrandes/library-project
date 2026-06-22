# Renting Service

Book rental microservice with:

- `backend`: Go API for rental orders.
- `frontend`: Svelte, TypeScript, Vite, pnpm, Material Web components, zustand, and fetch API.
- `../api/spec/renting.yml`: OpenAPI contract for the service. Its `Order.contents` schema references `../api/spec/bookinfo.yml`.

## Local Development

Backend:

```sh
cd renting/backend
go test ./...
go run ./cmd/renting
```

Frontend:

```sh
cd renting/frontend
pnpm install
pnpm test:coverage
pnpm dev
```

Full stack:

```sh
docker compose up --build
```

The Go backend is written against `database/sql` and registers `github.com/jackc/pgx/v5/stdlib` as the PostgreSQL driver. Repository integration tests use Testcontainers for Go with a real PostgreSQL container.
