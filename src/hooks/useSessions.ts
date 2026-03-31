import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { SessionListParams } from '@dapplepot/types/common'
import * as sessionsApi from '../api/sessions'

export function useSessionList(params: SessionListParams) {
  return useQuery({
    queryKey: ['sessions', params],
    queryFn: () => sessionsApi.getSessionList(params),
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  })
}

export function useSessionDetail(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionsApi.getSessionDetail(sessionId),
    staleTime: 5_000,
    refetchInterval: (query) =>
      query.state.data?.status === 'open' ? 5_000 : false,
  })
}

export function useSessionTrace(sessionId: string, sessionStatus?: string) {
  return useInfiniteQuery({
    queryKey: ['trace', sessionId],
    queryFn: ({ pageParam = 0 }) =>
      sessionsApi.getTrace(sessionId, { afterSeq: pageParam as number, limit: 100 }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: 0,
    staleTime: sessionStatus === 'finalised' ? Infinity : 5_000,
  })
}
