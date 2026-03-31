import { Link } from '@tanstack/react-router'
import type { AlertSummary } from '@dapplepot/types/alert'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { useUpdateAlertStatus } from '../../hooks/useAlerts'
import { formatAgo } from '../../utils/format'
import { X } from 'lucide-react'

interface AlertDrawerProps {
  alert: AlertSummary
  onClose: () => void
}

export function AlertDrawer({ alert, onClose }: AlertDrawerProps) {
  const updateStatus = useUpdateAlertStatus()

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: 'Agent',           value: alert.agentId ?? '—' },
    { label: 'Session',         value: alert.sessionId ? (
      <Link to="/sessions/$id" params={{ id: alert.sessionId }} className="font-mono text-xs text-violet-600 hover:underline">
        {alert.sessionId.slice(0, 8)}
      </Link>
    ) : '—' },
    { label: 'Rule',            value: alert.ruleName },
    { label: 'Rule type',       value: alert.ruleType },
    { label: 'Status',          value: alert.status },
    { label: 'Triggered',       value: formatAgo(alert.triggeredAt) },
    { label: 'Resolved',        value: alert.resolvedAt ? formatAgo(alert.resolvedAt) : '—' },
  ]

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="font-medium text-slate-900">{alert.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{alert.message}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="divide-y divide-slate-50 px-4">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-3 py-2">
            <span className="w-24 shrink-0 text-xs font-medium text-slate-500">{label}</span>
            <span className="text-xs text-slate-800">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
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
        {alert.sessionId && (
          <Link to="/sessions/$id" params={{ id: alert.sessionId }}>
            <Button size="sm" variant="ghost">View trace ↗</Button>
          </Link>
        )}
        <Badge
          className="ml-auto"
          variant={
            alert.severity === 'critical' ? 'destructive'
            : alert.severity === 'warning' ? 'warning'
            : alert.severity === 'medium' ? 'warning'
            : 'info'
          }
        >
          {alert.severity}
        </Badge>
      </div>
    </div>
  )
}
