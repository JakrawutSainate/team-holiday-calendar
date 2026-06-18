# Build Go Application
FROM golang:1.21

WORKDIR /app

COPY go.mod ./
RUN go get github.com/steebchen/prisma-client-go@v0.33.0

COPY . .

# Generate Prisma Client Go (generates the db package which imports prisma-client-go)
RUN go run github.com/steebchen/prisma-client-go generate

# Now tidy dependencies because db package is generated and imports prisma-client-go
RUN go mod tidy

# Build the executable
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

EXPOSE 8080

# Run prisma db push to synchronize database schema on startup, then execute Go backend
CMD go run github.com/steebchen/prisma-client-go db push && ./main
