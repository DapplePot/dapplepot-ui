export type RiskBand = 'clean' | 'low' | 'medium' | 'high' | 'critical'

export type ConfidenceTier = 'deterministic' | 'high' | 'medium' | 'low' | 'skeletal'

export type TrustTrend = 'improving' | 'stable' | 'degrading'

/** Per sub-check result within an OW signal (scorer v2+). */
export interface SubCheckStatus {
  status:         'fired' | 'clean'
  score:          number            // raw check_score (0–100)
  effectiveScore?: number           // v3: score × confidence_weight
  confidenceTier?: ConfidenceTier   // v3
  label:          string
  detail?:        string
}

/** Per OW-signal result with sub-check breakdown (scorer v2+). */
export interface OwSignalStatus {
  status:          'fired' | 'clean'
  rawScore:        number                          // max(check_score)
  effectiveScore?: number                          // v3: max(check_score × weight)
  sub_checks:      Record<string, SubCheckStatus>  // keyed by sub_check_id
  /** @deprecated use rawScore */
  score?:          number
}

export interface SessionRiskScore {
  sessionId:             string
  tenantId:              string
  agentId:               string | null
  llmScore:              number          // LLM composite score 0–100
  llmBand:               RiskBand
  asiScore:              number          // ASI composite score 0–100
  asiBand:               RiskBand
  llmSignalStatus:       Record<string, OwSignalStatus>
  asiSignalStatus:       Record<string, OwSignalStatus>
  // v3 additions
  attackChainsDetected?: string[]
  amplification?:        number       // attack-chain amplifier applied to composite
  rawLlmComposite?:      number       // LLM composite before amplification
  rawAsiComposite?:      number       // ASI composite before amplification
  confidenceBand?:       string
  trustScore?:           number
  trustTrend?:           TrustTrend
  scorerVersion:         string
  scoredAt:              string
}

export interface SecurityFinding {
  findingId:       string
  sessionId:       string
  eventId:         string
  eventType:       string
  framework:       string            // "LLM" | "ASI"
  owaspSignalId:   string            // "OW-LLM01"
  subCheckId:      string            // "PI-01a"
  checkScore:      number            // 0–100 individual sub-check weight
  checkLabel:      string
  category:        string
  severity:        'critical' | 'high' | 'medium' | 'low'
  matchedText:     string | null
  detail:          string | null
  detectionPhase:  'online' | 'post_session' | 'cross_session'
  // v3 additions
  confidenceTier?: ConfidenceTier
  confidence?:     number            // 0.0–1.0
  createdAt:       string
}

/** Entry from the signal_registry table. */
export interface SignalRegistryEntry {
  owaspSignalId:   string
  subCheckId:      string
  checkLabel:      string
  framework:       string
  signalNumber:    number
  category:        string
  detectionPhase:  'online' | 'post_session' | 'both' | 'cross_session' | 'excluded'
  checkScore:      number
  severity:        string
  confidenceTier:  ConfidenceTier
  excluded:        boolean
}

export interface AgentRiskEntry {
  agentId:       string
  sessionCount:  number
  avgLlmScore:   number
  avgAsiScore:   number
  maxLlmScore:   number
  maxAsiScore:   number
  compositeRisk: number
  trustScore?:   number
  trustTrend?:   TrustTrend
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
    asiScore:       number
    asiBand:        RiskBand
    owaspSignalIds: string[]
  }>
  topAgents: AgentRiskEntry[]
}

export interface AgentSignalBreakdown {
  owaspSignalId:    string
  framework:        string
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
  trustScore?:     number
  trustTrend?:     TrustTrend
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

export type OnlineAction = 'alert' | 'sanitize' | 'block_call' | 'terminate_session'

export interface SessionAction {
  id:               string            // finding_id UUID
  eventId:          string            // event_id that triggered this check
  triggerEventType: string | null     // event type that triggered this check (e.g. 'llm_start')
  sessionId:        string
  tenantId:         string
  agentId:          string | null
  subCheckId:       string
  owaspSignalId:    string
  checkLabel:       string
  severity:         string
  category:         string
  framework:        string
  matchedText:      string | null
  detail:           string | null
  actionTaken:      OnlineAction
  triggeredAt:      string
}
