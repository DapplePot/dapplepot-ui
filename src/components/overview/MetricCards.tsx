import type { OverviewMetrics } from '@dapplepot/types/analytics'
import type { SessionSummary } from '@dapplepot/types/session'
import { Skeleton } from '../ui/skeleton'
import { formatTokens, formatLatency } from '../../utils/format'

interface MetricCardsProps {
  overview: OverviewMetrics
  liveSessions: SessionSummary[]
}

export function MetricCards({ overview, liveSessions }: MetricCardsProps) {
  const cards = [
    {
      label: 'Live sessions',
      value: liveSessions.filter((s) => s.status === 'open').length,
      sub: `${liveSessions.length} total visible`,
    },
    {
      label: 'Completed today',
      value: overview.completedSessions,
      sub: `${overview.totalSessions} started`,
    },
    {
      label: 'Tokens today',
      value: formatTokens(overview.totalInputTokens + overview.totalOutputTokens),
      sub: `${formatTokens(overview.totalInputTokens)} in · ${formatTokens(overview.totalOutputTokens)} out`,
    },
    {
      label: 'p95 LLM latency',
      value: formatLatency(overview.p95LatencyMs),
      sub: `avg ${formatLatency(overview.avgLatencyMs)}`,
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
          <p className="mt-0.5 text-xs text-slate-400">{card.sub}</p>
        </div>
      ))}
    </div>
  )
}

export function MetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}
