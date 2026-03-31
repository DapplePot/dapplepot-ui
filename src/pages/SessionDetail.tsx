import { useParams } from '@tanstack/react-router'
import { useSessionDetail, useSessionTrace } from '../hooks/useSessions'
import { useSessionAlerts } from '../hooks/useAlerts'
import { TraceLayout } from '../components/trace/TraceLayout'
import { MetricStripSkeleton } from '../components/trace/MetricStrip'
import { EventTimelineSkeleton } from '../components/trace/EventTimeline'
import { Skeleton } from '../components/ui/skeleton'

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
      {message}
    </div>
  )
}

export function SessionDetail() {
  const { id } = useParams({ from: '/sessions/$id' })

  const { data: session, isLoading: sessionLoading, isError: sessionError, error: sessionErr } =
    useSessionDetail(id)

  const { data: tracePages, isLoading: traceLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSessionTrace(id, session?.status)

  const { data: alerts } = useSessionAlerts(id)

  if (sessionLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-lg" />
        <MetricStripSkeleton />
        <EventTimelineSkeleton />
      </div>
    )
  }

  if (sessionError) {
    return <ErrorCard message={(sessionErr as Error).message} />
  }

  if (!session) return null

  const events = tracePages?.pages.flatMap((p) => p.events) ?? []

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14)-theme(spacing.6)*2)] flex-col">
      {traceLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <MetricStripSkeleton />
          <EventTimelineSkeleton />
        </div>
      ) : (
        <TraceLayout
          session={session}
          events={events}
          alerts={alerts ?? []}
          hasMore={hasNextPage ?? false}
          isFetchingMore={isFetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
        />
      )}
    </div>
  )
}
