import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as securityApi from '../api/security'

// Tenant-level security overview — refreshes every 2 minutes
export function useSecurityOverview(windowHours = 168) {
  return useQuery({
    queryKey: ['security', 'overview', windowHours],
    queryFn:  () => securityApi.getSecurityOverview({ windowHours }),
    staleTime: 120_000,
    refetchInterval: 120_000,
  })
}

// Per-session risk score + findings — stable once written
export function useSessionSecurity(sessionId: string) {
  const score = useQuery({
    queryKey: ['security', 'session', sessionId, 'score'],
    queryFn:  () => securityApi.getSessionScore(sessionId),
    staleTime: 300_000,
    enabled:  !!sessionId,
  })
  const findings = useQuery({
    queryKey: ['security', 'session', sessionId, 'findings'],
    queryFn:  () => securityApi.getSessionFindings(sessionId),
    staleTime: 300_000,
    enabled:  !!sessionId,
  })
  return { score, findings }
}

// Remediation guidance — changes only when new findings accumulate
export function useRemediation(windowHours = 168) {
  return useQuery({
    queryKey: ['security', 'remediation', windowHours],
    queryFn:  () => securityApi.getRemediation({ windowHours }),
    staleTime: 300_000,
  })
}

// Top agents by composite risk — refreshes every 2 minutes
export function useTopAgents() {
  return useQuery({
    queryKey: ['security', 'agents'],
    queryFn:  () => securityApi.getTopAgents(),
    staleTime: 120_000,
    refetchInterval: 120_000,
  })
}

// Full security profile for a single agent
export function useAgentProfile(agentId: string) {
  return useQuery({
    queryKey: ['security', 'agent', agentId],
    queryFn:  () => securityApi.getAgentProfile(agentId),
    staleTime: 300_000,
    enabled:  !!agentId,
  })
}

// Signal registry — 121 sub-checks for all 20 OW signals; rarely changes
export function useSignalRegistry() {
  return useQuery({
    queryKey: ['security', 'signals'],
    queryFn:  () => securityApi.getSignalRegistry(),
    staleTime: 3_600_000,  // 1 hour — registry is static
  })
}

// Per-agent subcheck online toggle config
export function useSubcheckConfig(agentId: string) {
  return useQuery({
    queryKey: ['security', 'agent', agentId, 'subcheck-config'],
    queryFn:  () => securityApi.getSubcheckConfig(agentId),
    staleTime: 60_000,
    enabled:  !!agentId,
  })
}

// Mutation to toggle a single sub-check online/offline
export function useToggleSubcheckOnline(agentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ subCheckId, online_detection }: { subCheckId: string; online_detection: boolean }) =>
      securityApi.setSubcheckOnline(agentId, subCheckId, online_detection),
    onMutate: async ({ subCheckId, online_detection }) => {
      // Optimistic update
      const key = ['security', 'agent', agentId, 'subcheck-config']
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<Record<string, { online_detection: boolean }>>(key)
      queryClient.setQueryData(key, (old: Record<string, { online_detection: boolean }> = {}) => ({
        ...old,
        [subCheckId]: { online_detection },
      }))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      const key = ['security', 'agent', agentId, 'subcheck-config']
      queryClient.setQueryData(key, ctx?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['security', 'agent', agentId, 'subcheck-config'],
      })
    },
  })
}
