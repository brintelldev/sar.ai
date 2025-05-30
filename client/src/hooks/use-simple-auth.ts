import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login, register, logout, getCurrentUser, switchOrganization } from '@/lib/auth';
import type { AuthState } from '@/lib/auth';

export function useSimpleAuth() {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  // Check authentication only once on mount
  useEffect(() => {
    if (!hasChecked) {
      getCurrentUser()
        .then((data) => {
          setAuthState(data);
          setIsLoading(false);
          setHasChecked(true);
        })
        .catch(() => {
          setAuthState(null);
          setIsLoading(false);
          setHasChecked(true);
        });
    }
  }, [hasChecked]);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: (data) => {
      setAuthState(data);
      queryClient.setQueryData(['/api/auth/me'], data);
    },
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