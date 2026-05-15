import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type { LlmModel } from '../api/llmModels'

function getAgentLlmModels(agentId: string): Promise<LlmModel[]> {
  return apiClient.get(`v1/agents/${agentId}/llm-models`).json()
}

function setAgentLlmModels(agentId: string, modelIds: string[]): Promise<LlmModel[]> {
  return apiClient.put(`v1/agents/${agentId}/llm-models`, { json: { modelIds } }).json()
}

export function useAgentLlmModels(agentId: string) {
  return useQuery({
    queryKey: ['agent-llm-models', agentId],
    queryFn:  () => getAgentLlmModels(agentId),
    staleTime: 30_000,
  })
}

export function useSetAgentLlmModels(agentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (modelIds: string[]) => setAgentLlmModels(agentId, modelIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-llm-models', agentId] })
      qc.invalidateQueries({ queryKey: ['security', 'agent', agentId, 'alert-config'] })
    },
  })
}
