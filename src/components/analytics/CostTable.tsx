import { useNavigate } from '@tanstack/react-router'
import type { CostPoint } from '@dapplepot/types/analytics'
import { useSessionFilters } from '../../stores/sessionFilters'
import { formatTokens, formatCost } from '../../utils/format'
import { Skeleton } from '../ui/skeleton'

interface CostTableProps {
  data: CostPoint[]
}

export function CostTable({ data }: CostTableProps) {
  const navigate = useNavigate()
  const setAgentId = useSessionFilters((s) => s.setAgentId)

  const total = data.reduce((sum, d) => sum + d.estimatedCostUsd, 0)

  const handleRowClick = (agentId: string) => {
    setAgentId(agentId)
    void navigate({ to: '/sessions' })
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Agent</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Tokens</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Est. cost</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Share of spend</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row) => {
            const share = total > 0 ? row.estimatedCostUsd / total : 0
            return (
              <tr
                key={row.agentId}
                onClick={() => handleRowClick(row.agentId)}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3 text-xs text-slate-700">{row.agentId}</td>
                <td className="px-4 py-3 text-right text-xs text-slate-600">
                  {formatTokens(row.totalTokens)}
                </td>
                <td className="px-4 py-3 text-right text-xs font-medium text-slate-900">
                  {formatCost(row.estimatedCostUsd)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" style={{ width: 56 }}>
                      <div
                        className="h-full rounded-full bg-violet-400"
                        style={{ width: `${share * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{(share * 100).toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            )
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                No cost data
              </td>
            </tr>
          )}
        </tbody>
        {total > 0 && (
          <tfoot className="border-t border-slate-200">
            <tr>
              <td className="px-4 py-3 text-xs font-medium text-slate-500">Total</td>
              <td className="px-4 py-3 text-right text-xs text-slate-600">
                {formatTokens(data.reduce((s, d) => s + d.totalTokens, 0))}
              </td>
              <td className="px-4 py-3 text-right text-xs font-semibold text-slate-900">
                {formatCost(total)}
              </td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

export function CostTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-50">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-16 ml-auto" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}
