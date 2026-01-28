# Headscale Makefile
# Convenient commands for managing Headscale server

.PHONY: help deploy start stop restart status logs clean backup restore

# Default target
help:
	@echo "Shadow Shuttle - Headscale Management"
	@echo "====================================="
	@echo ""
	@echo "Available targets:"
	@echo "  make deploy          - Deploy Headscale server"
	@echo "  make start           - Start Headscale server"
	@echo "  make stop            - Stop Headscale server"
	@echo "  make restart         - Restart Headscale server"
	@echo "  make status          - Show server status"
	@echo "  make logs            - Show server logs"
	@echo "  make logs-follow     - Follow server logs"
	@echo "  make clean           - Stop and remove containers"
	@echo "  make backup          - Backup data and config"
	@echo "  make restore         - Restore from backup"
	@echo ""
	@echo "Namespace management:"
	@echo "  make namespace-create NAME=default"
	@echo "  make namespace-list"
	@echo ""
	@echo "Pre-auth key management:"
	@echo "  make preauth-create NAMESPACE=default"
	@echo "  make preauth-list NAMESPACE=default"
	@echo ""
	@echo "Node management:"
	@echo "  make nodes-list"
	@echo "  make nodes-delete ID=1"
	@echo ""

# Deployment
deploy:
	@chmod +x scripts/deploy.sh scripts/manage.sh
	@./scripts/deploy.sh

# Service management
start:
	@./scripts/manage.sh start

stop:
	@./scripts/manage.sh stop

restart:
	@./scripts/manage.sh restart

status:
	@./scripts/manage.sh status

# Logs
logs:
	@docker-compose logs --tail=100 headscale

logs-follow:
	@./scripts/manage.sh logs

# Namespace management
namespace-create:
	@./scripts/manage.sh namespace create $(NAME)

namespace-list:
	@./scripts/manage.sh namespace list

namespace-destroy:
	@./scripts/manage.sh namespace destroy $(NAME)

# Pre-auth key management
preauth-create:
	@./scripts/manage.sh preauth create $(NAMESPACE)

preauth-list:
	@./scripts/manage.sh preauth list $(NAMESPACE)

# Node management
nodes-list:
	@./scripts/manage.sh nodes list

nodes-delete:
	@./scripts/manage.sh nodes delete $(ID)

nodes-expire:
	@./scripts/manage.sh nodes expire $(ID)

# Routes management
routes-list:
	@./scripts/manage.sh routes list

routes-enable:
	@./scripts/manage.sh routes enable $(ID) $(ROUTE)

# Cleanup
clean:
	@echo "Stopping and removing containers..."
	@docker-compose down
	@echo "Done!"

clean-all: clean
	@echo "Removing data directory..."
	@rm -rf data/
	@echo "Done!"

# Backup and restore
backup:
	@echo "Creating backup..."
	@./scripts/manage.sh stop
	@tar -czf headscale-backup-$$(date +%Y%m%d-%H%M%S).tar.gz data/ config/
	@./scripts/manage.sh start
	@echo "Backup created: headscale-backup-$$(date +%Y%m%d-%H%M%S).tar.gz"

restore:
	@echo "Restoring from backup..."
	@echo "Please specify backup file: make restore BACKUP=headscale-backup-20240115-120000.tar.gz"
	@if [ -z "$(BACKUP)" ]; then \
		echo "Error: BACKUP variable not set"; \
		exit 1; \
	fi
	@./scripts/manage.sh stop
	@tar -xzf $(BACKUP)
	@./scripts/manage.sh start
	@echo "Restore completed!"

# Update
update:
	@echo "Updating Headscale..."
	@docker-compose pull
	@docker-compose up -d
	@echo "Update completed!"

# Health check
health:
	@curl -f http://localhost:8080/health || echo "Health check failed"

# Initialize (create default namespace and preauth key)
init:
	@echo "Initializing Headscale..."
	@./scripts/manage.sh namespace create default || true
	@echo ""
	@echo "Creating pre-auth key..."
	@./scripts/manage.sh preauth create default
	@echo ""
	@echo "Initialization completed!"
