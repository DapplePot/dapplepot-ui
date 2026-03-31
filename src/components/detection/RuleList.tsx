import type { PolicyRule } from '@dapplepot/types/rule'
import { Toggle } from '../ui/toggle'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import { useUpdateRule } from '../../hooks/useRules'
import { cn } from '../../utils/cn'

interface RuleListProps {
  rules: PolicyRule[]
}

export function RuleList({ rules }: RuleListProps) {
  const updateRule = useUpdateRule()

  const handleToggle = (rule: PolicyRule) => {
    updateRule.mutate({ ruleId: rule.ruleId, data: { enabled: !rule.enabled } })
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Eval</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Enabled</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rules.map((rule) => (
            <tr
              key={rule.ruleId}
              className={cn(
                'transition-opacity',
                !rule.enabled && 'opacity-45'
              )}
            >
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-slate-800">{rule.name}</p>
                <p className="text-xs text-slate-400 font-mono">{rule.ruleId.slice(0, 8)}</p>
              </td>
              <td className="px-4 py-3">
                <Badge variant="secondary">{rule.ruleType}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline">{rule.evalType}</Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <Toggle
                  checked={rule.enabled}
                  onCheckedChange={() => handleToggle(rule)}
                  aria-label={`Toggle ${rule.name}`}
                />
              </td>
            </tr>
          ))}
          {rules.length === 0 && (
            <tr>
              <td colSpan={4} className="py-10 text-center text-sm text-slate-400">
                No rules configured
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function RuleListSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-50">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16 ml-auto" />
        </div>
      ))}
    </div>
  )
}
