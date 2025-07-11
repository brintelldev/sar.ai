# Multi-stage build para otimizar o tamanho da imagem
FROM node:20-alpine AS base

# Instalar dependências do sistema necessárias
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração de dependências
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY drizzle.config.ts ./
COPY components.json ./

# Stage para instalação de dependências
FROM base AS deps

# Instalar todas as dependências (incluindo devDependencies para o build)
RUN npm ci

# Stage para build da aplicação
FROM base AS builder

# Copiar node_modules do stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p dist/public

# Build do frontend e backend
RUN npm run build

# Stage final de produção
FROM node:20-alpine AS runner

# Instalar dependências mínimas de sistema
RUN apk add --no-cache \
    dumb-init \
    nodejs \
    npm

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json para instalação apenas das dependências de produção
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Copiar arquivos de build
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist

# Copiar arquivos estáticos
COPY --from=builder --chown=nextjs:nodejs /app/client/public ./dist/public

# Copiar arquivos de configuração necessários
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/migrations ./migrations

# Copiar shared schemas se existirem
COPY --from=builder --chown=nextjs:nodejs /app/shared ./shared

# Definir variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=5000

# Expor porta
EXPOSE 5000

# Mudar para usuário não-root
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 5000, path: '/health', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

# Usar dumb-init para gerenciamento correto de sinais
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar a aplicação
CMD ["npm", "start"]