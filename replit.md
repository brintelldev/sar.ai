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

## Changelog

```
Changelog:
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