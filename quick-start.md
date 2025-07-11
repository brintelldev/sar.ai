# 🚀 Quick Start - Docker Sar.ai

## ⚡ Início Ultra-Rápido (5 minutos)

### 1️⃣ Verificar Sistema
```bash
./docker-verify.sh
```

### 2️⃣ Configurar e Iniciar
```bash
# Método 1: Script automatizado (Recomendado)
./docker-start.sh

# Método 2: Makefile
make prod
```

### 3️⃣ Acessar Aplicação
- **URL**: http://localhost:5000
- **Super Admin**: superadmin@brintell.com / admin123

---

## 📋 Comandos Essenciais

```bash
# Status dos containers
make status

# Ver logs em tempo real
make logs

# Parar tudo
make down

# Reiniciar
make restart

# Limpar e recomeçar
make clean && make prod
```

---

## 🔧 Configuração Personalizada

### Arquivo .env (Obrigatório para produção)
```bash
cp .env.docker .env
nano .env  # Edite suas configurações
```

### Variáveis Críticas
- `SESSION_SECRET` - Mude para produção!
- `DATABASE_URL` - URL do banco PostgreSQL
- `SENDGRID_API_KEY` - Para emails (opcional)

---

## ❓ Problemas Comuns

### Erro "Port already in use"
```bash
# Parar processos usando a porta 5000
sudo lsof -ti:5000 | xargs kill -9
make up
```

### Container não inicia
```bash
# Ver logs detalhados
make logs

# Reconstruir imagem
make down && make build && make up
```

### Banco de dados com erro
```bash
# Resetar banco (ATENÇÃO: apaga dados!)
make db-reset
```

---

## 🎯 Próximos Passos

1. **Configurar SSL**: Configure nginx/caddy para HTTPS
2. **Backup**: Configure backups automáticos do banco
3. **Monitoramento**: Configure alertas e métricas
4. **CI/CD**: Configure deploy automático

---

## 📞 Suporte Rápido

- 📋 **Verificar saúde**: `make health`
- 📊 **Ver status**: `make status`  
- 🔍 **Debug**: `make logs`
- 🆘 **Reset completo**: `make clean && make prod`

**Documentação completa**: Ver `DOCKER-README.md`