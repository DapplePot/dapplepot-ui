import type { SessionDetail } from '@dapplepot/types/session'
import { formatDuration, formatTokens } from '../../utils/format'
import { Skeleton } from '../ui/skeleton'

interface MetricStripProps {
  session: SessionDetail
}

export function MetricStrip({ session }: MetricStripProps) {
  const { tokenUsage } = session
  const multiModel = tokenUsage.byModel.length > 1

  const metrics = [
    {
      label: 'Duration',
      value: session.durationMs != null ? formatDuration(session.durationMs) : '—',
      sub:   null,
    },
    {
      label: 'Tokens in',
      value: formatTokens(tokenUsage.totalInputTokens),
      sub:   !multiModel && tokenUsage.byModel[0] ? tokenUsage.byModel[0].model : null,
    },
    {
      label: 'Tokens out',
      value: formatTokens(tokenUsage.totalOutputTokens),
      sub:   null,
    },
    {
      label: 'Tool calls',
      value: session.executionSummary.toolCallCount,
      sub:   null,
    },
    {
      label: 'Nodes',
      value: session.executionSummary.nodeCount,
      sub:   null,
    },
  ]

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="grid grid-cols-5 divide-x divide-slate-100 dark:divide-zinc-800">
        {metrics.map((m) => (
          <div key={m.label} className="px-4 py-3">
            <p className="text-xs text-slate-500 dark:text-zinc-400">{m.label}</p>
            <p className="mt-0.5 text-lg font-semibold text-slate-900 dark:text-zinc-100">{m.value}</p>
            {m.sub && (
              <p className="truncate font-mono text-xs text-slate-400 dark:text-zinc-500">{m.sub}</p>
            )}
          </div>
        ))}
      </div>

      {multiModel && (
        <div className="border-t border-slate-100 px-4 py-2 dark:border-zinc-800">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {tokenUsage.byModel.map(m => (
              <span key={m.model} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                <span className="font-mono text-slate-700 dark:text-zinc-300">{m.model}</span>
                <span>{formatTokens(m.inputTokens)}↑</span>
                <span>{formatTokens(m.outputTokens)}↓</span>
                <span className="text-slate-300 dark:text-zinc-600">·</span>
                <span>{m.callCount} call{m.callCount !== 1 ? 's' : ''}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function MetricStripSkeleton() {
  return (
    <div className="grid grid-cols-5 divide-x divide-slate-100 rounded-lg border border-slate-200 bg-white dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-900">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-4 py-3 space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  )
}
