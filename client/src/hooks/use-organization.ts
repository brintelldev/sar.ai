import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface DashboardMetrics {
  activeProjects: number;
  totalDonated: number;
  beneficiariesServed: number;
  activeVolunteers: number;
}

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
    staleTime: 30000, // 30 seconds
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ['/api/projects'],
    staleTime: 60000, // 1 minute
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['/api/projects', id],
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest('PATCH', `/api/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
    },
  });
}

export function useDonors() {
  return useQuery({
    queryKey: ['/api/donors'],
    staleTime: 60000, // 1 minute
  });
}

export function useCreateDonor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/donors', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/donors'] });
    },
  });
}

export function useBeneficiaries() {
  return useQuery({
    queryKey: ['/api/beneficiaries'],
    staleTime: 60000, // 1 minute
  });
}

export function useCreateBeneficiary() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/beneficiaries', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/beneficiaries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
    },
  });
}

export function useVolunteers() {
  return useQuery({
    queryKey: ['/api/volunteers'],
    staleTime: 60000, // 1 minute
  });
}

export function useCreateVolunteer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/volunteers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/volunteers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
    },
  });
}

export function useDonations() {
  return useQuery({
    queryKey: ['/api/donations'],
    staleTime: 60000, // 1 minute
  });
}

export function useCreateDonation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/donations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/donations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
    },
  });
}

export function useUpdateDonation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest('PATCH', `/api/donations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/donations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
    },
  });
}
