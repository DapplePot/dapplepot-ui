import { apiClient } from './client'
import type { AgentSummary, CreateAgentRequest } from '../types/agent'

export function getAgents(): Promise<AgentSummary[]> {
  return apiClient.get('v1/agents').json()
}

export function createAgent(body: CreateAgentRequest): Promise<AgentSummary> {
  return apiClient.post('v1/agents', { json: body }).json()
}
