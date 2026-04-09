export type RiskBand = 'clean' | 'low' | 'medium' | 'high' | 'critical'

/** Per sub-check result within an OW signal (scorer v2+). */
export interface SubCheckStatus {
  status:  'fired' | 'clean'
  score:   number
  label:   string
  detail?: string
}

/** Per OW-signal result with sub-check breakdown (scorer v2+). */
export interface OwSignalStatus {
  status:     'fired' | 'clean'
  score:      number              // max(sub-check scores)
  sub_checks: Record<string, SubCheckStatus>
}

export interface SessionRiskScore {
  sessionId:        string
  tenantId:         string
  agentId:          string | null
  llmScore:         number          // LLM composite score 0–100
  llmBand:          RiskBand
  asiScore:         number          // ASI composite score 0–100
  asiBand:          RiskBand
  llmSignalStatus:  Record<string, OwSignalStatus> // keyed by "OW-LLM01"
  asiSignalStatus:  Record<string, OwSignalStatus> // keyed by "OW-ASI05"
  scorerVersion:    string
  scoredAt:         string          // ISO 8601
}

export interface SecurityFinding {
  findingId:      string
  sessionId:      string
  eventId:        string
  eventType:      string
  framework:      string            // "LLM" | "ASI"
  owaspSignalId:  string            // "OW-LLM01"
  subCheckId:     string            // "PI-01a"
  checkScore:     number            // 0–100 individual sub-check weight
  checkLabel:     string            // "Role-override phrase match"
  category:       string            // "prompt_injection" | "data_disclosure" | etc.
  severity:       'critical' | 'high' | 'medium' | 'low'
  matchedText:    string | null     // always redacted before storage
  detail:         string | null
  detectionPhase: 'online' | 'post_session'
  createdAt:      string
}

/** Entry from the signal_registry table. */
export interface SignalRegistryEntry {
  owaspSignalId:   string         // "OW-LLM01"
  subCheckId:      string         // "PI-01a"
  checkLabel:      string
  framework:       string         // "LLM" | "ASI"
  signalNumber:    number         // 1–20
  category:        string
  detectionPhase:  'online' | 'post_session' | 'both'
  checkScore:      number
  severity:        string
}

export interface AgentRiskEntry {
  agentId:       string
  sessionCount:  number
  avgLlmScore:   number
  avgAsiScore:   number
  maxLlmScore:   number
  maxAsiScore:   number
  compositeRisk: number
  lastScoredAt:  string
}

export interface SecurityOverview {
  window:            string
  sessionsScored:    number
  highCriticalCount: number
  avgLlmScore:       number
  topSignalId:       string | null
  topSignalCount:    number
  bandDistribution:  Record<RiskBand, number>
  owaspFrequency:    Array<{ signalId: string; count: number }>
  asiFrequency:      Array<{ signalId: string; count: number }>
  highRiskSessions:  Array<{
    sessionId:      string
    agentId:        string
    llmScore:       number
    llmBand:        RiskBand
    owaspSignalIds: string[]
  }>
  topAgents: AgentRiskEntry[]
}

export interface AgentSignalBreakdown {
  owaspSignalId:    string           // "OW-LLM01" … "OW-ASI10"
  framework:        string           // "LLM" | "ASI"
  firedCount:       number
  sessionsAffected: number
  lastSeenAt:       string | null
}

export interface AgentRecentSession {
  sessionId: string
  llmScore:  number
  llmBand:   RiskBand
  asiScore:  number
  asiBand:   RiskBand
  scoredAt:  string
}

export interface AgentProfile {
  agentId:         string
  name:            string | null
  latestVersion:   string | null
  createdAt:       string | null
  sessionCount:    number
  avgLlmScore:     number
  avgAsiScore:     number
  maxLlmScore:     number
  maxAsiScore:     number
  compositeRisk:   number
  lastScoredAt:    string | null
  signalBreakdown: AgentSignalBreakdown[]
  recentSessions:  AgentRecentSession[]
}

export interface RemediationCard {
  owaspSignalId: string
  title:         string
  description:   string
  fixSteps:      string[]
  sdkSnippet:    string | null
  frequency:     number
}
