import { useSimpleAuth as useAuth } from "@/hooks/use-simple-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

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
  useEffect(() => {
    if (!isLoading && (!userRole || !allowedRoles.includes(userRole))) {
      // Para beneficiários, redirecionar para cursos
      if (userRole === 'beneficiary') {
        setLocation('/course-enrollments');
      } else {
        setLocation(fallbackPath);
      }
    }
  }, [userRole, isLoading, allowedRoles, setLocation, fallbackPath]);

  if (!userRole || !allowedRoles.includes(userRole)) {
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
    <RoleGuard allowedRoles={['admin', 'manager']} fallbackPath="/course-enrollments">
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