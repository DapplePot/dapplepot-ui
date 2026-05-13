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
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            )}
            <span className="font-mono text-xs text-slate-700 dark:text-zinc-300">
              {session.sessionId.slice(0, 8)}…
            </span>
          </div>
        </TableCell>
        <TableCell className="text-xs text-slate-600 dark:text-zinc-400">
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
        <TableCell className="text-xs text-slate-500 dark:text-zinc-400">
          {session.startedAt ? formatAgo(session.startedAt) : '—'}
        </TableCell>
        <TableCell className="text-xs text-slate-600 dark:text-zinc-400">
          {session.durationMs != null ? formatDuration(session.durationMs) : '—'}
        </TableCell>
        <TableCell>
          <TokenBar sessionId={session.sessionId} />
        </TableCell>
        <TableCell className="text-xs text-slate-600 text-right dark:text-zinc-400">
          {session.alertCount > 0 && (
            <span className="mr-2 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {session.alertCount}
            </span>
          )}
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-slate-50 hover:bg-slate-50 dark:bg-zinc-800/50 dark:hover:bg-zinc-800/50">
          <TableCell colSpan={8} className="px-6 py-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Session ID</p>
                <p className="mt-0.5 font-mono text-xs text-slate-800 break-all dark:text-zinc-200">
                  {session.sessionId}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">User context</p>
                <p className="mt-0.5 font-mono text-xs text-slate-800 dark:text-zinc-200">
                  {session.userContextId ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Deployment</p>
                <p className="mt-0.5 font-mono text-xs text-slate-800 dark:text-zinc-200">
                  {session.deploymentId ?? '—'}
                </p>
              </div>
              {session.status === 'terminated' && (
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Exit reason</p>
                  <p className="mt-0.5 text-xs text-red-600 font-medium dark:text-red-400">
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

function TokenBar(_props: { sessionId: string }) {
  return <span className="text-xs text-slate-400 dark:text-zinc-500">—</span>
}
