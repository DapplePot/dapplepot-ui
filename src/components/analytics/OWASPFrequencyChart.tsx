import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Skeleton } from '../ui/skeleton'

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
  // Merge and sort by count desc, take top 10
  const merged = [
    ...llmFrequency.map((e) => ({ ...e, framework: 'LLM' })),
    ...asiFrequency.map((e)  => ({ ...e, framework: 'ASI' })),
  ]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  if (merged.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">No signals fired in this window</p>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={merged}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="signalId"
          tick={{ fontSize: 10, fill: '#64748b' }}
          width={76}
        />
        <Tooltip
          formatter={(value: number, _: string, entry: { payload: FrequencyEntry & { framework: string } }) => [
            `${value} sessions`,
            entry.payload.framework,
          ]}
          contentStyle={{ fontSize: 12 }}
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
