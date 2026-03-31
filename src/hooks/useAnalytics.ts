import { useQuery } from '@tanstack/react-query'
import * as analyticsApi from '../api/analytics'

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
