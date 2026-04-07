import { useMutation, useQuery } from '@tanstack/react-query'
import { onboardClient, getTenant, getTenants } from '../api/tenants'
import type { OnboardClientRequest } from '../types/tenant'

export function useOnboardClient() {
  return useMutation({
    mutationFn: (body: OnboardClientRequest) => onboardClient(body),
  })
}

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn:  getTenants,
    staleTime: 60_000,
  })
}

export function useTenant(tenantId: string | null) {
  return useQuery({
    queryKey: ['tenant', tenantId],
    queryFn:  () => getTenant(tenantId!),
    enabled:  !!tenantId,
    staleTime: 5 * 60_000,
  })
}
