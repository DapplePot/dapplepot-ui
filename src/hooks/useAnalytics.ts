import { useQuery } from '@tanstack/react-query'
import * as analyticsApi from '../api/analytics'
import * as securityApi from '../api/security'
import * as alertsApi from '../api/alerts'

function windowToHours(w: string): number {
  if (w === '7d') return 168
  if (w === '30d') return 720
  return 24
}

export function useOverview(window: string) {
  return useQuery({
    queryKey: ['analytics', 'overview', window],
    queryFn: () => analyticsApi.getOverview({ window }),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

export function useLlmUsage(window: string, agentId?: string) {
  return useQuery({
    queryKey: ['analytics', 'llm-usage', window, agentId],
    queryFn: () => analyticsApi.getLlmUsage({ window, agentId }),
    staleTime: 60_000,
  })
}

export function useErrorRates(window: string, agentId?: string) {
  return useQuery({
    queryKey: ['analytics', 'error-rates', window, agentId],
    queryFn: () => analyticsApi.getErrorRates({ window, groupBy: 'agent', agentId }),
    staleTime: 60_000,
  })
}

export function useLatency(window: string, agentId?: string) {
  return useQuery({
    queryKey: ['analytics', 'latency', window, agentId],
    queryFn: () => analyticsApi.getLatency({ window, agentId }),
    staleTime: 60_000,
  })
}

export function useCost(window: string) {
  return useQuery({
    queryKey: ['analytics', 'cost', window],
    queryFn: () => analyticsApi.getCost({ window }),
    staleTime: 300_000,
  })
}

export function useTrends(window: string) {
  return useQuery({
    queryKey: ['analytics', 'trends', window],
    queryFn:  () => analyticsApi.getTrends({ window }),
    staleTime: 60_000,
  })
}

export function useAgentSessions(window: string) {
  return useQuery({
    queryKey: ['analytics', 'agent-sessions', window],
    queryFn:  () => analyticsApi.getAgentSessions({ window }),
    staleTime: 60_000,
  })
}

export function useSessionFunnel(window: string) {
  return useQuery({
    queryKey: ['analytics', 'session-funnel', window],
    queryFn: () => analyticsApi.getSessionFunnel({ window }),
    staleTime: 60_000,
  })
}

export function useSecurityAnalytics(window: string) {
  return useQuery({
    queryKey: ['analytics', 'security-overview', window],
    queryFn: () => securityApi.getSecurityOverview({ windowHours: windowToHours(window) }),
    staleTime: 60_000,
  })
}

export function useAlertStats(window: string) {
  return useQuery({
    queryKey: ['analytics', 'alert-stats', window],
    queryFn: () => alertsApi.getAlertStats({ window }),
    staleTime: 60_000,
  })
}
