#!/bin/bash

# Script de verificação para deployment Docker do Sar.ai

echo "🔍 Verificando configuração Docker do Sar.ai..."
echo "================================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar comando
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "✅ ${GREEN}$1 está instalado${NC}"
        return 0
    else
        echo -e "❌ ${RED}$1 não está instalado${NC}"
        return 1
    fi
}

# Função para verificar arquivo
check_file() {
    if [ -f "$1" ]; then
        echo -e "✅ ${GREEN}$1 existe${NC}"
        return 0
    else
        echo -e "❌ ${RED}$1 não encontrado${NC}"
        return 1
    fi
}

# Função para verificar porta
check_port() {
    if netstat -tuln | grep ":$1 " > /dev/null; then
        echo -e "⚠️  ${YELLOW}Porta $1 está em uso${NC}"
        return 1
    else
        echo -e "✅ ${GREEN}Porta $1 está disponível${NC}"
        return 0
    fi
}

echo "1. Verificando pré-requisitos..."
echo "--------------------------------"

# Verificar Docker
check_command "docker"
DOCKER_OK=$?

# Verificar Docker Compose
if check_command "docker-compose"; then
    COMPOSE_OK=0
elif check_command "docker compose"; then
    COMPOSE_OK=0
    echo -e "ℹ️  ${BLUE}Usando 'docker compose' (v2)${NC}"
else
    COMPOSE_OK=1
fi

# Verificar Make (opcional)
check_command "make"
MAKE_OK=$?

echo ""
echo "2. Verificando arquivos de configuração..."
echo "-------------------------------------------"

# Verificar arquivos essenciais
check_file "Dockerfile"
DOCKERFILE_OK=$?

check_file "docker-compose.yml"
COMPOSE_FILE_OK=$?

check_file ".dockerignore"
DOCKERIGNORE_OK=$?

# Verificar arquivo .env
if check_file ".env"; then
    ENV_OK=0
    echo -e "ℹ️  ${BLUE}Verificando configuração do .env...${NC}"
    
    # Verificar variáveis críticas
    if grep -q "SESSION_SECRET=sua-chave-secreta" .env; then
        echo -e "⚠️  ${YELLOW}ATENÇÃO: SESSION_SECRET ainda está com valor padrão${NC}"
    fi
    
    if grep -q "DATABASE_URL=" .env; then
        echo -e "✅ ${GREEN}DATABASE_URL configurado${NC}"
    else
        echo -e "❌ ${RED}DATABASE_URL não encontrado${NC}"
    fi
else
    ENV_OK=1
    if check_file ".env.docker"; then
        echo -e "ℹ️  ${BLUE}Template .env.docker encontrado. Execute: cp .env.docker .env${NC}"
    fi
fi

echo ""
echo "3. Verificando portas..."
echo "------------------------"

check_port "5000"
PORT_5000_OK=$?

check_port "5432"
PORT_5432_OK=$?

echo ""
echo "4. Verificando recursos do sistema..."
echo "-------------------------------------"

# Verificar espaço em disco
DISK_USAGE=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo -e "✅ ${GREEN}Espaço em disco: ${DISK_USAGE}%${NC}"
else
    echo -e "⚠️  ${YELLOW}Espaço em disco baixo: ${DISK_USAGE}%${NC}"
fi

# Verificar memória disponível
if [ -f /proc/meminfo ]; then
    TOTAL_MEM=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    TOTAL_MEM_GB=$((TOTAL_MEM / 1024 / 1024))
    if [ $TOTAL_MEM_GB -ge 4 ]; then
        echo -e "✅ ${GREEN}Memória disponível: ${TOTAL_MEM_GB}GB${NC}"
    else
        echo -e "⚠️  ${YELLOW}Memória baixa: ${TOTAL_MEM_GB}GB (recomendado: 4GB+)${NC}"
    fi
fi

echo ""
echo "5. Resumo e Recomendações..."
echo "=========================================="

# Calcular score geral
TOTAL_CHECKS=7
PASSED_CHECKS=0

[ $DOCKER_OK -eq 0 ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[ $COMPOSE_OK -eq 0 ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[ $DOCKERFILE_OK -eq 0 ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[ $COMPOSE_FILE_OK -eq 0 ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[ $DOCKERIGNORE_OK -eq 0 ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[ $ENV_OK -eq 0 ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[ $PORT_5000_OK -eq 0 ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))

SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

if [ $SCORE -ge 85 ]; then
    echo -e "🎉 ${GREEN}Sistema pronto para Docker! Score: ${SCORE}%${NC}"
    echo ""
    echo -e "${GREEN}Próximos passos:${NC}"
    echo "1. Configure o arquivo .env com suas variáveis"
    echo "2. Execute: make prod (ou ./docker-start.sh)"
    echo "3. Acesse: http://localhost:5000"
elif [ $SCORE -ge 60 ]; then
    echo -e "⚠️  ${YELLOW}Sistema parcialmente pronto. Score: ${SCORE}%${NC}"
    echo ""
    echo -e "${YELLOW}Resolva os problemas acima antes de continuar.${NC}"
else
    echo -e "❌ ${RED}Sistema não está pronto. Score: ${SCORE}%${NC}"
    echo ""
    echo -e "${RED}Instale os pré-requisitos necessários.${NC}"
fi

echo ""
echo "📋 Comandos úteis:"
echo "  make help          - Ver todos os comandos"
echo "  make setup         - Configurar .env"
echo "  make build         - Construir imagem"
echo "  make up            - Iniciar serviços"
echo "  make logs          - Ver logs"
echo "  ./docker-start.sh  - Script automatizado"

exit $((100 - SCORE))