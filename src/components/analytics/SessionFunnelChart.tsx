import type { SessionFunnel } from '@dapplepot/types/analytics'
import { Skeleton } from '../ui/skeleton'

interface SessionFunnelChartProps {
  data: SessionFunnel
}

export function SessionFunnelChart({ data }: SessionFunnelChartProps) {
  const total         = data.totalStarted || 1
  const finalisedPct  = (data.finalised   / total) * 100
  const terminatedPct = (data.terminated  / total) * 100

  return (
    <div className="space-y-3">
      <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800 flex gap-px">
        {finalisedPct >= 0.5 && (
          <div
            style={{ width: `${finalisedPct}%`, backgroundColor: '#1D9E75' }}
            title={`Finalised: ${data.finalised.toLocaleString()} (${finalisedPct.toFixed(1)}%)`}
          />
        )}
        {terminatedPct >= 0.5 && (
          <div
            style={{ width: `${terminatedPct}%`, backgroundColor: '#ef4444' }}
            title={`Terminated: ${data.terminated.toLocaleString()} (${terminatedPct.toFixed(1)}%)`}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded bg-slate-300 dark:bg-zinc-600" />
          <span className="text-xs text-slate-500 dark:text-zinc-400">Started</span>
          <span className="text-xs tabular-nums text-slate-400 dark:text-zinc-500">{data.totalStarted.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded" style={{ backgroundColor: '#1D9E75' }} />
          <span className="text-xs text-slate-500 dark:text-zinc-400">Finalised</span>
          <span className="text-xs tabular-nums text-slate-400 dark:text-zinc-500">
            {data.finalised.toLocaleString()} ({finalisedPct.toFixed(0)}%)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded" style={{ backgroundColor: '#ef4444' }} />
          <span className="text-xs text-slate-500 dark:text-zinc-400">Terminated</span>
          <span className="text-xs tabular-nums text-slate-400 dark:text-zinc-500">
            {data.terminated.toLocaleString()} ({terminatedPct.toFixed(0)}%)
          </span>
        </div>
        {data.open > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded bg-violet-400 dark:bg-violet-600" />
            <span className="text-xs text-slate-500 dark:text-zinc-400">In progress</span>
            <span className="text-xs tabular-nums text-slate-400 dark:text-zinc-500">{data.open.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function SessionFunnelSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-full rounded-full" />
      <div className="flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-3 w-24" />)}
      </div>
    </div>
  )
}
