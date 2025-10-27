# syntax=docker/dockerfile:1

# ===== Build stage =====
FROM golang:1.22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache git ca-certificates

# Модульные файлы
COPY go.mod go.sum ./
RUN go mod download

# Исходники бэка (контекст ./backend)
COPY . .

# Собираем сервер (предполагается main в ./cmd/server)
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/quiz-server ./cmd/server

# ===== Runtime stage =====
FROM alpine:3.20
WORKDIR /srv
RUN apk add --no-cache ca-certificates tzdata

# Кладём бинарь
COPY --from=builder /out/quiz-server /srv/quiz-server

# Слушаем 8081 (без TLS — TLS на nginx хосте)
EXPOSE 8081

# Healthcheck: если нет /healthz — можешь удалить, у нас есть запасной в compose
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q -O- http://127.0.0.1:8081/healthz || exit 1

ENTRYPOINT ["/srv/quiz-server"]
CMD ["-addr", ":8081"]
