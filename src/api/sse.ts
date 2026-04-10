import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { SessionSummary } from '@dapplepot/types/session'
import { API_BASE } from './client'
import { useAuthStore } from '../stores/auth'
import { getSessionList } from './sessions'

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
          // Handle both named 'sessions' events and default 'message' events
          if (event.event === 'sessions' || event.event === 'message' || !event.event) {
            if (!event.data) return
            try {
              const sessions = JSON.parse(event.data) as SessionSummary[]
              if (Array.isArray(sessions)) {
                queryClient.setQueryData(['sessions', 'live'], sessions)
              }
            } catch {
              // ignore malformed frames
            }
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
    // Seed with open sessions from REST so the feed isn't empty before first SSE push
    queryFn: () =>
      getSessionList({ status: 'open', limit: 50, page: 1 }).then((r) => r.data),
    staleTime: Infinity, // SSE owns updates after initial load
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
