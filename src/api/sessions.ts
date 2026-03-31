import type { SessionDetail, SessionSummary, TracePage, StateHistory } from '@dapplepot/types/session'
import type { Paginated, SessionListParams } from '@dapplepot/types/common'
import { apiClient } from './client'

export async function getSessionList(
  params: SessionListParams
): Promise<Paginated<SessionSummary>> {
  return apiClient.get('v1/sessions', { searchParams: params as Record<string, string | number> }).json()
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail> {
  return apiClient.get(`v1/sessions/${sessionId}`).json()
}

export async function getTrace(
  sessionId: string,
  params: { afterSeq: number; limit: number }
): Promise<TracePage> {
  return apiClient
    .get(`v1/sessions/${sessionId}/trace`, { searchParams: params as Record<string, number> })
    .json()
}

export async function getStateHistory(sessionId: string): Promise<StateHistory> {
  return apiClient.get(`v1/sessions/${sessionId}/state-history`).json()
}
