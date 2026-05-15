import { apiClient } from './client'

export interface AuditArchiveMeta {
  archiveId:    string
  tenantId:     string
  agentId:      string | null
  periodStart:  string
  periodEnd:    string
  status:       'sealing' | 'sealed' | 'failed'
  sha256:       string | null
  sessionCount: number
  eventCount:   number
  findingCount: number
  alertCount:   number
  createdAt:    string
  sealedAt:     string | null
}

export async function listArchives(agentId?: string | null): Promise<AuditArchiveMeta[]> {
  const params = new URLSearchParams()
  if (agentId) params.set('agentId', agentId)
  const url = params.size ? `v1/audit/archives?${params}` : 'v1/audit/archives'
  const res = await apiClient.get(url).json<{ data: AuditArchiveMeta[] }>()
  return res.data
}

export async function sealArchive(params: {
  year:    number
  month:   number
  agentId: string | null
}): Promise<{ archiveId: string }> {
  return apiClient.post('v1/audit/archives/seal', { json: params }).json()
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadArchive(archiveId: string, filename: string): Promise<void> {
  const blob = await apiClient.get(`v1/audit/archives/${archiveId}`).blob()
  downloadBlob(blob, filename)
}

export async function downloadLiveReport(agentId?: string | null): Promise<void> {
  const params = new URLSearchParams()
  if (agentId) params.set('agentId', agentId)
  const url  = params.size ? `v1/audit/live?${params}` : 'v1/audit/live'
  const blob = await apiClient.get(url).blob()
  const date = new Date().toISOString().slice(0, 10)
  downloadBlob(blob, `audit-live-${date}.json`)
}

export async function downloadSessionReport(sessionId: string): Promise<void> {
  const blob = await apiClient.get(`v1/audit/sessions/${sessionId}`).blob()
  downloadBlob(blob, `audit-session-${sessionId.slice(0, 8)}.json`)
}
