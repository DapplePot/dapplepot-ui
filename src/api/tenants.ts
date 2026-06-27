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

export interface UserLookupResult {
  exists:             boolean
  userId?:            string
  name?:              string
  email?:             string
  role?:              'superadmin' | 'admin' | 'editor' | 'viewer'
  status?:            'active' | 'disabled'
  hasPersonalTenant?: boolean
}

/** Superadmin-only — checks whether an email already belongs to a DapplePot user.
 *  Used by the Onboard Tenant wizard to adapt the form when linking an existing user. */
export function lookupUserByEmail(email: string): Promise<UserLookupResult> {
  return apiClient.get('v1/tenants/lookup-user', { searchParams: { email } }).json()
}

export function getTenants(): Promise<TenantWithStats[]> {
  return apiClient.get('v1/tenants').json()
}

export function getTenantGrowth(): Promise<TenantGrowthPoint[]> {
  return apiClient.get('v1/tenants/stats/growth').json()
}

/** Owner-only self-serve workspace delete. Requires typed `confirmName` to match
 *  the workspace name exactly, enforced server-side. */
export function deleteOwnWorkspace(confirmName: string): Promise<{ deleted: true; tenantId: string; name: string }> {
  return apiClient.post('v1/tenants/me/delete', { json: { confirmName } }).json()
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
