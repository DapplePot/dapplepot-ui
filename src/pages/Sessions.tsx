import { useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useSessionList } from '../hooks/useSessions'
import { useAgents } from '../hooks/useAgents'
import { useSessionFilters } from '../stores/sessionFilters'
import { SessionTable, SessionTableSkeleton } from '../components/sessions/SessionTable'
import { SessionFilters } from '../components/sessions/SessionFilters'
import { SessionPagination } from '../components/sessions/SessionPagination'

function ErrorCard({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="rounded border border-red-100 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
      <span>{message}</span>
      <button onClick={retry} className="text-red-600 underline dark:text-red-400">Retry</button>
    </div>
  )
}

export function Sessions() {
  const search = useSearch({ from: '/sessions' })
  const navigate = useNavigate({ from: '/sessions' })
  const page = search.page ?? 1

  const {
    status, agentId, environment, dateRange, searchQuery,
    hasAlerts, signalId, subCheckId,
    setAgentId, setHasAlerts, setSignalId, setSubCheckId,
  } = useSessionFilters()

  // Seed store from URL search params so deep links from the security page work.
  // On unmount, clear filters so they don't bleed into the next visit to /sessions.
  useEffect(() => {
    if (search.hasAlerts !== undefined)  setHasAlerts(search.hasAlerts)
    if (search.signalId   !== undefined) setSignalId(search.signalId)
    if (search.subCheckId !== undefined) setSubCheckId(search.subCheckId)
    if (search.agentId    !== undefined) setAgentId(search.agentId)
    return () => {
      useSessionFilters.getState().clearFilters()
    }
  // Run once on mount — subsequent changes flow store → URL via SessionFilters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: agentsData } = useAgents()
  const agentMap = Object.fromEntries(
    (agentsData ?? []).map((a) => [a.agentId, a.name])
  )

  const { data, isLoading, isError, error, refetch } = useSessionList({
    page,
    limit: 20,
    status: status || undefined,
    agentId: agentId || undefined,
    environment: environment || undefined,
    since: dateRange === '24h' ? new Date(Date.now() - 86_400_000).toISOString()
         : dateRange === '7d'  ? new Date(Date.now() - 7 * 86_400_000).toISOString()
         : dateRange === '30d' ? new Date(Date.now() - 30 * 86_400_000).toISOString()
         : undefined,
    q: searchQuery || undefined,
    hasAlerts: hasAlerts || undefined,
    signalId: signalId || undefined,
    subCheckId: subCheckId || undefined,
  })

  const handlePage = (p: number) => {
    void navigate({ search: (prev) => ({ ...prev, page: p }) })
  }

  const agents = (agentsData ?? []).map((a) => ({ value: a.agentId, label: a.name }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
          Sessions
          {data && (
            <span className="ml-2 text-sm font-normal text-slate-400 dark:text-zinc-500">
              {data.total}
            </span>
          )}
        </h1>
      </div>

      <SessionFilters
        agents={agents}
        onFiltersChange={() => void navigate({
          search: () => {
            // Read latest store state — closure values may be stale here.
            const s = useSessionFilters.getState()
            const next: { page: number; hasAlerts?: boolean; signalId?: string; subCheckId?: string; agentId?: string } = { page: 1 }
            if (s.hasAlerts)  next.hasAlerts  = true
            if (s.signalId)   next.signalId   = s.signalId
            if (s.subCheckId) next.subCheckId = s.subCheckId
            if (s.agentId)    next.agentId    = s.agentId
            return next
          },
        })}
      />

      {isLoading ? (
        <SessionTableSkeleton />
      ) : isError ? (
        <ErrorCard message={(error as Error).message} retry={() => void refetch()} />
      ) : (
        <>
          <SessionTable
            sessions={data?.data ?? []}
            agentMap={agentMap}
          />
          <SessionPagination
            page={page}
            totalPages={data?.totalPages ?? 1}
            total={data?.total ?? 0}
            onPage={handlePage}
          />
        </>
      )}
    </div>
  )
}
