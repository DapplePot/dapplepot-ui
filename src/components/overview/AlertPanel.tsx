import { Link } from '@tanstack/react-router'
import type { AlertSummary } from '@dapplepot/types/alert'
import { Skeleton } from '../ui/skeleton'
import { formatAgo } from '../../utils/format'
import { useAgents } from '../../hooks/useAgents'

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  warning:  'bg-amber-500',
  medium:   'bg-orange-400',
  info:     'bg-blue-400',
}

interface AlertPanelProps {
  alerts: AlertSummary[]
}

export function AlertPanel({ alerts }: AlertPanelProps) {
  const { data: agentsData } = useAgents()
  const agentMap = Object.fromEntries((agentsData ?? []).map((a) => [a.agentId, a.name]))

  if (alerts.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center text-sm text-slate-400 dark:text-zinc-500">
        No recent alerts
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
      {alerts.slice(0, 4).map((alert) => (
        <div key={alert.alertId} className="flex items-start gap-3 px-4 py-3">
          <span
            className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[alert.severity] ?? 'bg-slate-400'}`}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800 dark:text-zinc-200">{alert.title}</p>
            <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-zinc-500">
              {alert.agentId ? (agentMap[alert.agentId] ?? alert.agentId) : '—'} · {alert.ruleName}
            </p>
          </div>
          <span className="shrink-0 text-xs text-slate-400 dark:text-zinc-500">
            {formatAgo(alert.triggeredAt)}
          </span>
        </div>
      ))}
      <div className="px-4 py-2">
        <Link to="/detection" className="text-xs text-violet-600 hover:underline dark:text-violet-400">
          View all alerts →
        </Link>
      </div>
    </div>
  )
}

export function AlertPanelSkeleton() {
  return (
    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <Skeleton className="mt-0.5 h-2 w-2 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3 w-10 shrink-0" />
        </div>
      ))}
    </div>
  )
}
