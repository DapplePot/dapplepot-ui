import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { useAgentProfile } from '../hooks/useSecurity'
import { Skeleton } from '../components/ui/skeleton'
import { Sparkline } from '../components/ui/Sparkline'
import { Settings, Copy, Check, HelpCircle } from 'lucide-react'
import type { RiskBand } from '../types/security'

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
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-lg leading-relaxed whitespace-normal dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
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
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900 flex flex-col">
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
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900 flex flex-col">
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
        <Link to="/inventory" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
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
      <div>
        <Link to="/inventory" className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
          ← Agents
        </Link>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
            {data.name ?? 'Agent Health'}
          </h1>
          {/* Page navigation: Health ↔ Config */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 shrink-0 dark:border-zinc-700 dark:bg-zinc-800">
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
      <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-4 space-y-3 dark:border-violet-800 dark:bg-violet-900/20">
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
          history={[...data.recentSessions].reverse().map(s => Math.round((s.llmScore + s.asiScore) / 2))}
        />
        <ScoreCard
          label="Avg LLM risk score"
          score={Math.round(data.avgLlmScore)}
          band={llmBand}
          tooltip="Average OWASP LLM Top 10 composite score across all sessions. Per session: top fired signal × 60% + mean of rest × 40%, then amplified by attack chains (up to ×1.35). Bands: clean 0–14, low 15–34, medium 35–59, high 60–84, critical 85–100."
          history={[...data.recentSessions].reverse().map(s => s.llmScore)}
        />
        <ScoreCard
          label="Avg ASI risk score"
          score={Math.round(data.avgAsiScore)}
          band={asiBand}
          tooltip="Average OWASP Agentic Security Top 10 composite score across all sessions. Same formula as LLM — covers agentic threats like goal hijacking, tool misuse, inter-agent compromise, and rogue behaviour."
          history={[...data.recentSessions].reverse().map(s => s.asiScore)}
        />
        {data.trustScore !== undefined ? (
          <TrustCard
            score={data.trustScore}
            history={[...data.recentSessions]
              .filter(s => s.trustScore != null)
              .reverse()
              .map(s => s.trustScore!)}
          />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
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

      {/* Peak scores */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Peak LLM score', value: data.maxLlmScore },
          { label: 'Peak ASI score', value: data.maxAsiScore },
        ].map(m => (
          <div key={m.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-xs text-slate-500 dark:text-zinc-400">{m.label}</p>
            <p className="mt-0.5 text-lg font-semibold text-slate-900 dark:text-zinc-100">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Signal breakdown */}
      <div className="grid grid-cols-2 gap-6">
        {/* LLM signals */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-zinc-300">LLM signal history (OW-LLM01–10)</h2>
          {llmSignals.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-zinc-500">No LLM signals fired</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-zinc-800 dark:text-zinc-500">
                  <th className="pb-2 text-left font-medium">Signal</th>
                  <th className="pb-2 text-right font-medium">Sessions</th>
                  <th className="pb-2 text-right font-medium">Events</th>
                  <th className="pb-2 text-right font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                {llmSignals.map(s => (
                  <tr key={s.owaspSignalId} className="text-slate-700 dark:text-zinc-300">
                    <td className="py-1.5 font-mono">{s.owaspSignalId}</td>
                    <td className="py-1.5 text-right">{s.sessionsAffected}</td>
                    <td className="py-1.5 text-right">{s.firedCount}</td>
                    <td className="py-1.5 text-right text-slate-400 dark:text-zinc-500">{fmt(s.lastSeenAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ASI signals */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-zinc-300">Agent threat history (OW-ASI01–10)</h2>
          {agentSignals.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-zinc-500">No ASI signals fired</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-zinc-800 dark:text-zinc-500">
                  <th className="pb-2 text-left font-medium">Signal</th>
                  <th className="pb-2 text-right font-medium">Sessions</th>
                  <th className="pb-2 text-right font-medium">Events</th>
                  <th className="pb-2 text-right font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                {agentSignals.map(s => (
                  <tr key={s.owaspSignalId} className="text-slate-700 dark:text-zinc-300">
                    <td className="py-1.5 font-mono">{s.owaspSignalId}</td>
                    <td className="py-1.5 text-right">{s.sessionsAffected}</td>
                    <td className="py-1.5 text-right">{s.firedCount}</td>
                    <td className="py-1.5 text-right text-slate-400 dark:text-zinc-500">{fmt(s.lastSeenAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent sessions */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-slate-700 dark:text-zinc-300">Recent sessions</h2>
        {data.recentSessions.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-zinc-500">No sessions scored yet</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-zinc-800 dark:text-zinc-500">
                <th className="pb-2 text-left font-medium">Session ID</th>
                <th className="pb-2 text-right font-medium">LLM score</th>
                <th className="pb-2 text-right font-medium">LLM band</th>
                <th className="pb-2 text-right font-medium">ASI score</th>
                <th className="pb-2 text-right font-medium">ASI band</th>
                <th className="pb-2 text-right font-medium">Scored</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
              {data.recentSessions.map(s => (
                <tr key={s.sessionId} className="text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50">
                  <td className="py-1.5">
                    <Link
                      to="/sessions/$id"
                      params={{ id: s.sessionId }}
                      className="font-mono text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {s.sessionId.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className={`py-1.5 text-right font-semibold ${BAND_COLOR[s.llmBand]}`}>
                    {s.llmScore}
                  </td>
                  <td className="py-1.5 text-right capitalize text-slate-500 dark:text-zinc-400">{s.llmBand}</td>
                  <td className={`py-1.5 text-right font-semibold ${BAND_COLOR[s.asiBand]}`}>
                    {s.asiScore}
                  </td>
                  <td className="py-1.5 text-right capitalize text-slate-500 dark:text-zinc-400">{s.asiBand}</td>
                  <td className="py-1.5 text-right text-slate-400 dark:text-zinc-500">{fmt(s.scoredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
