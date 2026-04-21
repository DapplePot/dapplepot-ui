import type { SessionDetail } from '@dapplepot/types/session'
import { formatAgo, formatDuration } from '../../utils/format'
import { useAgents } from '../../hooks/useAgents'

interface SessionInfoTabProps {
  session: SessionDetail
}

const EXIT_REASON_LABELS: Record<string, string> = {
  error:                'Node error',
  security_terminated:  'Security policy',
}

function exitReasonLabel(reason: string): string {
  return EXIT_REASON_LABELS[reason] ?? reason
}

export function SessionInfoTab({ session }: SessionInfoTabProps) {
  const { data: agentsData } = useAgents()
  const agentMap = Object.fromEntries((agentsData ?? []).map((a) => [a.agentId, a.name]))

  const rows: { label: string; value: string | number | null }[] = [
    { label: 'Session ID',    value: session.sessionId },
    { label: 'Status',        value: session.status },
    { label: 'Agent',         value: session.agentId ? (agentMap[session.agentId] ?? session.agentId) : null },
    { label: 'Version',       value: session.agentVersion },
    { label: 'Environment',   value: session.environment },
    { label: 'Deployment',    value: session.deploymentId },
    { label: 'User context',  value: session.userContextId },
    { label: 'Started',       value: session.startedAt ? formatAgo(session.startedAt) : '—' },
    { label: 'Ended',         value: session.endedAt ? formatAgo(session.endedAt) : '—' },
    { label: 'Duration',      value: session.durationMs != null ? formatDuration(session.durationMs) : '—' },
    { label: 'LLM calls',     value: session.tokenUsage.llmCallCount },
    { label: 'Nodes visited', value: session.executionSummary.nodesVisited.join(', ') || '—' },
    { label: 'Error count',   value: session.executionSummary.errorCount },
  ]

  return (
    <div className="divide-y divide-slate-100">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex gap-3 py-2">
          <span className="w-32 shrink-0 text-xs font-medium text-slate-500">{label}</span>
          <span className="min-w-0 break-all font-mono text-xs text-slate-800">
            {value ?? '—'}
          </span>
        </div>
      ))}

      {session.exitReason && (
        <div className="flex gap-3 py-2">
          <span className="w-32 shrink-0 text-xs font-medium text-slate-500">Exit reason</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-red-600">
              {exitReasonLabel(session.exitReason)}
            </span>
            <span className="font-mono text-xs text-slate-400">
              {session.exitReason}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
