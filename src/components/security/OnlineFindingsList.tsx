import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { SessionAction} from '../../types/security'

interface OnlineFindingsListProps {
  findings: SessionAction[]
  baseTime: string | null
}

const SEVERITY_ICON: Record<string, string> = {
  critical: '🔴',
  high:     '🟠',
  medium:   '🟡',
  low:      '🔵',
}

const ACTION_BADGE: Record<string, string> = {
  terminate_session: 'border-red-200 bg-red-50 text-red-700',
  sanitize:          'border-teal-200 bg-teal-50 text-teal-700',
  alert:             'border-amber-200 bg-amber-50 text-amber-700',
}

const ACTION_LABEL: Record<string, string> = {
  terminate_session: 'terminated',
  sanitize:          'sanitized',
  alert:             'alert',
}

export function OnlineFindingsList({ findings, baseTime }: OnlineFindingsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (findings.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No online findings</p>
  }

  return (
    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
      {findings.map((f) => (
        <div key={f.id}>
          <div
            className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50"
            onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
          >
            <span>{SEVERITY_ICON[f.severity] ?? '⚪'}</span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Action badge */}
                <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${ACTION_BADGE[f.actionTaken] ?? ACTION_BADGE.alert}`}>
                  {ACTION_LABEL[f.actionTaken] ?? f.actionTaken}
                </span>
                <p className="text-sm font-medium text-slate-800">{f.checkLabel}</p>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  f.framework === 'ASI' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {f.framework}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {f.owaspSignalId}:{f.subCheckId} · {f.category}
                {(() => {
                  const relMs = baseTime && f.triggeredAt
                    ? new Date(f.triggeredAt).getTime() - new Date(baseTime).getTime()
                    : null
                  const evType = f.triggerEventType ?? null
                  if (relMs !== null || evType) {
                    return (
                      <span className="ml-2 text-slate-300">
                        · {relMs !== null ? `+${relMs}ms` : ''}{evType ? ` ${evType}` : ''}
                      </span>
                    )
                  }
                  return null
                })()}
              </p>
            </div>

            <span className="shrink-0 text-xs text-slate-400">
              {new Date(f.triggeredAt).toLocaleTimeString()}
            </span>

            {expandedId === f.id
              ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
              : <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
          </div>

          {expandedId === f.id && (
            <div className="border-t border-slate-50 bg-slate-50 px-4 py-3 space-y-3">
              {f.detail && (
                <p className="text-xs text-slate-600">{f.detail}</p>
              )}
              {f.matchedText && (
                <>
                  <p className="text-xs font-medium text-slate-500">Matched text</p>
                  <pre className="rounded bg-slate-900 p-3 font-mono text-xs text-slate-100 whitespace-pre-wrap break-all">
                    {f.matchedText}
                  </pre>
                </>
              )}
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>online</span>
                <span>·</span>
                <span className="capitalize">{f.severity}</span>
                <span>·</span>
                <span>{f.owaspSignalId}</span>
                <span>·</span>
                <span>{new Date(f.triggeredAt).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
