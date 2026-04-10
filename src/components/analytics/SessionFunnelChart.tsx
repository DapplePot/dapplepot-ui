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
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-600">{label}</span>
          <span className="text-lg font-semibold text-slate-900 tabular-nums">
            {count.toLocaleString()}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-xs text-slate-400 mt-1 block">
          {sublabel ?? `${pct.toFixed(1)}% of total`}
        </span>
      </div>
      {!isLast && (
        <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 16 16">
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
  const terminal = data.completedSessions + data.errorSessions + data.killedSessions

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
    { label: 'Killed',  count: data.killedSessions, color: '#f59e0b' },
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
        <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400">Drop-off:</span>
          {dropoffs.map((d) => (
            <span key={d.label} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span
                className="inline-block w-2 h-2 rounded-full"
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
