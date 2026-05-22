import { apiClient } from './client'
import type { AgentSummary, CreateAgentRequest, UpdateAgentRequest } from '../types/agent'

export function getAgents(): Promise<AgentSummary[]> {
  return apiClient.get('v1/agents').json()
}

export function createAgent(body: CreateAgentRequest): Promise<AgentSummary> {
  return apiClient.post('v1/agents', { json: body }).json()
}

export function updateAgent(agentId: string, body: UpdateAgentRequest): Promise<AgentSummary> {
  return apiClient.patch(`v1/agents/${agentId}`, { json: body }).json()
}

export function deleteAgent(agentId: string): Promise<void> {
  return apiClient.delete(`v1/agents/${agentId}`).json()
}
