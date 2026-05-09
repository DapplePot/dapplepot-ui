import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useSessionList } from '../hooks/useSessions'
import { useAgents } from '../hooks/useAgents'
import { useSessionFilters } from '../stores/sessionFilters'
import { SessionTable, SessionTableSkeleton } from '../components/sessions/SessionTable'
import { SessionFilters } from '../components/sessions/SessionFilters'
import { SessionPagination } from '../components/sessions/SessionPagination'

type SortKey = 'startedAt' | 'durationMs' | 'status' | 'agentId'
type SortDir = 'asc' | 'desc'

function ErrorCard({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
      <span>{message}</span>
      <button onClick={retry} className="text-red-600 underline dark:text-red-400">Retry</button>
    </div>
  )
}

export function Sessions() {
  const search = useSearch({ from: '/sessions' })
  const navigate = useNavigate({ from: '/sessions' })
  const page = search.page ?? 1

  const [sort, setSort] = useState<SortKey>('startedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const { status, agentId, environment, dateRange, searchQuery } = useSessionFilters()

  const { data: agentsData } = useAgents()
  const agentMap = Object.fromEntries(
    (agentsData ?? []).map((a) => [a.agentId, a.name])
  )

  const { data, isLoading, isError, error, refetch } = useSessionList({
    page,
    limit: 20,
    sort: `${sort}:${sortDir}`,
    status: status || undefined,
    agentId: agentId || undefined,
    environment: environment || undefined,
    since: dateRange === '24h' ? new Date(Date.now() - 86_400_000).toISOString()
         : dateRange === '7d'  ? new Date(Date.now() - 7 * 86_400_000).toISOString()
         : dateRange === '30d' ? new Date(Date.now() - 30 * 86_400_000).toISOString()
         : undefined,
    q: searchQuery || undefined,
  })

  const handleSort = (key: SortKey) => {
    if (sort === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(key)
      setSortDir('desc')
    }
    void navigate({ search: { page: 1 } })
  }

  const handlePage = (p: number) => {
    void navigate({ search: { page: p } })
  }

  const agents = (agentsData ?? []).map((a) => ({ value: a.agentId, label: a.name }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Sessions
          {data && (
            <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">
              {data.total}
            </span>
          )}
        </h1>
      </div>

      <SessionFilters
        agents={agents}
        onFiltersChange={() => void navigate({ search: { page: 1 } })}
      />

      {isLoading ? (
        <SessionTableSkeleton />
      ) : isError ? (
        <ErrorCard message={(error as Error).message} retry={() => void refetch()} />
      ) : (
        <>
          <SessionTable
            sessions={data?.data ?? []}
            sort={sort}
            sortDir={sortDir}
            onSort={handleSort}
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
