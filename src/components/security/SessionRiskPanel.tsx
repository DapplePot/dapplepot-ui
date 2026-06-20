import { useState } from 'react'
import { ChevronDown, ChevronRight, Link2, ShieldAlert, HelpCircle } from 'lucide-react'
import { Badge } from '../ui/badge'
import type { OwSignalStatus, ConfidenceTier, TrustTrend } from '../../types/security'

interface SessionRiskPanelProps {
  llmScore:               number
  llmBand:                string
  asiScore:               number
  asiBand:                string
  llmSignalStatus:        Record<string, OwSignalStatus>
  asiSignalStatus:        Record<string, OwSignalStatus>
  scoredAt:               string
  scorerVersion:          string
  // v3
  trustScore?:            number
  trustTrend?:            TrustTrend
  attackChainsDetected?:  string[]
  amplification?:         number
  rawLlmComposite?:       number
  rawAsiComposite?:       number
  confidenceBand?:        string
}

const BAND_VARIANT: Record<string, 'destructive' | 'warning' | 'info' | 'secondary'> = {
  critical: 'destructive',
  high:     'destructive',
  medium:   'warning',
  low:      'info',
  clean:    'secondary',
}

const CONFIDENCE_TIER_VARIANT: Record<ConfidenceTier, string> = {
  deterministic: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  high:          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  medium:        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  low:           'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  skeletal:      'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400',
}

const ATTACK_CHAIN_LABELS: Record<string, string> = {
  indirect_injection_to_exfil:  'Injection → Exfiltration',
  prompt_injection_to_agency:   'Injection → Rogue Agency',
  pii_exfil_chain:              'PII Exfiltration Chain',
  tool_abuse_to_exfil:          'Tool Abuse → Exfiltration',
  trust_fraud:                  'Trust Fraud',
  cascade_rogue:                'Cascade Rogue Agency',
  supply_chain_to_injection:    'Supply Chain → Injection',
}

function Tooltip({ text, placement = 'top' }: { text: string; placement?: 'top' | 'bottom' }) {
  const [visible, setVisible] = useState(false)
  const posClass = placement === 'bottom'
    ? 'top-full left-1/2 -translate-x-1/2 mt-1.5'
    : 'bottom-full left-1/2 -translate-x-1/2 mb-1.5'
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
        <span className={`absolute ${posClass} z-20 w-64 rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-lg leading-relaxed whitespace-normal dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300`}>
          {text}
        </span>
      )}
    </span>
  )
}

const LLM_SIGNAL_ORDER   = ['OW-LLM01','OW-LLM02','OW-LLM03','OW-LLM04','OW-LLM05','OW-LLM06','OW-LLM07','OW-LLM08','OW-LLM09','OW-LLM10']
const AGENT_SIGNAL_ORDER = ['OW-ASI01','OW-ASI02','OW-ASI03','OW-ASI04','OW-ASI05','OW-ASI06','OW-ASI07','OW-ASI08','OW-ASI09','OW-ASI10']

