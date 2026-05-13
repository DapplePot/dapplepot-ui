import { useRef, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { SessionSummary } from '@dapplepot/types/session'
import { Skeleton } from '../ui/skeleton'
import { formatAgo } from '../../utils/format'
import { cn } from '../../utils/cn'
import { useAgents } from '../../hooks/useAgents'

const MIN_RETAIN_MS = 10_000  // minimum hold time after a session ends

const STATUS_DOT: Record<string, string> = {
  open:       'bg-emerald-500',
  stub:       'bg-slate-400',
  finalised:  'bg-slate-500',
  terminated: 'bg-orange-500',
  error:      'bg-red-600',
}

function byStartedDesc(a: SessionSummary, b: SessionSummary): number {
  return (new Date(b.startedAt ?? 0).getTime()) - (new Date(a.startedAt ?? 0).getTime())
}

interface SessionFeedProps {
  sessions: SessionSummary[]
}

export function SessionFeed({ sessions }: SessionFeedProps) {
  const { data: agentsData } = useAgents()
  const agentMap = Object.fromEntries((agentsData ?? []).map((a) => [a.agentId, a.name]))

  // displayRef is the source of truth — a Map so we get stable insertion/update without churn.
  const displayRef = useRef<Map<string, SessionSummary>>(new Map())
  // Per-session removal timers (started when a session leaves the live list).
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const [displaySessions, setDisplaySessions] = useState<SessionSummary[]>([])
  // IDs currently in the 5-second hold-open window (session ended but not yet removed).
  const [retainingIds, setRetainingIds] = useState<Set<string>>(new Set())
  // IDs that just appeared — flash blue for 800 ms.
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const liveIds = new Set(sessions.map((s) => s.sessionId))
    const newIds: string[] = []

    // Add new sessions; update existing ones and cancel any pending removal timer.
    for (const s of sessions) {
      if (!displayRef.current.has(s.sessionId)) newIds.push(s.sessionId)
      displayRef.current.set(s.sessionId, s)

      const t = timers.current.get(s.sessionId)
      if (t !== undefined) {
        clearTimeout(t)
        timers.current.delete(s.sessionId)
        setRetainingIds((prev) => { const n = new Set(prev); n.delete(s.sessionId); return n })
      }
    }

    // Start a removal timer for sessions that just left the live list.
    // Hold for max(10s, session_length) so short sessions aren't invisible blinks.
    for (const id of displayRef.current.keys()) {
      if (!liveIds.has(id) && !timers.current.has(id)) {
        const s = displayRef.current.get(id)!
        const sessionLengthMs = s.durationMs
          ?? (s.startedAt ? Date.now() - new Date(s.startedAt).getTime() : 0)
        const retainMs = Math.max(MIN_RETAIN_MS, sessionLengthMs)

        setRetainingIds((prev) => new Set([...prev, id]))
        const t = setTimeout(() => {
          displayRef.current.delete(id)
          timers.current.delete(id)
          setRetainingIds((prev) => { const n = new Set(prev); n.delete(id); return n })
          setDisplaySessions([...displayRef.current.values()].sort(byStartedDesc))
        }, retainMs)
        timers.current.set(id, t)
      }
    }

    setDisplaySessions([...displayRef.current.values()].sort(byStartedDesc))

    if (newIds.length > 0) {
      setFlashIds(new Set(newIds))
      const flashTimer = setTimeout(() => setFlashIds(new Set()), 800)
      return () => clearTimeout(flashTimer)
    }
  }, [sessions])

  // Clean up all timers on unmount.
  useEffect(() => {
    return () => {
      for (const t of timers.current.values()) clearTimeout(t)
    }
  }, [])

  if (displaySessions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400 dark:text-zinc-500">
        No live sessions
      </div>
    )
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800/50">
        <span className="w-2 shrink-0" />
        <span className="flex-1 text-xs font-medium text-slate-400 uppercase tracking-wide dark:text-zinc-500">Session / Agent</span>
        <span className="w-20 shrink-0 text-xs font-medium text-slate-400 uppercase tracking-wide dark:text-zinc-500">Status</span>
        <span className="w-16 shrink-0 text-right text-xs font-medium text-slate-400 uppercase tracking-wide dark:text-zinc-500">Started</span>
      </div>

      {/* Scrollable session list */}
      <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
        {displaySessions.map((session) => {
          const retaining = retainingIds.has(session.sessionId)
          return (
            <div
              key={session.sessionId}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 transition-all duration-300',
                flashIds.has(session.sessionId) && 'bg-blue-50 dark:bg-blue-950/30',
                retaining && 'opacity-40'
              )}
            >
              <span
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  STATUS_DOT[session.status] ?? 'bg-slate-400',
                  session.status === 'open' && !retaining && 'animate-pulse'
                )}
              />

              <div className="min-w-0 flex-1">
                <Link
                  to="/sessions/$id"
                  params={{ id: session.sessionId }}
                  className="font-mono text-xs text-slate-700 hover:text-violet-600 dark:text-zinc-300 dark:hover:text-violet-400"
                >
                  {session.sessionId.slice(0, 8)}
                </Link>
                {session.agentId && (
                  <span className="ml-2 text-xs text-slate-400 dark:text-zinc-500">
                    {agentMap[session.agentId] ?? session.agentId}
                  </span>
                )}
              </div>

              <span className="w-20 shrink-0 text-xs capitalize text-slate-500 dark:text-zinc-400">
                {retaining ? 'ended' : session.status}
              </span>

              <span className="w-16 shrink-0 text-right text-xs text-slate-400 dark:text-zinc-500">
                {session.startedAt ? formatAgo(session.startedAt) : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SessionFeedSkeleton() {
  return (
    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
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
