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
  CreditCard as PlansIcon
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

// Navegação padrão para ONGs
const standardNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projetos", href: "/projects", icon: FolderOpen },
  { name: "Beneficiários", href: "/beneficiaries", icon: Users },
  { name: "Voluntários", href: "/volunteers", icon: HandHeart },
  { name: "Doadores", href: "/donors", icon: Heart },
  { name: "Doações", href: "/donations", icon: DollarSign },
  { name: "Capacitação", href: "/courses", icon: BookOpen },
  { name: "Admin Cursos", href: "/course-admin", icon: Settings },
  { name: "Site Whitelabel", href: "/whitelabel", icon: Globe },
  { name: "Contas a Receber", href: "/accounts-receivable", icon: Receipt },
  { name: "Contas a Pagar", href: "/accounts-payable", icon: CreditCard },
  { name: "Relatórios", href: "/reports", icon: TrendingUp },
  { name: "Financiadores", href: "/funders", icon: Building2 },
];

export function Sidebar() {
  const [location] = useLocation();
  const { currentOrganization } = useAuth();
  
  // Verificar se é organização de super admin
  const isSuperAdmin = currentOrganization?.slug === 'super-admin';
  const navigation = isSuperAdmin ? superAdminNavigation : standardNavigation;

  return (
    <div className={cn(
      "flex h-full w-64 flex-col border-r",
      isSuperAdmin 
        ? "bg-gradient-to-b from-purple-50 to-white border-purple-200" 
        : "bg-white border-gray-200"
    )}>
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        {/* Logo/Header específico para super admin */}
        {isSuperAdmin && (
          <div className="px-4 mb-6 border-b border-purple-100 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-6 w-6 text-purple-600" />
              <span className="font-bold text-lg text-purple-700">Super Admin</span>
            </div>
            <p className="text-xs text-purple-500 font-medium">Gerenciamento da Plataforma</p>
          </div>
        )}
        
        <nav className="flex-1 space-y-1 px-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                location === item.href
                  ? isSuperAdmin 
                    ? "bg-purple-50 text-purple-700 border-l-4 border-purple-600"
                    : "bg-blue-50 text-blue-700"
                  : isSuperAdmin
                    ? "text-purple-600 hover:bg-purple-50 hover:text-purple-700 hover:border-l-2 hover:border-purple-300"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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