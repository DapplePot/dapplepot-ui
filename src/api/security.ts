import { apiClient } from './client'
import type {
  SecurityOverview, SessionRiskScore,
  SecurityFinding, RemediationCard, AgentRiskEntry, AgentProfile,
  SignalRegistryEntry,
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

export async function getTopAgents(): Promise<AgentRiskEntry[]> {
  const data = await apiClient
    .get('v1/security/agents')
    .json<{ agents: AgentRiskEntry[] }>()
  return data.agents
}

export async function getAgentProfile(agentId: string): Promise<AgentProfile | null> {
  try {
    return await apiClient.get(`v1/security/agents/${agentId}`).json()
  } catch (e: any) {
    if (e.response?.status === 404) return null
    throw e
  }
}

export async function getSignalRegistry(): Promise<SignalRegistryEntry[]> {
  const data = await apiClient
    .get('v1/security/signals')
    .json<{ signals: SignalRegistryEntry[] }>()
  return data.signals
}

export async function getSubcheckConfig(
  agentId: string
): Promise<Record<string, { online_detection: boolean }>> {
  const data = await apiClient
    .get(`v1/security/agents/${agentId}/subcheck-config`)
    .json<{ overrides: Record<string, { online_detection: boolean }> }>()
  return data.overrides
}

export async function setSubcheckOnline(
  agentId: string,
  subCheckId: string,
  online_detection: boolean
): Promise<void> {
  await apiClient
    .put(`v1/security/agents/${agentId}/subcheck-config`, {
      json: { subCheckId, online_detection },
    })
    .json()
}
