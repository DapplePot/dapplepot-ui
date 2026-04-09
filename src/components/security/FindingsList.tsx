import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { SecurityFinding } from '../../types/security'

interface FindingsListProps {
  findings: SecurityFinding[]
}

const SEVERITY_ICON: Record<string, string> = {
  critical: '🔴',
  high:     '🟠',
  medium:   '🟡',
  low:      '🔵',
}

export function FindingsList({ findings }: FindingsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (findings.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No findings</p>
  }

  return (
    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
      {findings.map((f) => (
        <div key={f.findingId}>
          <div
            className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50"
            onClick={() => setExpandedId(expandedId === f.findingId ? null : f.findingId)}
          >
            <span>{SEVERITY_ICON[f.severity] ?? '⚪'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-800">
                  {f.checkLabel}
                </p>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  f.framework === 'ASI'
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {f.framework}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {f.owaspSignalId}:{f.subCheckId} · {f.category}
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-700">
              {f.checkScore}
            </span>
            {expandedId === f.findingId ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </div>

          {expandedId === f.findingId && (
            <div className="border-t border-slate-50 px-4 py-3 bg-slate-50 space-y-3">
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
              <p className="text-xs text-slate-400">
                {f.detectionPhase} · {f.eventType} · {new Date(f.createdAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
