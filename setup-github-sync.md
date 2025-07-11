# 🔗 Configuração da Sincronização GitHub

## Passos para Conectar ao Repositório Privado

### 1. Configurar SSH no Replit
1. Acesse **Settings** → **SSH Keys** no Replit
2. Clique em **Generate SSH Key** 
3. Copie a chave pública SSH gerada

### 2. Adicionar Chave SSH no GitHub
1. Acesse GitHub → **Settings** → **SSH and GPG keys**
2. Clique **New SSH key**
3. Cole a chave pública do Replit
4. Salve a configuração

### 3. Configurar Git (Execute no Console)
```bash
# Configurar Git
git config user.name "Replit Sar.ai"
git config user.email "sarai@brintelldev.com"

# Adicionar remote (se não existir)
git remote add origin git@github.com:brintelldev/sar.ai.git

# Verificar configuração
git remote -v
```

### 4. Sincronização Manual
```bash
# Adicionar mudanças
git add .

# Commit com timestamp
git commit -m "Sincronização Replit - $(date '+%Y-%m-%d %H:%M:%S')"

# Push para GitHub
git push origin main
```

## ⚠️ Importante

O Replit possui proteções que impedem modificações automáticas no Git. A sincronização deve ser feita manualmente usando os comandos acima.

## 📋 Comandos Úteis

```bash
# Ver status
git status

# Ver histórico
git log --oneline -5

# Testar SSH
ssh -T git@github.com

# Forçar push (se necessário)
git push --force origin main
```

## 📁 Repositório Configurado
- **URL**: git@github.com:brintelldev/sar.ai.git
- **Branch**: main
- **Método**: SSH