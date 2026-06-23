import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type {
  UserSummary,
  InviteSummary,
  InviteUserRequest,
  UpdateMeRequest,
  ChangeRoleRequest,
  ChangeStatusRequest,
} from '../types/auth'
import type { Paginated } from '../types/common'

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
