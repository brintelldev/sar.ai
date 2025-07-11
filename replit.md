# NGO Management Platform - replit.md

## Overview

This is a comprehensive NGO (Non-Governmental Organization) management platform built with React/TypeScript frontend and Express/Node.js backend. The platform provides multi-tenant SaaS functionality for managing NGO operations including projects, donors, beneficiaries, volunteers, donations, financial tracking, and compliance with Brazilian LGPD privacy regulations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Session Management**: Express session with PostgreSQL store
- **Authentication**: bcrypt for password hashing, session-based auth
- **API Design**: RESTful API with standardized error handling

### Database Architecture
- **Primary Database**: PostgreSQL (Supabase hosted)
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Migration Strategy**: Drizzle-kit for schema migrations
- **Multi-tenancy**: Organization-based isolation with foreign keys

## Key Components

### Authentication & Authorization
- Session-based authentication with secure cookies
- Multi-tenant role-based access control (RBAC)
- Organization-scoped permissions (admin, manager, volunteer, beneficiary)
- Global super-admin capabilities for platform management

### Core Modules
1. **Organizations**: Multi-tenant base with subscription management
2. **Projects**: Project lifecycle management with budgeting
3. **Donor Management**: Individual and corporate donor tracking
4. **Beneficiary Management**: LGPD-compliant person served tracking
5. **Volunteer Management**: Skills-based volunteer coordination
6. **Financial Management**: Donations, accounts receivable/payable
7. **Learning Management**: Course creation and certification system
8. **Whitelabel Sites**: Custom branded public websites per organization
9. **Super Admin System**: Centralized SaaS platform management with subscription plans, metrics, and organization oversight

### Data Privacy & Compliance
- LGPD compliance with data retention policies
- Consent management and anonymization workflows
- Audit logging for data access and modifications
- Configurable data retention periods per organization

## Data Flow

### Authentication Flow
1. User submits credentials to `/api/auth/login`
2. Server validates against database and creates session
3. Session stored in PostgreSQL with organization context
4. Subsequent requests authenticated via session middleware

### Multi-tenant Data Access
1. All API requests include organization context from session
2. Database queries filtered by organization ID
3. Role permissions checked before data access
4. Audit logs created for sensitive operations

### Real-time Updates
- TanStack Query provides optimistic updates and cache invalidation
- Background refetching keeps data synchronized
- Error boundaries handle network failures gracefully

## External Dependencies

### Core Dependencies
- **Database**: Supabase PostgreSQL with connection pooling
- **Authentication**: Express sessions with connect-pg-simple store
- **UI Components**: Radix UI primitives with shadcn/ui abstractions
- **Charts**: Recharts for financial reporting and analytics
- **Date Handling**: date-fns for Brazilian locale formatting
- **Form Validation**: Zod schemas shared between client/server

### Development Tools
- **TypeScript**: Shared types between frontend/backend
- **ESBuild**: Server-side bundling for production
- **Vite**: Frontend development server with HMR
- **Drizzle Studio**: Database management interface

## Deployment Strategy

### Development Environment
- Replit-hosted with automatic reloading
- PostgreSQL module for local development database
- Environment variables managed through .env file
- Port 5000 exposed for development server

### Production Build Process
1. **Frontend**: Vite builds optimized React bundle to `dist/public`
2. **Backend**: ESBuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations applied automatically
4. **Static Assets**: Served from Express with proper caching headers

### Scaling Considerations
- Horizontal scaling through stateless session design
- Database connection pooling via Supabase
- CDN-ready static asset structure
- Environment-specific configuration management

## Super Admin Access

**Credenciais de Super Admin:**
- Email: superadmin@brintell.com
- Senha: admin123

O super admin tem acesso completo ao painel administrativo da plataforma SaaS, incluindo:
- Visão geral da plataforma (métricas, organizações, receita)
- Gerenciamento de organizações cadastradas
- Criação e edição de planos de assinatura
- Sistema de anúncios para comunicação com organizações
- Analytics e métricas detalhadas da plataforma

## GitHub Sincronização

**Repositório Privado Configurado:**
- URL: git@github.com:brintelldev/sar.ai.git
- Branch: main
- Método: SSH

**Status da Configuração:**
- ✅ Scripts de sincronização criados
- ✅ Configuração Git preparada
- ✅ SSH configurado e funcionando com GitHub
- ✅ Pronto para sincronização manual (ver manual-sync-commands.md)

