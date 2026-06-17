# Stage 1: Build Go Application
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install git/gcc
RUN apk add --no-cache git gcc libc-dev

COPY go.mod ./
COPY . .
RUN go mod tidy

# Generate Prisma Client Go
RUN go run github.com/steebchen/prisma-client-go generate

# Build the executable
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Stage 2: Runtime image with Go SDK to support db push on startup
FROM golang:1.21-alpine

WORKDIR /app

# Copy built main binary and schema
COPY --from=builder /app/main .
COPY --from=builder /app/schema.prisma .
COPY --from=builder /app/go.mod .
# Copy backend source files so go run works for prisma cli at runtime
COPY . .

EXPOSE 8080

# Run prisma db push to synchronize database schema on startup, then execute Go backend
CMD go run github.com/steebchen/prisma-client-go db push && ./main
