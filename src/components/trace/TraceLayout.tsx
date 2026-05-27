import type { SessionDetail, TraceEvent } from '@dapplepot/types/session'
import type { AlertSummary } from '@dapplepot/types/alert'
import { TraceHeader } from './TraceHeader'
import { MetricStrip } from './MetricStrip'
import { EventTimeline } from './EventTimeline'
import { RightPanel } from './RightPanel'

interface TraceLayoutProps {
  session: SessionDetail
  events: TraceEvent[]
  alerts: AlertSummary[]
  hasMore: boolean
  isFetchingMore: boolean
  onLoadMore: () => void
}

export function TraceLayout({
  session,
  events,
  alerts,
  hasMore,
  isFetchingMore,
  onLoadMore,
}: TraceLayoutProps) {
  const baseTime = session.executionSummary.firstEventAt ?? session.startedAt
  const securityCount = events.filter(e => e.eventType === 'security_finding').length

  return (
    <div className="flex h-full flex-col gap-3">
      <TraceHeader session={session} alertCount={alerts.length} />
      <MetricStrip session={session} events={events} />

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex w-3/5 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <RightPanel session={session} alerts={alerts} />
        </div>

        <div className="flex w-2/5 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-slate-100 px-4 py-2.5 dark:border-zinc-800">
            <h2 className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              Event timeline
              <span className="ml-2 text-xs font-normal text-slate-400 dark:text-zinc-500">
                {events.length} events
                {securityCount > 0 && (
                  <span className="ml-1 text-red-400 dark:text-red-500">· {securityCount} security</span>
                )}
              </span>
            </h2>
          </div>
          <EventTimeline
            events={events}
            baseTime={baseTime}
            hasMore={hasMore}
            isFetchingMore={isFetchingMore}
            onLoadMore={onLoadMore}
          />
        </div>
      </div>
    </div>
  )
}
