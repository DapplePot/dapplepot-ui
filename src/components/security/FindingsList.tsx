import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { SecurityFinding, ConfidenceTier } from '../../types/security'

interface FindingsListProps {
  findings: SecurityFinding[]
}

const SEVERITY_ICON: Record<string, string> = {
  critical: '🔴',
  high:     '🟠',
  medium:   '🟡',
  low:      '🔵',
}

const CONFIDENCE_TIER_CLASS: Record<ConfidenceTier, string> = {
  deterministic: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  high:          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  medium:        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  low:           'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  skeletal:      'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400',
}

export function FindingsList({ findings }: FindingsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (findings.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No findings</p>
  }

  return (
    <div className="divide-y divide-slate-100 rounded border border-slate-200 bg-white dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-900">
      {findings.map((f) => (
        <div key={f.findingId}>
          <div
            className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
            onClick={() => setExpandedId(expandedId === f.findingId ? null : f.findingId)}
          >
            <span>{SEVERITY_ICON[f.severity] ?? '⚪'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                  {f.checkLabel}
                </p>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  f.framework === 'ASI'
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                }`}>
                  {f.framework}
                </span>
                {f.confidenceTier && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${CONFIDENCE_TIER_CLASS[f.confidenceTier]}`}>
                    {f.confidenceTier}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono">
                {f.owaspSignalId}:{f.subCheckId} · {f.category}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{f.checkScore}</span>
              {f.confidence !== undefined && (
                <span className="text-xs text-slate-400 dark:text-zinc-500">×{f.confidence.toFixed(1)}</span>
              )}
            </div>
            {expandedId === f.findingId ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </div>

          {expandedId === f.findingId && (
            <div className="border-t border-slate-50 px-4 py-3 bg-slate-50 space-y-3 dark:border-zinc-800 dark:bg-zinc-800/50">
              {f.detail && (
                <p className="text-xs text-slate-600 dark:text-zinc-400">{f.detail}</p>
              )}
              {f.matchedText && (
                <>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Matched text</p>
                  <pre className="rounded bg-slate-900 p-3 font-mono text-xs text-slate-100 whitespace-pre-wrap break-all dark:bg-zinc-950">
                    {f.matchedText}
                  </pre>
                </>
              )}
              <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-zinc-500">
                <span className="capitalize">{f.detectionPhase}</span>
                <span>·</span>
                <span>{f.eventType}</span>
                <span>·</span>
                <span>{new Date(f.createdAt).toLocaleString()}</span>
                {f.confidenceTier && (
                  <>
                    <span>·</span>
                    <span>confidence: <span className="font-medium text-slate-500 dark:text-zinc-400">{f.confidenceTier}</span>
                      {f.confidence !== undefined && ` (${(f.confidence * 100).toFixed(0)}%)`}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
