import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useSecurityOverview, useTopAgents } from '../hooks/useSecurity'
import { useAgents } from '../hooks/useAgents'
import { RiskDistribution } from '../components/security/RiskDistribution'
import { OwaspFrequency } from '../components/security/OwaspFrequency'
import { HighRiskTable } from '../components/security/HighRiskTable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Skeleton } from '../components/ui/skeleton'

type Tab = 'sessions' | 'agents'

const RISK_COLORS: Record<string, string> = {
  clean:    '#10b981',
  low:      '#60a5fa',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
}

export function Security() {
  const [tab, setTab] = useState<Tab>('sessions')
  const navigate = useNavigate()

  const overview  = useSecurityOverview()
  const topAgents = useTopAgents()
  const { data: agentsData } = useAgents()
  const agentMap = Object.fromEntries((agentsData ?? []).map((a) => [a.agentId, a.name]))

  const handleSelectSession = (id: string) => {
    void navigate({ to: '/sessions/$id', params: { id } })
  }

  const dist = overview.data?.bandDistribution
  const bands = dist
    ? Object.entries(dist).map(([key, count]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        count,
        color: RISK_COLORS[key] ?? '#94a3b8',
      }))
    : []
  const totalScored = overview.data?.sessionsScored ?? 0

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Security</h1>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>

        {/* Sessions tab */}
        <TabsContent value="sessions">
          {overview.isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-48 rounded-lg" />
            </div>
          ) : overview.isError ? (
            <p className="text-sm text-red-500">{overview.error.message}</p>
          ) : overview.data ? (
            <div className="space-y-6">
              {/* Metric cards */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Sessions scored', value: overview.data.sessionsScored },
                  { label: 'High / critical', value: overview.data.highCriticalCount },
                  { label: 'Top signal',      value: overview.data.topSignalId ?? '—' },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">{m.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900 truncate">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Distribution + LLM + ASI signal frequency */}
              <div className="grid grid-cols-3 gap-6">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="mb-4 text-sm font-medium text-slate-700">Risk distribution</h2>
                  <RiskDistribution bands={bands} total={totalScored} />
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="mb-4 text-sm font-medium text-slate-700">LLM signal frequency</h2>
                  <OwaspFrequency entries={overview.data.owaspFrequency} />
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="mb-4 text-sm font-medium text-slate-700">ASI signal frequency</h2>
                  {overview.data.asiFrequency.length === 0 ? (
                    <p className="text-sm text-slate-400">No ASI signals detected</p>
                  ) : (
                    <OwaspFrequency entries={overview.data.asiFrequency} />
                  )}
                </div>
              </div>

              {/* High risk sessions */}
              <div>
                <h2 className="mb-3 text-sm font-medium text-slate-700">Highest-risk sessions</h2>
                <HighRiskTable
                  sessions={overview.data.highRiskSessions}
                  onSelect={handleSelectSession}
                />
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* Agents tab */}
        <TabsContent value="agents">
          {topAgents.isLoading || overview.isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-48 rounded-lg" />
            </div>
          ) : topAgents.isError ? (
            <p className="text-sm text-red-500">{topAgents.error.message}</p>
          ) : (
            <div className="space-y-6">
              {/* Metric cards */}
              {(() => {
                const agents = topAgents.data ?? []
                const highCritical = agents.filter((a) => a.compositeRisk >= 65).length
                const avgRisk = agents.length > 0
                  ? agents.reduce((s, a) => s + a.compositeRisk, 0) / agents.length
                  : 0
                const topAgent = agents[0]
                return (
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Agents scored',   value: agents.length },
                      { label: 'High / critical',  value: highCritical },
                      { label: 'Avg composite risk', value: avgRisk.toFixed(1) },
                      { label: 'Highest risk agent', value: topAgent ? (agentMap[topAgent.agentId] ?? topAgent.agentId) : '—' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">{m.label}</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900 truncate">{m.value}</p>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {/* Agent risk distribution + ASI signal frequency */}
              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="mb-4 text-sm font-medium text-slate-700">Agent risk distribution</h2>
                  {(() => {
                    const agents = topAgents.data ?? []
                    const buckets: Record<string, number> = { clean: 0, low: 0, medium: 0, high: 0, critical: 0 }
                    agents.forEach((a) => {
                      if      (a.compositeRisk >= 80) buckets.critical++
                      else if (a.compositeRisk >= 65) buckets.high++
                      else if (a.compositeRisk >= 40) buckets.medium++
                      else if (a.compositeRisk >= 20) buckets.low++
                      else                            buckets.clean++
                    })
                    const bands = Object.entries(buckets).map(([key, count]) => ({
                      label: key.charAt(0).toUpperCase() + key.slice(1),
                      count,
                      color: RISK_COLORS[key] ?? '#94a3b8',
                    }))
                    return <RiskDistribution bands={bands} total={agents.length} />
                  })()}
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="mb-4 text-sm font-medium text-slate-700">Agent threat frequency (ASI)</h2>
                  {!overview.data || overview.data.asiFrequency.length === 0 ? (
                    <p className="text-sm text-slate-400">No ASI signals detected</p>
                  ) : (
                    <OwaspFrequency entries={overview.data.asiFrequency} />
                  )}
                </div>
              </div>

              {/* Agents table */}
              <div>
                <h2 className="mb-3 text-sm font-medium text-slate-700">All agents by risk</h2>
                {!topAgents.data || topAgents.data.length === 0 ? (
                  <p className="text-sm text-slate-400">No agent risk data yet</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Agent</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Sessions</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Avg LLM</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Max LLM</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Avg ASI</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Max ASI</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Composite risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {topAgents.data.map((a) => (
                          <tr
                            key={a.agentId}
                            onClick={() => void navigate({ to: '/agents/$agentId', params: { agentId: a.agentId } })}
                            className="cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-4 py-3 text-xs font-medium text-violet-600">
                              {agentMap[a.agentId] ?? a.agentId}
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-slate-600">{a.sessionCount}</td>
                            <td className="px-4 py-3 text-right text-xs text-slate-600">{a.avgLlmScore.toFixed(1)}</td>
                            <td className="px-4 py-3 text-right text-xs text-slate-600">{a.maxLlmScore.toFixed(1)}</td>
                            <td className="px-4 py-3 text-right text-xs text-slate-600">{a.avgAsiScore.toFixed(1)}</td>
                            <td className="px-4 py-3 text-right text-xs text-slate-600">{a.maxAsiScore.toFixed(1)}</td>
                            <td className="px-4 py-3 text-right text-xs font-semibold">
                              <span className={
                                a.compositeRisk >= 65 ? 'text-red-600'
                                : a.compositeRisk >= 40 ? 'text-amber-600'
                                : 'text-slate-700'
                              }>
                                {a.compositeRisk.toFixed(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
