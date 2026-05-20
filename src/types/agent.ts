export interface AgentSummary {
  agentId:       string
  tenantId:      string
  name:          string
  description:   string | null
  latestVersion: string | null
  createdAt:     string
  updatedAt:     string
}

export interface CreateAgentRequest {
  name:           string
  description?:   string | null
  latestVersion?: string
}

export interface UpdateAgentRequest {
  description?:   string | null
  latestVersion?: string | null
}
