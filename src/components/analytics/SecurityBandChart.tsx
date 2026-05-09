import type { RiskBand } from '@dapplepot/types/security'
import { Skeleton } from '../ui/skeleton'

const BAND_CONFIG: Record<RiskBand, { label: string; color: string }> = {
  clean:    { label: 'Clean',    color: '#10b981' },
  low:      { label: 'Low',      color: '#84cc16' },
  medium:   { label: 'Medium',   color: '#f59e0b' },
  high:     { label: 'High',     color: '#f97316' },
  critical: { label: 'Critical', color: '#ef4444' },
}

const BAND_ORDER: RiskBand[] = ['clean', 'low', 'medium', 'high', 'critical']

interface SecurityBandChartProps {
  bandDistribution: Record<RiskBand, number>
  sessionsScored: number
  highCriticalCount: number
}

export function SecurityBandChart({
  bandDistribution,
  sessionsScored,
  highCriticalCount,
}: SecurityBandChartProps) {
  const total = sessionsScored || 1
  const highCriticalPct = ((highCriticalCount / total) * 100).toFixed(1)

  return (
    <div className="space-y-4">
      {/* High+critical callout */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{highCriticalPct}%</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">sessions high or critical</span>
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{sessionsScored.toLocaleString()} scored</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 overflow-hidden rounded-full gap-px">
        {BAND_ORDER.map((band) => {
          const count = bandDistribution[band] ?? 0
          const pct = (count / total) * 100
          if (pct < 0.5) return null
          return (
            <div
              key={band}
              style={{ width: `${pct}%`, backgroundColor: BAND_CONFIG[band].color }}
              title={`${BAND_CONFIG[band].label}: ${count} (${pct.toFixed(1)}%)`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {BAND_ORDER.map((band) => {
          const count = bandDistribution[band] ?? 0
          const pct = ((count / total) * 100).toFixed(0)
          return (
            <div key={band} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                style={{ backgroundColor: BAND_CONFIG[band].color }}
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">{BAND_CONFIG[band].label}</span>
              <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">{count} ({pct}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SecurityBandSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-full rounded-full" />
      <div className="flex gap-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-3 w-20" />)}
      </div>
    </div>
  )
}
