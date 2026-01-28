.PHONY: build test clean install run

# Binary names
BINARY=shadowd
SERVICE_BINARY=shadowd-service
VERSION=0.1.0

# Build flags
LDFLAGS=-ldflags "-X main.version=$(VERSION)"

# Default target
all: build

# Build the binary
build:
	go build $(LDFLAGS) -o $(BINARY) .

# Build service manager
build-service:
	go build -o $(SERVICE_BINARY) ./cmd/service

# Run tests
test:
	go test -v ./...

# Run tests with coverage
test-coverage:
	go test -cover ./...
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Clean build artifacts
clean:
	rm -f $(BINARY) $(SERVICE_BINARY)
	rm -f coverage.out coverage.html
	rm -f shadowd-linux shadowd-macos shadowd.exe
	rm -f shadowd-service-linux shadowd-service-macos shadowd-service.exe

# Install dependencies
deps:
	go mod download
	go mod tidy

# Generate protobuf code
proto:
	protoc --go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=. --go-grpc_opt=paths=source_relative \
		proto/device.proto

# Run the daemon
run:
	go run . -config shadowd.yaml

# Build for multiple platforms
build-all: build-linux build-macos build-windows

build-linux:
	GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o shadowd-linux .
	GOOS=linux GOARCH=amd64 go build -o shadowd-service-linux ./cmd/service

build-macos:
	GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o shadowd-macos .
	GOOS=darwin GOARCH=amd64 go build -o shadowd-service-macos ./cmd/service

build-windows:
	GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o shadowd.exe .
	GOOS=windows GOARCH=amd64 go build -o shadowd-service.exe ./cmd/service

# Format code
fmt:
	go fmt ./...

# Run linter
lint:
	golangci-lint run

# Install the binary
install: build build-service
	sudo cp $(BINARY) /usr/local/bin/
	sudo cp $(SERVICE_BINARY) /usr/local/bin/

# Install as system service
install-service: install
	sudo $(SERVICE_BINARY) -action install -executable /usr/local/bin/$(BINARY) -config /etc/shadowd/shadowd.yaml
