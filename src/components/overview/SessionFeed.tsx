import { useRef, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { SessionSummary } from '@dapplepot/types/session'
import { Skeleton } from '../ui/skeleton'
import { formatAgo } from '../../utils/format'
import { cn } from '../../utils/cn'
import { useAgents } from '../../hooks/useAgents'

const STATUS_DOT: Record<string, string> = {
  open:        'bg-emerald-500',
  stub:        'bg-slate-400',
  finalised:   'bg-slate-500',
  error:       'bg-red-600',
}

interface SessionFeedProps {
  sessions: SessionSummary[]
}

export function SessionFeed({ sessions }: SessionFeedProps) {
  const { data: agentsData } = useAgents()
  const agentMap = Object.fromEntries((agentsData ?? []).map((a) => [a.agentId, a.name]))
  const prevIds = useRef<Set<string>>(new Set())
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const currentIds = new Set(sessions.map((s) => s.sessionId))
    const newOrChanged = sessions
      .filter((s) => !prevIds.current.has(s.sessionId))
      .map((s) => s.sessionId)

    if (newOrChanged.length > 0) {
      setFlashIds(new Set(newOrChanged))
      const timer = setTimeout(() => setFlashIds(new Set()), 800)
      prevIds.current = currentIds
      return () => clearTimeout(timer)
    }
    prevIds.current = currentIds
  }, [sessions])

  if (sessions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        No live sessions
      </div>
    )
  }

  return (
    <div>
      {/* Column header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2 bg-slate-50">
        <span className="w-2 shrink-0" />
        <span className="flex-1 text-xs font-medium text-slate-400 uppercase tracking-wide">Session / Agent</span>
        <span className="w-20 shrink-0 text-xs font-medium text-slate-400 uppercase tracking-wide">Status</span>
        <span className="w-16 shrink-0 text-right text-xs font-medium text-slate-400 uppercase tracking-wide">Started</span>
      </div>

      <div className="divide-y divide-slate-100">
        {sessions.slice(0, 20).map((session) => (
          <div
            key={session.sessionId}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 transition-colors',
              flashIds.has(session.sessionId) && 'bg-blue-50'
            )}
          >
            {/* Status dot — pulses for open sessions */}
            <span
              className={cn(
                'h-2 w-2 shrink-0 rounded-full',
                STATUS_DOT[session.status] ?? 'bg-slate-400',
                session.status === 'open' && 'animate-pulse'
              )}
            />

            <div className="min-w-0 flex-1">
              <Link
                to="/sessions/$id"
                params={{ id: session.sessionId }}
                className="font-mono text-xs text-slate-700 hover:text-violet-600"
              >
                {session.sessionId.slice(0, 8)}
              </Link>
              {session.agentId && (
                <span className="ml-2 text-xs text-slate-400">{agentMap[session.agentId] ?? session.agentId}</span>
              )}
            </div>

            <span className="w-20 shrink-0 text-xs capitalize text-slate-500">{session.status}</span>

            <span className="w-16 shrink-0 text-right text-xs text-slate-400">
              {session.startedAt ? formatAgo(session.startedAt) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SessionFeedSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}
