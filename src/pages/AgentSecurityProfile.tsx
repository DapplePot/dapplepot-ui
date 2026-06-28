import { useState } from 'react'
import { useParams, Link, useNavigate } from '@tanstack/react-router'
import { useAgentProfile } from '../hooks/useSecurity'
import { Skeleton } from '../components/ui/skeleton'
import { Sparkline } from '../components/ui/Sparkline'
import { Settings, Copy, Check, HelpCircle, ChevronRight } from 'lucide-react'
import type { RiskBand } from '../types/security'
import { formatAgo, formatDuration } from '../utils/format'

const TOP_SUBCHECKS_COLLAPSED = 5

function AgentIdRow({ agentId }: { agentId: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(agentId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="mt-1 flex items-center gap-1.5">
      <span className="text-xs text-slate-400">Agent ID:</span>
      <span className="font-mono text-xs text-slate-500">{agentId}</span>
      <button
        onClick={handleCopy}
        title="Copy agent ID"
        className="ml-0.5 text-slate-300 hover:text-slate-500 transition-colors"
      >
        {copied
          ? <Check className="h-3 w-3 text-emerald-500" />
          : <Copy className="h-3 w-3" />}
      </button>
    </div>
  )
}

function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
        className="text-slate-300 hover:text-slate-400 transition-colors"
        type="button"
        aria-label="More info"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 w-64 rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-lg leading-relaxed whitespace-normal dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {text}
        </span>
      )}
    </span>
  )
}

const BAND_COLOR: Record<RiskBand, string> = {
  clean:    'text-emerald-600 dark:text-emerald-400',
  low:      'text-blue-500 dark:text-blue-400',
  medium:   'text-amber-500 dark:text-amber-400',
  high:     'text-orange-500 dark:text-orange-400',
  critical: 'text-red-600 dark:text-red-400',
}

const BAND_BG: Record<RiskBand, string> = {
  clean:    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  low:      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  medium:   'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  high:     'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  critical: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
}


const BAND_LINE_COLOR: Record<RiskBand, string> = {
  clean:    '#10b981',
  low:      '#3b82f6',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
}

function ScoreCard({ label, score, band, tooltip, history }: { label: string; score: number; band: RiskBand; tooltip: string; history?: number[] }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900 flex flex-col">
      <div className="flex items-center gap-1 mb-1">
        <p className="text-xs text-slate-500 dark:text-zinc-400">{label}</p>
        <Tooltip text={tooltip} />
      </div>
      <p className={`text-3xl font-bold ${BAND_COLOR[band]}`}>{score}</p>
      <span className={`mt-2 inline-block self-start rounded border px-2 py-0.5 text-xs font-medium capitalize ${BAND_BG[band]}`}>
        {band}
      </span>
      {history && (
        <div className="mt-3">
          <span className="text-[10px] text-slate-400 dark:text-zinc-500">24h</span>
          <div className="-mx-1">
            <Sparkline data={history} color={BAND_LINE_COLOR[band]} id={label} height={28} />
          </div>
        </div>
      )}
    </div>
  )
}

function trustScoreColor(score: number): string {
  if (score >= 71) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 41) return 'text-amber-500 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function trustLineColor(score: number): string {
  if (score >= 71) return '#10b981'
  if (score >= 41) return '#f59e0b'
  return '#ef4444'
}


