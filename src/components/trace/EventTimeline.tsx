import { useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { TraceEvent } from '@dapplepot/types/session'
import { useTraceFilters } from '../../stores/traceFilters'
import { EventRow } from './EventRow'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { cn } from '../../utils/cn'

type EventCategory = 'all' | 'graph' | 'node' | 'llm' | 'tool' | 'state'

const CATEGORY_PILLS: { key: EventCategory; label: string }[] = [
  { key: 'all',   label: 'All' },
  { key: 'graph', label: 'Graph' },
  { key: 'node',  label: 'Nodes' },
  { key: 'llm',   label: 'LLM' },
  { key: 'tool',  label: 'Tools' },
  { key: 'state', label: 'State' },
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

  // Reset filter when navigating to a different session trace
  useEffect(() => {
    setActiveCategory('all')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered =
    activeCategory === 'all'
      ? events
      : events.filter((e) =>
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

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Category pills */}
      <div className="flex gap-1 border-b border-slate-100 px-4 py-2 shrink-0">
        {CATEGORY_PILLS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              activeCategory === key
                ? 'bg-violet-100 text-violet-700'
                : 'text-slate-500 hover:bg-slate-100'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Virtualised event list */}
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

        {/* Load more */}
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
          <div className="flex h-32 items-center justify-center text-sm text-slate-400">
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
