import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLlmModels, createLlmModel } from '../api/llmModels'
import type { CreateLlmModelRequest } from '../api/llmModels'

export function useLlmModels() {
  return useQuery({
    queryKey: ['llm-models'],
    queryFn:  getLlmModels,
    staleTime: 60_000,
  })
}

export function useCreateLlmModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateLlmModelRequest) => createLlmModel(body),
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ['llm-models'] }),
  })
}
