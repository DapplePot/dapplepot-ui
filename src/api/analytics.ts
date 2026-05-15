import type {
  OverviewMetrics,
  LlmUsagePoint,
  ErrorRatePoint,
  LatencyStat,
  CostPoint,
  SessionFunnel,
  AgentSessionCount,
  TrendPoint,
} from '@dapplepot/types/analytics'
import { apiClient } from './client'

export async function getOverview(params: { window: string }): Promise<OverviewMetrics> {
  return apiClient.get('v1/analytics/overview', { searchParams: params }).json()
}

export async function getLlmUsage(params: {
  window: string
  agentId?: string
}): Promise<LlmUsagePoint[]> {
  return apiClient
    .get('v1/analytics/llm-usage', { searchParams: params as Record<string, string> })
    .json()
}

export async function getErrorRates(params: {
  window: string
  groupBy?: string
  agentId?: string
}): Promise<ErrorRatePoint[]> {
  return apiClient
    .get('v1/analytics/error-rates', { searchParams: params as Record<string, string> })
    .json()
}

export async function getLatency(params: {
  window: string
  agentId?: string
}): Promise<LatencyStat[]> {
  return apiClient
    .get('v1/analytics/latency', { searchParams: params as Record<string, string> })
    .json()
}

export async function getCost(params: { window: string }): Promise<CostPoint[]> {
  return apiClient.get('v1/analytics/cost', { searchParams: params }).json()
}

export async function getSessionFunnel(params: { window: string }): Promise<SessionFunnel> {
  return apiClient.get('v1/analytics/sessions/funnel', { searchParams: params }).json()
}

export async function getAgentSessions(params: { window: string }): Promise<AgentSessionCount[]> {
  return apiClient.get('v1/analytics/agents/sessions', { searchParams: params }).json()
}

export async function getTrends(params: { window: string }): Promise<TrendPoint[]> {
  return apiClient.get('v1/analytics/trends', { searchParams: params }).json()
}
