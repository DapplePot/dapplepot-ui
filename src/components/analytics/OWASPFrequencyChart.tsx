import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Skeleton } from '../ui/skeleton'
import { useThemeStore } from '../../stores/theme'

interface FrequencyEntry {
  signalId: string
  count: number
}

interface OWASPFrequencyChartProps {
  llmFrequency: FrequencyEntry[]
  asiFrequency: FrequencyEntry[]
}

function signalColor(signalId: string): string {
  return signalId.startsWith('OW-LLM') ? '#7F77DD' : '#378ADD'
}

export function OWASPFrequencyChart({ llmFrequency, asiFrequency }: OWASPFrequencyChartProps) {
  const { theme } = useThemeStore()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const gridStroke   = isDark ? '#334155' : '#f1f5f9'
  const tickColor    = isDark ? '#94a3b8' : '#64748b'
  const tooltipStyle = isDark
    ? { fontSize: 12, backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }
    : { fontSize: 12 }

  // Merge and sort by count desc, take top 10
  const merged = [
    ...llmFrequency.map((e) => ({ ...e, framework: 'LLM' })),
    ...asiFrequency.map((e)  => ({ ...e, framework: 'ASI' })),
  ]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  if (merged.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No signals fired in this window</p>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={merged}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: tickColor }}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="signalId"
          tick={{ fontSize: 10, fill: tickColor }}
          width={76}
        />
        <Tooltip
          formatter={(value: number, _: string, entry) => [
            `${value} sessions`,
            (entry.payload as FrequencyEntry & { framework: string })?.framework ?? '',
          ]}
          contentStyle={tooltipStyle}
        />
        <Bar dataKey="count" radius={[0, 3, 3, 0]}>
          {merged.map((entry) => (
            <Cell key={entry.signalId} fill={signalColor(entry.signalId)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function OWASPFrequencySkeleton() {
  return <Skeleton className="h-[220px] w-full" />
}
