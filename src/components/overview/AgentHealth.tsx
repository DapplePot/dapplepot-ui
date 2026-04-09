import type { ErrorRatePoint } from '@dapplepot/types/analytics'
import { Skeleton } from '../ui/skeleton'
import { useAgents } from '../../hooks/useAgents'

/** Non-linear scale: bar fills 100% at 15% error rate */
function toBarWidth(errorRate: number): number {
  return Math.min((errorRate / 0.15) * 100, 100)
}

function barColor(errorRate: number): string {
  if (errorRate > 0.08) return 'bg-red-500'
  if (errorRate > 0.04) return 'bg-amber-400'
  return 'bg-emerald-500'
}

interface AgentHealthProps {
  data: ErrorRatePoint[]
}

export function AgentHealth({ data }: AgentHealthProps) {
  const { data: agentsData } = useAgents()
  const agentMap = Object.fromEntries((agentsData ?? []).map((a) => [a.agentId, a.name]))

  // Aggregate per agent (sum across hours)
  const byAgent = data.reduce<Record<string, { errors: number; total: number }>>((acc, pt) => {
    if (!acc[pt.agentId]) acc[pt.agentId] = { errors: 0, total: 0 }
    acc[pt.agentId].errors += pt.errorCount
    acc[pt.agentId].total += pt.totalCount
    return acc
  }, {})

  const agents = Object.entries(byAgent).map(([agentId, { errors, total }]) => ({
    agentId,
    errorRate: total > 0 ? errors / total : 0,
  }))

  if (agents.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center text-sm text-slate-400">
        No agent data
      </div>
    )
  }

  return (
    <div className="space-y-3 px-4 py-3">
      {agents.map(({ agentId, errorRate }) => (
        <div key={agentId}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-slate-600 truncate max-w-[70%]">{agentMap[agentId] ?? agentId}</span>
            <span className="text-xs font-medium text-slate-700">
              {(errorRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${barColor(errorRate)}`}
              style={{ width: `${toBarWidth(errorRate)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AgentHealthSkeleton() {
  return (
    <div className="space-y-3 px-4 py-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-1.5 w-full" />
        </div>
      ))}
    </div>
  )
}
