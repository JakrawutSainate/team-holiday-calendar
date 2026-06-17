# Stage 1: Build Go Application
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install git/gcc (if needed for prisma compilation)
RUN apk add --no-cache git gcc libc-dev

COPY go.mod ./
COPY . .
RUN go mod tidy

# Generate Prisma Client Go inside the build container
RUN go run github.com/steebchen/prisma-client-go generate

# Build the executable
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Stage 2: Final minimal image
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/main .
COPY --from=builder /app/schema.prisma .

EXPOSE 8080

CMD ["./main"]
