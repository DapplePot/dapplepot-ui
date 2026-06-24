import { useMemo, useRef } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useTenantGrowth } from '../../hooks/useTenants'
import { useUserGrowth } from '../../hooks/useUsers'
import { useThemeStore } from '../../stores/theme'
import { Skeleton } from '../ui/skeleton'

const TENANT_SERIES = {
  total:        { label: 'Total',        color: '#7C3AED' },
  organization: { label: 'Organization', color: '#2563EB' },
  personal:     { label: 'Personal',     color: '#10B981' },
} as const

const USER_SERIES = {
  total:        { label: 'Total',        color: '#EA580C' },
  organization: { label: 'Organization', color: '#0891B2' },
  self:         { label: 'Self-signup',  color: '#DB2777' },
} as const

// Module-level flag: animate each chart only the first time it renders in
// this page-load session. Subsequent navigations back to Overview skip the
// sweep so it feels instant.
let hasAnimatedOnce = false

function formatMonth(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString(undefined, { month: 'short', year: '2-digit' })
}

export function SuperAdminHome() {
  const { theme } = useThemeStore()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const tenantGrowth = useTenantGrowth()
  const userGrowth = useUserGrowth()
  const animateRef = useRef(!hasAnimatedOnce)

  const tenantData = useMemo(
    () => (tenantGrowth.data ?? []).map(p => ({ ...p, month: formatMonth(p.month) })),
    [tenantGrowth.data]
  )
  const userData = useMemo(
    () => (userGrowth.data ?? []).map(p => ({ ...p, month: formatMonth(p.month) })),
    [userGrowth.data]
  )

  const chartTheme = {
    gridStroke:   isDark ? '#27272a' : '#f1f5f9',
    tickColor:    isDark ? '#a1a1aa' : '#64748b',
    tooltipStyle: isDark
      ? { fontSize: 12, backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f4f4f5' }
      : { fontSize: 12 },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Overview</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          System-wide growth across tenants and users.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GrowthChartCard
          title="Tenant growth"
          series={TENANT_SERIES}
          data={tenantData}
          isLoading={tenantGrowth.isLoading}
          error={tenantGrowth.error}
          emptyMessage="No tenants yet."
          gradientPrefix="tenant"
          animate={animateRef.current}
          theme={chartTheme}
        />
        <GrowthChartCard
          title="User growth"
          series={USER_SERIES}
          data={userData}
          isLoading={userGrowth.isLoading}
          error={userGrowth.error}
          emptyMessage="No users yet."
          gradientPrefix="user"
          animate={animateRef.current}
          theme={chartTheme}
        />
      </div>
    </div>
  )
}

interface SeriesDef {
  label: string
  color: string
}

interface GrowthChartCardProps {
  title:           string
  series:          Record<string, SeriesDef>
  data:            Array<Record<string, string | number>>
  isLoading:       boolean
  error:           Error | null
  emptyMessage:    string
  gradientPrefix:  string
  animate:         boolean
  theme: {
    gridStroke:   string
    tickColor:    string
    tooltipStyle: Record<string, unknown>
  }
}

function GrowthChartCard({
  title, series, data, isLoading, error, emptyMessage, gradientPrefix, animate, theme,
}: GrowthChartCardProps) {
  return (
    <div className="rounded border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-slate-700 dark:text-zinc-300">{title}</h2>
      </div>
      <div className="p-4">
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : error ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-red-600 dark:text-red-400">
            {error.message}
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-slate-500 dark:text-zinc-400">
            {emptyMessage}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                {Object.entries(series).map(([key, s]) => (
                  <linearGradient key={key} id={`grad-${gradientPrefix}-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={s.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme.tickColor }} />
              <YAxis tick={{ fontSize: 11, fill: theme.tickColor }} allowDecimals={false} width={36} />
              <Tooltip contentStyle={theme.tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {Object.entries(series).map(([key, s]) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#grad-${gradientPrefix}-${key})`}
                  activeDot={{ r: 4 }}
                  isAnimationActive={animate}
                  onAnimationEnd={() => { hasAnimatedOnce = true }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
