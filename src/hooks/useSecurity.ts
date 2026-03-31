import { useQuery } from '@tanstack/react-query'
import * as securityApi from '../api/security'

// Tenant-level security overview — refreshes every 2 minutes
export function useSecurityOverview(windowHours = 168) {
  return useQuery({
    queryKey: ['security', 'overview', windowHours],
    queryFn:  () => securityApi.getSecurityOverview({ windowHours }),
    staleTime: 120_000,
    refetchInterval: 120_000,
  })
}

// Per-session risk score + findings — stable once written
export function useSessionSecurity(sessionId: string) {
  const score = useQuery({
    queryKey: ['security', 'session', sessionId, 'score'],
    queryFn:  () => securityApi.getSessionScore(sessionId),
    staleTime: 300_000,
    enabled:  !!sessionId,
  })
  const findings = useQuery({
    queryKey: ['security', 'session', sessionId, 'findings'],
    queryFn:  () => securityApi.getSessionFindings(sessionId),
    staleTime: 300_000,
    enabled:  !!sessionId,
  })
  return { score, findings }
}

// Remediation guidance — changes only when new findings accumulate
export function useRemediation(windowHours = 168) {
  return useQuery({
    queryKey: ['security', 'remediation', windowHours],
    queryFn:  () => securityApi.getRemediation({ windowHours }),
    staleTime: 300_000,
  })
}
