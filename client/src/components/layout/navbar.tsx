import { useState } from 'react';
import { ChevronDown, Heart, User, Settings, HelpCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@/lib/utils';
import { useLocation } from 'wouter';
import { NotificationsDropdown } from './notifications-dropdown';
import logoSarai from '@/assets/logo_sarai.png';

export function Navbar() {
  const { user, organizations, currentOrganization, userRole, logout, switchOrganization } = useAuth();
  const [location, setLocation] = useLocation();

  const handleOrganizationChange = (organizationId: string) => {
    switchOrganization(organizationId);
  };

  const handleMenuItemClick = (path: string) => {
    setLocation(path);
  };

  const handleLogout = async () => {
    try {
      // Call logout function
      logout();
      // Force immediate redirect as backup
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/login';
    }
  };

  return (
    <nav className="bg-white dark:bg-card border-b border-border px-3 md:px-6 py-3 w-full">
      <div className="flex items-center justify-between w-full max-w-none">
        {/* Logo - Canto esquerdo */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <img 
            src={logoSarai} 
            alt="SAR.AI" 
            className="h-6 md:h-8 w-auto"
          />
        </div>

        {/* Centro - Seletor de organização */}
        {currentOrganization && (
          <div className="hidden md:flex items-center space-x-2 flex-1 justify-center max-w-md">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Organização:</span>
            <Select
              value={currentOrganization.id}
              onValueChange={handleOrganizationChange}
            >
              <SelectTrigger className="w-full min-w-[200px] max-w-[250px] bg-muted border-border">
                <SelectValue>{currentOrganization.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Mobile - Seletor de organização */}
        {currentOrganization && (
          <div className="md:hidden flex items-center space-x-1 flex-1 justify-center px-2">
            <Select
              value={currentOrganization.id}
              onValueChange={handleOrganizationChange}
            >
              <SelectTrigger className="w-full max-w-[180px] bg-muted border-border text-xs">
                <SelectValue>{currentOrganization.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Direita - Notificações e Menu do usuário */}
        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
          {/* Notifications - only show for admins */}
          {userRole === 'admin' && <NotificationsDropdown />}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-1 md:space-x-3 px-1 md:px-3 py-2">
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium text-foreground">{user?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {userRole === 'admin' ? 'Admin da ONG' : 
                     userRole === 'beneficiary' ? 'Beneficiário' : 
                     userRole === 'volunteer' ? 'Voluntário' : 
                     user?.position || 'Usuário'}
                  </div>
                </div>
                <div className="w-6 h-6 md:w-8 md:h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xs md:text-sm font-medium">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleMenuItemClick('/profile')}>
                <User className="h-4 w-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMenuItemClick('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMenuItemClick('/support')}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Suporte
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}