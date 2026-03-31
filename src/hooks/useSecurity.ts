import { useQuery } from '@tanstack/react-query'
import * as securityApi from '../api/security'

export function useSecurityOverview(window: string) {
  return useQuery({
    queryKey: ['security', 'overview', window],
    queryFn: () => securityApi.getSecurityOverview(window),
    staleTime: 60_000,
  })
}

export function useSessionScore(sessionId: string) {
  return useQuery({
    queryKey: ['security', 'session', sessionId],
    queryFn: () => securityApi.getSessionScore(sessionId),
    staleTime: Infinity,
    enabled: !!sessionId,
  })
}

export function useRemediation() {
  return useQuery({
    queryKey: ['security', 'remediation'],
    queryFn: () => securityApi.getRemediation(),
    staleTime: 300_000,
  })
}
