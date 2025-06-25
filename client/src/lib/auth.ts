import { apiRequest } from './queryClient';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  position?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  cnpj?: string;
  email: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
}

export interface AuthState {
  user: AuthUser | null;
  organizations: Organization[];
  currentOrganization: Organization | null;
  userRole?: string;
}

export async function login(email: string, password: string): Promise<AuthState> {
  return await apiRequest('/api/auth/login', 'POST', { email, password });
}

export async function register(data: {
  email: string;
  password: string;
  name: string;
  organizationName: string;
  organizationSlug: string;
}): Promise<AuthState> {
  return await apiRequest('/api/auth/register', 'POST', data);
}

export async function logout(): Promise<void> {
  await apiRequest('/api/auth/logout', 'POST');
}

export async function getCurrentUser(): Promise<AuthState> {
  return await apiRequest('/api/auth/me', 'GET');
}

export async function switchOrganization(organizationId: string): Promise<{ organization: Organization }> {
  return await apiRequest('/api/organizations/switch', 'POST', { organizationId });
}
