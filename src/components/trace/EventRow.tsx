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
  terminate_session: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
  block_call:        'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  sanitize:          'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
  alert:             'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
}
const SECURITY_ACTION_LABEL: Record<string, string> = {
  terminate_session: 'terminated',
  block_call:        'blocked',
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
          className="flex items-center gap-3 px-4 py-2 hover:bg-red-50/40 cursor-pointer border-l-2 border-red-300 dark:hover:bg-red-950/20 dark:border-red-700"
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="w-4 shrink-0 text-slate-400 dark:text-slate-500">
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>

          <span className="w-20 shrink-0 font-mono text-xs text-slate-400 dark:text-slate-500">{relativeLabel}</span>

          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-red-400 dark:text-red-500" />

          <span className="w-48 shrink-0 font-mono text-xs text-red-600 truncate dark:text-red-400">
            security_finding
          </span>

          <span className="flex-1 truncate text-xs text-slate-600 dark:text-slate-400">
            {p['check_label'] ?? p['sub_check_id'] ?? '—'}
          </span>

          <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${SECURITY_ACTION_BADGE[action] ?? SECURITY_ACTION_BADGE.alert}`}>
            {SECURITY_ACTION_LABEL[action] ?? action}
          </span>
        </div>

        {expanded && (
          <div className="border-l-2 border-red-300 bg-red-50/30 px-4 pb-3 space-y-2 dark:border-red-700 dark:bg-red-950/10">
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-slate-500 dark:text-slate-400">
              <span><span className="font-medium text-slate-600 dark:text-slate-300">Check</span> {p['owasp_signal_id']}:{p['sub_check_id']}</span>
              <span><span className="font-medium text-slate-600 dark:text-slate-300">Severity</span> {p['severity']}</span>
              <span><span className="font-medium text-slate-600 dark:text-slate-300">Category</span> {p['category']}</span>
            </div>
            {p['matched_text'] && (
              <pre className="rounded bg-slate-900 p-2 font-mono text-xs text-slate-100 whitespace-pre-wrap break-all dark:bg-slate-950">
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
        className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-800"
        onClick={() => hasPayload && setExpanded((v) => !v)}
      >
        <span className="w-4 shrink-0 text-slate-400 dark:text-slate-500">
          {hasPayload ? (
            expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : null}
        </span>

        <span className="w-20 shrink-0 font-mono text-xs text-slate-400 dark:text-slate-500">{relativeLabel}</span>

        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />

        <span className="w-48 shrink-0 font-mono text-xs text-slate-700 truncate dark:text-slate-300">
          {event.eventType}
        </span>

        <span className="flex-1 truncate text-xs text-slate-500 dark:text-slate-400">
          {event.nodeName || event.llmModel || event.toolName || '—'}
        </span>

        {event.errorCode && (
          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">
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
