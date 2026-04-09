import { useState } from 'react'
import type { AlertSummary } from '@dapplepot/types/alert'
import { AlertDrawer } from './AlertDrawer'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import { useAlertFilters } from '../../stores/alertFilters'
import { formatAgo } from '../../utils/format'
import { cn } from '../../utils/cn'
import { useAgents } from '../../hooks/useAgents'

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  warning:  'bg-amber-500',
  medium:   'bg-orange-400',
  info:     'bg-blue-400',
}

type AlertSeverity = 'info' | 'warning' | 'medium' | 'critical' | ''
type AlertSource   = 'security' | 'policy' | ''

const SEVERITY_PILLS: { value: AlertSeverity; label: string }[] = [
  { value: '',         label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'warning',  label: 'Warning' },
  { value: 'medium',   label: 'Medium' },
  { value: 'info',     label: 'Info' },
]

const SOURCE_PILLS: { value: AlertSource; label: string }[] = [
  { value: '',          label: 'All sources' },
  { value: 'security',  label: 'Security' },
  { value: 'policy',    label: 'Policy' },
]

interface AlertFeedProps {
  alerts: AlertSummary[]
}

export function AlertFeed({ alerts }: AlertFeedProps) {
  const { severity, setSeverity, source, setSource } = useAlertFilters()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: agentsData } = useAgents()
  const agentMap = Object.fromEntries((agentsData ?? []).map((a) => [a.agentId, a.name]))

  return (
    <div className="space-y-3">
      {/* Severity pills */}
      <div className="flex flex-wrap gap-1">
        {SEVERITY_PILLS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSeverity(value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              severity === value
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 self-center text-slate-300">|</span>
        {SOURCE_PILLS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSource(value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              source === value
                ? 'bg-violet-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {alerts.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No alerts</div>
        ) : (
          alerts.map((alert) =>
            alert.alertId === selectedId ? (
              <AlertDrawer
                key={alert.alertId}
                alert={alert}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <div
                key={alert.alertId}
                onClick={() => setSelectedId(alert.alertId)}
                className="flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
              >
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[alert.severity] ?? 'bg-slate-400'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{alert.title}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {alert.agentId ? (agentMap[alert.agentId] ?? alert.agentId) : '—'} · {alert.ruleName}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-slate-400">{formatAgo(alert.triggeredAt)}</span>
                  <Badge
                    variant={
                      alert.status === 'resolved' ? 'success'
                      : alert.status === 'acknowledged' ? 'warning'
                      : 'outline'
                    }
                  >
                    {alert.status}
                  </Badge>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  )
}

export function AlertFeedSkeleton() {
  return (
    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <Skeleton className="mt-1 h-2 w-2 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}
