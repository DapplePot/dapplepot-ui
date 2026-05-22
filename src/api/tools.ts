import { apiClient } from './client'

export interface Tool {
  toolId:        string
  tenantId:      string
  name:          string
  description:   string | null
  category:      string | null
  schema:        Record<string, unknown> | null
  version:       string | null
  mcpServerId:   string | null
  mcpServerName: string | null
  mcpServerUrl:  string | null
  createdAt:     string
  updatedAt:     string
}

export interface CreateToolRequest {
  name:        string
  description?: string | null
  category?:   string | null
  schema?:     Record<string, unknown> | null
  version?:    string | null
}

export function getTools(): Promise<Tool[]> {
  return apiClient.get('v1/tools').json()
}

export function createTool(body: CreateToolRequest): Promise<Tool> {
  return apiClient.post('v1/tools', { json: body }).json()
}

export interface UpdateToolRequest {
  description?:  string | null
  schema?:       Record<string, unknown> | null
  version?:      string | null
  mcpServerId?:  string | null
}

export function updateTool(toolId: string, body: UpdateToolRequest): Promise<Tool> {
  return apiClient.patch(`v1/tools/${toolId}`, { json: body }).json()
}

export function deleteTool(toolId: string): Promise<{ ok: boolean }> {
  return apiClient.delete(`v1/tools/${toolId}`).json()
}

export function updateToolSchema(
  toolId: string,
  schema: Record<string, unknown> | null,
): Promise<Tool> {
  return updateTool(toolId, { schema })
}
