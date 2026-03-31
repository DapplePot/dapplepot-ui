import { useState } from 'react'
import type { SessionSummary } from '@dapplepot/types/session'
import {
  Table, TableHeader, TableBody, TableRow, TableHead,
} from '../ui/table'
import { Skeleton } from '../ui/skeleton'
import { SessionRow } from './SessionRow'

type SortKey = 'startedAt' | 'durationMs' | 'status' | 'agentId'
type SortDir = 'asc' | 'desc'

interface SessionTableProps {
  sessions: SessionSummary[]
  sort: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}

const COLUMNS: { key: SortKey | null; label: string }[] = [
  { key: null,        label: 'Session ID' },
  { key: 'agentId',   label: 'Agent' },
  { key: 'status',    label: 'Status' },
  { key: null,        label: 'Env' },
  { key: 'startedAt', label: 'Started' },
  { key: 'durationMs',label: 'Duration' },
  { key: null,        label: 'Tokens' },
  { key: null,        label: '' },
]

export function SessionTable({ sessions, sort, sortDir, onSort }: SessionTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map(({ key, label }) => (
              <TableHead
                key={label}
                className={key ? 'cursor-pointer select-none' : ''}
                onClick={key ? () => onSort(key) : undefined}
              >
                {label}
                {key && sort === key && (
                  <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableHead>
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
            />
          ))}
          {sessions.length === 0 && (
            <TableRow>
              <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
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
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <Skeleton className="h-4 w-32" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-50">
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
