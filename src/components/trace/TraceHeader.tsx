import type { SessionDetail } from '@dapplepot/types/session'
import { StatusBadge } from '../sessions/StatusBadge'
import { Button } from '../ui/button'
import { useKillSwitch } from '../../hooks/useControl'
import { Link } from '@tanstack/react-router'

interface TraceHeaderProps {
  session: SessionDetail
  alertCount: number
}

export function TraceHeader({ session, alertCount }: TraceHeaderProps) {
  const killSwitch = useKillSwitch()

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4">
      <div className="min-w-0">
        <p className="font-mono text-sm font-semibold text-slate-900 break-all">
          {session.sessionId}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {session.agentId}
          {session.agentVersion && ` · v${session.agentVersion}`}
          {` · ${session.environment}`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={session.status} />

        {alertCount > 0 && (
          <Link to="/detection">
            <Button variant="outline" size="sm">
              Alerts ({alertCount}) ↗
            </Button>
          </Link>
        )}

        <Button
          variant="destructive"
          size="sm"
          disabled={session.status !== 'open' || killSwitch.isPending}
          onClick={() => killSwitch.mutate(session.sessionId)}
        >
          Kill session
        </Button>
      </div>
    </div>
  )
}
