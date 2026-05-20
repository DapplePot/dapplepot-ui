import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAgents, createAgent, updateAgent, deleteAgent } from '../api/agents'
import type { CreateAgentRequest, UpdateAgentRequest } from '../types/agent'

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn:  getAgents,
    staleTime: 60_000,
  })
}

export function useCreateAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateAgentRequest) => createAgent(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

export function useUpdateAgent(agentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateAgentRequest) => updateAgent(agentId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

export function useDeleteAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (agentId: string) => deleteAgent(agentId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}
