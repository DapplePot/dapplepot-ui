import type { SessionSummary } from '@dapplepot/types/session'
import type { TrustTrend } from '../../types/security'
import { Skeleton } from '../ui/skeleton'
import { useAgents } from '../../hooks/useAgents'
import { useTopAgents } from '../../hooks/useSecurity'

function trustColor(score: number): string {
  if (score >= 71) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 41) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function trustBg(score: number): string {
  if (score >= 71) return 'bg-emerald-50 dark:bg-emerald-900/20'
  if (score >= 41) return 'bg-amber-50 dark:bg-amber-900/20'
  return 'bg-red-50 dark:bg-red-900/20'
}

function TrendIcon({ trend }: { trend: TrustTrend | undefined }) {
  if (trend === 'improving') return <span className="text-emerald-500 text-xs">↑</span>
  if (trend === 'degrading') return <span className="text-red-500 text-xs">↓</span>
  return <span className="text-slate-400 text-xs">→</span>
}

interface AgentHealthProps {
  liveSessions: SessionSummary[]
}

export function AgentHealth({ liveSessions }: AgentHealthProps) {
  const { data: topAgents, isLoading } = useTopAgents()
  const { data: agentsData } = useAgents()

  const agentMap = Object.fromEntries((agentsData ?? []).map((a) => [a.agentId, a.name]))

  const activeByAgent = liveSessions.reduce<Record<string, number>>((acc, s) => {
    if (s.status === 'open' && s.agentId) {
      acc[s.agentId] = (acc[s.agentId] ?? 0) + 1
    }
    return acc
  }, {})

  if (isLoading) return <AgentHealthSkeleton />

  const agents = [...(topAgents ?? [])].sort(
    (a, b) => new Date(b.lastScoredAt).getTime() - new Date(a.lastScoredAt).getTime()
  )

  if (agents.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
        No agent data
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {agents.map((agent) => {
        const name = agentMap[agent.agentId] ?? agent.agentId
        const activeSessions = activeByAgent[agent.agentId] ?? 0
        const score = agent.trustScore

        return (
          <div key={agent.agentId} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                activeSessions > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />

            <span className="min-w-0 flex-1 truncate text-xs text-slate-700 dark:text-slate-300">{name}</span>

            {activeSessions > 0 && (
              <span className="shrink-0 text-xs font-medium text-slate-600 dark:text-slate-400">{activeSessions} active</span>
            )}

            {score !== undefined ? (
              <span className={`flex items-center gap-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${trustColor(score)} ${trustBg(score)}`}>
                Trust {score}
                <TrendIcon trend={agent.trustTrend} />
              </span>
            ) : (
              <span className="shrink-0 rounded px-1.5 py-0.5 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 dark:text-slate-500">
                No trust score
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function AgentHealthSkeleton() {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-5 w-12 rounded" />
          <Skeleton className="h-5 w-10 rounded" />
        </div>
      ))}
    </div>
  )
}
