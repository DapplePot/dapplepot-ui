import type { OverviewMetrics } from '@dapplepot/types/analytics'
import type { SessionSummary } from '@dapplepot/types/session'
import type { TrendPoint } from '@dapplepot/types/analytics'
import { Skeleton } from '../ui/skeleton'
import { Sparkline } from '../ui/Sparkline'
import { formatTokens, formatLatency } from '../../utils/format'

interface MetricCardsProps {
  overview: OverviewMetrics
  liveSessions: SessionSummary[]
  trends?: TrendPoint[]
}

export function MetricCards({ overview, liveSessions, trends = [] }: MetricCardsProps) {
  const sessionTrend  = trends.map(t => t.sessionCount)
  const tokenTrend    = trends.map(t => t.tokenCount)
  const latencyTrend  = trends.map(t => t.avgLatencyMs)

  const cards = [
    {
      label: 'Live sessions',
      value: liveSessions.filter((s) => s.status === 'open').length,
      sub: `${liveSessions.length} total visible`,
      trend: sessionTrend,
      color: '#7F77DD',
      id: 'live-sessions',
    },
    {
      label: 'Completed today',
      value: overview.completedSessions,
      sub: `${overview.totalSessions} started`,
      trend: sessionTrend,
      color: '#1D9E75',
      id: 'completed',
    },
    {
      label: 'Tokens today',
      value: formatTokens(overview.totalInputTokens + overview.totalOutputTokens),
      sub: `${formatTokens(overview.totalInputTokens)} in · ${formatTokens(overview.totalOutputTokens)} out`,
      trend: tokenTrend,
      color: '#7F77DD',
      id: 'tokens',
    },
    {
      label: 'p95 LLM latency',
      value: formatLatency(overview.p95LatencyMs),
      sub: `avg ${formatLatency(overview.avgLatencyMs)}`,
      trend: latencyTrend,
      color: '#f59e0b',
      id: 'latency',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900 flex flex-col">
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-zinc-100">{card.value}</p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500">{card.sub}</p>
          <div className="mt-3 -mx-1">
            <Sparkline data={card.trend} color={card.color} id={card.id} height={28} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function MetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 dark:border-zinc-700 dark:bg-zinc-900">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-full rounded mt-3" />
        </div>
      ))}
    </div>
  )
}
