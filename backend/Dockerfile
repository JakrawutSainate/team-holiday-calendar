# Build Go Application
FROM golang:1.21

WORKDIR /app

# Download dependencies (cached layer — only re-runs when go.mod/go.sum change)
COPY go.mod go.sum ./
RUN go mod download

# Generate Prisma client from schema
COPY schema.prisma ./
RUN go run github.com/steebchen/prisma-client-go generate

# Copy source code and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

EXPOSE 8080
CMD ["./main"]
