import { Link } from '@tanstack/react-router'
import type { SessionSummary } from '@dapplepot/types/session'
import { TableRow, TableCell } from '../ui/table'
import { StatusBadge } from './StatusBadge'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { formatAgo, formatDuration } from '../../utils/format'
import { ChevronRight, ChevronDown } from 'lucide-react'

interface SessionRowProps {
  session: SessionSummary
  isExpanded: boolean
  onToggle: () => void
  agentName?: string
}

export function SessionRow({ session, isExpanded, onToggle, agentName }: SessionRowProps) {
  return (
    <>
      <TableRow
        onClick={onToggle}
        className="cursor-pointer"
        data-state={isExpanded ? 'selected' : undefined}
      >
        <TableCell>
          <div className="flex items-center gap-1.5">
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            )}
            <span className="font-mono text-xs text-slate-700">
              {session.sessionId.slice(0, 8)}…
            </span>
          </div>
        </TableCell>
        <TableCell className="text-xs text-slate-600">
          {agentName ?? '—'}
        </TableCell>
        <TableCell>
          <StatusBadge status={session.status} />
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="text-xs">
            {session.environment}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-slate-500">
          {session.startedAt ? formatAgo(session.startedAt) : '—'}
        </TableCell>
        <TableCell className="text-xs text-slate-600">
          {session.durationMs != null ? formatDuration(session.durationMs) : '—'}
        </TableCell>
        <TableCell>
          <TokenBar sessionId={session.sessionId} />
        </TableCell>
        <TableCell className="text-xs text-slate-600 text-right">
          {session.alertCount > 0 && (
            <span className="mr-2 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-600">
              {session.alertCount}
            </span>
          )}
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-slate-50 hover:bg-slate-50">
          <TableCell colSpan={8} className="px-6 py-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-500">Session ID</p>
                <p className="mt-0.5 font-mono text-xs text-slate-800 break-all">
                  {session.sessionId}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">User context</p>
                <p className="mt-0.5 font-mono text-xs text-slate-800">
                  {session.userContextId ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Deployment</p>
                <p className="mt-0.5 font-mono text-xs text-slate-800">
                  {session.deploymentId ?? '—'}
                </p>
              </div>
              {session.status === 'terminated' && (
                <div>
                  <p className="text-xs font-medium text-slate-500">Exit reason</p>
                  <p className="mt-0.5 text-xs text-red-600 font-medium">
                    {session.exitReason === 'security_terminated'
                      ? 'Security policy'
                      : session.exitReason === 'error'
                      ? 'Node error'
                      : session.exitReason ?? '—'}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-3">
              <Link to="/sessions/$id" params={{ id: session.sessionId }}>
                <Button size="sm" variant="outline">
                  Open trace ↗
                </Button>
              </Link>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

/** Inline token bar — visual only, no data fetch needed here */
function TokenBar(_props: { sessionId: string }) {  // eslint-disable-line @typescript-eslint/no-unused-vars
  return <span className="text-xs text-slate-400">—</span>
}
