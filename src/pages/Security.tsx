import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useSecurityOverview, useTopAgents } from '../hooks/useSecurity'
import { RiskDistribution } from '../components/security/RiskDistribution'
import { Skeleton } from '../components/ui/skeleton'
import { formatAgo, formatDuration } from '../utils/format'

const TOP_SUBCHECKS_COLLAPSED = 5

const RISK_COLORS: Record<string, string> = {
  clean:    '#10b981',
  low:      '#60a5fa',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
}

export function Security() {
  const navigate = useNavigate()
  const [subchecksExpanded, setSubchecksExpanded] = useState(false)

  const overview  = useSecurityOverview()
  const topAgents = useTopAgents()

  const sessionBands = (() => {
    const dist = overview.data?.bandDistribution
    if (!dist) return []
    return Object.entries(dist).map(([key, count]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      count,
      color: RISK_COLORS[key] ?? '#94a3b8',
    }))
  })()
  const sessionsScored = overview.data?.sessionsScored ?? 0

  const agents = topAgents.data ?? []
  const agentBands = (() => {
    const buckets: Record<string, number> = { clean: 0, low: 0, medium: 0, high: 0, critical: 0 }
    agents.forEach((a) => {
      if      (a.compositeRisk >= 80) buckets.critical++
      else if (a.compositeRisk >= 65) buckets.high++
      else if (a.compositeRisk >= 40) buckets.medium++
      else if (a.compositeRisk >= 20) buckets.low++
      else                            buckets.clean++
    })
    return Object.entries(buckets).map(([key, count]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      count,
      color: RISK_COLORS[key] ?? '#94a3b8',
    }))
  })()

  const isLoading = overview.isLoading || topAgents.isLoading
  const error = overview.error ?? topAgents.error

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Security</h1>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded" />
            ))}
          </div>
          <Skeleton className="h-64 rounded" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 dark:text-red-400">{error.message}</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-xs text-slate-500 dark:text-zinc-400">Sessions scored</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-zinc-100">{sessionsScored}</p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-xs text-slate-500 dark:text-zinc-400">Agents scored</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-zinc-100">{agents.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="rounded border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-zinc-300">Session risk distribution</h2>
              <RiskDistribution bands={sessionBands} total={sessionsScored} />
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-zinc-300">Agent risk distribution</h2>
              <RiskDistribution bands={agentBands} total={agents.length} />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-zinc-300">Recent sessions with alerts</h2>
            <div className="overflow-hidden rounded border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Session</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Ended</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Alerts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                  {!overview.data?.recentAlertedSessions || overview.data.recentAlertedSessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400 dark:text-zinc-500">
                        No alerted sessions in window
                      </td>
                    </tr>
                  ) : (
                    overview.data.recentAlertedSessions.map((r) => (
                      <tr
                        key={r.sessionId}
                        onClick={() => void navigate({ to: '/sessions/$id', params: { id: r.sessionId } })}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800"
                      >
                        <td className="px-4 py-3 text-xs font-mono text-slate-700 dark:text-zinc-300">
                          {r.sessionId.slice(0, 8)}…
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-zinc-400">
                          {r.agentName ?? r.agentId ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-zinc-400">
                          {r.endedAt ? formatAgo(r.endedAt) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-zinc-400">
                          {r.durationMs != null ? formatDuration(r.durationMs) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {r.alertCount > 0 && (
                            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">
                              {r.alertCount}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-700 dark:text-zinc-300">Top sub-checks fired</h2>
              {overview.data && overview.data.topSubchecks.length > TOP_SUBCHECKS_COLLAPSED && (
                <button
                  onClick={() => setSubchecksExpanded((v) => !v)}
                  className="text-xs text-violet-600 hover:underline dark:text-violet-400"
                >
                  {subchecksExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
            <div className="overflow-hidden rounded border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Sub-check</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Signal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Framework</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Count</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Latest session</th>
                    <th className="w-10 px-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                  {!overview.data || overview.data.topSubchecks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400 dark:text-zinc-500">
                        No findings in window
                      </td>
                    </tr>
                  ) : (
                    (subchecksExpanded
                      ? overview.data.topSubchecks
                      : overview.data.topSubchecks.slice(0, TOP_SUBCHECKS_COLLAPSED)
                    ).map((s) => (
                      <tr key={s.subCheckId}>
                        <td className="px-4 py-3 text-xs text-slate-700 dark:text-zinc-300">
                          <span className="font-medium text-slate-900 dark:text-zinc-100">{s.subCheckId}</span>
                          <span className="ml-2 text-slate-500 dark:text-zinc-400">{s.checkLabel}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-zinc-400">{s.owaspSignalId}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-zinc-400">{s.framework}</td>
                        <td className="px-4 py-3 text-left text-xs font-semibold text-slate-800 dark:text-zinc-200">{s.count}</td>
                        <td className="px-4 py-3 text-xs">
                          <button
                            onClick={() => void navigate({ to: '/sessions/$id', params: { id: s.latestSessionId } })}
                            className="font-mono text-violet-600 hover:underline dark:text-violet-400"
                          >
                            {s.latestSessionId}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <button
                            onClick={() => void navigate({ to: '/sessions', search: { page: 1, subCheckId: s.subCheckId } })}
                            title={`See all sessions with ${s.subCheckId}`}
                            aria-label={`See all sessions with ${s.subCheckId}`}
                            className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-violet-600 hover:underline dark:text-violet-400"
                          >
                            show all
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
