import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { SecurityFinding, ConfidenceTier } from '../../types/security'
import { phaseLabel } from '../../utils/vocabulary'
import { useHighlightedEvent } from '../../stores/highlightedEvent'

interface FindingsListProps {
  findings: SecurityFinding[]
}

const SEVERITY_DOT_CLASS: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-amber-400',
  low:      'bg-blue-400',
}

const CONFIDENCE_TIER_CLASS: Record<ConfidenceTier, string> = {
  deterministic: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  high:          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  medium:        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  low:           'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  skeletal:      'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400',
}

const CHIP_BASE =
  'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none'

const FRAMEWORK_CHIP: Record<string, string> = {
  LLM: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  ASI: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-300',
}

export function FindingsList({ findings }: FindingsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const setHighlight   = useHighlightedEvent(s => s.setHighlight)
  const clearHighlight = useHighlightedEvent(s => s.clearHighlight)

  // Clear the highlight when this list unmounts so it doesn't linger between
  // tab switches / navigations.
  useEffect(() => clearHighlight, [clearHighlight])

  function handleToggle(finding: SecurityFinding) {
    const nextExpandedId = expandedId === finding.findingId ? null : finding.findingId
    setExpandedId(nextExpandedId)
    if (nextExpandedId) {
      // Prefer the full set of contributing events; fall back to the primary
      // event_id for legacy rows written before migration 032.
      const ids = finding.involvedEventIds && finding.involvedEventIds.length > 0
        ? finding.involvedEventIds
        : (finding.eventId ? [finding.eventId] : [])
      setHighlight(ids)
    } else {
      clearHighlight()
    }
  }

  if (findings.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No findings</p>
  }

  return (
    <div className="divide-y divide-slate-100 rounded border border-slate-200 bg-white dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-900">
      {findings.map((f) => {
        const isExpanded = expandedId === f.findingId
        const dotCls = SEVERITY_DOT_CLASS[f.severity] ?? 'bg-slate-400'
        const frameworkCls = FRAMEWORK_CHIP[f.framework] ?? 'border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'

        return (
          <div key={f.findingId}>
            <button
              type="button"
              onClick={() => handleToggle(f)}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50"
              aria-expanded={isExpanded}
            >
              {/* Severity indicator — colour dot, not emoji */}
              <span
                className={`inline-block h-2 w-2 shrink-0 rounded-full ${dotCls}`}
                title={f.severity}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                    {f.checkLabel}
                  </p>
                  <span className={`${CHIP_BASE} font-mono tracking-wide ${frameworkCls}`}>
                    OW-{f.framework}
                  </span>
                  {f.confidenceTier && (
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${CONFIDENCE_TIER_CLASS[f.confidenceTier]}`}>
                      {f.confidenceTier}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 font-mono text-xs text-slate-400 dark:text-zinc-500">
                  {f.owaspSignalId}:{f.subCheckId} · {f.category}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{f.checkScore}</span>
                {f.confidence !== undefined && (
                  <span className="text-xs text-slate-400 dark:text-zinc-500">×{f.confidence.toFixed(1)}</span>
                )}
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {isExpanded && (
              <div className="space-y-3 border-t border-slate-50 bg-slate-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                {f.detail && (
                  <p className="text-xs text-slate-600 dark:text-zinc-400">{f.detail}</p>
                )}
                {f.matchedText && (
                  <>
                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Matched text</p>
                    <pre className="whitespace-pre-wrap break-all rounded bg-slate-900 p-3 font-mono text-xs text-slate-100 dark:bg-zinc-950">
                      {f.matchedText}
                    </pre>
                  </>
                )}
                <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-zinc-500">
                  <span>{phaseLabel(f.detectionPhase)}</span>
                  <span>·</span>
                  <span>{f.eventType}</span>
                  <span>·</span>
                  <span>{new Date(f.createdAt).toLocaleString()}</span>
                  {f.confidenceTier && (
                    <>
                      <span>·</span>
                      <span>
                        confidence:{' '}
                        <span className="font-medium text-slate-500 dark:text-zinc-400">{f.confidenceTier}</span>
                        {f.confidence !== undefined && ` (${(f.confidence * 100).toFixed(0)}%)`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
