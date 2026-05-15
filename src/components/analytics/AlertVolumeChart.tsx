import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { AlertStats } from '@dapplepot/types/alert'
import { Skeleton } from '../ui/skeleton'
import { useThemeStore } from '../../stores/theme'

const SEV_CONFIG: Record<string, { label: string; color: string; bg: string; text: string }> = {
  critical: { label: 'Critical', color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20',    text: 'text-red-700 dark:text-red-400'    },
  high:     { label: 'High',     color: '#f97316', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400' },
  warning:  { label: 'Warning',  color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-700 dark:text-amber-400'  },
  medium:   { label: 'Medium',   color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-700 dark:text-amber-400'  },
  info:     { label: 'Info',     color: '#7F77DD', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400' },
  low:      { label: 'Low',      color: '#94a3b8', bg: 'bg-slate-50 dark:bg-zinc-800',       text: 'text-slate-500 dark:text-zinc-400'   },
}

const SEV_ORDER = ['critical', 'high', 'warning', 'medium', 'info', 'low']

interface AlertVolumeChartProps {
  data: AlertStats
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-1 text-xs font-medium text-slate-700 dark:text-zinc-300">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="text-slate-500 dark:text-zinc-400">{p.name}</span>
          <span className="ml-auto font-medium tabular-nums text-slate-900 dark:text-zinc-100">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function AlertVolumeChart({ data }: AlertVolumeChartProps) {
  const { theme } = useThemeStore()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const gridStroke = isDark ? '#27272a' : '#f1f5f9'
  const tickColor  = isDark ? '#71717a' : '#94a3b8'

  const grandTotal = data.bySeverity.reduce((s, r) => s + r.total, 0)

  if (grandTotal === 0) {
    return <p className="py-8 text-center text-sm text-slate-400 dark:text-zinc-500">No alerts in this window</p>
  }

  const sorted = [...data.bySeverity]
    .filter(s => s.total > 0)
    .sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity))

  const chartData = sorted.map(s => ({
    label: SEV_CONFIG[s.severity]?.label ?? s.severity,
    severity: s.severity,
    open: s.open,
    acknowledged: s.acknowledged,
    resolved: s.resolved,
    total: s.total,
  }))

  return (
    <div className="space-y-4">
      {/* Stat pills */}
      <div className="flex flex-wrap items-center gap-2">
        {sorted.map(s => {
          const cfg = SEV_CONFIG[s.severity] ?? SEV_CONFIG.low
          return (
            <span
              key={s.severity}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
              style={{ borderColor: cfg.color + '40' }}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
              {s.total} {cfg.label}
            </span>
          )
        })}
        <span className="ml-auto text-xs text-slate-400 dark:text-zinc-500">{grandTotal} total</span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#ffffff08' : '#00000006' }} />
          <Bar dataKey="open"         name="Open"         stackId="a" fill="#ef4444" radius={[0,0,0,0]} />
          <Bar dataKey="acknowledged" name="Acknowledged" stackId="a" fill="#f59e0b" radius={[0,0,0,0]} />
          <Bar dataKey="resolved"     name="Resolved"     stackId="a" fill="#1D9E75" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Status legend */}
      <div className="flex items-center gap-4 border-t border-slate-100 pt-2 dark:border-zinc-800">
        {[
          { color: '#ef4444', label: 'Open'         },
          { color: '#f59e0b', label: 'Acknowledged' },
          { color: '#1D9E75', label: 'Resolved'     },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: l.color }} />
            <span className="text-xs text-slate-500 dark:text-zinc-400">{l.label}</span>
          </div>
        ))}

        {/* Top rule inline */}
        {data.topRules[0] && (
          <span className="ml-auto truncate text-[11px] text-slate-400 dark:text-zinc-500">
            Top: <span className="font-medium text-slate-600 dark:text-zinc-300">{data.topRules[0].ruleName}</span>
            <span className="ml-1 tabular-nums">×{data.topRules[0].count}</span>
          </span>
        )}
      </div>
    </div>
  )
}

export function AlertVolumeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 w-20 rounded-full" />)}
      </div>
      <Skeleton className="h-[180px] w-full rounded-lg" />
      <div className="flex gap-4 border-t border-slate-100 pt-2 dark:border-zinc-800">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-3 w-16" />)}
      </div>
    </div>
  )
}