function trustStatusBadge(score: number) {
  if (score >= 75) return { label: 'Trusted',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' }
  if (score >= 50) return { label: 'Caution',  cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' }
  return           { label: 'At risk', cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' }
}

function TrustCard({ score, history }: { score: number; history: number[] }) {
  const rounded = Math.round(score)
  const badge   = trustStatusBadge(rounded)

  return (
    <div className="rounded border border-slate-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900 flex flex-col">
      <div className="flex items-center gap-1 mb-1">
        <p className="text-xs text-slate-500 dark:text-zinc-400">Agent trust score</p>
        <Tooltip text="Bayesian trust score (0–100). Starts at ~80. Each session updates the score: risky sessions (composite > 40) lower it, clean sessions raise it. Older sessions are decay-weighted so recent behaviour matters more. Alert fires when the last 3 consecutive sessions all score below 50." />
      </div>
      <p className={`text-3xl font-bold ${trustScoreColor(rounded)}`}>{rounded}</p>
      <span className={`mt-2 inline-block self-start rounded border px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
        {badge.label}
      </span>
      <div className="mt-3">
        <span className="text-[10px] text-slate-400 dark:text-zinc-500">24h</span>
        <div className="-mx-1">
          <Sparkline data={history} color={trustLineColor(rounded)} id="trust" height={28} />
        </div>
      </div>
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
  const { agentId } = useParams({ from: '/inventory/agents/$agentId' })
  const navigate = useNavigate()
  const [subchecksExpanded, setSubchecksExpanded] = useState(false)
  const { data, isLoading, isError, error } = useAgentProfile(agentId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded" />)}
        </div>
        <Skeleton className="h-64 rounded" />
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
        <Link to="/inventory" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Back to Agents
        </Link>
      </div>
    )
  }

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
      <div>
        <Link to="/inventory" className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
          ← Agents
        </Link>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
            {data.name ?? 'Agent Health'}
          </h1>
          {/* Page navigation: Health ↓ Config */}
          <div className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 p-1 shrink-0 dark:border-zinc-700 dark:bg-zinc-800">
            <span className="rounded bg-white px-3 py-1.5 text-xs font-medium text-violet-700 shadow-sm dark:bg-zinc-700 dark:text-violet-300">
              Health
            </span>
            <Link
              to="/inventory/agents/$agentId/config"
              params={{ agentId }}
              className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm transition-all dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            >
              <Settings className="h-3 w-3" /> Config
            </Link>
          </div>
        </div>
        <AgentIdRow agentId={data.agentId} />
      </div>

      {/* ── Summary banner ── */}
      <div className="rounded border border-violet-200 bg-violet-50 px-4 py-4 space-y-3 dark:border-violet-800 dark:bg-violet-900/20">
        {/* Stats row */}
        <div className="flex items-center gap-5 flex-wrap">
          <span className="text-xs text-violet-800 dark:text-violet-300">
            <span className="font-semibold">{data.sessionCount}</span>
            <span className="text-violet-500 dark:text-violet-400 ml-1">sessions scored</span>
          </span>
          {data.lastScoredAt && (
            <span className="text-xs text-violet-800 dark:text-violet-300">
              <span className="text-violet-500 dark:text-violet-400">Last scored</span>
              <span className="font-semibold ml-1">{fmt(data.lastScoredAt)}</span>
            </span>
          )}
        </div>

        {/* Legends row */}
        <div className="flex flex-col gap-2">
          {/* Risk bands */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-medium text-violet-500 dark:text-violet-400 uppercase tracking-wide mr-1">Risk</span>
            {([
              { color: 'bg-emerald-500', label: 'Clean',    range: '0–14'   },
              { color: 'bg-blue-500',    label: 'Low',      range: '15–34'  },
              { color: 'bg-amber-500',   label: 'Medium',   range: '35–59'  },
              { color: 'bg-orange-500',  label: 'High',     range: '60–84'  },
              { color: 'bg-red-600',     label: 'Critical', range: '85–100' },
            ] as const).map(({ color, label, range }) => (
              <span key={label} className="flex items-center gap-1 text-[11px] text-violet-700 dark:text-violet-300">
                <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
                {label}
                <span className="text-violet-400">{range}</span>
              </span>
            ))}
          </div>
          {/* Trust score markers */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-medium text-violet-500 dark:text-violet-400 uppercase tracking-wide mr-1">Trust</span>
            {([
              { color: 'bg-emerald-500', label: 'Trusted',  range: '≥75'  },
              { color: 'bg-amber-400',   label: 'Caution',  range: '50–74' },
              { color: 'bg-red-500',     label: 'At risk',  range: '<50'  },
            ] as const).map(({ color, label, range }) => (
              <span key={label} className="flex items-center gap-1 text-[11px] text-violet-700 dark:text-violet-300">
                <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
                {label}
                <span className="text-violet-400">{range}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Score cards — always 4 columns; trust shows pending state until first session scored */}
      <div className="grid gap-4 grid-cols-4">
        <ScoreCard
          label="Composite risk (avg)"
          score={Math.round(data.compositeRisk)}
          band={compositeRiskBand}
          tooltip="Average of (avg LLM score + avg ASI score) / 2 across all scored sessions. Gives an overall picture of how risky this agent has been over time."
          history={(data.scoreHistory ?? []).map(p => Math.round((p.llmScore + p.asiScore) / 2))}
        />
        <ScoreCard
          label="Avg LLM risk score"
          score={Math.round(data.avgLlmScore)}
          band={llmBand}
          tooltip="Average OWASP LLM Top 10 composite score across all sessions. Per session: top fired signal × 60% + mean of rest × 40%, then amplified by attack chains (up to ×1.35). Bands: clean 0–14, low 15–34, medium 35–59, high 60–84, critical 85–100."
          history={(data.scoreHistory ?? []).map(p => p.llmScore)}
        />
        <ScoreCard
          label="Avg ASI risk score"
          score={Math.round(data.avgAsiScore)}
          band={asiBand}
          tooltip="Average OWASP Agentic Security Top 10 composite score across all sessions. Same formula as LLM — covers agentic threats like goal hijacking, tool misuse, inter-agent compromise, and rogue behaviour."
          history={(data.scoreHistory ?? []).map(p => p.asiScore)}
        />
        {data.trustScore !== undefined ? (
          <TrustCard
            score={data.trustScore}
            history={(data.scoreHistory ?? []).map(p => p.trustScore ?? data.trustScore!)}
          />
        ) : (
          <div className="rounded border border-slate-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs text-slate-500 dark:text-zinc-400">Agent trust score</p>
              <Tooltip text="Bayesian trust score (0–100). Starts at ~80. Each session updates the score: risky sessions (composite > 40) lower it, clean sessions raise it. Older sessions are decay-weighted so recent behaviour matters more. Alert fires when the last 3 consecutive sessions all score below 50." />
            </div>
            <p className="text-3xl font-bold text-slate-300 dark:text-zinc-600">—</p>
            <p className="mt-2 text-xs text-slate-400 dark:text-zinc-500">
              Available after first scored session
            </p>
          </div>
        )}
      </div>

      {/* Recent sessions with alerts (this agent) */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-zinc-300">Recent sessions with alerts</h2>
        {!data.recentAlertedSessions || data.recentAlertedSessions.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-zinc-500">No alerted sessions for this agent</p>
        ) : (
          <div className="overflow-hidden rounded border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Session</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Ended</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                {data.recentAlertedSessions.map((r) => (
                  <tr
                    key={r.sessionId}
                    onClick={() => void navigate({ to: '/sessions/$id', params: { id: r.sessionId } })}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-slate-700 dark:text-zinc-300">
                      {r.sessionId.slice(0, 8)}…
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top sub-checks fired (this agent) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700 dark:text-zinc-300">Top sub-checks fired</h2>
          {data.topSubchecks && data.topSubchecks.length > TOP_SUBCHECKS_COLLAPSED && (
            <button
              onClick={() => setSubchecksExpanded((v) => !v)}
              className="text-xs text-violet-600 hover:underline dark:text-violet-400"
            >
              {subchecksExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
        {!data.topSubchecks || data.topSubchecks.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-zinc-500">No findings for this agent</p>
        ) : (
          <div className="overflow-hidden rounded border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Sub-check</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Signal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Framework</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-zinc-400">Count</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-zinc-400">Latest session</th>
                  <th className="w-24 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                {(subchecksExpanded
                  ? data.topSubchecks
                  : data.topSubchecks.slice(0, TOP_SUBCHECKS_COLLAPSED)
                ).map((s) => (
                  <tr key={s.subCheckId}>
                    <td className="px-4 py-3 text-xs text-slate-700 dark:text-zinc-300">
                      <span className="font-medium text-slate-900 dark:text-zinc-100">{s.subCheckId}</span>
                      <span className="ml-2 text-slate-500 dark:text-zinc-400">{s.checkLabel}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-zinc-400">{s.owaspSignalId}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-zinc-400">{s.framework}</td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-slate-800 dark:text-zinc-200">{s.count}</td>
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
                        onClick={() => void navigate({ to: '/sessions', search: { page: 1, subCheckId: s.subCheckId, agentId } })}
                        title={`See sessions for this agent with ${s.subCheckId}`}
                        aria-label={`See sessions for this agent with ${s.subCheckId}`}
                        className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-violet-600 hover:underline dark:text-violet-400"
                      >
                        show all
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
