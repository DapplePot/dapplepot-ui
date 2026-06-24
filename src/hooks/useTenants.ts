import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { onboardClient, getTenant, getTenants, getTenantGrowth, getMyTenants, switchTenant, createPersonalWorkspace, deleteTenant } from '../api/tenants'
import { useAuthStore } from '../stores/auth'
import { scheduleProactiveRefresh } from '../api/client'
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

export function useTenantGrowth() {
  const role = useAuthStore((s) => s.user?.role)
  return useQuery({
    queryKey: ['tenants', 'growth'],
    queryFn:  getTenantGrowth,
    enabled:  role === 'superadmin',
    staleTime: 5 * 60_000,
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

export function useMyTenants() {
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  return useQuery({
    queryKey: ['me', 'tenants'],
    queryFn:  getMyTenants,
    enabled:  isAuthed,
    staleTime: 60_000,
  })
}

export function useCreatePersonalWorkspace() {
  const setTokens   = useAuthStore((s) => s.setTokens)
  const queryClient = useQueryClient()
  const router      = useRouter()

  return useMutation({
    mutationFn: () => createPersonalWorkspace(),
    onSuccess: (data) => {
      queryClient.clear()
      setTokens(data.accessToken, data.refreshToken, data.user, data.expiresIn)
      scheduleProactiveRefresh(data.expiresIn)
      void router.navigate({ to: '/' })
    },
  })
}

export function useDeleteTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tenantId: string) => deleteTenant(tenantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tenants'] })
      void queryClient.invalidateQueries({ queryKey: ['tenants', 'growth'] })
    },
  })
}

export function useSwitchTenant() {
  const setTokens   = useAuthStore((s) => s.setTokens)
  const queryClient = useQueryClient()
  const router      = useRouter()

  return useMutation({
    mutationFn: (tenantId: string) => switchTenant(tenantId),
    onSuccess: (data) => {
      // Wipe per-tenant cache so the new workspace's data is fetched fresh.
      // Keep nothing — every query was scoped to the previous tenant.
      queryClient.clear()
      setTokens(data.accessToken, data.refreshToken, data.user, data.expiresIn)
      scheduleProactiveRefresh(data.expiresIn)
      void router.navigate({ to: '/' })
    },
  })
}
