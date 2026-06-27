import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    listAdminTenants,
    getAdminTenant,
    createAdminTenant,
    patchAdminTenant,
    searchAdminUsers,
    getAdminUsage,
    listAdminAuditLog,
    type PlanTier,
} from '../api/admin'

const ADMIN_STALE = 60_000

export function useAdminTenants(filters: { planTier?: PlanTier; enabled?: boolean; search?: string } = {}) {
    return useQuery({
        queryKey: ['admin', 'tenants', filters],
        queryFn:  () => listAdminTenants(filters).then(r => r.data),
        staleTime: ADMIN_STALE,
    })
}

export function useAdminTenant(tenantId: string | null) {
    return useQuery({
        queryKey: ['admin', 'tenant', tenantId],
        queryFn:  () => getAdminTenant(tenantId!),
        enabled:  !!tenantId,
        staleTime: ADMIN_STALE,
    })
}

export function useCreateAdminTenant() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createAdminTenant,
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['admin', 'tenants'] })
            void qc.invalidateQueries({ queryKey: ['admin', 'usage'] })
        },
    })
}

export function usePatchAdminTenant() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (vars: { tenantId: string; body: Parameters<typeof patchAdminTenant>[1] }) =>
            patchAdminTenant(vars.tenantId, vars.body),
        onSuccess: (_, vars) => {
            void qc.invalidateQueries({ queryKey: ['admin', 'tenant', vars.tenantId] })
            void qc.invalidateQueries({ queryKey: ['admin', 'tenants'] })
            void qc.invalidateQueries({ queryKey: ['admin', 'audit-log'] })
        },
    })
}

export function useAdminUserSearch(search: string) {
    return useQuery({
        queryKey: ['admin', 'users', search],
        queryFn:  () => searchAdminUsers(search).then(r => r.data),
        enabled:  search.length >= 2,
        staleTime: ADMIN_STALE,
    })
}

export function useAdminUsage() {
    return useQuery({
        queryKey: ['admin', 'usage'],
        queryFn:  getAdminUsage,
        staleTime: 5 * 60_000,
    })
}

export function useAdminAuditLog(filters: Parameters<typeof listAdminAuditLog>[0] = {}) {
    return useQuery({
        queryKey: ['admin', 'audit-log', filters],
        queryFn:  () => listAdminAuditLog(filters).then(r => r.data),
        staleTime: 30_000,
    })
}
