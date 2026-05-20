import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMcpServers, createMcpServer, updateMcpServer, deleteMcpServer,
  type CreateMcpServerRequest, type UpdateMcpServerRequest,
} from '../api/mcpServers'

export function useMcpServers() {
  return useQuery({
    queryKey:  ['mcp-servers'],
    queryFn:   getMcpServers,
    staleTime: 60_000,
  })
}

export function useCreateMcpServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateMcpServerRequest) => createMcpServer(body),
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ['mcp-servers'] }),
  })
}

export function useUpdateMcpServer(serverId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateMcpServerRequest) => updateMcpServer(serverId, body),
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ['mcp-servers'] }),
  })
}

export function useDeleteMcpServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (serverId: string) => deleteMcpServer(serverId),
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ['mcp-servers'] }),
  })
}
