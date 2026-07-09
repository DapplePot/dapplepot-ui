import { useState } from 'react'
import { Link2, ShieldAlert, HelpCircle } from 'lucide-react'
import { Badge } from '../ui/badge'
import type { TrustTrend } from '../../types/security'

interface SessionRiskPanelProps {
  llmScore:               number
  llmBand:                string
  asiScore:               number
  asiBand:                string
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


export function SessionRiskPanel({
  llmScore,
  llmBand,
  asiScore,
  asiBand,
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

    </div>
  )
}
