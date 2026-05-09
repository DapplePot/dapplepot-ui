import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { AlertStats } from '@dapplepot/types/alert'
import { Skeleton } from '../ui/skeleton'
import { useThemeStore } from '../../stores/theme'

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: '#ef4444' },
  warning:  { label: 'Warning',  color: '#f59e0b' },
  medium:   { label: 'Medium',   color: '#f97316' },
  info:     { label: 'Info',     color: '#64748b' },
} as const

type Severity = keyof typeof SEVERITY_CONFIG

interface AlertVolumeChartProps {
  data: AlertStats
}

export function AlertVolumeChart({ data }: AlertVolumeChartProps) {
  const { theme } = useThemeStore()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const gridStroke   = isDark ? '#334155' : '#f1f5f9'
  const tickColor    = isDark ? '#94a3b8' : '#64748b'
  const tooltipStyle = isDark
    ? { fontSize: 12, backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }
    : { fontSize: 12 }

  const chartData = data.bySeverity.map((s) => ({
    severity: s.severity,
    label: SEVERITY_CONFIG[s.severity as Severity]?.label ?? s.severity,
    total: s.total,
    open: s.open,
    acknowledged: s.acknowledged,
    resolved: s.resolved,
  }))

  const grandTotal = data.bySeverity.reduce((sum, s) => sum + s.total, 0)

  if (grandTotal === 0) {
    return <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No alerts in this window</p>
  }

  return (
    <div className="space-y-3">
      {/* Summary pills */}
      <div className="flex flex-wrap items-center gap-3">
        {data.bySeverity
          .filter((s) => s.total > 0)
          .sort((a, b) => {
            const order = ['critical', 'warning', 'medium', 'info']
            return order.indexOf(a.severity) - order.indexOf(b.severity)
          })
          .map((s) => (
            <span
              key={s.severity}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: SEVERITY_CONFIG[s.severity as Severity]?.color ?? '#94a3b8' }}
            >
              {s.total} {SEVERITY_CONFIG[s.severity as Severity]?.label ?? s.severity}
            </span>
          ))}
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{grandTotal} total</span>
      </div>

      {/* Stacked status breakdown per severity */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} />
          <YAxis tick={{ fontSize: 11, fill: tickColor }} allowDecimals={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="open"         name="Open"         stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
          <Bar dataKey="acknowledged" name="Acknowledged" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
          <Bar dataKey="resolved"     name="Resolved"     stackId="a" fill="#10b981" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Top rules */}
      {data.topRules.length > 0 && (
        <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Top firing rules</p>
          <div className="space-y-1">
            {data.topRules.slice(0, 5).map((r, i) => (
              <div key={r.ruleId ?? r.ruleName ?? i} className="flex items-center justify-between">
                <span className="truncate text-xs text-slate-600 dark:text-slate-400">{r.ruleName}</span>
                <span className="ml-2 text-xs font-medium tabular-nums text-slate-900 dark:text-slate-100">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function AlertVolumeSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-5 w-20 rounded-full" />)}
      </div>
      <Skeleton className="h-[180px] w-full" />
    </div>
  )
}
