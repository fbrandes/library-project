FROM golang:1.26-alpine AS build

WORKDIR /workspace

COPY renting/backend/go.mod renting/backend/go.mod

WORKDIR /workspace/renting/backend
RUN go mod download

COPY renting/backend ./

RUN CGO_ENABLED=0 go test ./...
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/renting ./cmd/renting

FROM alpine:3.22

WORKDIR /app

RUN addgroup -S renting \
    && adduser -S -G renting -h /app -s /sbin/nologin renting

COPY --from=build --chown=renting:renting /out/renting /app/renting

USER renting

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["/app/renting"]
