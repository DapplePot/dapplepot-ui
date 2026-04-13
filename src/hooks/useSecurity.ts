import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as securityApi from '../api/security'
import type { OnlineAction } from '../types/security'

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

// Per-agent alert threshold config
export function useAlertConfig(agentId: string) {
  return useQuery({
    queryKey: ['security', 'agent', agentId, 'alert-config'],
    queryFn:  () => securityApi.getAlertConfig(agentId),
    staleTime: 60_000,
    enabled:  !!agentId,
  })
}

// Mutation: update composite alert threshold
export function useUpdateCompositeThreshold(agentId: string) {
  const queryClient = useQueryClient()
  const key = ['security', 'agent', agentId, 'alert-config']
  return useMutation({
    mutationFn: (composite_threshold: number) =>
      securityApi.updateCompositeThreshold(agentId, composite_threshold),
    onMutate: async (composite_threshold) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<securityApi.AgentAlertConfig>(key)
      queryClient.setQueryData(key, (old: securityApi.AgentAlertConfig | undefined) =>
        old ? { ...old, composite_threshold }
            : { composite_threshold, llm_composite_threshold: null, asi_composite_threshold: null, signal_thresholds: {} }
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(key, ctx?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

// Mutation: update LLM composite threshold (null = reset to platform default)
export function useUpdateLlmCompositeThreshold(agentId: string) {
  const queryClient = useQueryClient()
  const key = ['security', 'agent', agentId, 'alert-config']
  return useMutation({
    mutationFn: (threshold: number | null) =>
      securityApi.updateLlmCompositeThreshold(agentId, threshold),
    onMutate: async (llm_composite_threshold) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<securityApi.AgentAlertConfig>(key)
      queryClient.setQueryData(key, (old: securityApi.AgentAlertConfig | undefined) =>
        old ? { ...old, llm_composite_threshold }
            : { composite_threshold: 60, llm_composite_threshold, asi_composite_threshold: null, signal_thresholds: {} }
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(key, ctx?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

// Mutation: update ASI composite threshold (null = reset to platform default)
export function useUpdateAsiCompositeThreshold(agentId: string) {
  const queryClient = useQueryClient()
  const key = ['security', 'agent', agentId, 'alert-config']
  return useMutation({
    mutationFn: (threshold: number | null) =>
      securityApi.updateAsiCompositeThreshold(agentId, threshold),
    onMutate: async (asi_composite_threshold) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<securityApi.AgentAlertConfig>(key)
      queryClient.setQueryData(key, (old: securityApi.AgentAlertConfig | undefined) =>
        old ? { ...old, asi_composite_threshold }
            : { composite_threshold: 60, llm_composite_threshold: null, asi_composite_threshold, signal_thresholds: {} }
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(key, ctx?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

// Mutation: update or reset a single signal's alert threshold
// threshold=null removes the override, falling back to platform default
export function useUpdateSignalThreshold(agentId: string) {
  const queryClient = useQueryClient()
  const key = ['security', 'agent', agentId, 'alert-config']
  return useMutation({
    mutationFn: ({ signal_id, threshold }: { signal_id: string; threshold: number | null }) =>
      securityApi.updateSignalThreshold(agentId, signal_id, threshold),
    onMutate: async ({ signal_id, threshold }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<securityApi.AgentAlertConfig>(key)
      queryClient.setQueryData(key, (old: securityApi.AgentAlertConfig | undefined) => {
        const base = old ?? { composite_threshold: 60, signal_thresholds: {} }
        if (threshold === null) {
          // Remove the key so hasOverride returns false → badge shows "platform default"
          const next = { ...base.signal_thresholds }
          delete next[signal_id]
          return { ...base, signal_thresholds: next }
        }
        return { ...base, signal_thresholds: { ...base.signal_thresholds, [signal_id]: threshold } }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(key, ctx?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

// Mutation to toggle or reconfigure a single sub-check (online flag + action)
export function useToggleSubcheckOnline(agentId: string) {
  const queryClient = useQueryClient()
  const key = ['security', 'agent', agentId, 'subcheck-config']
  return useMutation({
    mutationFn: ({
      subCheckId, online_detection, action = 'monitor',
    }: { subCheckId: string; online_detection: boolean; action?: OnlineAction }) =>
      securityApi.setSubcheckOnline(agentId, subCheckId, online_detection, action),
    onMutate: async ({ subCheckId, online_detection, action = 'monitor' }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<Record<string, { online_detection: boolean; action: OnlineAction }>>(key)
      queryClient.setQueryData(
        key,
        (old: Record<string, { online_detection: boolean; action: OnlineAction }> = {}) => ({
          ...old,
          [subCheckId]: { online_detection, action },
        }),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(key, ctx?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

// Per-session online actions (block_call / terminate_session audit rows)
export function useSessionActions(sessionId: string) {
  return useQuery({
    queryKey: ['security', 'session', sessionId, 'actions'],
    queryFn:  () => securityApi.getSessionActions(sessionId),
    staleTime: 300_000,
    enabled:  !!sessionId,
  })
}
