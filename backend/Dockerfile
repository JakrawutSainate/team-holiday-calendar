# Build Go Application
FROM golang:1.21

WORKDIR /app

COPY go.mod ./
RUN go get github.com/steebchen/prisma-client-go@v0.33.0

COPY schema.prisma ./
RUN go run github.com/steebchen/prisma-client-go generate

COPY . .
RUN go mod tidy

# Build the executable
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

EXPOSE 8080

# Execute Go backend
CMD ["./main"]
