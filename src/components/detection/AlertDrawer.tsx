import { Link } from '@tanstack/react-router'
import type { AlertSummary } from '@dapplepot/types/alert'
import type { OwSignalStatus } from '@dapplepot/types/security'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { useUpdateAlertStatus, useAlertDetail } from '../../hooks/useAlerts'
import { formatAgo } from '../../utils/format'
import { X } from 'lucide-react'
import { useAgents } from '../../hooks/useAgents'

interface AlertDrawerProps {
  alert: AlertSummary
  onClose: () => void
}

function SecurityDetail({ payload }: { payload: Record<string, unknown> }) {
  const llmScore       = payload['llm_score'] as number | undefined
  const llmBand        = payload['llm_band'] as string | undefined
  const asiScore       = payload['asi_score'] as number | undefined
  const asiBand        = payload['asi_band'] as string | undefined
  const summary        = payload['summary'] as Record<string, number> | undefined

  const topFindings = payload['top_findings'] as Array<{
    owasp_signal_id: string; sub_check_id: string; check_label: string
    severity: string; detail: string | null; check_score?: number
  }> | undefined

  const llmSignalStatus = payload['llm_signal_status'] as Record<string, OwSignalStatus> | undefined
  const asiSignalStatus = payload['asi_signal_status'] as Record<string, OwSignalStatus> | undefined

  const BAND_COLOR: Record<string, string> = {
    critical: 'text-red-600',
    high:     'text-orange-500',
    warning:  'text-amber-500',
    medium:   'text-orange-400',
    low:      'text-blue-500',
    clean:    'text-green-600',
    info:     'text-blue-400',
  }

  // Collect fired signal IDs
  const firedSignalIds: string[] = [
    ...Object.entries(llmSignalStatus ?? {}).filter(([, v]) => v.status === 'fired').map(([k]) => k),
    ...Object.entries(asiSignalStatus ?? {}).filter(([, v]) => v.status === 'fired').map(([k]) => k),
  ]

  return (
    <div className="border-t border-slate-100 px-4 py-3 space-y-3">
      {/* Score row */}
      <div className="flex gap-6">
        <div>
          <p className="text-xs font-medium text-slate-500">LLM Risk</p>
          <p className={`text-lg font-semibold ${BAND_COLOR[llmBand ?? ''] ?? 'text-slate-800'}`}>
            {llmScore ?? '—'}<span className="text-xs font-normal text-slate-400">/100</span>
          </p>
          <p className="text-xs text-slate-400 capitalize">{llmBand}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Agent Risk (ASI)</p>
          <p className={`text-lg font-semibold ${BAND_COLOR[asiBand ?? ''] ?? 'text-slate-800'}`}>
            {asiScore ?? '—'}<span className="text-xs font-normal text-slate-400">/100</span>
          </p>
          <p className="text-xs text-slate-400 capitalize">{asiBand}</p>
        </div>
        {summary && (
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-400">{summary['llm_signals_fired']} LLM · {summary['asi_signals_fired']} Agent signals fired</p>
          </div>
        )}
      </div>

      {/* Top findings */}
      {topFindings && topFindings.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Top findings</p>
          <div className="space-y-1">
            {topFindings.map((f) => (
              <div key={`${f.owasp_signal_id}:${f.sub_check_id}`} className="flex items-start gap-2 rounded bg-slate-50 px-2 py-1.5">
                <span className="font-mono text-xs text-violet-600 shrink-0">{f.owasp_signal_id}:{f.sub_check_id}</span>
                <span className="text-xs text-slate-700 flex-1">{f.check_label ?? f.detail}</span>
                {f.check_score !== undefined && (
                  <span className="font-mono text-xs text-slate-500 shrink-0">{f.check_score}</span>
                )}
                <Badge variant={f.severity === 'critical' ? 'destructive' : 'warning'}>{f.severity}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fired signals */}
      {firedSignalIds.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Fired signals</p>
          <div className="flex flex-wrap gap-1">
            {firedSignalIds.map((id) => (
              <span key={id} className="rounded bg-red-50 px-1.5 py-0.5 font-mono text-xs text-red-700">
                {id}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function AlertDrawer({ alert, onClose }: AlertDrawerProps) {
  const updateStatus = useUpdateAlertStatus()
  const { data: detail } = useAlertDetail(alert.alertId)
  const { data: agentsData } = useAgents()
  const agentMap = Object.fromEntries((agentsData ?? []).map((a) => [a.agentId, a.name]))

  const isSecurityAlert = alert.ruleType === 'security_risk'

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: 'Agent',      value: alert.agentId ? (agentMap[alert.agentId] ?? alert.agentId) : '—' },
    { label: 'Session',    value: alert.sessionId ? (
      <Link to="/sessions/$id" params={{ id: alert.sessionId }} className="font-mono text-xs text-violet-600 hover:underline">
        {alert.sessionId.slice(0, 8)}
      </Link>
    ) : '—' },
    { label: 'Rule',       value: alert.ruleName },
    { label: 'Rule type',  value: alert.ruleType },
    { label: 'Status',     value: alert.status },
    { label: 'Triggered',  value: formatAgo(alert.triggeredAt) },
    { label: 'Resolved',   value: alert.resolvedAt ? formatAgo(alert.resolvedAt) : '—' },
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

      {isSecurityAlert && detail && (
        <SecurityDetail payload={detail.payload} />
      )}

      <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
        {alert.status === 'open' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateStatus.mutate({ alertId: alert.alertId, status: 'acknowledged' })}
            disabled={updateStatus.isPending}
            className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
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
            className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          >
            Resolve
          </Button>
        )}
        {alert.sessionId && (
          <Link to="/sessions/$id" params={{ id: alert.sessionId }}>
            <Button size="sm" variant="outline">View trace ↗</Button>
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
