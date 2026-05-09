import type { OverviewMetrics } from '@dapplepot/types/analytics'
import { Skeleton } from '../ui/skeleton'

interface SessionFunnelChartProps {
  data: OverviewMetrics
}

interface StageProps {
  label: string
  count: number
  pct: number
  color: string
  sublabel?: string
  isLast?: boolean
}

function Stage({ label, count, pct, color, sublabel, isLast }: StageProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
          <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {count.toLocaleString()}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">
          {sublabel ?? `${pct.toFixed(1)}% of total`}
        </span>
      </div>
      {!isLast && (
        <svg className="h-4 w-4 flex-shrink-0 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 16 16">
          <path
            d="M6 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}

export function SessionFunnelChart({ data }: SessionFunnelChartProps) {
  const total = data.totalSessions || 1
  const terminal = data.completedSessions + data.errorSessions

  const stages: StageProps[] = [
    {
      label: 'Started',
      count: data.totalSessions,
      pct: 100,
      color: '#64748b',
      sublabel: 'total',
    },
    {
      label: 'Reached terminal',
      count: terminal,
      pct: (terminal / total) * 100,
      color: '#7F77DD',
    },
    {
      label: 'Completed',
      count: data.completedSessions,
      pct: (data.completedSessions / total) * 100,
      color: '#1D9E75',
      isLast: true,
    },
  ]

  const dropoffs = [
    { label: 'Errored', count: data.errorSessions,  color: '#ef4444' },
    { label: 'In progress', count: data.liveSessions, color: '#94a3b8' },
  ].filter((d) => d.count > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        {stages.map((s, i) => (
          <Stage key={s.label} {...s} isLast={i === stages.length - 1} />
        ))}
      </div>
      {dropoffs.length > 0 && (
        <div className="flex items-center gap-4 border-t border-slate-100 pt-2 dark:border-slate-800">
          <span className="text-xs text-slate-400 dark:text-slate-500">Drop-off:</span>
          {dropoffs.map((d) => (
            <span key={d.label} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              {d.label}: {d.count.toLocaleString()}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function SessionFunnelSkeleton() {
  return (
    <div className="flex gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}
