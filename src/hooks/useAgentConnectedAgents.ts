import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type { AgentSummary } from '../types/agent'

function getAgentConnectedAgents(agentId: string): Promise<AgentSummary[]> {
  return apiClient.get(`v1/agents/${agentId}/connected-agents`).json()
}

function setAgentConnectedAgents(agentId: string, agentIds: string[]): Promise<AgentSummary[]> {
  return apiClient.put(`v1/agents/${agentId}/connected-agents`, { json: { agentIds } }).json()
}

export function useAgentConnectedAgents(agentId: string) {
  return useQuery({
    queryKey: ['agent-connected-agents', agentId],
    queryFn:  () => getAgentConnectedAgents(agentId),
    staleTime: 30_000,
  })
}

export function useSetAgentConnectedAgents(agentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (agentIds: string[]) => setAgentConnectedAgents(agentId, agentIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-connected-agents', agentId] })
      qc.invalidateQueries({ queryKey: ['security', 'agent', agentId, 'alert-config'] })
    },
  })
}
