# 🔄 Comandos para Sincronização Manual

## ✅ SSH Configurado com Sucesso!

Sua chave SSH está funcionando corretamente com o GitHub. Agora você pode sincronizar manualmente.

## 📋 Comandos para Executar no Terminal

### 1. Configurar Git (Execute uma vez)
```bash
# Configurar usuário
git config user.name "Replit Sar.ai"
git config user.email "sarai@brintelldev.com"

# Configurar remote (pode dar erro se já existir, tudo bem)
git remote add origin git@github.com:brintelldev/sar.ai.git
```

### 2. Sincronização Manual (Execute sempre que quiser sincronizar)
```bash
# Verificar status
git status

# Adicionar todos os arquivos
git add .

# Criar commit
git commit -m "Sincronização manual - $(date '+%Y-%m-%d %H:%M:%S')"

# Enviar para GitHub
git push origin main
```

### 3. Se der erro de conflito, usar força:
```bash
git push --force origin main
```

## 🔧 Comandos de Diagnóstico

```bash
# Testar conexão SSH
ssh -T git@github.com

# Ver configuração atual
git remote -v

# Ver histórico de commits
git log --oneline -5
```

## 📝 Notas Importantes

1. **SSH Funcionando**: Sua chave está correta
2. **Repositório**: git@github.com:brintelldev/sar.ai.git
3. **Limitações**: Replit impede automação Git por segurança
4. **Solução**: Use os comandos manuais acima

## 🚀 Próximos Passos

1. Execute os comandos da seção 1 (configuração)
2. Sempre que fizer mudanças, execute os comandos da seção 2
3. O código será espelhado no repositório privado do GitHub!