import { apiClient } from './client'
import type {
  OnboardClientRequest,
  OnboardClientResponse,
  TenantGrowthPoint,
  TenantSummary,
  TenantWithStats,
  UserTenantSummary,
} from '../types/tenant'
import type { LoginResponse } from '../types/auth'

export function onboardClient(body: OnboardClientRequest): Promise<OnboardClientResponse> {
  return apiClient.post('v1/tenants/onboard', { json: body }).json()
}

export function getTenants(): Promise<TenantWithStats[]> {
  return apiClient.get('v1/tenants').json()
}

export function getTenantGrowth(): Promise<TenantGrowthPoint[]> {
  return apiClient.get('v1/tenants/stats/growth').json()
}

export async function deleteTenant(tenantId: string): Promise<void> {
  await apiClient.delete(`v1/tenants/${tenantId}`)
}

export function getTenant(tenantId: string): Promise<TenantSummary> {
  return apiClient.get(`v1/tenants/${tenantId}`).json()
}

export async function getMyTenants(): Promise<UserTenantSummary[]> {
  const data = await apiClient.get('v1/users/me/tenants').json<{ tenants: UserTenantSummary[] }>()
  return data.tenants
}

export function switchTenant(tenantId: string): Promise<LoginResponse> {
  return apiClient.post('v1/auth/switch-tenant', { json: { tenantId } }).json()
}

export function createPersonalWorkspace(): Promise<LoginResponse> {
  return apiClient.post('v1/auth/create-personal-workspace').json()
}
