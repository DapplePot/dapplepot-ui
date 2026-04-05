export interface AgentSummary {
  agentId:       string
  tenantId:      string
  name:          string
  latestVersion: string | null
  createdAt:     string
  updatedAt:     string
}

export interface CreateAgentRequest {
  name:          string
  latestVersion?: string
}
