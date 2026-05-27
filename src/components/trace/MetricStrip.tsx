import type { SessionDetail, TraceEvent } from '@dapplepot/types/session'
import { formatDuration, formatTokens } from '../../utils/format'
import { Skeleton } from '../ui/skeleton'
import { useAgentLlmModels } from '../../hooks/useAgentLlmModels'

interface MetricStripProps {
  session: SessionDetail
  events: TraceEvent[]
}

function deriveMetrics(events: TraceEvent[]) {
  let totalInputTokens  = 0
  let totalOutputTokens = 0

  for (const e of events) {
    if (e.eventType !== 'llm_end') continue
    totalInputTokens  += e.llmInputTokens
    totalOutputTokens += e.llmOutputTokens
  }

  return {
    totalInputTokens,
    totalOutputTokens,
    toolCallCount: events.filter(e => e.eventType === 'tool_end').length,
    nodeCount:     events.filter(e => e.eventType === 'node_start').length,
  }
}

function formatCost(usd: number): string {
  if (usd >= 1)    return `$${usd.toFixed(2)}`
  if (usd >= 0.01) return `$${usd.toFixed(4)}`
  return `$${usd.toFixed(6)}`
}

export function MetricStrip({ session, events }: MetricStripProps) {
  const live = deriveMetrics(events)

  const { data: agentModels = [] } = useAgentLlmModels(session.agentId ?? '')

  // Build model → pricing map from connected LLM inventory
  const priceMap = new Map<string, { in: number; out: number }>(
    agentModels
      .filter(m => m.inputCostPer1k != null || m.outputCostPer1k != null)
      .map(m => [m.name, { in: m.inputCostPer1k ?? 0, out: m.outputCostPer1k ?? 0 }])
  )

  // Compute session cost — prefer live events (post-fix sessions have llmModel set),
  // fall back to session.tokenUsage.byModel for older/pre-fix sessions.
  let sessionCost: number | null = null
  if (priceMap.size > 0) {
    for (const e of events) {
      if (e.eventType !== 'llm_end' || !e.llmModel) continue
      const p = priceMap.get(e.llmModel)
      if (!p) continue
      if (sessionCost === null) sessionCost = 0
      sessionCost += (e.llmInputTokens / 1000) * p.in + (e.llmOutputTokens / 1000) * p.out
    }
    if (sessionCost === null) {
      for (const { model, inputTokens, outputTokens } of session.tokenUsage.byModel) {
        const p = priceMap.get(model)
        if (!p) continue
        if (sessionCost === null) sessionCost = 0
        sessionCost += (inputTokens / 1000) * p.in + (outputTokens / 1000) * p.out
      }
    }
  }

  const metrics = [
    {
      label: 'Duration',
      value: session.durationMs != null ? formatDuration(session.durationMs) : '—',
    },
    {
      label: 'Tokens in',
      value: formatTokens(live.totalInputTokens || session.tokenUsage.totalInputTokens),
    },
    {
      label: 'Tokens out',
      value: formatTokens(live.totalOutputTokens || session.tokenUsage.totalOutputTokens),
    },
    {
      label: 'Cost',
      value: sessionCost != null ? formatCost(sessionCost) : '—',
    },
    {
      label: 'Tool calls',
      value: live.toolCallCount || session.executionSummary.toolCallCount,
    },
    {
      label: 'Nodes',
      value: live.nodeCount || session.executionSummary.nodeCount,
    },
  ]

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="grid grid-cols-6 divide-x divide-slate-100 dark:divide-zinc-800">
        {metrics.map((m) => (
          <div key={m.label} className="px-4 py-3">
            <p className="text-xs text-slate-500 dark:text-zinc-400">{m.label}</p>
            <p className="mt-0.5 text-lg font-semibold text-slate-900 dark:text-zinc-100">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MetricStripSkeleton() {
  return (
    <div className="grid grid-cols-6 divide-x divide-slate-100 rounded-lg border border-slate-200 bg-white dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-900">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-4 py-3 space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  )
}
