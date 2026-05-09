import { useState } from 'react'
import {
  useOverview,
  useLlmUsage,
  useErrorRates,
  useLatency,
  useCost,
  useSecurityAnalytics,
  useAlertStats,
} from '../hooks/useAnalytics'
import { DateRangePicker } from '../components/analytics/DateRangePicker'
import { TokenChart, TokenChartSkeleton } from '../components/analytics/TokenChart'
import { ErrorRateChart, ErrorRateChartSkeleton } from '../components/analytics/ErrorRateChart'
import { LatencyChart, LatencyChartSkeleton } from '../components/analytics/LatencyChart'
import { CostTable, CostTableSkeleton } from '../components/analytics/CostTable'
import { SessionFunnelChart, SessionFunnelSkeleton } from '../components/analytics/SessionFunnelChart'
import { SecurityBandChart, SecurityBandSkeleton } from '../components/analytics/SecurityBandChart'
import { OWASPFrequencyChart, OWASPFrequencySkeleton } from '../components/analytics/OWASPFrequencyChart'
import { AlertVolumeChart, AlertVolumeSkeleton } from '../components/analytics/AlertVolumeChart'
import { formatCost } from '../utils/format'

type Window = '24h' | '7d' | '30d'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</h2>
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
  const llmUsage     = useLlmUsage(window, agentId || undefined)
  const errorRates   = useErrorRates(window, agentId || undefined)
  const latency      = useLatency(window, agentId || undefined)
  const cost         = useCost(window)
  const security     = useSecurityAnalytics(window)
  const alertStats   = useAlertStats(window)

  const agents = Array.from(
    new Set((errorRates.data ?? []).map((d) => d.agentId).filter(Boolean))
  )

  const totalCost = (cost.data ?? []).reduce((s, d) => s + d.estimatedCostUsd, 0)

  const completionRate = overview.data && overview.data.totalSessions > 0
    ? ((overview.data.completedSessions / overview.data.totalSessions) * 100).toFixed(1)
    : null

  const highCriticalPct = security.data && security.data.sessionsScored > 0
    ? ((security.data.highCriticalCount / security.data.sessionsScored) * 100).toFixed(1)
    : null

  const heroMetrics = overview.data
    ? [
        { label: 'Total sessions',   value: overview.data.totalSessions.toLocaleString() },
        { label: 'Completion rate',  value: completionRate != null ? `${completionRate}%` : '—' },
        { label: 'High+critical',    value: highCriticalPct != null ? `${highCriticalPct}%` : '—' },
        { label: 'Estimated cost',   value: formatCost(totalCost) },
      ]
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Analytics</h1>
        <DateRangePicker
          window={window}
          agentId={agentId}
          agents={agents}
          onWindowChange={setWindow}
          onAgentChange={setAgentId}
        />
      </div>

      {heroMetrics && (
        <div className="grid grid-cols-4 gap-4">
          {heroMetrics.map((m) => (
            <div key={m.label} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs text-slate-500 dark:text-slate-400">{m.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      <Card title="Session funnel">
        {overview.isLoading ? <SessionFunnelSkeleton /> :
         overview.isError   ? <ErrorMsg message={overview.error.message} /> :
         overview.data      ? <SessionFunnelChart data={overview.data} /> :
         null}
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Risk band distribution">
          {security.isLoading ? <SecurityBandSkeleton /> :
           security.isError   ? <ErrorMsg message={security.error.message} /> :
           security.data      ? (
             <SecurityBandChart
               bandDistribution={security.data.bandDistribution}
               sessionsScored={security.data.sessionsScored}
               highCriticalCount={security.data.highCriticalCount}
             />
           ) : null}
        </Card>
        <Card title="OWASP signal frequency">
          {security.isLoading ? <OWASPFrequencySkeleton /> :
           security.isError   ? <ErrorMsg message={security.error.message} /> :
           security.data      ? (
             <OWASPFrequencyChart
               llmFrequency={security.data.owaspFrequency}
               asiFrequency={security.data.asiFrequency}
             />
           ) : null}
        </Card>
      </div>

      <Card title="Alert volume by severity">
        {alertStats.isLoading ? <AlertVolumeSkeleton /> :
         alertStats.isError   ? <ErrorMsg message={alertStats.error.message} /> :
         alertStats.data      ? <AlertVolumeChart data={alertStats.data} /> :
         null}
      </Card>

      <Card title="Token usage by model">
        {llmUsage.isLoading ? <TokenChartSkeleton /> :
         llmUsage.isError   ? <ErrorMsg message={llmUsage.error.message} /> :
         <TokenChart data={llmUsage.data ?? []} />}
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Error rate by agent">
          {errorRates.isLoading ? <ErrorRateChartSkeleton /> :
           errorRates.isError   ? <ErrorMsg message={errorRates.error.message} /> :
           <ErrorRateChart data={errorRates.data ?? []} />}
        </Card>
        <Card title="Latency (avg / p95)">
          {latency.isLoading ? <LatencyChartSkeleton /> :
           latency.isError   ? <ErrorMsg message={latency.error.message} /> :
           <LatencyChart data={latency.data ?? []} />}
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Cost attribution</h2>
        {cost.isLoading ? <CostTableSkeleton /> :
         cost.isError   ? <ErrorMsg message={cost.error.message} /> :
         <CostTable data={cost.data ?? []} />}
      </div>
    </div>
  )
}
