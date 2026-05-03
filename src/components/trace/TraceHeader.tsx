import type { SessionDetail } from '@dapplepot/types/session'
import { StatusBadge } from '../sessions/StatusBadge'
import { useAgents } from '../../hooks/useAgents'

interface TraceHeaderProps {
  session: SessionDetail
  alertCount: number
}

export function TraceHeader({ session}: TraceHeaderProps) {
  const { data: agentsData } = useAgents()
  const agentMap = Object.fromEntries((agentsData ?? []).map((a) => [a.agentId, a.name]))

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4">
      <div className="min-w-0">
        <p className="font-mono text-sm font-semibold text-slate-900 break-all">
          {session.sessionId}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {session.agentId ? (agentMap[session.agentId] ?? session.agentId) : '—'}
          {session.agentVersion && ` · v${session.agentVersion}`}
          {session.environment && ` · ${session.environment}`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={session.status} />
      </div>
    </div>
  )
}
