import { apiClient } from './client'
import type { OnboardClientRequest, OnboardClientResponse, TenantWithStats } from '../types/tenant'

export function onboardClient(body: OnboardClientRequest): Promise<OnboardClientResponse> {
  return apiClient.post('v1/tenants/onboard', { json: body }).json()
}

export function getTenants(): Promise<TenantWithStats[]> {
  return apiClient.get('v1/tenants').json()
}
