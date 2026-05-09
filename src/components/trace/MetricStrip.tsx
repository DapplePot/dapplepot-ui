import type { SessionDetail } from '@dapplepot/types/session'
import { formatDuration, formatTokens } from '../../utils/format'
import { Skeleton } from '../ui/skeleton'

interface MetricStripProps {
  session: SessionDetail
}

export function MetricStrip({ session }: MetricStripProps) {
  const metrics = [
    {
      label: 'Duration',
      value: session.durationMs != null ? formatDuration(session.durationMs) : '—',
    },
    {
      label: 'Tokens in',
      value: formatTokens(session.tokenUsage.totalInputTokens),
    },
    {
      label: 'Tokens out',
      value: formatTokens(session.tokenUsage.totalOutputTokens),
    },
    {
      label: 'Tool calls',
      value: session.executionSummary.toolCallCount,
    },
    {
      label: 'Nodes',
      value: session.executionSummary.nodeCount,
    },
  ]

  return (
    <div className="grid grid-cols-5 divide-x divide-slate-100 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">
      {metrics.map((m) => (
        <div key={m.label} className="px-4 py-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">{m.label}</p>
          <p className="mt-0.5 text-lg font-semibold text-slate-900 dark:text-slate-100">{m.value}</p>
        </div>
      ))}
    </div>
  )
}

export function MetricStripSkeleton() {
  return (
    <div className="grid grid-cols-5 divide-x divide-slate-100 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-4 py-3 space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  )
}
