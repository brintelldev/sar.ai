# Makefile para Sar.ai - Simplifica comandos Docker

.PHONY: help build up down restart logs shell clean db-migrate db-reset prod dev

# Cores para output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
NC=\033[0m # No Color

# Variáveis
COMPOSE_FILE=docker-compose.yml
APP_CONTAINER=sarai-app
DB_CONTAINER=sarai-postgres

help: ## Mostrar esta ajuda
	@echo "$(BLUE)Sar.ai - Comandos Docker$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Configuração inicial - criar .env
	@echo "$(YELLOW)Configurando ambiente...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.docker .env; \
		echo "$(GREEN)Arquivo .env criado. Configure as variáveis antes de continuar.$(NC)"; \
	else \
		echo "$(BLUE)Arquivo .env já existe.$(NC)"; \
	fi

build: ## Construir a imagem Docker
	@echo "$(YELLOW)Construindo imagem...$(NC)"
	@docker-compose build --no-cache

up: ## Iniciar todos os serviços
	@echo "$(YELLOW)Iniciando serviços...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)Serviços iniciados! Acesse: http://localhost:5000$(NC)"

down: ## Parar todos os serviços
	@echo "$(YELLOW)Parando serviços...$(NC)"
	@docker-compose down

restart: ## Reiniciar todos os serviços
	@echo "$(YELLOW)Reiniciando serviços...$(NC)"
	@docker-compose restart

logs: ## Ver logs em tempo real
	@docker-compose logs -f

logs-app: ## Ver logs apenas da aplicação
	@docker-compose logs -f $(APP_CONTAINER)

logs-db: ## Ver logs apenas do banco
	@docker-compose logs -f $(DB_CONTAINER)

shell: ## Acessar shell do container da aplicação
	@docker-compose exec $(APP_CONTAINER) sh

shell-db: ## Acessar shell do PostgreSQL
	@docker-compose exec $(DB_CONTAINER) psql -U sarai_user -d sarai_db

status: ## Ver status dos containers
	@docker-compose ps

db-migrate: ## Executar migrações do banco
	@echo "$(YELLOW)Executando migrações...$(NC)"
	@docker-compose exec $(APP_CONTAINER) npm run db:push
	@echo "$(GREEN)Migrações concluídas!$(NC)"

db-reset: ## Resetar banco de dados (CUIDADO!)
	@echo "$(RED)ATENÇÃO: Isso irá apagar todos os dados!$(NC)"
	@read -p "Tem certeza? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker-compose down; \
		docker volume rm $$(docker volume ls -q | grep postgres); \
		docker-compose up -d; \
		sleep 10; \
		make db-migrate; \
	fi

clean: ## Limpar containers e volumes não utilizados
	@echo "$(YELLOW)Limpando recursos Docker...$(NC)"
	@docker system prune -f
	@docker volume prune -f

dev: ## Iniciar em modo desenvolvimento
	@echo "$(YELLOW)Iniciando em modo desenvolvimento...$(NC)"
	@npm run dev

prod: setup build up db-migrate ## Setup completo para produção
	@echo "$(GREEN)Aplicação em produção iniciada!$(NC)"
	@echo "$(BLUE)Acesse: http://localhost:5000$(NC)"

install: ## Instalar dependências localmente
	@npm install

test: ## Executar testes
	@docker-compose exec $(APP_CONTAINER) npm test

backup-db: ## Fazer backup do banco de dados
	@echo "$(YELLOW)Criando backup...$(NC)"
	@docker-compose exec $(DB_CONTAINER) pg_dump -U sarai_user sarai_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup criado!$(NC)"

# Comandos de desenvolvimento
dev-reset: ## Resetar ambiente de desenvolvimento
	@make down
	@make clean
	@make dev

# Comandos de monitoramento
health: ## Verificar saúde dos serviços
	@echo "$(BLUE)Verificando saúde dos serviços...$(NC)"
	@curl -f http://localhost:5000/health || echo "$(RED)Aplicação não está respondendo$(NC)"
	@docker-compose exec $(DB_CONTAINER) pg_isready -U sarai_user -d sarai_db || echo "$(RED)Banco não está respondendo$(NC)"