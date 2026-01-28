#!/bin/bash

# Shadow Shuttle MVP Quick Start Script
# This script helps you quickly set up a demo environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if command -v docker &> /dev/null; then
        print_success "Docker is installed"
    else
        print_error "Docker is not installed"
        echo "Please install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check Docker Compose
    if command -v docker compose &> /dev/null; then
        print_success "Docker Compose is installed"
    else
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check Go
    if command -v go &> /dev/null; then
        print_success "Go is installed ($(go version))"
    else
        print_warning "Go is not installed (needed for Shadowd)"
        echo "Install Go: https://golang.org/dl/"
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        print_success "Node.js is installed ($(node --version))"
    else
        print_warning "Node.js is not installed (needed for mobile app)"
    fi
}

# Deploy Headscale
deploy_headscale() {
    print_header "Deploying Headscale Server"
    
    if [ ! -d "headscale" ]; then
        print_error "headscale directory not found"
        exit 1
    fi
    
    cd headscale
    
    print_info "Starting Headscale with Docker Compose..."
    docker compose up -d
    
    sleep 5
    
    print_info "Checking Headscale status..."
    if docker compose ps | grep -q "Up"; then
        print_success "Headscale is running"
    else
        print_error "Headscale failed to start"
        docker compose logs
        exit 1
    fi
    
    print_info "Creating default namespace..."
    docker compose exec -T headscale headscale namespaces create default || true
    
    print_info "Generating preauth key..."
    PREAUTH_KEY=$(docker compose exec -T headscale headscale preauthkeys create --namespace default --expiration 24h | grep -oP 'Key: \K.*')
    
    print_success "Headscale deployed successfully"
    print_info "Preauth Key: $PREAUTH_KEY"
    echo "$PREAUTH_KEY" > ../preauth_key.txt
    
    cd ..
}

# Build Shadowd
build_shadowd() {
    print_header "Building Shadowd"
    
    if [ ! -d "shadowd" ]; then
        print_error "shadowd directory not found"
        exit 1
    fi
    
    cd shadowd
    
    print_info "Building Shadowd..."
    go build -o shadowd .
    
    if [ -f "shadowd" ]; then
        print_success "Shadowd built successfully"
    else
        print_error "Shadowd build failed"
        exit 1
    fi
    
    cd ..
}

# Setup Shadowd config
setup_shadowd_config() {
    print_header "Setting up Shadowd Configuration"
    
    cd shadowd
    
    if [ ! -f "shadowd.yaml" ]; then
        print_info "Creating shadowd.yaml from example..."
        cp shadowd.yaml.example shadowd.yaml
    fi
    
    # Update config with preauth key
    if [ -f "../preauth_key.txt" ]; then
        PREAUTH_KEY=$(cat ../preauth_key.txt)
        print_info "Updating config with preauth key..."
        
        # Use sed to update the config (macOS compatible)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/preauth_key:.*/preauth_key: \"$PREAUTH_KEY\"/" shadowd.yaml
        else
            sed -i "s/preauth_key:.*/preauth_key: \"$PREAUTH_KEY\"/" shadowd.yaml
        fi
        
        print_success "Configuration updated"
    fi
    
    cd ..
}

# Setup mobile app
setup_mobile_app() {
    print_header "Setting up Mobile App"
    
    if [ ! -d "mobile-app" ]; then
        print_warning "mobile-app directory not found, skipping"
        return
    fi
    
    cd mobile-app
    
    if command -v npm &> /dev/null; then
        print_info "Installing dependencies..."
        npm install --silent
        print_success "Dependencies installed"
    else
        print_warning "npm not found, skipping mobile app setup"
    fi
    
    cd ..
}

# Print next steps
print_next_steps() {
    print_header "MVP Setup Complete!"
    
    echo -e "${GREEN}✓ Headscale is running${NC}"
    echo -e "${GREEN}✓ Shadowd is built${NC}"
    echo -e "${GREEN}✓ Configuration is ready${NC}"
    
    print_header "Next Steps"
    
    echo "1. Start Shadowd:"
    echo -e "   ${YELLOW}cd shadowd && ./shadowd -config shadowd.yaml${NC}"
    echo ""
    
    echo "2. Verify connection:"
    echo -e "   ${YELLOW}cd headscale && docker compose exec headscale headscale nodes list${NC}"
    echo ""
    
    echo "3. (Optional) Run mobile app:"
    echo -e "   ${YELLOW}cd mobile-app && npm run ios${NC}"
    echo -e "   ${YELLOW}cd mobile-app && npm run android${NC}"
    echo ""
    
    echo "4. Test SSH connection:"
    echo -e "   ${YELLOW}ssh user@<mesh-ip> -p 22${NC}"
    echo ""
    
    print_header "Useful Commands"
    
    echo "View Headscale logs:"
    echo -e "   ${YELLOW}cd headscale && docker compose logs -f${NC}"
    echo ""
    
    echo "Stop Headscale:"
    echo -e "   ${YELLOW}cd headscale && docker compose down${NC}"
    echo ""
    
    echo "View Shadowd help:"
    echo -e "   ${YELLOW}cd shadowd && ./shadowd --help${NC}"
    echo ""
    
    print_header "Documentation"
    echo "- MVP Deployment Guide: MVP_DEPLOYMENT_GUIDE.md"
    echo "- Headscale README: headscale/README.md"
    echo "- Shadowd README: shadowd/README.md"
    echo "- Mobile App README: mobile-app/README.md"
    echo ""
    
    print_success "Happy hacking! 🚀"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════╗"
    echo "║   Shadow Shuttle MVP Quick Start      ║"
    echo "║   影梭 MVP 快速启动                    ║"
    echo "╚═══════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_prerequisites
    deploy_headscale
    build_shadowd
    setup_shadowd_config
    setup_mobile_app
    print_next_steps
}

# Run main function
main
