import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { SessionSummary } from '@dapplepot/types/session'
import { API_BASE } from './client'
import { useAuthStore } from '../stores/auth'

/** SSE hook: connects to /v1/sessions/live, writes updates directly into React Query cache */
export function useLiveSessions() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const controller = new AbortController()

    const connect = async () => {
      const token = useAuthStore.getState().accessToken
      await fetchEventSource(`${API_BASE}/v1/sessions/live`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
        onmessage(event) {
          if (event.event === 'sessions') {
            const sessions = JSON.parse(event.data) as SessionSummary[]
            queryClient.setQueryData(['sessions', 'live'], sessions)
          }
        },
        onerror() {
          // fetchEventSource retries automatically on error
        },
      })
    }

    void connect()
    return () => controller.abort()
  }, [queryClient])

  return useQuery({
    queryKey: ['sessions', 'live'],
    queryFn: () => [] as SessionSummary[],
    staleTime: Infinity, // SSE pushes updates directly
  })
}

/** SSE hook: listens for kill/interrupt commands on a specific session */
export function useControlChannel(sessionId: string) {
  useEffect(() => {
    const controller = new AbortController()

    const connect = async () => {
      const token = useAuthStore.getState().accessToken
      await fetchEventSource(
        `${API_BASE}/v1/control/channel?session_id=${encodeURIComponent(sessionId)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
          onmessage() {
            // Command events handled by caller if needed
          },
          onerror() {
            // auto-retry
          },
        }
      )
    }

    void connect()
    return () => controller.abort()
  }, [sessionId])
}
