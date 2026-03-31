import { apiClient } from './client'

export interface SecurityOverview {
  totalScored: number
  highCriticalCount: number
  avgScore: number
  topSignal: string
  riskDistribution: {
    clean: number
    low: number
    medium: number
    high: number
    critical: number
  }
  owaspFrequency: Array<{ category: string; count: number }>
  highRiskSessions: Array<{
    sessionId: string
    agentId: string
    riskScore: number
    riskBand: string
    signals: string[]
  }>
}

export interface SessionScore {
  sessionId: string
  agentId: string
  riskScore: number
  riskBand: string
  signalCount: number
  scoredAfterMs: number
  breakdown: Array<{ signal: string; points: number }>
  owaspCategories: string[]
  findings: Array<{
    findingId: string
    title: string
    signalId: string
    owaspCategory: string
    severity: 'info' | 'warning' | 'medium' | 'critical'
    points: number
    timestamp: string
    matchedText: string
    sessionId: string
    sequenceIndex: number
  }>
}

export interface RemediationItem {
  signalId: string
  owaspId: string
  title: string
  description: string
  fix: string
  sdkSnippet?: string
  frequency: number
}

export async function getSecurityOverview(window: string): Promise<SecurityOverview> {
  return apiClient.get('v1/security/overview', { searchParams: { window } }).json()
}

export async function getSessionScore(sessionId: string): Promise<SessionScore> {
  return apiClient.get(`v1/security/sessions/${sessionId}/score`).json()
}

export async function getRemediation(): Promise<RemediationItem[]> {
  return apiClient.get('v1/security/remediation').json()
}
