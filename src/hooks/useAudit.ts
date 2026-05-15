import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as auditApi from '../api/audit'

export function useAuditArchives(agentId?: string | null) {
  return useQuery({
    queryKey: ['audit-archives', agentId ?? null],
    queryFn:  () => auditApi.listArchives(agentId),
    staleTime: 30_000,
  })
}

export function useSealArchive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: auditApi.sealArchive,
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ['audit-archives'] }),
  })
}

export function useDownloadArchive() {
  return useMutation({
    mutationFn: ({ archiveId, filename }: { archiveId: string; filename: string }) =>
      auditApi.downloadArchive(archiveId, filename),
  })
}

export function useDownloadLiveReport() {
  return useMutation({
    mutationFn: ({ agentId }: { agentId?: string | null }) =>
      auditApi.downloadLiveReport(agentId),
  })
}

export function useDownloadSessionReport() {
  return useMutation({
    mutationFn: ({ sessionId }: { sessionId: string }) =>
      auditApi.downloadSessionReport(sessionId),
  })
}
