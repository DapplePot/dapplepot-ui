import { useRef, useEffect, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { TraceEvent } from '@dapplepot/types/session'
import { useTraceFilters } from '../../stores/traceFilters'
import { useHighlightedEvent } from '../../stores/highlightedEvent'
import { EventRow } from './EventRow'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { cn } from '../../utils/cn'

type EventCategory = 'all' | 'graph' | 'node' | 'llm' | 'tool' | 'state' | 'security'

const CATEGORY_PILLS: { key: EventCategory; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'graph',    label: 'Graph' },
  { key: 'node',     label: 'Nodes' },
  { key: 'llm',      label: 'LLM' },
  { key: 'tool',     label: 'Tools' },
  { key: 'state',    label: 'State' },
  { key: 'security', label: 'Security' },
]

interface EventTimelineProps {
  events: TraceEvent[]
  baseTime: string | null
  hasMore: boolean
  isFetchingMore: boolean
  onLoadMore: () => void
}

export function EventTimeline({
  events,
  baseTime,
  hasMore,
  isFetchingMore,
  onLoadMore,
}: EventTimelineProps) {
  const { activeCategory, setActiveCategory } = useTraceFilters()
  const primaryEventId    = useHighlightedEvent(s => s.primaryEventId)
  const highlightedIds    = useHighlightedEvent(s => s.eventIds)

  useEffect(() => {
    setActiveCategory('all')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const allEvents = useMemo(() => events, [events])

  const filtered =
    activeCategory === 'all'
      ? allEvents
      : allEvents.filter((e) =>
          e.eventCategory === activeCategory ||
          e.eventCategory.startsWith(`${activeCategory}_`) ||
          e.eventType.startsWith(`${activeCategory}_`)
        )

  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
    measureElement: (el) => el.getBoundingClientRect().height,
    paddingEnd: 16,
  })

  // When a finding is expanded, scroll the timeline to the primary event of
  // that finding. If any highlighted event is present in the full list but
  // filtered out under the current category, drop the filter to 'all' so
  // every contributing event becomes visible.
  useEffect(() => {
    if (!primaryEventId) return
    const primaryIdx = filtered.findIndex(e => e.eventId === primaryEventId)
    if (primaryIdx < 0) {
      if (allEvents.some(e => e.eventId === primaryEventId)) {
        setActiveCategory('all')
      }
      return
    }
    // If any additional highlighted events are hidden by the filter, still
    // reset to 'all' so the user sees the whole set — but do it in one shot
    // (no double-scroll).
    const anyHidden = highlightedIds.some(
      id => id !== primaryEventId
         && !filtered.some(e => e.eventId === id)
         && allEvents.some(e => e.eventId === id)
    )
    if (anyHidden) {
      setActiveCategory('all')
      return
    }
    rowVirtualizer.scrollToIndex(primaryIdx, { align: 'center', behavior: 'smooth' })
  }, [primaryEventId, highlightedIds, filtered, allEvents, rowVirtualizer, setActiveCategory])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex gap-1 border-b border-slate-100 px-4 py-2 shrink-0 dark:border-zinc-800">
        {CATEGORY_PILLS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              activeCategory === key
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                : 'text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div ref={parentRef} className="flex-1 overflow-y-auto">
        <div
          style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const event = filtered[virtualItem.index]
            return (
              <div
                key={event.eventId}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <EventRow event={event} baseTime={baseTime} />
              </div>
            )
          })}
        </div>

        {hasMore && (
          <div className="px-4 py-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              disabled={isFetchingMore}
            >
              {isFetchingMore ? 'Loading…' : 'Load more events'}
            </Button>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex h-32 items-center justify-center text-sm text-slate-400 dark:text-zinc-500">
            No events in this category
          </div>
        )}
      </div>
    </div>
  )
}

export function EventTimelineSkeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 flex-1" />
        </div>
      ))}
    </div>
  )
}
