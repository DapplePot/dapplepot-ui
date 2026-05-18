import { apiClient } from './client'

export interface Tool {
  toolId:      string
  tenantId:    string
  name:        string
  description: string | null
  category:    string | null
  schema:      Record<string, unknown> | null
  createdAt:   string
  updatedAt:   string
}

export interface CreateToolRequest {
  name:        string
  description?: string | null
  category?:   string | null
  schema?:     Record<string, unknown> | null
}

export function getTools(): Promise<Tool[]> {
  return apiClient.get('v1/tools').json()
}

export function createTool(body: CreateToolRequest): Promise<Tool> {
  return apiClient.post('v1/tools', { json: body }).json()
}

export function updateToolSchema(
  toolId: string,
  schema: Record<string, unknown> | null,
): Promise<Tool> {
  return apiClient.patch(`v1/tools/${toolId}`, { json: { schema } }).json()
}