**Arquivos de Configuração:**
- `sync-github.sh` - Script principal de sincronização
- `setup-github-sync.md` - Instruções detalhadas de configuração
- `.gitconfig` - Configuração Git padrão
- `github-config.json` - Configurações do repositório

## Docker Deployment

**Configuração Completa de Containerização:**
- ✅ Dockerfile multi-stage otimizado para produção
- ✅ Docker Compose com PostgreSQL, Redis e aplicação
- ✅ Variáveis de ambiente configuráveis (.env)
- ✅ Scripts automatizados (docker-start.sh, Makefile)
- ✅ Health checks e monitoramento configurados
- ✅ Documentação completa de deployment (DOCKER-README.md)
- ✅ Build otimizado com cache e dependências mínimas
- ✅ Segurança: usuário não-root, firewall, SSL ready

**Comandos Principais:**
- `make prod` - Setup completo de produção
- `make up` - Iniciar serviços
- `make logs` - Ver logs em tempo real
- `./docker-start.sh` - Script automatizado

## Changelog

```
Changelog:
- July 11, 2025. Dockerização completa da aplicação implementada:
  * Dockerfile multi-stage otimizado para produção com Node.js 20 Alpine
  * Docker Compose com PostgreSQL 15, Redis para cache e aplicação principal
  * Sistema completo de variáveis de ambiente (.env.docker template)
  * Scripts automatizados: docker-start.sh e Makefile com comandos úteis
  * Health checks configurados para monitoramento de containers
  * Documentação detalhada de deployment em DOCKER-README.md
  * Configurações de segurança: usuário não-root, volumes persistentes
  * Build otimizado: cache de dependências, apenas produção na imagem final
  * Suporte completo a deployment em cloud e VPS
  * Comandos simplificados: make prod, make up, make logs, etc.
- July 11, 2025. Configuração completa para sincronização com GitHub:
  * Repositório privado git@github.com:brintelldev/sar.ai.git configurado
  * Scripts de sincronização automática criados (sync-github.sh)
  * Arquivos de configuração Git e documentação completa
  * Instruções detalhadas para configuração SSH no Replit e GitHub
  * Sistema pronto para espelhamento automático de commits
  * Proteções do Replit requerem configuração manual inicial
- July 09, 2025. Deployment fixes implemented for production readiness:
  * Enhanced database connection with proper error handling and connection pool settings
  * PostgreSQL session store configured with connect-pg-simple for production persistence
  * Health check endpoints added at /health and /api/health for deployment monitoring
  * Database health check endpoints at /health/db and /api/health/db
  * Secure cookie configuration for production (HTTPS-only when NODE_ENV=production)
  * Graceful shutdown handling for SIGTERM and SIGINT signals
  * Improved server startup error handling with port conflict resolution
  * Server now properly listens on 0.0.0.0 interface for deployment compatibility
  * Environment variable PORT support with fallback to 5000
- July 09, 2025. Session persistence fixes for production login issues:
  * Fixed session configuration with rolling refresh and proper cookie settings
  * Added explicit session.save() calls in login and registration endpoints
  * Improved client-side authentication flow with better error handling
  * Added session validation endpoint /api/session/validate for debugging
  * Enhanced PostgreSQL session store with error logging and pruning
  * Updated authentication hooks to handle production environment navigation
  * Trust proxy configuration for production deployments
- July 08, 2025. Sistema completo de contas a pagar implementado:
  * Diálogo de visualização com informações detalhadas
  * Funcionalidade de edição com formulário completo
  * Campo condicional de projeto na edição
  * Endpoint PATCH /api/accounts-payable/:id com validação de organização
  * Método updateAccountPayable implementado na interface IStorage
  * Implementação PostgresStorage com query de atualização
  * Validação de segurança multi-tenant
  * Interface responsiva e integrada ao sistema principal
- July 01, 2025. Remoção de usuários indesejados do banco de dados:
  * Removidos usuários com emails: daniel.juswiak@brintell.com, danieljuswiak@hotmail.com, danieljuswiak.eng@gmail.com
  * Limpeza em cascata: removidos 4 registros de user_roles e 2 registros de beneficiaries
  * Operação concluída com sucesso sem afetar integridade do banco
  * Sistema de constraints de chave estrangeira respeitado durante a remoção
- July 01, 2025. Sistema automático de criação de contas para beneficiárias implementado:
  * Novos beneficiários com email automaticamente recebem conta de usuário
  * Verificação para evitar duplicação de emails na organização
  * Senha temporária gerada automaticamente (usuário pode alterar depois)
  * Role 'beneficiary' atribuído automaticamente à conta criada
  * Notificações atualizadas para indicar quando conta foi criada
  * Interface frontend atualizada com feedback sobre criação de conta
  * Sistema robusto com tratamento de erros para não falhar cadastro principal
- July 01, 2025. Correção do sistema de formulários nos módulos de cursos:
  * Erro "currentModule before initialization" corrigido completamente
  * Callbacks onSuccess deprecados do TanStack Query v5 removidos
  * Sistema de envio de formulários funcionando corretamente
  * Validação de campos obrigatórios e feedback visual implementados
  * Integração com API existente de submissões de módulos funcional
- June 30, 2025. Sistema completo de gerenciamento e interação de notificações implementado:
  * Funcionalidade "Limpar Todas as Notificações" com endpoint DELETE /api/notifications/clear-all
  * Funcionalidade "Marcar Todas Como Lidas" com endpoint PATCH /api/notifications/mark-all-read
  * Sistema de navegação inteligente ao clicar nas notificações baseado no tipo e metadata
  * Interface aprimorada com botões de ação no dropdown de notificações
  * Indicadores visuais para notificações não lidas (ponto azul e destaque visual)
  * Notificações clicáveis que navegam automaticamente para a página relacionada
  * Sistema de prevenção de propagação de eventos nos botões de ação
- June 30, 2025. Sistema completo de notificações baseado em roles implementado e funcionando:
  * Infraestrutura completa de notificações no PostgreSQL com tabela notifications
  * API endpoints para criar, listar, marcar como lida e excluir notificações
  * Sistema de notificações automáticas ao cadastrar beneficiários
  * Notificações enviadas para todos os administradores e gerentes da organização
  * Metadados detalhados incluindo ID e nome da beneficiária
  * Correção crítica do campo category obrigatório nas notificações
  * Testado: notificação criada automaticamente para "Isabel Mendes Final" cadastrada
- June 30, 2025. Correção crítica do sistema de edição de cursos:
  * Problema de conversão de dados resolvido (duration "4 horas" -> número 4)
  * Validação de campos numéricos (passScore, duration) antes do salvamento
  * Botão "Salvar Alterações" totalmente funcional
  * Conversão automática de strings formatadas para números no backend
  * Testado: curso "Curso Presencial Teste Final" editado com sucesso
- June 30, 2025. Controle de permissões na aba Organização das configurações:
  * Campos de edição da organização agora disponíveis apenas para administradores (admin e manager)
  * Usuários não-administradores veem campos desabilitados com aviso informativo
  * Botões "Gerenciar Plano" e "Salvar Alterações" também restritos por permissão
  * Interface clara sobre limitações de acesso baseadas no role do usuário
- June 30, 2025. Interface de configurações simplificada:
  * Removidos campos "Autenticação de Dois Fatores" e "Sessões Ativas" da aba Segurança
  * Aba de segurança agora contém apenas funcionalidade de alteração de senha
  * Interface mais limpa e focada nas funcionalidades essenciais
- June 30, 2025. Sistema completo de alteração de senhas implementado:
  * Funcionalidade de alteração de senha na aba Segurança das configurações
  * Endpoint /api/user/change-password com validações de segurança completas
  * Verificação obrigatória de senha atual antes da alteração
  * Criptografia bcrypt para hash de novas senhas
  * Validação de comprimento mínimo da senha (6 caracteres)
  * Testado: senha atual incorreta rejeitada, nova senha criptografada corretamente
- June 30, 2025. Níveis de acesso para voluntários ajustados conforme solicitado:
  * Voluntários agora têm acesso aos links "Capacitação" e "Projetos" no menu
  * Na área de Capacitação, voluntários possuem credenciais de administrador
  * Criado CourseAdminGuard para permitir acesso de admin/manager/volunteer nas rotas de cursos
  * Sistema de navegação específico para voluntários com menu reduzido
  * Rotas de administração de cursos agora permitem acesso para voluntários
- June 30, 2025. Sistema completo de certificados para cursos presenciais implementado:
  * Alunos com nota aprovada em cursos presenciais podem emitir certificados automaticamente
  * Lógica de elegibilidade atualizada para verificar notas finais lançadas pelo instrutor
  * Sistema reconhece cursos "in_person" e verifica nota final (passed: true) em vez de progresso de módulos
  * Endpoint de emissão corrigido para usar verificação de elegibilidade apropriada
  * Certificados emitidos incluem dados corretos: número, código de verificação, metadata do curso presencial
  * Testado com sucesso: usuária Simone Santos (nota 10.0) conseguiu emitir certificado
- June 30, 2025. Correção crítica da sincronização entre inscrições admin e visualização do aluno:
  * Implementada sincronização bidirecional completa entre user_course_roles e user_course_progress
  * Quando admin atribui aluno ao curso, sistema cria automaticamente registro de progresso
  * Usuários cadastrados por administradores agora veem cursos corretamente como inscritos
  * Função syncCourseEnrollments() executa em ambas as direções na verificação de inscrições
  * Bug crítico de visibilidade resolvido: alunos atribuídos veem "Meus Cursos" corretamente
- June 30, 2025. Interface de aluno atualizada com resumo de notas e frequência para cursos presenciais:
  * Seções "Minhas Notas" e "Minha Frequência" adicionadas para beneficiários
  * Exibição de notas finais com feedback do instrutor
  * Resumo detalhado de presença com estatísticas (presenças, atrasos, faltas)
  * Taxa de presença calculada automaticamente
  * Interface responsiva e organizada em cards separados
  * Dados carregados via API existente dos endpoints de notas e frequência
- June 30, 2025. Correção crítica no sistema de notas dos cursos presenciais:
  * Erro "grade.gradeScale.toFixed is not a function" corrigido
  * Conversão automática de gradeScale de string para número usando Number()
  * Funções calculateClassAverage e exibição de notas funcionando corretamente
  * Sistema de filtro de alunos no resumo de frequência implementado
  * Interface de seleção permite visualizar dados agregados ou individuais
- June 30, 2025. Integração de templates personalizados de certificados:
  * Sistema de PDF agora usa template personalizado criado na edição do curso
  * Função replaceTemplateVariables substitui variáveis como {{studentName}}, {{courseTitle}}
  * PDF gerado automaticamente com template ou design padrão se não houver template
  * Suporte a todas as variáveis do editor: organizationName, studentCpf, courseDuration, etc.
  * Interface de pré-visualização funcional na página de edição do curso
- June 30, 2025. Unificação das páginas course-start e course-progress:
  * Removida página duplicada course-progress.tsx 
  * Mantida apenas /courses/:courseId/start como rota unificada
  * Corrigidas todas as referências de navegação para usar rota /start
  * Eliminada redundância entre funcionalidades similares
  * Interface mais limpa e experiência de usuário consistente
- June 30, 2025. Correções críticas no sistema:
  * Corrigido erro de exclusão de cursos (foreign key constraints)
  * Corrigido erro na emissão de certificados (organização undefined)
  * Sistema de certificados totalmente funcional com PDF automático
  * Exclusão em cascata correta para user_grades antes de módulos
- June 29, 2025. Consolidação completa das páginas duplicadas de cursos:
  * Removidas páginas duplicadas course-enrollment.tsx e course-enrollments.tsx
  * Criada página unificada /courses com interface moderna e funcional
  * Sistema de filtros abrangente (status, categoria, nível, tipo)
  * Seções separadas para "Meus Cursos" e "Cursos Disponíveis"  
  * Estatísticas em tempo real e interface responsiva
  * Navegação atualizada: sidebar agora usa "Capacitação" -> /courses
  * Redirecionamentos atualizados no role-guard para nova rota
  * Interface unificada elimina confusão entre funcionalidades duplicadas
- June 29, 2025. Correção crítica do bug de validação de inscrições em cursos:
  * Implementado método getUserCourseRoles na interface IStorage e PostgresStorage
  * Endpoint /api/courses/enrollments agora verifica inscrições em duas fontes:
    - Tabela user_course_progress (inscrições via formulário)
    - Tabela user_course_roles (usuários atribuídos como 'student' via admin)
  * Bug corrigido: usuários com role 'student' agora veem botão "Acessar Curso" corretamente
  * Sistema de inscrição em cursos totalmente funcional para ambos os métodos de enrollment
  * Validação bidirecional garante que isEnrolled seja true independente da forma de inscrição
- June 28, 2025. Sistema completo de gerenciamento de inscrições e roles de curso implementado:
  * Nova página /courses/:courseId/manage para gestão de participantes
  * Tabela user_course_roles no banco para controle granular de permissões
  * API endpoints para atribuir/remover usuários, listar alunos/instrutores
  * Interface com tabs separadas por função (alunos, instrutores, assistentes)
  * Controle de acesso baseado em roles (student, instructor, assistant, observer)
  * Integração com sistema existente de cursos e usuários
  * Funcionalidade acessível através do botão "Gerenciar" nas páginas de curso
  * Interface melhorada: função selecionada primeiro, filtros automáticos (voluntários para instrutores, beneficiários para alunos)
  * Campo único de busca e seleção com Combobox para melhor experiência do usuário
  * Sincronização bidirecional entre área administrativa e perfis de usuário
- June 26, 2025. Correções no tema escuro e aplicação automática:
  * Tema aplicado automaticamente ao fazer login (sem precisar ir às configurações)
  * Cores dos links Beneficiários e Capacitação melhoradas no tema escuro
  * Classes CSS sidebar-link e sidebar-link-active para melhor visibilidade
  * Função applyStoredTheme() chamada após autenticação bem-sucedida
  * Sistema de tema totalmente funcional em ambos os modos claro e escuro
- June 26, 2025. Melhorias abrangentes na seção "Site Whitelabel":
  * Sistema completo de gerenciamento de páginas com editor visual e API backend
  * Formulários dinâmicos com builder de campos e visualização de submissões
  * Preview responsivo do site com visualização desktop/tablet/mobile
  * Editor de menus com drag-and-drop e organização hierárquica
  * Configurações avançadas de SEO, analytics e domínios personalizados
  * Interface unificada com tabs para melhor experiência do usuário
  * Todas as funcionalidades conectadas ao backend PostgreSQL
- June 25, 2025. Correção do sistema de perfil para beneficiários:
  * Corrigido bug que mostrava "Admin da ONG" para todas as contas
  * Perfil agora exibe corretamente "Beneficiária" para role beneficiary
  * Configurações pessoais carregam dados corretos do usuário
  * Erro de notificações corrigido com verificação de array
  * Sistema de navegação para beneficiários funcionando corretamente
- June 24, 2025. Interface de capacitação simplificada e clarificada:
  * Removido botão "Módulos" duplicado da listagem de cursos
  * Mantido apenas "Editar Curso" como ponto único de edição
  * Adicionadas descrições explicativas nos botões e páginas
  * Interface mais intuitiva sem redundância de funcionalidades
  * Tooltips informativos para guiar usuários na criação de cursos
- June 24, 2025. Unificação e sistema de permissões de capacitação:
  * Removida página separada de inscrições (/course-enrollments)
  * Tudo consolidado em /course-admin com permissões por role
  * Beneficiários: apenas visualizar e se inscrever em cursos
  * Admins/Managers: controle total (criar, editar, excluir cursos e módulos)
  * Interface adaptativa baseada no perfil do usuário
  * Sistema de drag-and-drop para reordenar módulos funcionando
  * Exclusão de módulos com confirmação implementada
- June 24, 2025. Implementada distinção completa entre cursos online e presenciais:
  * Campo "Tipo de Curso" adicionado na criação (Online/Presencial/Híbrido)
  * Interface atualizada para mostrar tipo de curso com badges coloridos
  * Filtro por tipo na página de inscrições
  * Estatísticas separadas para cursos online vs presenciais
  * Informações específicas por tipo (24/7 para online, local para presencial)
- June 24, 2025. Criados cursos completos com estrutura abrangente:
  * Curso presencial: "Empreendedorismo para Mulheres Sobreviventes" (40h, 8 módulos)
  * Curso online: "Tecnologia e Segurança Digital para Mulheres" (25h, 8 módulos)
  * Módulos com conteúdo detalhado, atividades práticas e materiais
  * Vídeos educativos e recursos complementares para curso online
  * Estrutura presencial com workshops, dinâmicas e certificação
- June 24, 2025. Sistema completo de capacitação tecnológica implementado:
  * Inscrições de beneficiários em cursos
  * Atribuição de voluntários como instrutores
  * Controle de frequência para cursos presenciais
  * Acompanhamento de progresso para cursos online
  * Interface de gerenciamento de cursos com múltiplas abas
  * Página de inscrições para beneficiários visualizarem cursos disponíveis
- June 23, 2025. Sistema de Super Admin implementado com painel completo de gerenciamento SaaS
- June 23, 2025. Criada conta de super admin com credenciais de acesso
- June 23, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Super Admin Focus: Super admin should only see platform management features, not NGO-specific operations.
Navigation: Different sidebar for super admin with platform-focused options only.
Course Management: Unified interface with role-based permissions - beneficiaries can only view/enroll, admins have full control.
Interface Clarity: Remove redundant buttons and provide clear descriptions of what each action does. Users should not be confused about functionality.
```