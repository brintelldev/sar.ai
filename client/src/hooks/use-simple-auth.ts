import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login, register, logout, getCurrentUser, switchOrganization } from '@/lib/auth';
import type { AuthState } from '@/lib/auth';

// Função para aplicar o tema salvo
const applyStoredTheme = () => {
  const stored = localStorage.getItem('theme');
  const theme = stored || 'light';
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export function useSimpleAuth() {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  // Check authentication only once on mount (skip on login page)
  useEffect(() => {
    if (!hasChecked && window.location.pathname !== '/login') {
      getCurrentUser()
        .then((data) => {
          console.log('Auth data received:', data); // Debug log
          setAuthState(data);
          setIsLoading(false);
          setHasChecked(true);
          // Aplicar tema apenas se já estiver autenticado (refresh da página)
          if (data) {
            applyStoredTheme();
          }
        })
        .catch((error) => {
          // Don't log auth errors on login page
          if (window.location.pathname !== '/login') {
            console.log('Auth error:', error); // Debug log
          }
          setAuthState(null);
          setIsLoading(false);
          setHasChecked(true);
        });
    } else if (window.location.pathname === '/login') {
      // On login page, skip auth check
      setAuthState(null);
      setIsLoading(false);
      setHasChecked(true);
    }
  }, [hasChecked]);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: (data) => {
      console.log('Login successful, setting auth state:', data);
      setAuthState(data);
      setIsLoading(false);
      setHasChecked(true);
      queryClient.setQueryData(['/api/auth/me'], data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      // Aplicar tema imediatamente após login bem-sucedido
      applyStoredTheme();
      // Use replace instead of href to ensure proper navigation in production
      setTimeout(() => {
        window.location.replace('/');
      }, 200);
    },
    onError: (error) => {
      // Only log login errors if they're from actual login attempts
      if (error.message && !error.message.includes('Authentication required')) {
        console.error('Login error:', error);
      }
      setAuthState(null);
      setIsLoading(false);
    }
  });

  const registerMutation = useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      name: string;
      organizationName: string;
      organizationSlug: string;
    }) => register(data),
    onSuccess: (data) => {
      setAuthState(data);
      queryClient.setQueryData(['/api/auth/me'], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setAuthState(null);
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.clear();
      setHasChecked(false);
      // Force redirect to login page with reload
      setTimeout(() => {
        window.location.replace('/login');
      }, 100);
    },
  });

  const switchOrgMutation = useMutation({
    mutationFn: switchOrganization,
    onSuccess: (response) => {
      if (authState) {
        const updatedState = {
          ...authState,
          currentOrganization: response.organization,
        };
        setAuthState(updatedState);
        queryClient.setQueryData(['/api/auth/me'], updatedState);
      }
    },
  });

  return {
    user: authState?.user || null,
    organizations: authState?.organizations || [],
    currentOrganization: authState?.currentOrganization || null,
    userRole: authState?.userRole || null,
    isLoading,
    isAuthenticated: !!authState?.user,
    error: hasChecked && !authState ? new Error('Not authenticated') : null,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    switchOrganization: switchOrgMutation.mutate,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    isSwitchOrgPending: switchOrgMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}