import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AlertListParams } from '@dapplepot/types/common'
import * as alertsApi from '../api/alerts'
import { useOnboardingComplete } from './usePlan'

export function useAlerts(params: AlertListParams) {
  const onboardingComplete = useOnboardingComplete()
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => alertsApi.getAlerts(params),
    enabled: onboardingComplete,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useAlertDetail(alertId: string) {
  return useQuery({
    queryKey: ['alert', alertId],
    queryFn: () => alertsApi.getAlertDetail(alertId),
    staleTime: 30_000,
  })
}

export function useAlertStats(window: string) {
  return useQuery({
    queryKey: ['alerts', 'stats', window],
    queryFn: () => alertsApi.getAlertStats({ window }),
    staleTime: 60_000,
  })
}

export function useSessionAlerts(sessionId: string) {
  return useQuery({
    queryKey: ['session-alerts', sessionId],
    queryFn: () => alertsApi.getSessionAlerts(sessionId),
    staleTime: 30_000,
  })
}

export function useUpdateAlertStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      alertId,
      status,
    }: {
      alertId: string
      status: 'acknowledged' | 'resolved'
    }) => alertsApi.updateAlertStatus(alertId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alerts'] })
      void queryClient.invalidateQueries({ queryKey: ['session-alerts'] })
    },
  })
}
