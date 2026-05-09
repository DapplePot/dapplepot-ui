import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { LlmUsagePoint } from '@dapplepot/types/analytics'
import { formatTokens } from '../../utils/format'
import { Skeleton } from '../ui/skeleton'
import { useThemeStore } from '../../stores/theme'

const MODEL_COLORS: Record<string, string> = {
  'claude-sonnet-4-6': '#7F77DD',
  'claude-haiku-4-5':  '#1D9E75',
}
const FALLBACK_COLORS = ['#378ADD', '#BA7517', '#D85A30']

interface TokenChartProps {
  data: LlmUsagePoint[]
}

export function TokenChart({ data }: TokenChartProps) {
  const { theme } = useThemeStore()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const gridStroke   = isDark ? '#334155' : '#f1f5f9'
  const tickColor    = isDark ? '#94a3b8' : '#94a3b8'
  const tooltipStyle = isDark
    ? { fontSize: 12, backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }
    : { fontSize: 12 }

  // Pivot data: group by hour, one key per model
  const byHour = data.reduce<Record<string, Record<string, number>>>((acc, pt) => {
    if (!acc[pt.hour]) acc[pt.hour] = { hour: pt.hour as unknown as number }
    acc[pt.hour][pt.llmModel] = pt.totalInputTok + pt.totalOutputTok
    return acc
  }, {})

  const chartData = Object.values(byHour).sort((a, b) =>
    String(a.hour) < String(b.hour) ? -1 : 1
  )

  const models = Array.from(new Set(data.map((d) => d.llmModel)))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 11, fill: tickColor }}
          tickFormatter={(v: string) => v.slice(11, 16)}
        />
        <YAxis
          tick={{ fontSize: 11, fill: tickColor }}
          tickFormatter={(v: number) => formatTokens(v)}
          width={52}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatTokens(value), name]}
          contentStyle={tooltipStyle}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {models.map((model, i) => (
          <Line
            key={model}
            type="monotone"
            dataKey={model}
            stroke={MODEL_COLORS[model] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function TokenChartSkeleton() {
  return <Skeleton className="h-[220px] w-full" />
}
