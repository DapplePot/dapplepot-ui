import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { AgentSessionCount } from '@dapplepot/types/analytics'
import { Skeleton } from '../ui/skeleton'

interface AgentUsageChartProps {
  data: AgentSessionCount[]
}

const COLORS = ['#7F77DD', '#1D9E75', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#64748b', '#f97316', '#10b981']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as AgentSessionCount & { pct: number }
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      {d.agentName && <p className="text-xs font-medium text-slate-700 dark:text-zinc-200">{d.agentName}</p>}
      <p className="font-mono text-[10px] text-slate-400 dark:text-zinc-500">{d.agentId.slice(0, 8)}</p>
      <p className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-zinc-100">
        {d.sessionCount.toLocaleString()} <span className="font-normal text-slate-400">({d.pct.toFixed(1)}%)</span>
      </p>
    </div>
  )
}

export function AgentUsageChart({ data }: AgentUsageChartProps) {
  const total = data.reduce((s, d) => s + d.sessionCount, 0)

  if (total === 0 || data.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400 dark:text-zinc-500">No sessions in this window</p>
  }

  const chartData = data.map((d, i) => ({
    ...d,
    label: d.agentName ?? d.agentId.slice(0, 8),
    pct: (d.sessionCount / total) * 100,
    fill: COLORS[i % COLORS.length],
  }))

  return (
    <div className="flex items-center justify-center gap-14">
      {/* Donut with center label */}
      <div className="relative shrink-0" style={{ width: 280, height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={128}
              paddingAngle={2}
              dataKey="sessionCount"
              strokeWidth={0}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{total.toLocaleString()}</span>
          <span className="text-xs text-slate-400 dark:text-zinc-500">sessions</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col justify-center gap-2">
        {chartData.map((d, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.fill }} />
            <span className="text-xs text-slate-600 dark:text-zinc-400 w-28 truncate">{d.label}</span>
            <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-zinc-400 w-8 text-right">{d.sessionCount}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-2 dark:border-zinc-800">
          <span className="inline-block h-2 w-2 shrink-0" />
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 w-28">Total</span>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-700 dark:text-zinc-200 w-8 text-right">{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

export function AgentUsageSkeleton() {
  return (
    <div className="flex items-center justify-center gap-14">
      <Skeleton className="shrink-0 h-[280px] w-[280px] rounded-full" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-3 w-36" />)}
      </div>
    </div>
  )
}
