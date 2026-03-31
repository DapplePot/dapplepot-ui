import { useState } from 'react'
import { useOverview, useLlmUsage, useErrorRates, useLatency, useCost } from '../hooks/useAnalytics'
import { DateRangePicker } from '../components/analytics/DateRangePicker'
import { TokenChart, TokenChartSkeleton } from '../components/analytics/TokenChart'
import { ErrorRateChart, ErrorRateChartSkeleton } from '../components/analytics/ErrorRateChart'
import { LatencyChart, LatencyChartSkeleton } from '../components/analytics/LatencyChart'
import { CostTable, CostTableSkeleton } from '../components/analytics/CostTable'
import { formatTokens, formatLatency } from '../utils/format'

type Window = '24h' | '7d' | '30d'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-medium text-slate-700">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function ErrorMsg({ message }: { message: string }) {
  return <p className="py-4 text-center text-sm text-red-500">{message}</p>
}

export function Analytics() {
  const [window, setWindow] = useState<Window>('24h')
  const [agentId, setAgentId] = useState('')

  const overview = useOverview(window)
  const llmUsage = useLlmUsage(window, agentId || undefined)
  const errorRates = useErrorRates(window, agentId || undefined)
  const latency = useLatency(window, agentId || undefined)
  const cost = useCost(window)

  const agents = Array.from(
    new Set((errorRates.data ?? []).map((d) => d.agentId).filter(Boolean))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
        <DateRangePicker
          window={window}
          agentId={agentId}
          agents={agents}
          onWindowChange={setWindow}
          onAgentChange={setAgentId}
        />
      </div>

      {/* Summary metric cards */}
      {overview.data && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total sessions', value: overview.data.totalSessions },
            { label: 'LLM calls', value: overview.data.totalLlmCalls },
            { label: 'Total tokens', value: formatTokens(overview.data.totalInputTokens + overview.data.totalOutputTokens) },
            { label: 'p95 latency', value: formatLatency(overview.data.p95LatencyMs) },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">{m.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Token usage — full width */}
      <Card title="Token usage by model">
        {llmUsage.isLoading ? <TokenChartSkeleton /> :
         llmUsage.isError ? <ErrorMsg message={llmUsage.error.message} /> :
         <TokenChart data={llmUsage.data ?? []} />}
      </Card>

      {/* Error rate + latency side by side */}
      <div className="grid grid-cols-2 gap-6">
        <Card title="Error rate by agent">
          {errorRates.isLoading ? <ErrorRateChartSkeleton /> :
           errorRates.isError ? <ErrorMsg message={errorRates.error.message} /> :
           <ErrorRateChart data={errorRates.data ?? []} />}
        </Card>
        <Card title="Latency (avg / p95)">
          {latency.isLoading ? <LatencyChartSkeleton /> :
           latency.isError ? <ErrorMsg message={latency.error.message} /> :
           <LatencyChart data={latency.data ?? []} />}
        </Card>
      </div>

      {/* Cost attribution */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700">Cost attribution</h2>
        {cost.isLoading ? <CostTableSkeleton /> :
         cost.isError ? <ErrorMsg message={cost.error.message} /> :
         <CostTable data={cost.data ?? []} />}
      </div>
    </div>
  )
}
