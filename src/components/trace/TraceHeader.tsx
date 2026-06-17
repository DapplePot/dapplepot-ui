import { Download } from 'lucide-react'
import type { SessionDetail } from '@dapplepot/types/session'
import { StatusBadge } from '../sessions/StatusBadge'
import { useAgents } from '../../hooks/useAgents'
import { useAuthStore } from '../../stores/auth'
import { useDownloadSessionReport } from '../../hooks/useAudit'

interface TraceHeaderProps {
  session: SessionDetail
  alertCount: number
}

export function TraceHeader({ session }: TraceHeaderProps) {
  const { data: agentsData } = useAgents()
  const agentMap   = Object.fromEntries((agentsData ?? []).map((a) => [a.agentId, a.name]))
  const userRole   = useAuthStore((s) => s.user?.role)
  const dlSession  = useDownloadSessionReport()

  return (
    <div className="flex items-start justify-between gap-4 rounded border border-slate-200 bg-white px-5 py-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="min-w-0">
        <p className="font-mono text-sm font-semibold text-slate-900 break-all dark:text-zinc-100">
          {session.sessionId}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
          {session.agentId ? (agentMap[session.agentId] ?? session.agentId) : '—'}
          {session.agentVersion && ` · v${session.agentVersion}`}
          {session.environment && ` · ${session.environment}`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={session.status} />
        {userRole === 'admin' && (
          <button
            onClick={() => dlSession.mutate({ sessionId: session.sessionId })}
            disabled={dlSession.isPending}
            title="Download audit report"
            className="flex items-center gap-1.5 rounded border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:border-violet-300 hover:text-violet-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-violet-600 dark:hover:text-violet-400"
          >
            <Download className="h-3.5 w-3.5" />
            {dlSession.isPending ? 'Exporting…' : 'Export'}
          </button>
        )}
      </div>
    </div>
  )
}
