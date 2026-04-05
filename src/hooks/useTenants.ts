import { useMutation, useQuery } from '@tanstack/react-query'
import { onboardClient, getTenants } from '../api/tenants'
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
