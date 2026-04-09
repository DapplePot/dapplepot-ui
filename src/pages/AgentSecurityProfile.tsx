import { useParams, Link } from '@tanstack/react-router'
import { useAgentProfile } from '../hooks/useSecurity'
import { Skeleton } from '../components/ui/skeleton'
import type { RiskBand } from '../types/security'

const BAND_COLOR: Record<RiskBand, string> = {
  clean:    'text-emerald-600',
  low:      'text-blue-500',
  medium:   'text-amber-500',
  high:     'text-orange-500',
  critical: 'text-red-600',
}

const BAND_BG: Record<RiskBand, string> = {
  clean:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  low:      'bg-blue-50 text-blue-700 border-blue-200',
  medium:   'bg-amber-50 text-amber-700 border-amber-200',
  high:     'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
}

function ScoreCard({ label, score, band }: { label: string; score: number; band: RiskBand }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${BAND_COLOR[band]}`}>{score}</p>
      <span className={`mt-2 inline-block rounded border px-2 py-0.5 text-xs font-medium capitalize ${BAND_BG[band]}`}>
        {band}
      </span>
    </div>
  )
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function AgentSecurityProfile() {
  const { agentId } = useParams({ from: '/agents/$agentId' })
  const { data, isLoading, isError, error } = useAgentProfile(agentId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-red-500">{(error as Error).message}</p>
  }

  if (!data) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500 text-sm">No security data found for this agent.</p>
        <Link to="/agents" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Back to Agents
        </Link>
      </div>
    )
  }

  const llmSignals   = data.signalBreakdown.filter(s => s.framework === 'LLM')
    .sort((a, b) => a.owaspSignalId.localeCompare(b.owaspSignalId))
  const agentSignals = data.signalBreakdown.filter(s => s.framework === 'ASI')
    .sort((a, b) => a.owaspSignalId.localeCompare(b.owaspSignalId))

  const compositeRiskBand: RiskBand =
    data.compositeRisk >= 85 ? 'critical'
    : data.compositeRisk >= 65 ? 'high'
    : data.compositeRisk >= 40 ? 'medium'
    : data.compositeRisk >= 20 ? 'low'
    : 'clean'

  const llmBand: RiskBand =
    data.avgLlmScore >= 85 ? 'critical'
    : data.avgLlmScore >= 65 ? 'high'
    : data.avgLlmScore >= 40 ? 'medium'
    : data.avgLlmScore >= 20 ? 'low'
    : 'clean'

  const asiBand: RiskBand =
    data.avgAsiScore >= 85 ? 'critical'
    : data.avgAsiScore >= 65 ? 'high'
    : data.avgAsiScore >= 40 ? 'medium'
    : data.avgAsiScore >= 20 ? 'low'
    : 'clean'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/agents" className="text-xs text-slate-400 hover:text-slate-600">
            ← Agents
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            {data.name ?? 'Agent Security Profile'}
          </h1>
          <p className="mt-0.5 font-mono text-xs text-slate-400">{data.agentId}</p>
        </div>
        <div className="text-right text-xs text-slate-400 space-y-0.5">
          {data.latestVersion && <p>v{data.latestVersion}</p>}
          <p>{data.sessionCount} sessions scored</p>
          {data.lastScoredAt && <p>Last scored {fmt(data.lastScoredAt)}</p>}
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-3 gap-4">
        <ScoreCard label="Composite risk (avg)" score={Math.round(data.compositeRisk)} band={compositeRiskBand} />
        <ScoreCard label="Avg LLM risk score"   score={Math.round(data.avgLlmScore)}   band={llmBand} />
        <ScoreCard label="Avg ASI risk score"   score={Math.round(data.avgAsiScore)}   band={asiBand} />
      </div>

      {/* Peak scores */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Peak LLM score', value: data.maxLlmScore },
          { label: 'Peak ASI score', value: data.maxAsiScore },
        ].map(m => (
          <div key={m.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">{m.label}</p>
            <p className="mt-0.5 text-lg font-semibold text-slate-900">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Signal breakdown */}
      <div className="grid grid-cols-2 gap-6">
        {/* LLM signals */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-700">LLM signal history (OW-LLM01–10)</h2>
          {llmSignals.length === 0 ? (
            <p className="text-sm text-slate-400">No LLM signals fired</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="pb-2 text-left font-medium">Signal</th>
                  <th className="pb-2 text-right font-medium">Sessions</th>
                  <th className="pb-2 text-right font-medium">Events</th>
                  <th className="pb-2 text-right font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {llmSignals.map(s => (
                  <tr key={s.owaspSignalId} className="text-slate-700">
                    <td className="py-1.5 font-mono">{s.owaspSignalId}</td>
                    <td className="py-1.5 text-right">{s.sessionsAffected}</td>
                    <td className="py-1.5 text-right">{s.firedCount}</td>
                    <td className="py-1.5 text-right text-slate-400">{fmt(s.lastSeenAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ASI signals */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-700">Agent threat history (OW-ASI01–10)</h2>
          {agentSignals.length === 0 ? (
            <p className="text-sm text-slate-400">No ASI signals fired</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="pb-2 text-left font-medium">Signal</th>
                  <th className="pb-2 text-right font-medium">Sessions</th>
                  <th className="pb-2 text-right font-medium">Events</th>
                  <th className="pb-2 text-right font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {agentSignals.map(s => (
                  <tr key={s.owaspSignalId} className="text-slate-700">
                    <td className="py-1.5 font-mono">{s.owaspSignalId}</td>
                    <td className="py-1.5 text-right">{s.sessionsAffected}</td>
                    <td className="py-1.5 text-right">{s.firedCount}</td>
                    <td className="py-1.5 text-right text-slate-400">{fmt(s.lastSeenAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent sessions */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-700">Recent sessions</h2>
        {data.recentSessions.length === 0 ? (
          <p className="text-sm text-slate-400">No sessions scored yet</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="pb-2 text-left font-medium">Session ID</th>
                <th className="pb-2 text-right font-medium">LLM score</th>
                <th className="pb-2 text-right font-medium">LLM band</th>
                <th className="pb-2 text-right font-medium">ASI score</th>
                <th className="pb-2 text-right font-medium">ASI band</th>
                <th className="pb-2 text-right font-medium">Scored</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.recentSessions.map(s => (
                <tr key={s.sessionId} className="text-slate-700 hover:bg-slate-50">
                  <td className="py-1.5">
                    <Link
                      to="/sessions/$id"
                      params={{ id: s.sessionId }}
                      className="font-mono text-blue-600 hover:underline"
                    >
                      {s.sessionId.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className={`py-1.5 text-right font-semibold ${BAND_COLOR[s.llmBand]}`}>
                    {s.llmScore}
                  </td>
                  <td className="py-1.5 text-right capitalize text-slate-500">{s.llmBand}</td>
                  <td className={`py-1.5 text-right font-semibold ${BAND_COLOR[s.asiBand]}`}>
                    {s.asiScore}
                  </td>
                  <td className="py-1.5 text-right capitalize text-slate-500">{s.asiBand}</td>
                  <td className="py-1.5 text-right text-slate-400">{fmt(s.scoredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
