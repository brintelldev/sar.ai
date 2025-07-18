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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

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

// Navegação para voluntários - acesso a Capacitação (com credenciais admin) e Projetos
const volunteerNavigation = [
  { name: "Capacitação", href: "/admin/courses", icon: BookOpen },
  { name: "Projetos", href: "/projects", icon: FolderOpen },
];

// Navegação padrão para ONGs (admin, manager)
const standardNavigation = [
  { name: "Painel Geral", href: "/", icon: LayoutDashboard },
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

export function AppSidebar() {
  const [location] = useLocation();
  const { currentOrganization, user, userRole } = useAuth();
  
  // CORREÇÃO DE SEGURANÇA: Verificação imediata sem delay
  // Se userRole não estiver definido, não renderizar menu até ter o role
  if (!userRole) {
    return (
      <Sidebar>
        <SidebarContent>
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }
  
  // Determinar navegação baseada no tipo de usuário - IMEDIATAMENTE
  const isSuperAdmin = currentOrganization?.slug === 'super-admin';
  const isBeneficiary = userRole === 'beneficiary';
  const isVolunteer = userRole === 'volunteer';
  
  console.log('Sidebar debug:', { userRole, isBeneficiary, isVolunteer }); // Debug log
  
  let navigation;
  if (isSuperAdmin) {
    navigation = superAdminNavigation;
  } else if (isBeneficiary) {
    navigation = beneficiaryNavigation; // APENAS cursos e projetos
  } else if (isVolunteer) {
    navigation = volunteerNavigation; // Capacitação (admin) e Projetos
  } else {
    navigation = standardNavigation; // Admin e Manager - acesso completo
  }

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">
              {currentOrganization?.name || 'Plataforma'}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.name || 'Usuário'}
            </span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={location === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="px-4 py-2">
          <div className="text-xs text-muted-foreground">
            {userRole === 'admin' && 'Administrador'}
            {userRole === 'manager' && 'Gerente'}
            {userRole === 'volunteer' && 'Voluntário'}
            {userRole === 'beneficiary' && 'Beneficiário'}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}