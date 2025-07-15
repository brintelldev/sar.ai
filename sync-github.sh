#!/bin/bash

# Script para sincronizar o repositório com GitHub
# Repositório: git@github.com:brintelldev/sar.ai.git

echo "🔄 Iniciando sincronização com GitHub..."

# Configura o Git se necessário
git config user.name "Replit Sar.ai" 2>/dev/null || true
git config user.email "sarai@brintelldev.com" 2>/dev/null || true

# Verifica se o remote origin existe
if ! git remote get-url origin >/dev/null 2>&1; then
    echo "🔧 Configurando remote origin..."
    git remote add origin git@github.com:brintelldev/sar.ai.git
    echo "✅ Remote origin configurado"
fi

# Adiciona todos os arquivos modificados
echo "📂 Adicionando arquivos modificados..."
git add .

# Verifica se há mudanças para commit
if git diff --quiet && git diff --staged --quiet; then
    echo "ℹ️  Não há mudanças locais para sincronizar"
    
    # Verifica se há commits não enviados
    if git log --oneline origin/main..HEAD | grep -q .; then
        echo "🔄 Enviando commits pendentes..."
    else
        echo "✅ Repositório já está sincronizado"
        exit 0
    fi
fi

# Cria o commit com timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="Sincronização automática Replit - $TIMESTAMP"

echo "💾 Criando commit: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# Verifica se consegue conectar ao GitHub
echo "🔍 Verificando conectividade com GitHub..."
if ! git ls-remote origin >/dev/null 2>&1; then
    echo "❌ Erro: Não foi possível conectar ao GitHub"
    echo "📋 Instruções para configurar SSH:"
    echo "1. Vá em Settings > SSH Keys no Replit"
    echo "2. Gere uma nova chave SSH"
    echo "3. Copie a chave pública para GitHub > Settings > SSH and GPG keys"
    echo "4. Execute: ssh -T git@github.com para testar"
    exit 1
fi

# Tenta enviar para o GitHub
echo "🚀 Enviando para GitHub..."
if git push origin main 2>&1; then
    echo "✅ Sincronização concluída com sucesso!"
    echo "📊 Status atual:"
    git log --oneline -3
else
    echo "❌ Erro na sincronização"
    echo "🔧 Tentando com force push..."
    if git push --force origin main 2>&1; then
        echo "✅ Force push realizado com sucesso!"
    else
        echo "❌ Falha no force push. Verifique as credenciais SSH."
    fi
fi