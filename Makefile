.PHONY: help dev up-dev down-dev prod up-prod down-prod build-dev build-prod logs rebuild-dev clean

# Default to displaying help
.DEFAULT_GOAL := help

# Colors for help text
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
RESET  := $(shell tput -Txterm sgr0)

##
## 🚜 Sprout Local Development
##---------------------------------------------------------------------------

dev: ## Run the development environment (with hot-reloading)
	docker compose -f docker-compose.dev.yml up

up-dev: ## Run the development environment in detached mode
	docker compose -f docker-compose.dev.yml up -d

down-dev: ## Stop and remove the development environment containers
	docker compose -f docker-compose.dev.yml down

build-dev: ## Force rebuild development images without cache
	docker compose -f docker-compose.dev.yml build --no-cache

rebuild-dev: down-dev build-dev up-dev ## Down, rebuild without cache, and up-dev

##
## 🚀 Production / Standard
##---------------------------------------------------------------------------

prod: ## Run the production environment
	docker compose up

up-prod: ## Run the production environment in detached mode
	docker compose up -d

down-prod: ## Stop and remove the production containers
	docker compose down

build-prod: ## Force rebuild production images without cache
	docker compose build --no-cache

##
## 🛠️ Utilities
##---------------------------------------------------------------------------

logs: ## Tail logs for all containers
	docker compose logs -f

logs-dev: ## Tail logs for dev containers
	docker compose -f docker-compose.dev.yml logs -f

clean: ## Remove stopped containers, unused networks, dangling images, and build cache
	docker system prune -f
	docker volume prune -f

help: ## Show this help message
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<target>${RESET}'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} { \
		if (/^[a-zA-Z_-]+:.*?##.*$$/) {printf "    ${YELLOW}%-20s${GREEN}%s${RESET}\n", $$1, $$2} \
		else if (/^## .*$$/) {printf "  ${WHITE}%s${RESET}\n", substr($$1,4)} \
		}' $(MAKEFILE_LIST)
