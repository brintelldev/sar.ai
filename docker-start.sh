#!/bin/bash

# Script para iniciar a aplicação Sar.ai com Docker

echo "🐳 Iniciando aplicação Sar.ai com Docker..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Instale o Docker Compose primeiro."
    exit 1
fi

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env a partir do template..."
    cp .env.docker .env
    echo "⚠️  IMPORTANTE: Edite o arquivo .env com suas configurações antes de continuar."
    echo "⚠️  Especialmente a SESSION_SECRET e configurações do banco de dados."
    read -p "Pressione Enter para continuar após editar o .env..."
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Construir a imagem
echo "🔨 Construindo imagem da aplicação..."
docker-compose build --no-cache

# Iniciar os serviços
echo "🚀 Iniciando serviços..."
docker-compose up -d

# Aguardar os serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# Verificar status dos containers
echo "📊 Status dos containers:"
docker-compose ps

# Executar migrações do banco de dados
echo "🗄️  Executando migrações do banco de dados..."
docker-compose exec sarai-app npm run db:push

echo "✅ Aplicação iniciada com sucesso!"
echo "🌐 Acesse: http://localhost:5000"
echo ""
echo "📋 Comandos úteis:"
echo "  - Ver logs: docker-compose logs -f"
echo "  - Parar: docker-compose down"
echo "  - Reiniciar: docker-compose restart"
echo "  - Shell no container: docker-compose exec sarai-app sh"