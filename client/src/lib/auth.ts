import { apiRequest } from './queryClient';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
}

export interface AuthState {
  user: AuthUser | null;
  organizations: Organization[];
  currentOrganization: Organization | null;
}

export async function login(email: string, password: string): Promise<AuthState> {
  const response = await apiRequest('/api/auth/login', 'POST', { email, password });
  return response.json();
}

export async function register(data: {
  email: string;
  password: string;
  name: string;
  organizationName: string;
  organizationSlug: string;
}): Promise<AuthState> {
  const response = await apiRequest('/api/auth/register', 'POST', data);
  return response.json();
}

export async function logout(): Promise<void> {
  await apiRequest('/api/auth/logout', 'POST');
}

export async function getCurrentUser(): Promise<AuthState> {
  const response = await apiRequest('/api/auth/me', 'GET');
  return response.json();
}

export async function switchOrganization(organizationId: string): Promise<{ organization: Organization }> {
  const response = await apiRequest('/api/organizations/switch', 'POST', { organizationId });
  return response.json();
}
