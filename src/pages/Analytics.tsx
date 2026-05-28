import { useState } from 'react'
import {
  useOverview,
  useLlmUsage,
  useLatency,
  useCost,
  useAlertStats,
  useSessionFunnel,
  useAgentSessions,
  useTrends,
} from '../hooks/useAnalytics'
import { DateRangePicker } from '../components/analytics/DateRangePicker'
import { TokenChart, TokenChartSkeleton } from '../components/analytics/TokenChart'
import { LatencyChart, LatencyChartSkeleton } from '../components/analytics/LatencyChart'
import { CostTable, CostTableSkeleton } from '../components/analytics/CostTable'
import { SessionFunnelChart, SessionFunnelSkeleton } from '../components/analytics/SessionFunnelChart'
import { AlertVolumeChart, AlertVolumeSkeleton } from '../components/analytics/AlertVolumeChart'
import { AgentUsageChart, AgentUsageSkeleton } from '../components/analytics/AgentUsageChart'
import { Sparkline } from '../components/ui/Sparkline'
import { formatCost } from '../utils/format'

type Window = '24h' | '7d' | '30d'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-slate-700 dark:text-zinc-300">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function ErrorMsg({ message }: { message: string }) {
  return <p className="py-4 text-center text-sm text-red-500 dark:text-red-400">{message}</p>
}

export function Analytics() {
  const [window, setWindow] = useState<Window>('24h')
  const [agentId, setAgentId] = useState('')

  const overview     = useOverview(window)
  const funnel       = useSessionFunnel(window)
  const llmUsage     = useLlmUsage(window, agentId || undefined)
  const latency      = useLatency(window, agentId || undefined)
  const cost          = useCost(window)
  const trends        = useTrends(window)
  const agentSessions = useAgentSessions(window)
  const alertStats    = useAlertStats(window)

  const totalCost = (cost.data ?? []).reduce((s, d) => s + d.estimatedCostUsd, 0)

  const completionRate = overview.data && overview.data.totalSessions > 0
    ? ((overview.data.completedSessions / overview.data.totalSessions) * 100).toFixed(1)
    : null

  function fmtDuration(ms: number) {
    if (!ms) return '—'
    if (ms < 1000)  return `${ms.toFixed(3)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    const m = Math.floor(ms / 60000)
    const s = Math.round((ms % 60000) / 1000)
    return `${m}m ${s}s`
  }

  const heroMetrics = overview.data
    ? [
        { label: 'Total sessions',      value: overview.data.totalSessions.toLocaleString() },
        { label: 'Completion rate',     value: completionRate != null ? `${completionRate}%` : '—' },
        { label: 'Avg session duration', value: fmtDuration(overview.data.avgLatencyMs) },
        { label: 'Estimated cost',      value: formatCost(totalCost) },
      ]
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Analytics</h1>
        <DateRangePicker
          window={window}
          agentId={agentId}
          agents={(agentSessions.data ?? []).map(a => ({ id: a.agentId, name: a.agentName }))}
          onWindowChange={setWindow}
          onAgentChange={setAgentId}
        />
      </div>

      {heroMetrics && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { ...heroMetrics[0], trend: (trends.data ?? []).map(t => t.sessionCount),  color: '#7F77DD', id: 'a-sessions' },
            { ...heroMetrics[1], trend: (trends.data ?? []).map(t => t.sessionCount),  color: '#1D9E75', id: 'a-completion' },
            { ...heroMetrics[2], trend: (trends.data ?? []).map(t => t.avgLatencyMs),  color: '#f59e0b', id: 'a-duration' },
            { ...heroMetrics[3], trend: (trends.data ?? []).map(t => t.tokenCount),    color: '#7F77DD', id: 'a-cost' },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900 flex flex-col">
              <p className="text-xs text-slate-500 dark:text-zinc-400">{m.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-zinc-100">{m.value}</p>
              <div className="mt-3">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">{window}</span>
                <div className="-mx-1">
                  <Sparkline data={m.trend} color={m.color} id={m.id} height={28} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card title="Session funnel">
        {funnel.isLoading ? <SessionFunnelSkeleton /> :
         funnel.isError   ? <ErrorMsg message={funnel.error.message} /> :
         funnel.data      ? <SessionFunnelChart data={funnel.data} /> :
         null}
      </Card>


      <div className="grid grid-cols-2 gap-6">
        <Card title="Agent usage">
          {agentSessions.isLoading ? <AgentUsageSkeleton /> :
           agentSessions.isError   ? <ErrorMsg message={agentSessions.error.message} /> :
           <AgentUsageChart data={agentSessions.data ?? []} />}
        </Card>
        <Card title="Alert volume by severity">
          {alertStats.isLoading ? <AlertVolumeSkeleton /> :
           alertStats.isError   ? <ErrorMsg message={alertStats.error.message} /> :
           alertStats.data      ? <AlertVolumeChart data={alertStats.data} /> :
           null}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Token usage by model">
          {llmUsage.isLoading ? <TokenChartSkeleton /> :
           llmUsage.isError   ? <ErrorMsg message={llmUsage.error.message} /> :
           <TokenChart data={llmUsage.data ?? []} />}
        </Card>
        <Card title="Latency (avg / p95)">
          {latency.isLoading ? <LatencyChartSkeleton /> :
           latency.isError   ? <ErrorMsg message={latency.error.message} /> :
           <LatencyChart data={latency.data ?? []} />}
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-zinc-300">Cost attribution</h2>
        {cost.isLoading ? <CostTableSkeleton /> :
         cost.isError   ? <ErrorMsg message={cost.error.message} /> :
         <CostTable
           data={cost.data ?? []}
           agentMap={Object.fromEntries(
             (agentSessions.data ?? [])
               .filter((a) => a.agentName)
               .map((a) => [a.agentId, a.agentName!])
           )}
         />}
      </div>
    </div>
  )
}
