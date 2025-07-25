import { useSimpleAuth as useAuth } from "@/hooks/use-simple-auth";
import { useLocation } from "wouter";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallbackPath?: string;
}

export function RoleGuard({ allowedRoles, children, fallbackPath = "/" }: RoleGuardProps) {
  const { userRole, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Mostrar loading enquanto carrega
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-400">Verificando permissões...</div>
      </div>
    );
  }

  // Se não tem role ou role não é permitido, redirecionar
  if (!userRole || !allowedRoles.includes(userRole)) {
    // Para beneficiários e voluntários, redirecionar para cursos
    if (userRole === 'beneficiary' || userRole === 'volunteer') {
      setLocation('/course-admin');
    } else {
      setLocation(fallbackPath);
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Acesso não autorizado. Redirecionando...</div>
      </div>
    );
  }

  // Se tem permissão, renderizar conteúdo
  return <>{children}</>;
}

// Componente para páginas apenas de admin/manager
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']} fallbackPath="/courses">
      {children}
    </RoleGuard>
  );
}

// Componente para páginas de administração de cursos - inclui voluntários
export function CourseAdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin', 'manager', 'volunteer']} fallbackPath="/courses">
      {children}
    </RoleGuard>
  );
}

// Componente para páginas apenas de beneficiários
export function BeneficiaryGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['beneficiary']} fallbackPath="/">
      {children}
    </RoleGuard>
  );
}

// Componente para páginas de super admin
export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['super_admin']} fallbackPath="/">
      {children}
    </RoleGuard>
  );
}

// Componente para páginas que voluntários NÃO podem acessar
export function NonVolunteerGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin', 'manager', 'beneficiary']} fallbackPath="/course-admin">
      {children}
    </RoleGuard>
  );
}