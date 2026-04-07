import { useState } from 'react'
import type { TraceEvent } from '@dapplepot/types/session'
import { EventPayload } from './EventPayload'
import { getEventColor } from '../../utils/eventColors'
import { ChevronRight, ChevronDown } from 'lucide-react'

interface EventRowProps {
  event: TraceEvent
  baseTime: string | null
}

export function EventRow({ event, baseTime }: EventRowProps) {
  const [expanded, setExpanded] = useState(false)

  const relativeMs = baseTime
    ? new Date(event.emittedAt).getTime() - new Date(baseTime).getTime()
    : null
  const relativeLabel =
    relativeMs != null
      ? `+${relativeMs}ms`
      : '—'

  const dotColor = getEventColor(event.eventCategory)
  const hasPayload = Object.keys(event.payload ?? {}).length > 0

  return (
    <div>
      <div
        className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer"
        onClick={() => hasPayload && setExpanded((v) => !v)}
      >
        {/* Expand indicator */}
        <span className="w-4 shrink-0 text-slate-400">
          {hasPayload ? (
            expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : null}
        </span>

        {/* Relative time */}
        <span className="w-20 shrink-0 font-mono text-xs text-slate-400">{relativeLabel}</span>

        {/* Colour dot */}
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />

        {/* Event type */}
        <span className="w-48 shrink-0 font-mono text-xs text-slate-700 truncate">
          {event.eventType}
        </span>

        {/* Node name */}
        <span className="flex-1 truncate text-xs text-slate-500">
          {event.nodeName || event.llmModel || event.toolName || '—'}
        </span>

        {/* Error badge */}
        {event.errorCode && (
          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
            {event.errorCode}
          </span>
        )}
      </div>

      {expanded && hasPayload && (
        <div className="px-4 pb-3">
          <EventPayload payload={event.payload} />
        </div>
      )}
    </div>
  )
}
