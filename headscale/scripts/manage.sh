#!/bin/bash

# Shadow Shuttle - Headscale Management Script
# This script provides convenient commands for managing the Headscale server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Determine docker compose command
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Change to project directory
cd "$PROJECT_DIR"

# Function to execute headscale commands
headscale_exec() {
    $DOCKER_COMPOSE exec headscale headscale "$@"
}

# Function to show usage
show_usage() {
    echo -e "${BLUE}Shadow Shuttle - Headscale Management${NC}"
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  namespace create <name>       Create a new namespace"
    echo "  namespace list                List all namespaces"
    echo "  namespace destroy <name>      Delete a namespace"
    echo ""
    echo "  preauth create <namespace>    Create a pre-auth key"
    echo "  preauth list <namespace>      List pre-auth keys"
    echo ""
    echo "  nodes list                    List all registered nodes"
    echo "  nodes delete <id>             Delete a node by ID"
    echo "  nodes expire <id>             Expire a node by ID"
    echo ""
    echo "  routes list                   List all routes"
    echo "  routes enable <id> <route>    Enable a route for a node"
    echo ""
    echo "  status                        Show server status"
    echo "  logs                          Show server logs"
    echo "  restart                       Restart the server"
    echo "  stop                          Stop the server"
    echo "  start                         Start the server"
    echo ""
    echo "Examples:"
    echo "  $0 namespace create default"
    echo "  $0 preauth create default"
    echo "  $0 nodes list"
}

# Check if Headscale is running
check_running() {
    if [ ! "$($DOCKER_COMPOSE ps -q headscale 2>/dev/null)" ]; then
        echo -e "${RED}Error: Headscale is not running${NC}"
        echo "Start it with: $DOCKER_COMPOSE up -d"
        exit 1
    fi
}

# Main command handling
case "${1:-}" in
    namespace)
        check_running
        case "${2:-}" in
            create)
                if [ -z "${3:-}" ]; then
                    echo -e "${RED}Error: Namespace name required${NC}"
                    echo "Usage: $0 namespace create <name>"
                    exit 1
                fi
                echo "Creating namespace: $3"
                headscale_exec namespaces create "$3"
                echo -e "${GREEN}✓${NC} Namespace created"
                ;;
            list)
                headscale_exec namespaces list
                ;;
            destroy)
                if [ -z "${3:-}" ]; then
                    echo -e "${RED}Error: Namespace name required${NC}"
                    echo "Usage: $0 namespace destroy <name>"
                    exit 1
                fi
                echo -e "${YELLOW}Warning: This will delete namespace '$3' and all its nodes${NC}"
                read -p "Are you sure? (y/N) " -n 1 -r
                echo ""
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    headscale_exec namespaces destroy "$3"
                    echo -e "${GREEN}✓${NC} Namespace destroyed"
                fi
                ;;
            *)
                echo -e "${RED}Error: Unknown namespace command${NC}"
                show_usage
                exit 1
                ;;
        esac
        ;;
    
    preauth)
        check_running
        case "${2:-}" in
            create)
                if [ -z "${3:-}" ]; then
                    echo -e "${RED}Error: Namespace name required${NC}"
                    echo "Usage: $0 preauth create <namespace>"
                    exit 1
                fi
                echo "Creating pre-auth key for namespace: $3"
                headscale_exec preauthkeys create --namespace "$3" --expiration 24h --reusable
                ;;
            list)
                if [ -z "${3:-}" ]; then
                    echo -e "${RED}Error: Namespace name required${NC}"
                    echo "Usage: $0 preauth list <namespace>"
                    exit 1
                fi
                headscale_exec preauthkeys list --namespace "$3"
                ;;
            *)
                echo -e "${RED}Error: Unknown preauth command${NC}"
                show_usage
                exit 1
                ;;
        esac
        ;;
    
    nodes)
        check_running
        case "${2:-}" in
            list)
                headscale_exec nodes list
                ;;
            delete)
                if [ -z "${3:-}" ]; then
                    echo -e "${RED}Error: Node ID required${NC}"
                    echo "Usage: $0 nodes delete <id>"
                    exit 1
                fi
                echo -e "${YELLOW}Warning: This will delete node $3${NC}"
                read -p "Are you sure? (y/N) " -n 1 -r
                echo ""
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    headscale_exec nodes delete "$3"
                    echo -e "${GREEN}✓${NC} Node deleted"
                fi
                ;;
            expire)
                if [ -z "${3:-}" ]; then
                    echo -e "${RED}Error: Node ID required${NC}"
                    echo "Usage: $0 nodes expire <id>"
                    exit 1
                fi
                headscale_exec nodes expire "$3"
                echo -e "${GREEN}✓${NC} Node expired"
                ;;
            *)
                echo -e "${RED}Error: Unknown nodes command${NC}"
                show_usage
                exit 1
                ;;
        esac
        ;;
    
    routes)
        check_running
        case "${2:-}" in
            list)
                headscale_exec routes list
                ;;
            enable)
                if [ -z "${3:-}" ] || [ -z "${4:-}" ]; then
                    echo -e "${RED}Error: Node ID and route required${NC}"
                    echo "Usage: $0 routes enable <id> <route>"
                    exit 1
                fi
                headscale_exec routes enable --node "$3" --route "$4"
                echo -e "${GREEN}✓${NC} Route enabled"
                ;;
            *)
                echo -e "${RED}Error: Unknown routes command${NC}"
                show_usage
                exit 1
                ;;
        esac
        ;;
    
    status)
        if [ "$($DOCKER_COMPOSE ps -q headscale 2>/dev/null)" ]; then
            echo -e "${GREEN}✓${NC} Headscale is running"
            $DOCKER_COMPOSE ps headscale
        else
            echo -e "${RED}✗${NC} Headscale is not running"
        fi
        ;;
    
    logs)
        $DOCKER_COMPOSE logs -f headscale
        ;;
    
    restart)
        echo "Restarting Headscale..."
        $DOCKER_COMPOSE restart headscale
        echo -e "${GREEN}✓${NC} Headscale restarted"
        ;;
    
    stop)
        echo "Stopping Headscale..."
        $DOCKER_COMPOSE stop headscale
        echo -e "${GREEN}✓${NC} Headscale stopped"
        ;;
    
    start)
        echo "Starting Headscale..."
        $DOCKER_COMPOSE start headscale
        echo -e "${GREEN}✓${NC} Headscale started"
        ;;
    
    *)
        show_usage
        exit 1
        ;;
esac
