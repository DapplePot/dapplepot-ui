import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type {
  UserSummary,
  UserWithMemberships,
  UserGrowthPoint,
  InviteSummary,
  InviteUserRequest,
  UpdateMeRequest,
  ChangeRoleRequest,
  ChangeStatusRequest,
} from '../types/auth'
import type { Paginated } from '../types/common'
import { useAuthStore } from '../stores/auth'

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn:  () => apiClient.get('v1/users/me').json<UserSummary>(),
    staleTime: 5 * 60_000,
  })
}

export function useUpdateMe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateMeRequest) =>
      apiClient.patch('v1/users/me', { json: body }).json<UserSummary>(),
    onSuccess: (updated) => {
      qc.setQueryData(['me'], updated)
    },
  })
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn:  () => apiClient.get('v1/users').json<Paginated<UserSummary>>().then((r) => r.data),
    staleTime: 60_000,
  })
}

// Superadmin-only system-wide users listing with workspace memberships.
export function useAllUsers() {
  const role = useAuthStore((s) => s.user?.role)
  return useQuery({
    queryKey: ['users', 'all'],
    queryFn:  () => apiClient.get('v1/users/all').json<UserWithMemberships[]>(),
    enabled:  role === 'superadmin',
    staleTime: 60_000,
  })
}

// Superadmin-only monthly cumulative user counts for the Overview chart.
export function useUserGrowth() {
  const role = useAuthStore((s) => s.user?.role)
  return useQuery({
    queryKey: ['users', 'growth'],
    queryFn:  () => apiClient.get('v1/users/stats/growth').json<UserGrowthPoint[]>(),
    enabled:  role === 'superadmin',
    staleTime: 5 * 60_000,
  })
}

// Superadmin-only hard delete. Also invalidates the tenants list since
// deleting a user wipes their personal workspaces and tenant_members rows.
export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => apiClient.delete(`v1/users/${userId}`).then(() => undefined),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users', 'all'] })
      void qc.invalidateQueries({ queryKey: ['tenants'] })
      void qc.invalidateQueries({ queryKey: ['tenants', 'growth'] })
    },
  })
}

// Superadmin-only destructive force delete — wipes the user AND every
// tenant they own (personal + organisation). Use after the normal delete
// returns 409 OWNER_REMOVAL_FORBIDDEN and the operator has confirmed they
// understand the blast radius.
export interface ForceDeleteResult {
  deletedTenants: { tenantId: string; name: string }[]
}
export function useForceDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      apiClient.post(`v1/users/${userId}/force-delete`, { json: { acknowledged: true } })
        .json<ForceDeleteResult>(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users', 'all'] })
      void qc.invalidateQueries({ queryKey: ['tenants'] })
      void qc.invalidateQueries({ queryKey: ['tenants', 'growth'] })
    },
  })
}

export function useInviteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: InviteUserRequest) =>
      apiClient.post('v1/users/invite', { json: body }).json<InviteSummary>(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['invites'] })
    },
  })
}

export function useInvites() {
  return useQuery({
    queryKey: ['invites'],
    queryFn:  () => apiClient.get('v1/users/invites').json<InviteSummary[]>(),
    staleTime: 60_000,
  })
}

export function useChangeRole(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ChangeRoleRequest) =>
      apiClient.put(`v1/users/${userId}/role`, { json: body }).json<UserSummary>(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useChangeStatus(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ChangeStatusRequest) =>
      apiClient.put(`v1/users/${userId}/status`, { json: body }).json<UserSummary>(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

/** Removes the user from THIS workspace's membership. User account stays
 *  intact — they retain access to other workspaces they belong to. */
export interface RemoveMemberResult {
  removed:      boolean
  repointedTo:  string | null
}
export function useRemoveMember(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiClient.delete(`v1/users/${userId}/membership`).json<RemoveMemberResult>(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] })
      void qc.invalidateQueries({ queryKey: ['me', 'tenants'] })
    },
  })
}
