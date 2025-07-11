# 🔄 Sincronização Automática com GitHub

Este projeto está configurado para sincronizar automaticamente com o repositório privado:
**git@github.com:brintelldev/sar.ai.git**

## 🔧 Configuração Inicial

### 1. Configurar SSH no Replit
1. Vá para **Settings** > **SSH Keys** no seu Replit
2. Gere uma nova chave SSH ou use uma existente
3. Copie a chave pública SSH

### 2. Configurar SSH no GitHub
1. Vá para **GitHub** > **Settings** > **SSH and GPG keys**
2. Clique em **New SSH key**
3. Cole a chave pública SSH do Replit
4. Salve a configuração

### 3. Configurar o Remote do Git (Execute no Terminal)
```bash
# Remover remote existente se houver
git remote remove origin 2>/dev/null || true

# Adicionar o repositório privado
git remote add origin git@github.com:brintelldev/sar.ai.git

# Verificar se foi configurado corretamente
git remote -v
```

## 📤 Sincronização Manual

### Comando Principal
```bash
# Executa sincronização completa
./sync-github.sh
```

### Comandos Individuais
```bash
# Adicionar todas as mudanças
git add .

# Criar commit com timestamp
git commit -m "Sincronização automática Replit - $(date '+%Y-%m-%d %H:%M:%S')"

# Enviar para GitHub
git push origin main
```

## 🔄 Sincronização Automática

### Configuração Atual
- ✅ Script de sincronização criado (`sync-github.sh`)
- ✅ Configuração do repositório (`github-config.json`)
- ✅ Arquivos de configuração (.replit.nix)
- ✅ Gitignore atualizado

### Como Funciona
1. O script `sync-github.sh` detecta mudanças no código
2. Adiciona automaticamente todos os arquivos modificados
3. Cria um commit com timestamp
4. Envia as mudanças para o GitHub

## 📋 Comandos Disponíveis

```bash
# Sincronização manual
./sync-github.sh

# Verificar status do Git
git status

# Ver últimos commits
git log --oneline -10

# Verificar configuração do remote
git remote -v

# Testar conexão SSH com GitHub
ssh -T git@github.com
```

## 🚨 Resolução de Problemas

### Erro de Autenticação SSH
```bash
# Verificar se SSH está funcionando
ssh -T git@github.com
```

### Erro de Permissão
```bash
# Verificar permissões do script
chmod +x sync-github.sh
```

### Conflitos de Merge
```bash
# Forçar push (cuidado!)
git push --force origin main
```

## 📁 Estrutura de Arquivos

```
projeto/
├── sync-github.sh          # Script principal de sincronização
├── github-config.json      # Configurações do GitHub
├── .replit.nix             # Dependências do Replit
├── README-GITHUB-SYNC.md   # Este arquivo
└── .gitignore              # Arquivos ignorados pelo Git
```

## ⚠️ Importantes

1. **Backup**: Sempre faça backup antes de mudanças importantes
2. **SSH Keys**: Mantenha suas chaves SSH seguras
3. **Permissões**: Certifique-se de ter acesso ao repositório privado
4. **Commits**: Commits automáticos incluem timestamp para rastreamento

## 📞 Suporte

Para problemas de sincronização:
1. Verifique a configuração SSH
2. Confirme acesso ao repositório privado
3. Execute `./sync-github.sh` manualmente para diagnosticar
4. Verifique os logs de erro no terminal

---

**Repositório:** git@github.com:brintelldev/sar.ai.git  
**Branch:** main  
**Última atualização:** $(date '+%Y-%m-%d %H:%M:%S')