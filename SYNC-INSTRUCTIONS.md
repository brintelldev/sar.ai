# 🔄 Instruções de Sincronização GitHub

## ✅ Configuração Atual

- **Repositório**: git@github.com:brintelldev/sar.ai.git
- **SSH**: Chave configurada e funcionando
- **Teste**: `ssh -i ~/.ssh/replit -T git@github.com` retorna sucesso

## 📋 Comandos para Sincronização

### Configuração Inicial (Execute uma vez)
```bash
git config user.name "Replit Sar.ai"
git config user.email "sarai@brintelldev.com"
```

### Sincronização Manual (Execute quando quiser sincronizar)
```bash
# Usar chave SSH específica para GitHub
export GIT_SSH_COMMAND="ssh -i ~/.ssh/replit"

# Configurar remote se não existir
git remote add origin git@github.com:brintelldev/sar.ai.git 2>/dev/null || true

# Adicionar todas as mudanças
git add .

# Commit com timestamp
git commit -m "Sync from Replit - $(date '+%Y-%m-%d %H:%M:%S')"

# Push para GitHub
git push origin main
```

### Comando Único para Sincronização
```bash
export GIT_SSH_COMMAND="ssh -i ~/.ssh/replit" && git add . && git commit -m "Sync from Replit - $(date '+%Y-%m-%d %H:%M:%S')" && git push origin main
```

## 🔧 Solução de Problemas

### Se der erro de conflito:
```bash
export GIT_SSH_COMMAND="ssh -i ~/.ssh/replit" && git push --force origin main
```

### Testar conexão SSH:
```bash
ssh -i ~/.ssh/replit -T git@github.com
```

## 📝 Notas Importantes

1. Use sempre `ssh -i ~/.ssh/replit` para especificar a chave SSH
2. O export GIT_SSH_COMMAND configura o Git para usar a chave específica
3. Devido às proteções do Replit, a sincronização deve ser manual
4. Todos os arquivos do projeto serão espelhados no repositório privado