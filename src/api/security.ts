import { apiClient } from './client'
import type {
  SecurityOverview, SessionRiskScore,
  SecurityFinding, RemediationCard
} from '../types/security'

export async function getSecurityOverview(
  params: { windowHours?: number }
): Promise<SecurityOverview> {
  return apiClient.get('v1/security/overview', { searchParams: params }).json()
}

export async function getSessionScore(sessionId: string): Promise<SessionRiskScore | null> {
  try {
    return await apiClient.get(`v1/security/sessions/${sessionId}/score`).json()
  } catch (e: any) {
    if (e.response?.status === 404) return null
    throw e
  }
}

export async function getSessionFindings(sessionId: string): Promise<SecurityFinding[]> {
  const data = await apiClient
    .get(`v1/security/sessions/${sessionId}/findings`)
    .json<{ findings: SecurityFinding[] }>()
  return data.findings
}

export async function getRemediation(
  params: { windowHours?: number }
): Promise<RemediationCard[]> {
  const data = await apiClient
    .get('v1/security/remediation', { searchParams: params })
    .json<{ remediation: RemediationCard[] }>()
  return data.remediation
}