// Fired signal row — expandable sub-checks
function FiredSignalRow({ signalId, s }: { signalId: string; s: OwSignalStatus }) {
  const [expanded, setExpanded] = useState(false)
  const subChecks = Object.entries(s.sub_checks ?? {})
  const firedSubs = subChecks.filter(([, sc]) => sc.status === 'fired')
  const primaryLabel = firedSubs[0]?.[1].label ?? signalId
  const displayScore = s.rawScore ?? s.score ?? 0
  const effectiveScore = s.effectiveScore

  return (
    <div className="rounded border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <div
        className={`flex items-center gap-2 px-3 py-2 ${subChecks.length > 0 ? 'cursor-pointer' : ''}`}
        onClick={() => subChecks.length > 0 && setExpanded(e => !e)}
      >
        <Badge variant="outline" className="font-mono text-xs shrink-0">{signalId}</Badge>
        <span className="text-xs text-slate-700 dark:text-zinc-300 flex-1 min-w-0 truncate">{primaryLabel}</span>
        <span className="font-mono text-xs font-semibold text-red-700 dark:text-red-400 shrink-0">{displayScore}</span>
        {effectiveScore !== undefined && effectiveScore !== displayScore && (
          <span className="font-mono text-xs text-red-400 dark:text-red-500 shrink-0">
            (eff. {Math.round(effectiveScore)})
          </span>
        )}
        <Badge variant="destructive" className="text-xs shrink-0">fired</Badge>
        {subChecks.length > 0 && (
          expanded
            ? <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
            : <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
        )}
      </div>

      {expanded && (
        <div className="border-t border-red-100 dark:border-red-800 px-3 pb-2 space-y-1">
          {subChecks.map(([id, sc]) => (
            <div key={id} className="ml-2 pl-2 border-l border-red-200 dark:border-red-700 py-1">
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sc.status === 'fired' ? 'bg-red-500' : 'bg-green-400'}`} />
                <span className="font-mono text-xs text-slate-500 dark:text-zinc-400 shrink-0">{id}</span>
                <span className="text-xs text-slate-700 dark:text-zinc-300 flex-1">{sc.label}</span>
                {sc.confidenceTier && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${CONFIDENCE_TIER_VARIANT[sc.confidenceTier]}`}>
                    {sc.confidenceTier}
                  </span>
                )}
                <span className="font-mono text-xs text-slate-400 dark:text-zinc-500 shrink-0">{sc.score}</span>
                {sc.effectiveScore !== undefined && sc.effectiveScore !== sc.score && (
                  <span className="font-mono text-xs text-slate-300 dark:text-zinc-600 shrink-0">
                    →{Math.round(sc.effectiveScore)}
                  </span>
                )}
              </div>
              {sc.detail && (
                <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500 pl-4">{sc.detail}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Section showing all 10 signals — fired ones prominent, clean ones collapsed
function OwSignalStatusSection({
  title,
  order,
  statusMap,
}: {
  title: string
  order: string[]
  statusMap: Record<string, OwSignalStatus>
}) {
  const [cleanExpanded, setCleanExpanded] = useState(false)

  const fired = order.filter(id => statusMap[id]?.status === 'fired')
  const clean = order.filter(id => !statusMap[id] || statusMap[id].status === 'clean')

  return (
    <div className="rounded border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">{title}</p>
        <div className="flex gap-2 text-xs">
          {fired.length > 0 && <span className="text-red-600 dark:text-red-400 font-medium">{fired.length} fired</span>}
          <span className="text-green-700 dark:text-green-500 font-medium">{clean.length} clean</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {/* Fired signals — always visible */}
        {fired.map(id => (
          <FiredSignalRow key={id} signalId={id} s={statusMap[id]} />
        ))}

        {fired.length === 0 && (
          <p className="text-xs text-green-700 dark:text-green-500 font-medium py-1">All signals clean ✓</p>
        )}

        {/* Clean signals — collapsed */}
        {clean.length > 0 && (
          <div>
            <button
              onClick={() => setCleanExpanded(e => !e)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 mt-1"
            >
              {cleanExpanded
                ? <ChevronDown className="h-3 w-3" />
                : <ChevronRight className="h-3 w-3" />}
              {cleanExpanded ? 'Hide' : 'Show'} {clean.length} passed signals
            </button>

            {cleanExpanded && (
              <div className="mt-1.5 space-y-1">
                {clean.map(id => {
                  const s = statusMap[id]
                  return (
                    <div key={id} className="flex items-center gap-2 rounded border border-green-100 bg-green-50 px-3 py-1.5 dark:border-green-900/40 dark:bg-green-900/10">
                      <Badge variant="outline" className="font-mono text-xs shrink-0">{id}</Badge>
                      <span className="text-xs text-slate-400 dark:text-zinc-500 flex-1">{id}</span>
                      <span className="font-mono text-xs text-slate-400 dark:text-zinc-500 shrink-0">{s?.rawScore ?? s?.score ?? 0}</span>
                      <span className="text-xs font-medium text-green-700 dark:text-green-500 shrink-0">✓ clean</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function SessionRiskPanel({
  llmScore,
  llmBand,
  asiScore,
  asiBand,
  llmSignalStatus,
  asiSignalStatus,
  scoredAt,
  scorerVersion,
  trustScore,
  attackChainsDetected,
  amplification,
  confidenceBand,
}: SessionRiskPanelProps) {
  const hasChains = attackChainsDetected && attackChainsDetected.length > 0

  return (
    <div className="space-y-4">
      {/* Score summary cards — always 3 columns; trust shows pending state until computed */}
      <div className="grid gap-4 grid-cols-3">
        <div className="rounded border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">LLM risk score</p>
            <Tooltip placement="bottom" text="OWASP LLM Top 10 composite score for this session (0–100). Computed as: top fired signal × 60% + mean of rest × 40%. If multiple signals match a known attack chain, the score is amplified by up to ×1.35. Bands: clean 0–14, low 15–34, medium 35–59, high 60–84, critical 85–100." />
          </div>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-5xl font-bold text-slate-900 dark:text-zinc-100">{llmScore}</span>
            <Badge variant={BAND_VARIANT[llmBand] ?? 'secondary'} className="mb-1">
              {llmBand}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
            scored {new Date(scoredAt).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500 font-mono">{scorerVersion}</p>
          {confidenceBand && (
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
              confidence: <span className="font-medium">{confidenceBand}</span>
            </p>
          )}
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Agent risk score (ASI)</p>
            <Tooltip placement="bottom" text="OWASP Agentic Security Top 10 composite score for this session (0–100). Same formula as LLM — covers agentic threats: goal hijacking, tool misuse, privilege abuse, inter-agent compromise, and rogue behaviour." />
          </div>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-5xl font-bold text-slate-900 dark:text-zinc-100">{asiScore}</span>
            <Badge variant={BAND_VARIANT[asiBand] ?? 'secondary'} className="mb-1">
              {asiBand}
            </Badge>
          </div>
          {amplification !== undefined && amplification > 1.0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <Link2 className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                ×{amplification.toFixed(2)} chain amplification
              </span>
            </div>
          )}
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Agent trust score</p>
            <Tooltip placement="bottom" text="Bayesian trust score for this agent at the time of this session (0–100). Starts at ~80. Risky sessions lower it; clean sessions raise it. Older sessions are decay-weighted so recent behaviour matters more. Alert fires when the last 3 consecutive sessions all score below 50." />
          </div>
          {trustScore !== undefined ? (
            <>
              <div className="mt-2 flex items-end gap-3">
                <span className="text-5xl font-bold text-slate-900 dark:text-zinc-100">{Math.round(trustScore)}</span>
                <Badge
                  variant={Math.round(trustScore) >= 75 ? 'success' : Math.round(trustScore) >= 50 ? 'warning' : 'destructive'}
                  className="mb-1"
                >
                  {Math.round(trustScore) >= 75 ? 'Trusted' : Math.round(trustScore) >= 50 ? 'Caution' : 'At risk'}
                </Badge>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-5xl font-bold text-slate-300 dark:text-zinc-600">—</p>
              <p className="mt-2 text-xs text-slate-400 dark:text-zinc-500">Pending scorer</p>
            </>
          )}
        </div>
      </div>

      {/* Attack chains */}
      {hasChains && (
        <div className="rounded border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">
              Attack chains detected ({attackChainsDetected!.length})
            </p>
            {amplification !== undefined && amplification > 1.0 && (
              <Badge variant="warning" className="ml-auto text-xs">
                ×{amplification.toFixed(2)} amplification
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {attackChainsDetected!.map(chain => (
              <span
                key={chain}
                className="rounded-full bg-orange-100 border border-orange-200 px-2.5 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300"
              >
                {ATTACK_CHAIN_LABELS[chain] ?? chain}
              </span>
            ))}
          </div>
        </div>
      )}

      <OwSignalStatusSection
        title="LLM signals (OWASP LLM Top 10)"
        order={LLM_SIGNAL_ORDER}
        statusMap={llmSignalStatus}
      />
      <OwSignalStatusSection
        title="Agent signals (OWASP Agentic AI Top 10)"
        order={AGENT_SIGNAL_ORDER}
        statusMap={asiSignalStatus}
      />
    </div>
  )
}
