import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTools, createTool, updateToolSchema } from '../api/tools'
import type { CreateToolRequest } from '../api/tools'

export function useTools() {
  return useQuery({
    queryKey: ['tools'],
    queryFn:  getTools,
    staleTime: 60_000,
  })
}

export function useCreateTool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateToolRequest) => createTool(body),
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ['tools'] }),
  })
}

export function useUpdateToolSchema(toolId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (schema: Record<string, unknown> | null) => updateToolSchema(toolId, schema),
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ['tools'] }),
  })
}
