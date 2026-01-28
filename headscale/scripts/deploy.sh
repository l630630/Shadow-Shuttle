#!/bin/bash

# Shadow Shuttle - Headscale Deployment Script
# This script deploys the Headscale coordination server using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}Shadow Shuttle - Headscale Deployment${NC}"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

# Determine docker compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${GREEN}✓${NC} Docker and Docker Compose are installed"
echo ""

# Navigate to project directory
cd "$PROJECT_DIR"

# Create necessary directories
echo "Creating directories..."
mkdir -p config data
echo -e "${GREEN}✓${NC} Directories created"
echo ""

# Check if config file exists
if [ ! -f "config/config.yaml" ]; then
    echo -e "${YELLOW}Warning: config/config.yaml not found${NC}"
    echo "Please ensure the configuration file is in place before starting"
    exit 1
fi

echo -e "${GREEN}✓${NC} Configuration file found"
echo ""

# Check if server_url is configured
if grep -q "your-domain.com" config/config.yaml; then
    echo -e "${YELLOW}Warning: server_url is not configured${NC}"
    echo "Please update config/config.yaml with your actual domain or IP address"
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Pull the latest Headscale image
echo "Pulling Headscale Docker image..."
$DOCKER_COMPOSE pull
echo -e "${GREEN}✓${NC} Image pulled successfully"
echo ""

# Start the services
echo "Starting Headscale server..."
$DOCKER_COMPOSE up -d
echo -e "${GREEN}✓${NC} Headscale server started"
echo ""

# Wait for the service to be ready
echo "Waiting for Headscale to be ready..."
sleep 5

# Check if container is running
if [ "$($DOCKER_COMPOSE ps -q headscale)" ]; then
    echo -e "${GREEN}✓${NC} Headscale container is running"
else
    echo -e "${RED}Error: Headscale container failed to start${NC}"
    echo "Check logs with: $DOCKER_COMPOSE logs headscale"
    exit 1
fi

echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Create a namespace: $DOCKER_COMPOSE exec headscale headscale namespaces create default"
echo "2. Create a pre-auth key: $DOCKER_COMPOSE exec headscale headscale preauthkeys create --namespace default --expiration 24h"
echo "3. View registered nodes: $DOCKER_COMPOSE exec headscale headscale nodes list"
echo ""
echo "Access points:"
echo "- API/Web UI: http://localhost:8080"
echo "- Metrics: http://localhost:9090/metrics"
echo "- gRPC: localhost:50443"
echo ""
echo "To view logs: $DOCKER_COMPOSE logs -f headscale"
echo "To stop: $DOCKER_COMPOSE down"
echo "To restart: $DOCKER_COMPOSE restart"
