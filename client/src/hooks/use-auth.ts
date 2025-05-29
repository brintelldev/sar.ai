import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { login, register, logout, getCurrentUser, switchOrganization } from '@/lib/auth';
import type { AuthState } from '@/lib/auth';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<AuthState>({
    queryKey: ['/api/auth/me'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: (data) => {
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
      queryClient.setQueryData(['/api/auth/me'], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.clear();
    },
  });

  const switchOrgMutation = useMutation({
    mutationFn: switchOrganization,
    onSuccess: (response) => {
      // Update the current organization in the cache
      const currentData = queryClient.getQueryData<AuthState>(['/api/auth/me']);
      if (currentData) {
        queryClient.setQueryData(['/api/auth/me'], {
          ...currentData,
          currentOrganization: response.organization,
        });
      }
      // Invalidate all organization-specific queries
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0] as string;
        return key.startsWith('/api/') && !key.startsWith('/api/auth/');
      }});
    },
  });

  return {
    user: data?.user || null,
    organizations: data?.organizations || [],
    currentOrganization: data?.currentOrganization || null,
    isLoading: isLoading,
    isAuthenticated: !!data?.user,
    error,
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
