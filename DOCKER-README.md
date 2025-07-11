# 🐳 Docker Deployment - Sar.ai

## Visão Geral

Esta documentação detalha como dockerizar e executar a aplicação Sar.ai usando containers Docker, incluindo todas as dependências e variáveis de ambiente necessárias.

## 📋 Pré-requisitos

- **Docker**: versão 20.10 ou superior
- **Docker Compose**: versão 2.0 ou superior
- **4GB RAM** mínimo para executar todos os serviços
- **Porta 5000** disponível para a aplicação

## 🚀 Início Rápido

### 1. Configuração Automática (Recomendado)
```bash
# Usar o script automatizado
./docker-start.sh
```

### 2. Configuração Manual com Makefile
```bash
# Setup inicial e produção
make prod

# Ou passo a passo:
make setup    # Criar arquivo .env
make build    # Construir imagem
make up       # Iniciar serviços
make db-migrate  # Executar migrações
```

### 3. Comandos Docker Compose Tradicionais
```bash
# Copiar configurações
cp .env.docker .env

# Construir e iniciar
docker-compose up --build -d

# Executar migrações
docker-compose exec sarai-app npm run db:push
```

## 🏗️ Arquitetura dos Containers

### Serviços Incluídos

1. **sarai-app**: Aplicação principal (React + Express)
   - Porta: 5000
   - Healthcheck configurado
   - Build multi-stage otimizado

2. **postgres**: Banco de dados PostgreSQL 15
   - Porta: 5432
   - Volume persistente para dados
   - Healthcheck configurado

3. **redis**: Cache e sessões (opcional)
   - Porta: 6379
   - Volume persistente

## 🔧 Configuração de Variáveis de Ambiente

### Arquivo .env (Obrigatório)

```bash
# Banco de dados
DATABASE_URL=postgresql://sarai_user:sarai_password@postgres:5432/sarai_db

# Aplicação
NODE_ENV=production
PORT=5000
SESSION_SECRET=sua-chave-secreta-super-segura

# Email (SendGrid)
SENDGRID_API_KEY=sua-api-key-sendgrid
FROM_EMAIL=noreply@sarai.com.br

# Domínio
DOMAIN=localhost:5000

# Redis (opcional)
REDIS_PASSWORD=redis_password
```

### ⚠️ Configurações Importantes de Segurança

1. **SESSION_SECRET**: Mude para uma chave forte em produção
2. **Senhas do banco**: Use senhas complexas
3. **API Keys**: Configure suas chaves reais de serviços externos

## 📊 Comandos Úteis

### Gerenciamento Básico
```bash
make up           # Iniciar serviços
make down         # Parar serviços
make restart      # Reiniciar serviços
make status       # Ver status dos containers
```

### Logs e Debugging
```bash
make logs         # Ver todos os logs
make logs-app     # Logs apenas da aplicação
make logs-db      # Logs apenas do banco
make shell        # Acessar shell da aplicação
make shell-db     # Acessar PostgreSQL
```

### Banco de Dados
```bash
make db-migrate   # Executar migrações
make db-reset     # Resetar banco (CUIDADO!)
make backup-db    # Fazer backup
```

### Manutenção
```bash
make clean        # Limpar containers não utilizados
make health       # Verificar saúde dos serviços
```

## 🏭 Deployment em Produção

### 1. Servidor Cloud (AWS, GCP, Azure)

```bash
# Clone o repositório
git clone git@github.com:brintelldev/sar.ai.git
cd sar.ai

# Configure variáveis de ambiente
cp .env.docker .env
nano .env  # Edite com suas configurações

# Deploy
make prod
```

### 2. VPS/Servidor Dedicado

```bash
# Instalar Docker e Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone e configure
git clone git@github.com:brintelldev/sar.ai.git
cd sar.ai
cp .env.docker .env

# Edite as configurações de produção
nano .env

# Deploy
make prod
```

### 3. Configurações Específicas de Produção

```bash
# .env para produção
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=sua-chave-super-segura-de-32-caracteres
DOMAIN=sarai.com.br
```

## 🔒 Segurança e Boas Práticas

### 1. Variáveis de Ambiente
- ✅ Use `.env` para configurações
- ✅ Nunca commite `.env` no Git
- ✅ Use senhas fortes para banco de dados
- ✅ Gere SESSION_SECRET único e seguro

### 2. Rede e Firewall
- ✅ Configure firewall para apenas porta 80/443
- ✅ Use HTTPS em produção (nginx/caddy)
- ✅ Configure SSL/TLS certificates

### 3. Backup e Monitoramento
- ✅ Configure backups automáticos do banco
- ✅ Monitore logs e métricas
- ✅ Configure alertas de saúde

## 🐛 Resolução de Problemas

### Container não inicia
```bash
# Verificar logs
make logs

# Verificar recursos
docker system df
docker stats
```

### Erro de conexão com banco
```bash
# Verificar status do PostgreSQL
make logs-db

# Testar conexão
make shell-db
```

### Erro de memória
```bash
# Limpar recursos
make clean

# Verificar uso de memória
docker stats
```

### Aplicação não responde
```bash
# Verificar saúde
make health

# Reiniciar serviços
make restart
```

## 📈 Performance e Otimização

### 1. Build da Imagem
- Build multi-stage para menor tamanho
- Cache de dependências otimizado
- Apenas dependências de produção na imagem final

### 2. Runtime
- Usuário não-root para segurança
- Health checks configurados
- Graceful shutdown handling

### 3. Volumes
- Dados persistentes em volumes Docker
- Backup automático configurável

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy Sar.ai
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          docker-compose pull
          docker-compose up -d --build
          docker-compose exec sarai-app npm run db:push
```

## 📞 Suporte

Para dúvidas sobre deployment:
1. Verifique os logs: `make logs`
2. Teste conectividade: `make health`
3. Consulte esta documentação
4. Abra uma issue no repositório