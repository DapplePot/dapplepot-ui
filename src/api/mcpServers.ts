import { apiClient } from './client'

export interface McpServer {
  mcpServerId: string
  tenantId:    string
  name:        string
  url:         string
  description: string | null
  toolCount:   number
  createdAt:   string
  updatedAt:   string
}

export interface CreateMcpServerRequest {
  name:        string
  url:         string
  description?: string | null
}

export interface UpdateMcpServerRequest {
  name?:        string
  url?:         string
  description?: string | null
}

export function getMcpServers(): Promise<McpServer[]> {
  return apiClient.get('v1/mcp-servers').json()
}

export function createMcpServer(body: CreateMcpServerRequest): Promise<McpServer> {
  return apiClient.post('v1/mcp-servers', { json: body }).json()
}

export function updateMcpServer(serverId: string, body: UpdateMcpServerRequest): Promise<McpServer> {
  return apiClient.patch(`v1/mcp-servers/${serverId}`, { json: body }).json()
}

export function deleteMcpServer(serverId: string): Promise<{ ok: boolean }> {
  return apiClient.delete(`v1/mcp-servers/${serverId}`).json()
}
