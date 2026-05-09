import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { LatencyStat } from '@dapplepot/types/analytics'
import { formatLatency } from '../../utils/format'
import { Skeleton } from '../ui/skeleton'
import { useThemeStore } from '../../stores/theme'

interface LatencyChartProps {
  data: LatencyStat[]
}

export function LatencyChart({ data }: LatencyChartProps) {
  const { theme } = useThemeStore()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const gridStroke   = isDark ? '#334155' : '#f1f5f9'
  const tickColor    = isDark ? '#94a3b8' : '#94a3b8'
  const tooltipStyle = isDark
    ? { fontSize: 12, backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }
    : { fontSize: 12 }

  const chartData = data
    .reduce<Record<string, { hour: string; avgMs: number; p95Ms: number; count: number }>>((acc, pt) => {
      if (!acc[pt.hour]) acc[pt.hour] = { hour: pt.hour, avgMs: 0, p95Ms: 0, count: 0 }
      // Weighted avg across models
      const prev = acc[pt.hour]
      const total = prev.count + pt.callCount
      prev.avgMs = (prev.avgMs * prev.count + pt.avgMs * pt.callCount) / total
      prev.p95Ms = Math.max(prev.p95Ms, pt.p95Ms)
      prev.count = total
      return acc
    }, {})

  const sorted = Object.values(chartData).sort((a, b) =>
    a.hour < b.hour ? -1 : 1
  )

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={sorted} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 11, fill: tickColor }}
          tickFormatter={(v: string) => v.slice(11, 16)}
        />
        <YAxis
          tick={{ fontSize: 11, fill: tickColor }}
          tickFormatter={(v: number) => formatLatency(v)}
          width={56}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatLatency(value), name]}
          contentStyle={tooltipStyle}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="avgMs"
          name="avg"
          stroke="#378ADD"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="p95Ms"
          name="p95"
          stroke="#BA7517"
          strokeWidth={2}
          dot={false}
          strokeDasharray="4 2"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function LatencyChartSkeleton() {
  return <Skeleton className="h-[220px] w-full" />
}
