import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useSimpleAuth as useAuth } from "@/hooks/use-simple-auth";
import { 
  LayoutDashboard, 
  Users, 
  Heart, 
  HandHeart, 
  DollarSign, 
  FolderOpen,
  BookOpen,
  TrendingUp,
  Receipt,
  CreditCard,
  Building2,
  Settings,
  Globe,
  Shield,
  BarChart3,
  Megaphone,
  CreditCard as PlansIcon,
  UserCheck
} from "lucide-react";

// Navegação para super admin - apenas gestão da plataforma
const superAdminNavigation = [
  { name: "Visão Geral", href: "/super-admin", icon: LayoutDashboard },
  { name: "Organizações", href: "/super-admin", icon: Building2 },
  { name: "Planos", href: "/super-admin", icon: PlansIcon },
  { name: "Anúncios", href: "/super-admin", icon: Megaphone },
  { name: "Analytics", href: "/super-admin", icon: BarChart3 },
  { name: "Configurações", href: "/settings", icon: Settings },
];

// Navegação restrita para beneficiários - apenas cursos e projetos
const beneficiaryNavigation = [
  { name: "Capacitação", href: "/courses", icon: BookOpen },
  { name: "Projetos", href: "/projects", icon: FolderOpen },
];

// Navegação padrão para ONGs (admin, manager, volunteer)
const standardNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projetos", href: "/projects", icon: FolderOpen },
  { name: "Beneficiários", href: "/beneficiaries", icon: Users },
  { name: "Voluntários", href: "/volunteers", icon: HandHeart },
  { name: "Usuários", href: "/users", icon: UserCheck },
  { name: "Doadores", href: "/donors", icon: Heart },
  { name: "Doações", href: "/donations", icon: DollarSign },
  { name: "Capacitação", href: "/admin/courses", icon: BookOpen },
  { name: "Site Whitelabel", href: "/whitelabel", icon: Globe },
  { name: "Contas a Receber", href: "/accounts-receivable", icon: Receipt },
  { name: "Contas a Pagar", href: "/accounts-payable", icon: CreditCard },
  { name: "Relatórios", href: "/reports", icon: TrendingUp },
  { name: "Financiadores", href: "/funders", icon: Building2 },
  { name: "Controle de Acesso", href: "/access-control", icon: Shield },
];

export function Sidebar() {
  const [location] = useLocation();
  const { currentOrganization, user, userRole } = useAuth();
  
  // CORREÇÃO DE SEGURANÇA: Verificação imediata sem delay
  // Se userRole não estiver definido, não renderizar menu até ter o role
  if (!userRole) {
    return (
      <div className="flex h-full w-64 flex-col border-r bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="animate-pulse text-gray-400 dark:text-gray-500">Carregando...</div>
        </div>
      </div>
    );
  }
  
  // Determinar navegação baseada no tipo de usuário - IMEDIATAMENTE
  const isSuperAdmin = currentOrganization?.slug === 'super-admin';
  const isBeneficiary = userRole === 'beneficiary';
  
  console.log('Sidebar debug:', { userRole, isBeneficiary }); // Debug log
  
  let navigation;
  if (isSuperAdmin) {
    navigation = superAdminNavigation;
  } else if (isBeneficiary) {
    navigation = beneficiaryNavigation; // APENAS cursos e projetos
  } else {
    navigation = standardNavigation;
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <nav className="flex-1 space-y-1 px-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                location === item.href
                  ? "sidebar-link-active"
                  : "sidebar-link hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}