import { Link } from '@tanstack/react-router'
import type { AlertSummary } from '@dapplepot/types/alert'
import type { OwSignalStatus } from '@dapplepot/types/security'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { useAlertDeliveries } from '../../hooks/useAlertDeliveries'
import DeliveryStatusList from '../detection/DeliveryStatusList'
import { formatAgo } from '../../utils/format'
import { Link2, ShieldAlert, TrendingDown, TrendingUp, Minus, X } from 'lucide-react'
import { useAgents } from '../../hooks/useAgents'
import { useAlertDetail, useUpdateAlertStatus } from '../../hooks/useAlerts'

interface AlertDrawerProps {
  alert: AlertSummary
  onClose: () => void
}

const ATTACK_CHAIN_LABELS: Record<string, string> = {
  indirect_injection_to_exfil:  'Injection → Exfiltration',
  prompt_injection_to_agency:   'Injection → Rogue Agency',
  pii_exfil_chain:              'PII Exfiltration Chain',
  tool_abuse_to_exfil:          'Tool Abuse → Exfiltration',
  trust_fraud:                  'Trust Fraud',
  cascade_rogue:                'Cascade Rogue Agency',
  supply_chain_to_injection:    'Supply Chain → Injection',
}

function SecurityDetail({ payload }: { payload: Record<string, unknown> }) {
  const llmScore            = payload['llm_score'] as number | undefined
  const llmBand             = payload['llm_band'] as string | undefined
  const asiScore            = payload['asi_score'] as number | undefined
  const asiBand             = payload['asi_band'] as string | undefined
  const summary             = payload['summary'] as Record<string, number> | undefined
  const trustScore          = payload['trust_score'] as number | undefined
  const trustTrend          = payload['trust_trend'] as string | undefined
  const attackChains        = payload['attack_chains_detected'] as string[] | undefined
  const amplification       = payload['amplification'] as number | undefined
  const confidenceBand      = payload['confidence_band'] as string | undefined

  const topFindings = payload['top_findings'] as Array<{
    owasp_signal_id: string; sub_check_id: string; check_label: string
    severity: string; detail: string | null; check_score?: number
    confidence_tier?: string; effective_score?: number
  }> | undefined

  const llmSignalStatus = payload['llm_signal_status'] as Record<string, OwSignalStatus> | undefined
  const asiSignalStatus = payload['asi_signal_status'] as Record<string, OwSignalStatus> | undefined

  const triggerContext  = payload['trigger_context'] as {
    threshold_signals?: Array<{ sig_id: string; effective_score: number; threshold: number }>
  } | undefined
  const thresholdMap = Object.fromEntries(
    (triggerContext?.threshold_signals ?? []).map((s) => [s.sig_id, s])
  )

  const BAND_COLOR: Record<string, string> = {
    critical: 'text-red-600 dark:text-red-400',
    high:     'text-orange-500 dark:text-orange-400',
    warning:  'text-amber-500 dark:text-amber-400',
    medium:   'text-orange-400 dark:text-orange-300',
    low:      'text-blue-500 dark:text-blue-400',
    clean:    'text-green-600 dark:text-green-400',
    info:     'text-blue-400 dark:text-blue-300',
  }

  // Collect fired signal IDs
  const firedSignalIds: string[] = [
    ...Object.entries(llmSignalStatus ?? {}).filter(([, v]) => v.status === 'fired').map(([k]) => k),
    ...Object.entries(asiSignalStatus ?? {}).filter(([, v]) => v.status === 'fired').map(([k]) => k),
  ]

  const hasChains = attackChains && attackChains.length > 0

  return (
    <div className="border-t border-slate-100 px-4 py-3 space-y-3 dark:border-zinc-800">
      {/* Score row */}
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">LLM Risk</p>
          <p className={`text-lg font-semibold ${BAND_COLOR[llmBand ?? ''] ?? 'text-slate-800 dark:text-zinc-200'}`}>
            {llmScore ?? '—'}<span className="text-xs font-normal text-slate-400 dark:text-zinc-500">/100</span>
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 capitalize">{llmBand}</p>
          {confidenceBand && (
            <p className="text-xs text-slate-400 dark:text-zinc-500">confidence: <span className="font-medium">{confidenceBand}</span></p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Agent Risk (ASI)</p>
          <p className={`text-lg font-semibold ${BAND_COLOR[asiBand ?? ''] ?? 'text-slate-800 dark:text-zinc-200'}`}>
            {asiScore ?? '—'}<span className="text-xs font-normal text-slate-400 dark:text-zinc-500">/100</span>
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 capitalize">{asiBand}</p>
          {amplification !== undefined && amplification > 1.0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <Link2 className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">×{amplification.toFixed(2)} chain</span>
            </div>
          )}
        </div>
        {trustScore !== undefined && (
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Trust</p>
            <p className="text-lg font-semibold text-slate-800 dark:text-zinc-200">
              {Math.round(trustScore)}<span className="text-xs font-normal text-slate-400 dark:text-zinc-500">/100</span>
            </p>
            {trustTrend && (
              <div className="flex items-center gap-1">
                {trustTrend === 'improving'
                  ? <TrendingUp className="h-3 w-3 text-green-500" />
                  : trustTrend === 'degrading'
                  ? <TrendingDown className="h-3 w-3 text-red-500" />
                  : <Minus className="h-3 w-3 text-slate-400" />}
                <span className="text-xs text-slate-400 dark:text-zinc-500 capitalize">{trustTrend}</span>
              </div>
            )}
          </div>
        )}
        {summary && (
          <div className="ml-auto text-right self-start">
            <p className="text-xs text-slate-400 dark:text-zinc-500">{summary['llm_signals_fired']} LLM · {summary['asi_signals_fired']} Agent signals fired</p>
          </div>
        )}
      </div>

      {/* Attack chains */}
      {hasChains && (
        <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Attack chains detected</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {attackChains!.map(chain => (
              <span key={chain} className="rounded-full bg-orange-100 border border-orange-200 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300">
                {ATTACK_CHAIN_LABELS[chain] ?? chain}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top findings */}
      {topFindings && topFindings.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-zinc-400">Top findings</p>
          <div className="space-y-1">
            {topFindings.map((f) => (
              <div key={`${f.owasp_signal_id}:${f.sub_check_id}`} className="flex items-start gap-2 rounded bg-slate-50 px-2 py-1.5 dark:bg-zinc-800">
                <span className="font-mono text-xs text-violet-600 dark:text-violet-400 shrink-0">{f.owasp_signal_id}:{f.sub_check_id}</span>
                <span className="text-xs text-slate-700 dark:text-zinc-300 flex-1">{f.check_label ?? f.detail}</span>
                {f.confidence_tier && (
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 shrink-0 dark:bg-blue-900/30 dark:text-blue-300">
                    {f.confidence_tier}
                  </span>
                )}
                {f.check_score !== undefined && (
                  <span className="font-mono text-xs text-slate-500 dark:text-zinc-400 shrink-0">
                    {f.check_score}
                    {f.effective_score !== undefined && f.effective_score !== f.check_score && (
                      <span className="text-slate-300 dark:text-zinc-600"> →{Math.round(f.effective_score)}</span>
                    )}
                  </span>
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
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-zinc-400">Fired signals</p>
          <div className="flex flex-wrap gap-1">
            {firedSignalIds.map((id) => {
              const thr = thresholdMap[id]
              return (
                <span key={id} className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 font-mono text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  {id}
                  {thr && (
                    <span className="text-red-400 dark:text-red-500">
                      [{thr.effective_score} ≥ {thr.threshold}]
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const ACTION_BADGE: Record<string, string> = {
  terminate_session: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
  sanitize:          'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
  alert:             'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
}
const ACTION_LABEL: Record<string, string> = {
  terminate_session: 'terminated',
  sanitize:          'sanitized',
  alert:             'alert',
}

function OnlineDetectionsDetail({ payload }: { payload: Record<string, unknown> }) {
  const detections = payload['detections'] as Array<{
    sub_check_id:        string
    owasp_signal_id:     string
    check_label:         string
    check_score:         number
    effective_score:     number
    confidence_tier:     string
    severity:            string
    category:            string
    action_taken:        string
    matched_text:        string | null
    trigger_event_id:    string | null
    trigger_event_type:  string | null
    triggered_at:        string | null
  }> | undefined

  const actionCounts      = payload['action_counts']      as Record<string, number> | undefined
  const sessionStartedAt  = payload['session_started_at'] as string | null | undefined

  if (!detections || detections.length === 0) return null

  const SEVERITY_COLOR: Record<string, string> = {
    critical: 'text-red-600 dark:text-red-400',
    high:     'text-orange-500 dark:text-orange-400',
    medium:   'text-amber-500 dark:text-amber-400',
    low:      'text-blue-500 dark:text-blue-400',
  }

  return (
    <div className="border-t border-slate-100 px-4 py-3 space-y-3 dark:border-zinc-800">
      {/* Action counts summary */}
      {actionCounts && Object.keys(actionCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(actionCounts).map(([action, count]) => (
            <span
              key={action}
              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${ACTION_BADGE[action] ?? ACTION_BADGE['alert']}`}
            >
              <span>{ACTION_LABEL[action] ?? action}</span>
              <span className="opacity-60">×{count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Per-detection list */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
          Online findings ({detections.length})
        </p>
        <div className="space-y-1.5">
          {detections.map((d) => (
            <div
              key={`${d.owasp_signal_id}:${d.sub_check_id}:${d.trigger_event_id ?? ''}`}
              className="rounded border border-slate-100 bg-slate-50 px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-800/50"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${ACTION_BADGE[d.action_taken] ?? ACTION_BADGE['alert']}`}>
                  {ACTION_LABEL[d.action_taken] ?? d.action_taken}
                </span>
                <span className="font-mono text-xs text-violet-600 dark:text-violet-400 shrink-0">
                  {d.owasp_signal_id}:{d.sub_check_id}
                </span>
                <span className="text-xs text-slate-700 dark:text-zinc-300 flex-1">{d.check_label}</span>
                <span className={`text-xs font-medium shrink-0 ${SEVERITY_COLOR[d.severity] ?? 'text-slate-500 dark:text-zinc-400'}`}>
                  {d.severity}
                </span>
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 shrink-0 dark:bg-blue-900/30 dark:text-blue-300">
                  {d.confidence_tier}
                </span>
                <span className="font-mono text-xs text-slate-400 dark:text-zinc-500 shrink-0">
                  {d.check_score}
                  {d.effective_score !== d.check_score && (
                    <span className="text-slate-300 dark:text-zinc-600"> →{d.effective_score}</span>
                  )}
                </span>
              </div>
              {(d.trigger_event_type || d.triggered_at) && (() => {
                const relMs = sessionStartedAt && d.triggered_at
                  ? new Date(d.triggered_at).getTime() - new Date(sessionStartedAt).getTime()
                  : null
                return (
                  <p className="mt-0.5 font-mono text-[10px] text-slate-300 dark:text-zinc-600">
                    · {relMs !== null ? `+${relMs}ms` : ''}{d.trigger_event_type ? ` ${d.trigger_event_type}` : ''}
                  </p>
                )
              })()}
              {d.matched_text && (
                <p className="mt-1 truncate font-mono text-[10px] text-slate-400 dark:text-zinc-500">
                  {d.matched_text}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AlertDrawer({ alert, onClose }: AlertDrawerProps) {
  const updateStatus = useUpdateAlertStatus()
  const { data: detail } = useAlertDetail(alert.alertId)
  const { data: deliveryData, isLoading: deliveriesLoading } = useAlertDeliveries(alert.alertId)
  const { data: agentsData } = useAgents()
  const agentMap = Object.fromEntries((agentsData ?? []).map((a) => [a.agentId, a.name]))

  const isSecurityAlert = alert.ruleType === 'security_risk'
  const isOnlineAlert   = alert.ruleType === 'online_security_summary'

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: 'Agent',      value: alert.agentId ? (agentMap[alert.agentId] ?? alert.agentId) : '—' },
    { label: 'Session',    value: alert.sessionId ? (
      <Link to="/sessions/$id" params={{ id: alert.sessionId }} className="font-mono text-xs text-violet-600 hover:underline dark:text-violet-400">
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
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div
        onClick={onClose}
        className="flex cursor-pointer items-start justify-between border-b border-slate-100 px-4 py-3 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
      >
        <div>
          <p className="font-medium text-slate-900 dark:text-zinc-100">{alert.title}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{alert.message}</p>
        </div>
        <X className="h-4 w-4 shrink-0 text-slate-400" />
      </div>

      <div className="divide-y divide-slate-50 px-4 dark:divide-zinc-800">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-3 py-2">
            <span className="w-24 shrink-0 text-xs font-medium text-slate-500 dark:text-zinc-400">{label}</span>
            <span className="text-xs text-slate-800 dark:text-zinc-300">{value}</span>
          </div>
        ))}
      </div>
      {deliveryData && <DeliveryStatusList deliveries={deliveryData.deliveries} loading={deliveriesLoading} />}

      {isSecurityAlert && detail && (
        <SecurityDetail payload={detail.payload} />
      )}

      {isOnlineAlert && detail && (
        <OnlineDetectionsDetail payload={detail.payload} />
      )}

      <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 dark:border-zinc-800">
        {alert.status === 'open' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateStatus.mutate({ alertId: alert.alertId, status: 'acknowledged' })}
            disabled={updateStatus.isPending}
            className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
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
            className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
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
