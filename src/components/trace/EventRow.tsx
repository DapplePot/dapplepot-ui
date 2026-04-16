import { useState } from 'react'
import type { TraceEvent } from '@dapplepot/types/session'
import { EventPayload } from './EventPayload'
import { getEventColor } from '../../utils/eventColors'
import { ChevronRight, ChevronDown, ShieldAlert } from 'lucide-react'

interface EventRowProps {
  event: TraceEvent
  baseTime: string | null
}

const SECURITY_ACTION_BADGE: Record<string, string> = {
  terminate_session: 'border-red-200 bg-red-50 text-red-700',
  sanitize:          'border-teal-200 bg-teal-50 text-teal-700',
  alert:             'border-amber-200 bg-amber-50 text-amber-700',
}
const SECURITY_ACTION_LABEL: Record<string, string> = {
  terminate_session: 'terminated',
  sanitize:          'sanitized',
  alert:             'alert',
}

export function EventRow({ event, baseTime }: EventRowProps) {
  const [expanded, setExpanded] = useState(false)

  const relativeMs = baseTime
    ? new Date(event.emittedAt).getTime() - new Date(baseTime).getTime()
    : null
  const relativeLabel = relativeMs != null ? `+${relativeMs}ms` : '—'

  const isSecurityFinding = event.eventType === 'security_finding'
  const dotColor = getEventColor(event.eventCategory)
  const hasPayload = Object.keys(event.payload ?? {}).length > 0

  if (isSecurityFinding) {
    const p = event.payload as Record<string, string>
    const action = p['action_taken'] ?? 'alert'
    return (
      <div>
        <div
          className="flex items-center gap-3 px-4 py-2 hover:bg-red-50/40 cursor-pointer border-l-2 border-red-300"
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="w-4 shrink-0 text-slate-400">
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>

          <span className="w-20 shrink-0 font-mono text-xs text-slate-400">{relativeLabel}</span>

          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-red-400" />

          <span className="w-48 shrink-0 font-mono text-xs text-red-600 truncate">
            security_finding
          </span>

          <span className="flex-1 truncate text-xs text-slate-600">
            {p['check_label'] ?? p['sub_check_id'] ?? '—'}
          </span>

          <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${SECURITY_ACTION_BADGE[action] ?? SECURITY_ACTION_BADGE.alert}`}>
            {SECURITY_ACTION_LABEL[action] ?? action}
          </span>
        </div>

        {expanded && (
          <div className="border-l-2 border-red-300 bg-red-50/30 px-4 pb-3 space-y-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-slate-500">
              <span><span className="font-medium text-slate-600">Check</span> {p['owasp_signal_id']}:{p['sub_check_id']}</span>
              <span><span className="font-medium text-slate-600">Severity</span> {p['severity']}</span>
              <span><span className="font-medium text-slate-600">Category</span> {p['category']}</span>
            </div>
            {p['matched_text'] && (
              <pre className="rounded bg-slate-900 p-2 font-mono text-xs text-slate-100 whitespace-pre-wrap break-all">
                {p['matched_text']}
              </pre>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div
        className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer"
        onClick={() => hasPayload && setExpanded((v) => !v)}
      >
        <span className="w-4 shrink-0 text-slate-400">
          {hasPayload ? (
            expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : null}
        </span>

        <span className="w-20 shrink-0 font-mono text-xs text-slate-400">{relativeLabel}</span>

        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />

        <span className="w-48 shrink-0 font-mono text-xs text-slate-700 truncate">
          {event.eventType}
        </span>

        <span className="flex-1 truncate text-xs text-slate-500">
          {event.nodeName || event.llmModel || event.toolName || '—'}
        </span>

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
