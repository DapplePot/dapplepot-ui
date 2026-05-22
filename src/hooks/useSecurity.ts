import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as securityApi from '../api/security'
import type { OnlineAction } from '../types/security'

// Empty config shape used as optimistic default when no prior data exists
const _emptyAlertConfig = (): securityApi.AgentAlertConfig => ({
  composite_threshold: 60,
  llm_composite_threshold: null,
  asi_composite_threshold: null,
  signal_thresholds: {},
  tool_manifest: [],
  privilege_scope: [],
  max_tool_calls_per_session: null,
  system_prompt: null,
  environment: null,
  irreversible_tools: null,
  network_allowlist: null,
  working_directory: null,
  write_namespace: null,
  operating_hours: null,
  sbom_allowlist: null,
  mcp_endpoints: null,
  connected_llms: null,
  connected_agents: null,
})

// Tenant-level security overview — refreshes every 2 minutes
export function useSecurityOverview(windowHours = 168) {
  return useQuery({
    queryKey: ['security', 'overview', windowHours],
    queryFn:  () => securityApi.getSecurityOverview({ windowHours }),
    staleTime: 120_000,
    refetchInterval: 120_000,
  })
}

// Per-session risk score + findings — refetch every 30s so trust score
// and signal data appear promptly after the post-session scorer finishes.
export function useSessionSecurity(sessionId: string) {
  const score = useQuery({
    queryKey: ['security', 'session', sessionId, 'score'],
    queryFn:  () => securityApi.getSessionScore(sessionId),
    staleTime: 30_000,
    refetchInterval: 30_000,
    enabled:  !!sessionId,
  })
  const findings = useQuery({
    queryKey: ['security', 'session', sessionId, 'findings'],
    queryFn:  () => securityApi.getSessionFindings(sessionId),
    staleTime: 30_000,
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

// Full security profile for a single agent — refetch every 30s so trust
// score appears promptly after the first session is scored.
export function useAgentProfile(agentId: string) {
  return useQuery({
    queryKey: ['security', 'agent', agentId],
    queryFn:  () => securityApi.getAgentProfile(agentId),
    staleTime: 30_000,
    refetchInterval: 30_000,
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
      subCheckId, online_detection, action = 'alert',
    }: { subCheckId: string; online_detection: boolean; action?: OnlineAction }) =>
      securityApi.setSubcheckOnline(agentId, subCheckId, online_detection, action),
    onMutate: async ({ subCheckId, online_detection, action = 'alert' }) => {
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

// Mutation: update privilege scope (subset of manifest authorized for privilege ops)
export function useUpdatePrivilegeScope(agentId: string) {
  const queryClient = useQueryClient()
  const key = ['security', 'agent', agentId, 'alert-config']
  return useMutation({
    mutationFn: (privilege_scope: string[]) =>
      securityApi.updatePrivilegeScope(agentId, privilege_scope),
    onMutate: async (privilege_scope) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<securityApi.AgentAlertConfig>(key)
      queryClient.setQueryData(key, (old: securityApi.AgentAlertConfig | undefined) =>
        old ? { ...old, privilege_scope } : { ..._emptyAlertConfig(), privilege_scope }
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

// Mutation: update tool_manifest + privilege_scope atomically in one request.
// Use this whenever both change together (add-with-privilege, remove-tool) to
// prevent the race where mutation-1's onSettled refetch overwrites mutation-2's
// optimistic update before it reaches the server.
export function useUpdateToolScope(agentId: string) {
  const queryClient = useQueryClient()
  const key = ['security', 'agent', agentId, 'alert-config']
  return useMutation({
    mutationFn: ({ tool_manifest, privilege_scope }: { tool_manifest: string[]; privilege_scope: string[] }) =>
      securityApi.updateToolScope(agentId, tool_manifest, privilege_scope),
    onMutate: async ({ tool_manifest, privilege_scope }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<securityApi.AgentAlertConfig>(key)
      queryClient.setQueryData(key, (old: securityApi.AgentAlertConfig | undefined) =>
        old ? { ...old, tool_manifest, privilege_scope }
            : { ..._emptyAlertConfig(), tool_manifest, privilege_scope }
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

// Mutation: update tool manifest (list of allowed tool names for this agent)
export function useUpdateToolManifest(agentId: string) {
  const queryClient = useQueryClient()
  const key = ['security', 'agent', agentId, 'alert-config']
  return useMutation({
    mutationFn: (tool_manifest: string[]) =>
      securityApi.updateToolManifest(agentId, tool_manifest),
    onMutate: async (tool_manifest) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<securityApi.AgentAlertConfig>(key)
      queryClient.setQueryData(key, (old: securityApi.AgentAlertConfig | undefined) =>
        old ? { ...old, tool_manifest } : { ..._emptyAlertConfig(), tool_manifest }
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

// Mutation: update max tool calls per session (null = remove override)
export function useUpdateMaxToolCalls(agentId: string) {
  const queryClient = useQueryClient()
  const key = ['security', 'agent', agentId, 'alert-config']
  return useMutation({
    mutationFn: (max_tool_calls_per_session: number | null) =>
      securityApi.updateMaxToolCalls(agentId, max_tool_calls_per_session),
    onMutate: async (max_tool_calls_per_session) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<securityApi.AgentAlertConfig>(key)
      queryClient.setQueryData(key, (old: securityApi.AgentAlertConfig | undefined) =>
        old ? { ...old, max_tool_calls_per_session }
            : { ..._emptyAlertConfig(), max_tool_calls_per_session }
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

// Mutation: update agent profile fields (system_prompt, environment, irreversible_tools, …)
// Accepts a partial patch — only the keys present are sent to the API.
// null = revert to auto (heuristic); non-null = manual (declared).
export function useUpdateAgentProfile(agentId: string) {
  const queryClient = useQueryClient()
  const key = ['security', 'agent', agentId, 'alert-config']
  return useMutation({
    mutationFn: (patch: securityApi.AgentProfilePatch) =>
      securityApi.updateAgentProfile(agentId, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<securityApi.AgentAlertConfig>(key)
      queryClient.setQueryData(key, (old: securityApi.AgentAlertConfig | undefined) =>
        old ? { ...old, ...patch } : { ..._emptyAlertConfig(), ...patch }
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

// 7-day tool-call baseline stats for EA-02b display
export function useToolCallBaseline(agentId: string) {
  return useQuery({
    queryKey: ['security', 'agent', agentId, 'tool-call-baseline'],
    queryFn:  () => securityApi.getToolCallBaseline(agentId),
    staleTime: 300_000,   // 5 min — changes only as new sessions are scored
    enabled:  !!agentId,
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
