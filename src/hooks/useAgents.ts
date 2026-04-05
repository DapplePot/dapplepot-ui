import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAgents, createAgent } from '../api/agents'
import type { CreateAgentRequest } from '../types/agent'

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
