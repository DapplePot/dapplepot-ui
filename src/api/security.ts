import { apiClient } from './client'
import type {
  SecurityOverview, SessionRiskScore,
  SecurityFinding, RemediationCard, AgentRiskEntry, AgentProfile,
  SignalRegistryEntry, OnlineAction, SessionAction,
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

// ─── Shadow-mode evidence ────────────────────────────────────────────────
// Counts of past findings per sub-check for an agent within a rolling
// window. Powers the "fired N× last 7d" ambient stat on the Checks tab and
// the "would have blocked these sessions" evidence in the Enforce confirm
// modal. Returns empty {} if the security service is unreachable — the UI
// gracefully degrades to no badge.

export interface SubCheckFiring {
  count:             number
  distinct_sessions: number
  last_fired_at:     string | null
}

export interface SubCheckFiringsResponse {
  window_days: number
  firings:     Record<string, SubCheckFiring>
}

export async function getSubCheckFirings(
  agentId: string,
  windowDays: number = 7,
): Promise<SubCheckFiringsResponse> {
  return apiClient
    .get(`v1/security/agents/${agentId}/subcheck-firings`, {
      searchParams: { window_days: windowDays },
    })
    .json()
}

export interface SubCheckFiringSession {
  session_id:    string
  event_type:    string
  severity:      string
  matched_text:  string
  created_at:    string | null
}

export interface SubCheckFiringSessionsResponse {
  window_days:  number
  sub_check_id: string
  sessions:     SubCheckFiringSession[]
}

export async function getSubCheckFiringSessions(
  agentId: string,
  subCheckId: string,
  opts: { windowDays?: number; limit?: number } = {},
): Promise<SubCheckFiringSessionsResponse> {
  return apiClient
    .get(`v1/security/agents/${agentId}/subcheck-firings/${encodeURIComponent(subCheckId)}/sessions`, {
      searchParams: {
        window_days: opts.windowDays ?? 7,
        limit:       opts.limit ?? 25,
      },
    })
    .json()
}

export interface ObservedSignals {
  signals:   Array<{ signalId: string; count: number }>
  subchecks: Array<{ subCheckId: string; signalId: string; checkLabel: string; count: number }>
}

export async function getObservedSignals(): Promise<ObservedSignals> {
  return apiClient.get('v1/security/observed').json()
}

export async function getSignalRegistry(): Promise<SignalRegistryEntry[]> {
  const data = await apiClient
    .get('v1/security/signals')
    .json<{ signals: SignalRegistryEntry[] }>()
  return data.signals
}

export interface SubcheckOverride {
  online_detection: boolean
  action:           OnlineAction
}

export async function getSubcheckConfig(
  agentId: string
): Promise<Record<string, SubcheckOverride>> {
  const data = await apiClient
    .get(`v1/security/agents/${agentId}/subcheck-config`)
    .json<{ overrides: Record<string, SubcheckOverride> }>()
  return data.overrides
}

export async function setSubcheckOnline(
  agentId: string,
  subCheckId: string,
  online_detection: boolean,
  action: OnlineAction = 'alert',
): Promise<void> {
  await apiClient
    .put(`v1/security/agents/${agentId}/subcheck-config`, {
      json: { subCheckId, online_detection, action },
    })
    .json()
}

export async function getSessionActions(sessionId: string): Promise<SessionAction[]> {
  const data = await apiClient
    .get(`v1/security/sessions/${sessionId}/actions`)
    .json<{ actions: SessionAction[] }>()
  return data.actions
}

export interface AgentAlertConfig {
  composite_threshold:         number
  llm_composite_threshold:     number | null  // null = platform default (60)
  asi_composite_threshold:     number | null  // null = platform default (60)
  signal_thresholds:           Record<string, number>
  tool_manifest:               string[]        // [] = not configured
  privilege_scope:             string[]        // subset of tool_manifest authorized for privilege ops
  tool_approval_policy:        Record<string, 'always_allow' | 'needs_approval'> | null  // null = heuristic
  max_tool_calls_per_session:  number | null   // null = not configured
  // Agent profile fields — null = auto (heuristic); non-null = manual (declared)
  system_prompt:               string | null
  environment:                 'production' | 'staging' | null
  irreversible_tools:          string[] | null
  network_allowlist:           string[] | null
  working_directory:           string | null
  write_namespace:             string | null
  operating_hours:             { days: string[]; from: string; to: string } | null
  sbom_allowlist:              string[] | null
  mcp_endpoints:               string[] | null
  connected_llms:              string[] | null  // null = no models declared (EA-04a blind)
  connected_agents:            string[] | null  // null = no agents declared (IAC-05a blind)
  token_budget_usd:            number | null    // null = no budget cap (UBC-02b blind)
}

export type AgentProfilePatch = Partial<Pick<AgentAlertConfig,
  | 'system_prompt' | 'environment' | 'irreversible_tools' | 'network_allowlist'
  | 'working_directory' | 'write_namespace' | 'operating_hours' | 'sbom_allowlist'
  | 'mcp_endpoints' | 'token_budget_usd'
>>

export const PLATFORM_COMPOSITE_DEFAULT = 60

export async function getAlertConfig(agentId: string): Promise<AgentAlertConfig> {
  return apiClient.get(`v1/security/agents/${agentId}/alert-config`).json()
}

export async function updateCompositeThreshold(
  agentId: string,
  composite_threshold: number
): Promise<void> {
  await apiClient
    .put(`v1/security/agents/${agentId}/alert-config`, {
      json: { composite_threshold },
    })
    .json()
}

export async function updateLlmCompositeThreshold(
  agentId: string,
  threshold: number | null  // null = reset to platform default
): Promise<void> {
  await apiClient
    .put(`v1/security/agents/${agentId}/alert-config`, {
      json: { llm_composite_threshold: threshold },
    })
    .json()
}

export async function updateAsiCompositeThreshold(
  agentId: string,
  threshold: number | null  // null = reset to platform default
): Promise<void> {
  await apiClient
    .put(`v1/security/agents/${agentId}/alert-config`, {
      json: { asi_composite_threshold: threshold },
    })
    .json()
}

export async function updateSignalThreshold(
  agentId: string,
  signal_id: string,
  threshold: number | null  // null = reset to platform default
): Promise<void> {
  await apiClient
    .put(`v1/security/agents/${agentId}/alert-config`, {
      json: { signal_id, threshold },
    })
    .json()
}

export async function updateToolManifest(
  agentId: string,
  tool_manifest: string[]
): Promise<void> {
  await apiClient
    .put(`v1/security/agents/${agentId}/alert-config`, {
      json: { tool_manifest },
    })
    .json()
}

export async function updatePrivilegeScope(
  agentId: string,
  privilege_scope: string[]
): Promise<void> {
  await apiClient
    .put(`v1/security/agents/${agentId}/alert-config`, {
      json: { privilege_scope },
    })
    .json()
}

// Sends tool_manifest + privilege_scope + tool_approval_policy in one request
// to avoid race conditions when multiple fields change together.
export async function updateToolScope(
  agentId: string,
  tool_manifest: string[],
  privilege_scope: string[],
  tool_approval_policy: Record<string, 'always_allow' | 'needs_approval'> | null,
): Promise<void> {
  await apiClient
    .put(`v1/security/agents/${agentId}/alert-config`, {
      json: { tool_manifest, privilege_scope, tool_approval_policy },
    })
    .json()
}

export interface ToolCallBaseline {
  sessionCount: number
  mean:         number | null
  stddev:       number | null
  p90:          number | null  // 90th-percentile over last 7 days
}

export async function getToolCallBaseline(agentId: string): Promise<ToolCallBaseline> {
  return apiClient.get(`v1/security/agents/${agentId}/tool-call-baseline`).json()
}

export async function updateMaxToolCalls(
  agentId: string,
  max_tool_calls_per_session: number | null  // null = remove override
): Promise<void> {
  await apiClient
    .put(`v1/security/agents/${agentId}/alert-config`, {
      json: { max_tool_calls_per_session },
    })
    .json()
}

export async function updateAgentProfile(
  agentId: string,
  patch: AgentProfilePatch,
): Promise<void> {
  await apiClient
    .put(`v1/security/agents/${agentId}/alert-config`, { json: patch })
    .json()
}
