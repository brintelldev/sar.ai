import { 
  LayoutDashboard, 
  FolderKanban, 
  Heart, 
  Users, 
  UserCheck, 
  DollarSign, 
  ArrowDown, 
  ArrowUp, 
  FileText, 
  Handshake,
  Shield,
  BarChart3
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Visão Geral', href: '/financials', icon: FileText },
];

const managementNav = [
  { name: 'Projetos', href: '/projects', icon: FolderKanban, count: 12 },
  { name: 'Doadores', href: '/donors', icon: Heart, count: 284 },
  { name: 'Pessoas Atendidas', href: '/beneficiaries', icon: Users, count: 156 },
  { name: 'Voluntários', href: '/volunteers', icon: UserCheck, count: 43 },
];

const financialNav = [
  { name: 'Doações', href: '/donations', icon: DollarSign },
  { name: 'Contas a Receber', href: '/accounts-receivable', icon: ArrowDown },
  { name: 'Contas a Pagar', href: '/accounts-payable', icon: ArrowUp },
  { name: 'Relatórios', href: '/reports', icon: FileText },
];

const partnershipsNav = [
  { name: 'Financiadores', href: '/funders', icon: Handshake },
];

export function Sidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === '/') {
      return location === '/';
    }
    return location.startsWith(href);
  };

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  'sidebar-nav-item',
                  isActive(item.href) && 'sidebar-nav-item-active bg-primary/10 text-primary font-medium'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          
          <div className="pt-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Gestão
            </div>
            <div className="space-y-1">
              {managementNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={cn(
                      'sidebar-nav-item',
                      isActive(item.href) && 'sidebar-nav-item-active bg-primary/10 text-primary font-medium'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                    {item.count && (
                      <Badge 
                        variant="secondary" 
                        className="ml-auto bg-muted text-muted-foreground text-xs"
                      >
                        {item.count}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="pt-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Financeiro
            </div>
            <div className="space-y-1">
              {financialNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={cn(
                      'sidebar-nav-item',
                      isActive(item.href) && 'sidebar-nav-item-active bg-primary/10 text-primary font-medium'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="pt-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Parcerias
            </div>
            <div className="space-y-1">
              {partnershipsNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={cn(
                      'sidebar-nav-item',
                      isActive(item.href) && 'sidebar-nav-item-active bg-primary/10 text-primary font-medium'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* LGPD Compliance Indicator */}
      <div className="mt-auto p-6">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              LGPD Conforme
            </span>
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            Dados protegidos e políticas ativas
          </p>
        </div>
      </div>
    </aside>
  );
}
