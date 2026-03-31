import { useState } from 'react'
import { useSecurityOverview, useSessionSecurity, useRemediation } from '../hooks/useSecurity'
import { RiskDistribution } from '../components/security/RiskDistribution'
import { OwaspFrequency } from '../components/security/OwaspFrequency'
import { HighRiskTable } from '../components/security/HighRiskTable'
import { SessionRiskPanel } from '../components/security/SessionRiskPanel'
import { FindingsList } from '../components/security/FindingsList'
import { RemediationGuide } from '../components/security/RemediationGuide'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Skeleton } from '../components/ui/skeleton'

type Tab = 'overview' | 'session' | 'remediation'

const RISK_COLORS: Record<string, string> = {
  clean:    '#10b981',
  low:      '#60a5fa',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
}

export function Security() {
  const [tab, setTab] = useState<Tab>('overview')
  const [selectedSessionId, setSelectedSessionId] = useState('')

  const overview   = useSecurityOverview()
  const { score, findings } = useSessionSecurity(selectedSessionId)
  const remediation = useRemediation()

  const handleSelectSession = (id: string) => {
    setSelectedSessionId(id)
    setTab('session')
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="session">Session detail</TabsTrigger>
          <TabsTrigger value="remediation">Remediation</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview">
          {overview.isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
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
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Sessions scored',  value: overview.data.sessionsScored },
                  { label: 'High / critical',   value: overview.data.highCriticalCount },
                  { label: 'Avg risk score',    value: overview.data.avgRiskScore },
                  { label: 'Top signal',        value: overview.data.topSignalId ?? '—' },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">{m.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900 truncate">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Distribution + OWASP */}
              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="mb-4 text-sm font-medium text-slate-700">Risk distribution</h2>
                  <RiskDistribution bands={bands} total={totalScored} />
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="mb-4 text-sm font-medium text-slate-700">OWASP signal frequency</h2>
                  <OwaspFrequency entries={overview.data.owaspFrequency} />
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

        {/* Session detail tab */}
        <TabsContent value="session">
          {!selectedSessionId ? (
            <p className="py-12 text-center text-sm text-slate-400">
              Select a session from the Overview tab to view its risk detail
            </p>
          ) : score.isLoading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : score.isError ? (
            <p className="text-sm text-red-500">{score.error.message}</p>
          ) : score.data ? (
            <div className="space-y-4">
              <p className="font-mono text-sm text-slate-500">{selectedSessionId}</p>
              <SessionRiskPanel
                riskScore={score.data.riskScore}
                riskBand={score.data.riskBand}
                signalCount={score.data.signalCount}
                signalIds={score.data.signalIds}
                scoredAt={score.data.scoredAt}
                scorerVersion={score.data.scorerVersion}
              />
              <h2 className="text-sm font-medium text-slate-700">Findings</h2>
              <FindingsList findings={findings.data ?? []} />
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">No score available for this session</p>
          )}
        </TabsContent>

        {/* Remediation tab */}
        <TabsContent value="remediation">
          {remediation.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : remediation.isError ? (
            <p className="text-sm text-red-500">{remediation.error.message}</p>
          ) : (
            <RemediationGuide cards={remediation.data ?? []} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
