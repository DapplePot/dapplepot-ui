import type { AlertSummary } from '@dapplepot/types/alert'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { useUpdateAlertStatus } from '../../hooks/useAlerts'
import { formatAgo } from '../../utils/format'

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  warning:  'bg-amber-500',
  medium:   'bg-orange-400',
  info:     'bg-blue-400',
}

interface AlertsTabProps {
  alerts: AlertSummary[]
}

export function AlertsTab({ alerts }: AlertsTabProps) {
  const updateStatus = useUpdateAlertStatus()

  if (alerts.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
        No alerts for this session
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div key={alert.alertId} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <div className="flex items-start gap-2">
            <span
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[alert.severity] ?? 'bg-slate-400'}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{alert.title}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{alert.ruleName} · {formatAgo(alert.triggeredAt)}</p>
            </div>
            <Badge
              variant={
                alert.status === 'resolved' ? 'success'
                : alert.status === 'acknowledged' ? 'warning'
                : 'outline'
              }
              className="shrink-0"
            >
              {alert.status}
            </Badge>
          </div>
          <div className="mt-2 flex gap-2">
            {alert.status === 'open' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus.mutate({ alertId: alert.alertId, status: 'acknowledged' })}
                disabled={updateStatus.isPending}
              >
                Acknowledge
              </Button>
            )}
            {alert.status !== 'resolved' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus.mutate({ alertId: alert.alertId, status: 'resolved' })}
                disabled={updateStatus.isPending}
              >
                Resolve
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
