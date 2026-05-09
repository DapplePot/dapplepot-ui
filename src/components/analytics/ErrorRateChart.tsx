import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from 'recharts'
import type { ErrorRatePoint } from '@dapplepot/types/analytics'
import { Skeleton } from '../ui/skeleton'
import { useAgents } from '../../hooks/useAgents'
import { useThemeStore } from '../../stores/theme'

function barColor(rate: number): string {
  if (rate > 0.08) return '#ef4444'
  if (rate > 0.04) return '#f59e0b'
  return '#10b981'
}

interface ErrorRateChartProps {
  data: ErrorRatePoint[]
}

export function ErrorRateChart({ data }: ErrorRateChartProps) {
  const { data: agentsData } = useAgents()
  const agentMap = Object.fromEntries((agentsData ?? []).map((a) => [a.agentId, a.name]))

  const { theme } = useThemeStore()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const gridStroke   = isDark ? '#334155' : '#f1f5f9'
  const tickColor    = isDark ? '#94a3b8' : '#64748b'
  const tooltipStyle = isDark
    ? { fontSize: 12, backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }
    : { fontSize: 12 }

  // Aggregate to latest rate per agent
  const byAgent = data.reduce<Record<string, { errors: number; total: number }>>((acc, pt) => {
    if (!acc[pt.agentId]) acc[pt.agentId] = { errors: 0, total: 0 }
    acc[pt.agentId].errors += pt.errorCount
    acc[pt.agentId].total += pt.totalCount
    return acc
  }, {})

  const chartData = Object.entries(byAgent).map(([agentId, { errors, total }]) => ({
    agentId,
    agentName: agentMap[agentId] ?? agentId,
    rate: total > 0 ? errors / total : 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 0.14]}
          tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
          tick={{ fontSize: 11, fill: tickColor }}
        />
        <YAxis
          type="category"
          dataKey="agentName"
          tick={{ fontSize: 11, fill: tickColor }}
          width={120}
        />
        <Tooltip
          formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Error rate']}
          contentStyle={tooltipStyle}
        />
        <Bar dataKey="rate" radius={[0, 3, 3, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.agentId} fill={barColor(entry.rate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ErrorRateChartSkeleton() {
  return <Skeleton className="h-[220px] w-full" />
}
