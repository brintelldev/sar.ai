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
  { name: "Capacitação", href: "/course-enrollment", icon: BookOpen },
  { name: "Admin Cursos", href: "/courses-admin", icon: Settings },
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
    <div className="flex h-full w-64 flex-col border-r bg-white border-gray-200">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <nav className="flex-1 space-y-1 px-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                location === item.href
                  ? "bg-blue-50 text-blue-700"
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