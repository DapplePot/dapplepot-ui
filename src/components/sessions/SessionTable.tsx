import { useState } from 'react'
import type { SessionSummary } from '@dapplepot/types/session'
import {
  Table, TableHeader, TableBody, TableRow, TableHead,
} from '../ui/table'
import { Skeleton } from '../ui/skeleton'
import { SessionRow } from './SessionRow'

interface SessionTableProps {
  sessions: SessionSummary[]
  agentMap?: Record<string, string>
}

const COLUMNS = [
  'Session ID',
  'Agent',
  'Status',
  'Env',
  'Ended',
  'Duration',
  'Alerts',
]

export function SessionTable({ sessions, agentMap = {} }: SessionTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div className="rounded border border-slate-200 bg-white overflow-hidden dark:border-zinc-700 dark:bg-zinc-900">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
            {COLUMNS.map((label) => (
              <TableHead key={label}>{label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <SessionRow
              key={session.sessionId}
              session={session}
              isExpanded={expandedId === session.sessionId}
              onToggle={() => toggle(session.sessionId)}
              agentName={session.agentId ? (agentMap[session.agentId] ?? session.agentId.slice(0, 8)) : undefined}
            />
          ))}
          {sessions.length === 0 && (
            <TableRow>
              <td colSpan={7} className="py-12 text-center text-sm text-slate-400 dark:text-zinc-500">
                No sessions found
              </td>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function SessionTableSkeleton() {
  return (
    <div className="rounded border border-slate-200 bg-white overflow-hidden dark:border-zinc-700 dark:bg-zinc-900">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
        <Skeleton className="h-4 w-32" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-50 dark:border-zinc-800">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  )
}
