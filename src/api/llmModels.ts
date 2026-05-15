import { apiClient } from './client'

export interface LlmModel {
  modelId:             string
  tenantId:            string
  name:                string
  provider:            string | null
  contextWindowTokens: number | null
  inputCostPer1k:      number | null
  outputCostPer1k:     number | null
  createdAt:           string
  updatedAt:           string
}

export interface CreateLlmModelRequest {
  name:                string
  provider?:           string | null
  contextWindowTokens?: number | null
  inputCostPer1k?:     number | null
  outputCostPer1k?:    number | null
}

export function getLlmModels(): Promise<LlmModel[]> {
  return apiClient.get('v1/llm-models').json()
}

export function createLlmModel(body: CreateLlmModelRequest): Promise<LlmModel> {
  return apiClient.post('v1/llm-models', { json: body }).json()
}
