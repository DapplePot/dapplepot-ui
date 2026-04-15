import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import {
  useAgentProfile, useSubcheckConfig, useToggleSubcheckOnline,
  useAlertConfig,
  useUpdateLlmCompositeThreshold, useUpdateAsiCompositeThreshold,
  useUpdateSignalThreshold,
} from '../hooks/useSecurity'
import type { OnlineAction } from '../types/security'
import { ChevronDown, ChevronRight, Shield, ShieldOff, Settings, Zap, HelpCircle, Copy, Check } from 'lucide-react'
import {
  SIGNAL_REGISTRY,
  LLM_SIGNALS,
  ASI_SIGNALS,
  countActive,
  countExcluded,
  type SignalConfig,
  type SubCheck,
  type DetectionPhase,
  type Severity,
  type ConfidenceTier,
} from '../data/signalRegistry'

// ─── Style helpers ────────────────────────────────────────────────────────────

const PHASE_STYLE: Record<DetectionPhase, string> = {
  online:        'bg-violet-50 text-violet-700 border-violet-200',
  post_session:  'bg-blue-50 text-blue-700 border-blue-200',
  cross_session: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  both:          'bg-indigo-50 text-indigo-700 border-indigo-200',
  excluded:      'bg-slate-100 text-slate-400 border-slate-200',
}

const PHASE_LABEL: Record<DetectionPhase, string> = {
  online:        'Online',
  post_session:  'Post-session',
  cross_session: 'Cross-session',
  both:          'Online + Post',
  excluded:      'Excluded',
}

const SEV_STYLE: Record<Severity, string> = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  high:     'bg-orange-50 text-orange-700 border-orange-200',
  medium:   'bg-amber-50 text-amber-700 border-amber-200',
  low:      'bg-slate-50 text-slate-500 border-slate-200',
}

const CONF_STYLE: Record<ConfidenceTier, string> = {
  deterministic: 'text-emerald-700 font-semibold',
  high:          'text-slate-700',
  medium:        'text-slate-500',
  low:           'text-slate-400',
  skeletal:      'text-slate-300 italic',
}

const BAND_BG: Record<string, string> = {
  clean:    'bg-emerald-50 border-emerald-200 text-emerald-700',
  low:      'bg-green-50 border-green-200 text-green-700',
  medium:   'bg-amber-50 border-amber-200 text-amber-700',
  high:     'bg-orange-50 border-orange-200 text-orange-700',
  critical: 'bg-red-50 border-red-200 text-red-700',
}

// Lower boundary of each band — snaps the threshold when the user picks a band
const BAND_THRESHOLD: Record<string, number> = {
  clean:    1,
  low:      15,
  medium:   35,
  high:     60,
  critical: 85,
}

const BANDS = ['clean', 'low', 'medium', 'high', 'critical'] as const

// Default platform thresholds — mirrors SIGNAL_ALERT_THRESHOLDS_V3 in config.py
const PLATFORM_THRESHOLDS: Record<string, number> = {
  'OW-LLM01': 70, 'OW-LLM02': 75, 'OW-LLM03': 999, 'OW-LLM04': 999,
  'OW-LLM05': 70, 'OW-LLM06': 65, 'OW-LLM07': 70, 'OW-LLM08': 999,
  'OW-LLM09': 60, 'OW-LLM10': 55,
  'OW-ASI01': 70, 'OW-ASI02': 65, 'OW-ASI03': 70, 'OW-ASI04': 70,
  'OW-ASI05': 60, 'OW-ASI06': 70, 'OW-ASI07': 75, 'OW-ASI08': 70,
  'OW-ASI09': 70, 'OW-ASI10': 65,
}

const ALL_SIGNALS = [
  ...LLM_SIGNALS.map(s => ({ id: s.owaspSignalId, name: s.name, framework: 'LLM' as const })),
  ...ASI_SIGNALS.map(s => ({ id: s.owaspSignalId, name: s.name, framework: 'ASI' as const })),
]

const TOTAL_ACTIVE = SIGNAL_REGISTRY.flatMap(s => s.subChecks).filter(c => !c.excluded).length
const TOTAL_CHECKS = SIGNAL_REGISTRY.flatMap(s => s.subChecks).length

// ─── Agent ID row with copy ───────────────────────────────────────────────────

function ConfigAgentIdRow({ agentId }: { agentId: string }) {
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

// ─── Tooltip component ────────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
        className="text-slate-300 hover:text-slate-500 transition-colors"
        type="button"
        aria-label="More info"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-lg leading-relaxed whitespace-normal">
          {text}
        </span>
      )}
    </span>
  )
}

// ─── Alert Thresholds tab ─────────────────────────────────────────────────────

const PLATFORM_COMPOSITE = 60

function bandLabel(score: number) {
  return score >= 85 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'medium' : score >= 15 ? 'low' : 'clean'
}

function CompositeSlider({
  label,
  tooltip,
  accentColor,
  value,            // current effective value (may be draft)
  savedValue,       // value that is persisted (null = platform default)
  onDraftChange,
  onCommit,         // receives the final value directly — avoids stale-closure issues
  onReset,
}: {
  label: string
  tooltip: string
  accentColor: 'blue' | 'purple'
  value: number
  savedValue: number | null
  onDraftChange: (v: number) => void
  onCommit: (v: number) => void
  onReset: () => void
}) {
  const [bandOpen, setBandOpen] = useState(false)
  // != null catches both null and undefined (guards against API not yet returning the field)
  const isCustom = savedValue != null
  const band = bandLabel(value)
  const accent = accentColor === 'blue' ? 'accent-blue-600' : 'accent-purple-600'
  const focusRing = accentColor === 'blue'
    ? 'focus:border-blue-400 focus:ring-blue-400'
    : 'focus:border-purple-400 focus:ring-purple-400'

  function handleCommit(raw: string) {
    const v = Number(raw)
    if (!raw || isNaN(v) || v < 1 || v > 100) return
    onCommit(v)
  }

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${accentColor === 'blue' ? 'text-blue-700' : 'text-purple-700'}`}>
            {label}
          </span>
          <Tooltip text={tooltip} />
        </div>
        <div className="flex items-center gap-2">
          {isCustom ? (
            <>
              <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                accentColor === 'blue'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-purple-200 bg-purple-50 text-purple-700'
              }`}>custom</span>
              <button
                onClick={onReset}
                className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                title="Reset to platform default (60)"
              >
                reset to default
              </button>
            </>
          ) : (
            <span className="inline-block rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
              platform default
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={1}
          max={100}
          value={value}
          onChange={e => onDraftChange(Number(e.currentTarget.value))}
          onMouseUp={e => handleCommit(e.currentTarget.value)}
          onTouchEnd={e => handleCommit(e.currentTarget.value)}
          className={`flex-1 ${accent}`}
        />
        <input
          type="number"
          min={1}
          max={100}
          value={value}
          onChange={e => onDraftChange(Number(e.currentTarget.value))}
          onBlur={e => handleCommit(e.currentTarget.value)}
          onKeyDown={e => e.key === 'Enter' && handleCommit(e.currentTarget.value)}
          className={`w-14 rounded-md border border-slate-200 px-2 py-1 text-center text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 ${focusRing}`}
        />
        <div className="relative">
          <button
            type="button"
            onClick={() => setBandOpen(o => !o)}
            className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium capitalize cursor-pointer hover:opacity-80 transition-opacity ${BAND_BG[band] ?? ''}`}
            title="Click to change alert band"
          >
            alerts at {band} band
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>
          {bandOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-slate-200 bg-white shadow-lg py-1">
              {BANDS.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    setBandOpen(false)
                    const v = BAND_THRESHOLD[b]
                    onDraftChange(v)
                    onCommit(v)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium capitalize hover:bg-slate-50 transition-colors ${
                    b === band ? 'font-semibold' : ''
                  }`}
                >
                  <span className={`inline-block rounded border px-1.5 py-0.5 ${BAND_BG[b]}`}>{b}</span>
                  <span className="text-slate-400 font-normal">≥ {BAND_THRESHOLD[b]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AlertThresholdsTab({ agentId }: { agentId: string }) {
  const { data: alertConfig, isLoading, isError } = useAlertConfig(agentId)
  const updateLlm    = useUpdateLlmCompositeThreshold(agentId)
  const updateAsi    = useUpdateAsiCompositeThreshold(agentId)
  const updateSignal = useUpdateSignalThreshold(agentId)

  // Local draft state — populated only while the user is dragging/typing
  const [llmDraft, setLlmDraft] = useState<number | null>(null)
  const [asiDraft, setAsiDraft] = useState<number | null>(null)
  const [signalDrafts, setSignalDrafts] = useState<Record<string, string>>({})

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 rounded-lg bg-slate-100" />
        <div className="h-64 rounded-lg bg-slate-100" />
      </div>
    )
  }

  if (isError || !alertConfig) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
        Failed to load alert config. Make sure migrations 011 (dapplepot-api) and 018 (dapplepot-security)
        have been applied, then reload.
      </div>
    )
  }

  // Effective values: draft takes priority, then saved override, then platform default
  const effectiveLlm = llmDraft ?? alertConfig.llm_composite_threshold ?? PLATFORM_COMPOSITE
  const effectiveAsi = asiDraft ?? alertConfig.asi_composite_threshold ?? PLATFORM_COMPOSITE

  function commitLlm(v: number) {
    if (!v || v < 1 || v > 100) return
    // Keep draft alive until onSettled so the slider doesn't snap back before
    // the optimistic update fires (avoids the double-render flicker).
    updateLlm.mutate(v, { onSettled: () => setLlmDraft(null) })
  }
  function commitAsi(v: number) {
    if (!v || v < 1 || v > 100) return
    updateAsi.mutate(v, { onSettled: () => setAsiDraft(null) })
  }

  function getEffectiveSignalThreshold(sigId: string) {
    if (sigId in signalDrafts) return signalDrafts[sigId]
    const override = alertConfig!.signal_thresholds[sigId]
    return String(override ?? PLATFORM_THRESHOLDS[sigId] ?? 70)
  }

  function commitSignal(sigId: string) {
    const draft = signalDrafts[sigId]
    if (!draft) return
    const num = parseInt(draft, 10)
    if (isNaN(num) || num < 0 || num > 999) return
    updateSignal.mutate({ signal_id: sigId, threshold: num })
    setSignalDrafts(d => {
      const next = { ...d }
      delete next[sigId]
      return next
    })
  }

  const isExcluded = (sigId: string) =>
    PLATFORM_THRESHOLDS[sigId] === 999

  const hasOverride = (sigId: string) =>
    sigId in alertConfig.signal_thresholds

  return (
    <div className="space-y-6">
      {/* ── Trust degradation alert ── */}
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 border border-amber-200">
              <Shield className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-slate-800">Agent trust degradation</h3>
                <Tooltip text="Trust alerts fire when this agent's trust score drops below 50 for 3+ consecutive sessions. This detects agents that are systematically behaving poorly over time, not just a one-off risky session. The threshold is platform-wide and cannot be overridden per-agent." />
              </div>
              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                Tracks cross-session trust decay for <span className="font-medium text-slate-700">this agent</span>.
                Fires when behaviour is persistently risky, not just once.
              </p>
            </div>
          </div>
          <span className="shrink-0 inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-400">
            platform-wide · not configurable per-agent
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs rounded-md bg-slate-50 border border-slate-100 px-3 py-2">
          <span className="text-slate-400">Alert fires when trust score</span>
          <span className="font-semibold text-slate-800">&lt; 50</span>
          <span className="text-slate-400">for</span>
          <span className="font-semibold text-slate-800">3+</span>
          <span className="text-slate-400">consecutive sessions on this agent</span>
        </div>
      </div>

      {/* ── Per-session composite thresholds ── */}
      <div className="rounded-lg bg-white px-4 py-4">
        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="text-sm font-semibold text-slate-700">Per-session composite alert thresholds</h3>
          <Tooltip text="Each session produces two composite scores — one for LLM threats and one for Agentic (ASI) threats. An alert fires when either score meets or exceeds its threshold. You can tune them independently: lower the LLM threshold if you care more about prompt injection; lower ASI if you care more about rogue tool behaviour." />
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          After each session ends, its <span className="font-semibold">LLM composite</span> and{' '}
          <span className="font-semibold">ASI composite</span> scores are compared against these thresholds separately.
          An alert fires if <em>either</em> exceeds its limit.
          Platform default for both: <span className="font-semibold">60</span>.
          Lower = more sensitive · higher = fewer alerts.
        </p>

        <div className="space-y-3">
          <CompositeSlider
            label="LLM composite threshold"
            tooltip="Fires when this session's OWASP LLM Top 10 composite score ≥ this value. Composite = top fired signal × 60% + mean of rest × 40%, amplified by any cross-signal attack chains (up to ×1.35). Platform default: 60."
            accentColor="blue"
            value={effectiveLlm}
            savedValue={alertConfig.llm_composite_threshold}
            onDraftChange={setLlmDraft}
            onCommit={commitLlm}
            onReset={() => updateLlm.mutate(null)}
          />
          <CompositeSlider
            label="ASI composite threshold"
            tooltip="Fires when this session's OWASP Agentic Security Top 10 composite score ≥ this value. Same formula as LLM — covers agentic threats: goal hijacking, tool misuse, privilege abuse, inter-agent compromise, and rogue behaviour. Platform default: 60."
            accentColor="purple"
            value={effectiveAsi}
            savedValue={alertConfig.asi_composite_threshold}
            onDraftChange={setAsiDraft}
            onCommit={commitAsi}
            onReset={() => updateAsi.mutate(null)}
          />
        </div>
      </div>

      {/* ── Per-signal thresholds ── */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-slate-700">Per-signal alert thresholds</h3>
            <Tooltip text="Per session — fires when a single session's effective score for this signal (check score × confidence weight) reaches this threshold. Threshold 999 means the signal never triggers an alert, though findings are still recorded. Platform defaults shown in grey; overrides in violet." />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-medium text-slate-400">
                <th className="px-4 py-2.5 text-left">Signal</th>
                <th className="px-4 py-2.5 text-left">Description</th>
                <th className="px-4 py-2.5 text-left">Framework</th>
                <th className="px-4 py-2.5 text-right w-32">Threshold</th>
                <th className="px-4 py-2.5 text-center w-28">Direct alert</th>
                <th className="px-4 py-2.5 text-right w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {ALL_SIGNALS.map((sig, idx) => {
                const excluded    = isExcluded(sig.id)
                const overridden  = hasOverride(sig.id)
                const draftVal   = getEffectiveSignalThreshold(sig.id)

                return (
                  <tr
                    key={sig.id}
                    className={`border-b border-slate-50 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    } ${excluded ? 'opacity-60' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">{sig.id}</td>
                    <td className="px-4 py-2.5 text-slate-700 max-w-xs">
                      <span className="line-clamp-1">{sig.name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                        sig.framework === 'LLM'
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-purple-50 border-purple-200 text-purple-700'
                      }`}>
                        {sig.framework}
                      </span>
                    </td>
                    {(() => {
                      const isDirectAlert = overridden && alertConfig.signal_thresholds[sig.id] === 0
                      return (
                        <>
                          <td className="px-4 py-2.5 text-right">
                            {excluded && !overridden ? (
                              <span className="text-slate-300 text-[10px]">excluded</span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                {overridden && (
                                  <button
                                    className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                                    title="Reset to platform default"
                                    onClick={() => {
                                      updateSignal.mutate({ signal_id: sig.id, threshold: null })
                                    }}
                                  >
                                    reset
                                  </button>
                                )}
                                <input
                                  type="number"
                                  min={0}
                                  max={999}
                                  value={draftVal}
                                  onChange={e =>
                                    setSignalDrafts(d => ({ ...d, [sig.id]: e.target.value }))
                                  }
                                  onBlur={() => commitSignal(sig.id)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') commitSignal(sig.id)
                                    if (e.key === 'Escape') setSignalDrafts(d => {
                                      const next = { ...d }
                                      delete next[sig.id]
                                      return next
                                    })
                                  }}
                                  className={`w-16 rounded border px-2 py-1 text-center text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-violet-400 ${
                                    isDirectAlert
                                      ? 'border-rose-300 text-rose-600 bg-rose-50 focus:border-rose-400 focus:ring-rose-400'
                                      : overridden
                                        ? 'border-violet-300 text-violet-700 bg-violet-50 focus:border-violet-500'
                                        : 'border-slate-200 text-slate-600 bg-white focus:border-slate-400'
                                  }`}
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {excluded && !overridden ? (
                              <span className="text-slate-200">—</span>
                            ) : (
                              <button
                                role="switch"
                                aria-checked={isDirectAlert}
                                title={isDirectAlert ? 'Turn off direct alert (reset to platform default)' : 'Direct alert: set threshold to 0 — alert on any score'}
                                onClick={() => {
                                  if (isDirectAlert) {
                                    updateSignal.mutate({ signal_id: sig.id, threshold: null })
                                  } else {
                                    updateSignal.mutate({ signal_id: sig.id, threshold: 0 })
                                  }
                                }}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-150 focus:outline-none ${
                                  isDirectAlert
                                    ? 'bg-rose-500 border-rose-500'
                                    : 'bg-slate-200 border-slate-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-150 ${
                                    isDirectAlert ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            )}
                          </td>
                        </>
                      )
                    })()}
                    <td className="px-4 py-2.5 text-right">
                      {excluded && !overridden ? (
                        <span className="inline-block rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
                          no alerts
                        </span>
                      ) : alertConfig.signal_thresholds[sig.id] === 0 ? (
                        <span className="inline-block rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600">
                          direct alert
                        </span>
                      ) : overridden ? (
                        <span className="inline-block rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                          custom
                        </span>
                      ) : (
                        <span className="inline-block rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">
                          platform default
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

// ─── Toggle switch component ──────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
        disabled
          ? 'cursor-not-allowed opacity-40 bg-slate-200'
          : checked
          ? 'bg-violet-500 cursor-pointer'
          : 'bg-slate-300 cursor-pointer'
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-3.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

// ─── Sub-component: single sub-check row ─────────────────────────────────────

const ACTION_LABELS: Record<OnlineAction, string> = {
  alert:             'alert',
  sanitize:          'sanitize',
  terminate_session: 'terminate',
}

const ACTION_STYLE: Record<OnlineAction, string> = {
  alert:             'border-amber-200 bg-amber-50 text-amber-700',
  sanitize:          'border-teal-200 bg-teal-50 text-teal-700',
  terminate_session: 'border-red-200 bg-red-50 text-red-700',
}

function SubCheckRow({
  check,
  isOnline,
  action,
  onToggleOnline,
  onActionChange,
}: {
  check: SubCheck
  isOnline: boolean
  action: OnlineAction
  onToggleOnline: (subCheckId: string, online: boolean) => void
  onActionChange: (subCheckId: string, action: OnlineAction) => void
}) {
  const [showMatches, setShowMatches] = useState(false)
  const hasMatches = check.matches && check.matches.length > 0
  const canToggle = check.onlineCapable === true && !check.excluded

  const effectivePhase: DetectionPhase =
    check.excluded        ? 'excluded' :
    isOnline              ? 'online' :
    check.phase === 'cross_session' ? 'cross_session' :
    'post_session'

  return (
    <>
      <tr
        className={`border-b border-slate-50 text-xs ${check.excluded ? 'opacity-50' : 'hover:bg-slate-50/60'}`}
      >
        <td className="py-2 pr-3 font-mono text-slate-500 whitespace-nowrap">{check.subCheckId}</td>
        <td className="py-2 pr-3 text-slate-700">
          <div className="flex items-center gap-1.5">
            {check.excluded
              ? <ShieldOff className="h-3 w-3 shrink-0 text-slate-300" />
              : <Shield className="h-3 w-3 shrink-0 text-violet-400" />
            }
            {check.label}
          </div>
          {check.exclusionReason && (
            <p className="mt-0.5 text-slate-400 italic">{check.exclusionReason}</p>
          )}
        </td>
        <td className="py-2 pr-3 whitespace-nowrap">
          <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${PHASE_STYLE[effectivePhase]}`}>
            {PHASE_LABEL[effectivePhase]}
          </span>
        </td>
        <td className="py-2 pr-3 whitespace-nowrap">
          {!check.excluded && (
            <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize ${SEV_STYLE[check.severity]}`}>
              {check.severity}
            </span>
          )}
        </td>
        <td className={`py-2 pr-3 text-[10px] capitalize whitespace-nowrap ${CONF_STYLE[check.confidenceTier]}`}>
          {!check.excluded ? check.confidenceTier : '—'}
        </td>
        <td className="py-2 pr-3 text-right tabular-nums">
          {check.excluded ? (
            <span className="text-slate-300">—</span>
          ) : (
            <span className={`font-semibold ${
              check.score >= 90 ? 'text-red-600' :
              check.score >= 70 ? 'text-orange-500' :
              check.score >= 50 ? 'text-amber-500' : 'text-slate-500'
            }`}>{check.score}</span>
          )}
        </td>
        <td className="py-2 text-right">
          {hasMatches && !check.excluded ? (
            <button
              onClick={() => setShowMatches(v => !v)}
              className="inline-flex items-center gap-0.5 text-[10px] text-violet-600 hover:text-violet-800"
            >
              {showMatches ? 'hide' : 'patterns'}
              {showMatches
                ? <ChevronDown className="h-3 w-3" />
                : <ChevronRight className="h-3 w-3" />
              }
            </button>
          ) : null}
        </td>
        <td className="py-2 pl-2 text-right">
          {canToggle ? (
            <div className="flex items-center justify-end gap-1.5 flex-wrap">
              <Zap className={`h-3 w-3 shrink-0 ${isOnline ? 'text-violet-500' : 'text-slate-300'}`} />
              <ToggleSwitch
                checked={isOnline}
                onChange={v => onToggleOnline(check.subCheckId, v)}
                label={`Toggle ${check.subCheckId} online detection`}
              />
              <select
                value={action}
                onChange={e => onActionChange(check.subCheckId, e.target.value as OnlineAction)}
                disabled={!isOnline}
                className={`rounded border px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-violet-400 disabled:opacity-40 disabled:cursor-not-allowed ${ACTION_STYLE[isOnline ? action : 'monitor']}`}
                title={isOnline ? 'Action when this sub-check fires' : 'Enable online detection to configure action'}
              >
                {(Object.keys(ACTION_LABELS) as OnlineAction[]).map(a => (
                  <option key={a} value={a}>{ACTION_LABELS[a]}</option>
                ))}
              </select>
            </div>
          ) : check.excluded ? (
            <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
              <ShieldOff className="h-3 w-3" /> Excluded
            </span>
          ) : (
            <span className="text-[10px] text-slate-300">post-session only</span>
          )}
        </td>
      </tr>

      {showMatches && hasMatches && (
        <tr className="bg-violet-50/40 border-b border-slate-100">
          <td colSpan={8} className="px-6 py-2">
            <p className="mb-1.5 text-[10px] font-medium text-violet-600 uppercase tracking-wide">
              Detection patterns
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {check.matches!.map((m, i) => (
                <li
                  key={i}
                  className="rounded bg-white border border-violet-200 px-2 py-0.5 font-mono text-[10px] text-violet-800"
                >
                  {m}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Sub-component: signal accordion card ────────────────────────────────────

function SignalCard({
  signal,
  defaultOpen = false,
  onlineOverrides,
  actionOverrides,
  onToggleOnline,
  onActionChange,
}: {
  signal: SignalConfig
  defaultOpen?: boolean
  onlineOverrides: Record<string, boolean>
  actionOverrides: Record<string, OnlineAction>
  onToggleOnline: (subCheckId: string, online: boolean) => void
  onActionChange: (subCheckId: string, action: OnlineAction) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const active   = countActive(signal)
  const excluded = countExcluded(signal)
  const allExcluded = active === 0
  const onlineCount = signal.subChecks.filter(c => onlineOverrides[c.subCheckId]).length

  return (
    <div className={`rounded-lg border bg-white ${allExcluded ? 'border-slate-200 opacity-70' : 'border-slate-200'}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors"
      >
        <span className="shrink-0 text-slate-400">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <span className="shrink-0 font-mono text-xs font-semibold text-slate-500 w-24">
          {signal.owaspSignalId}
        </span>
        <span className="flex-1 text-sm font-medium text-slate-800 text-left">
          {signal.name}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {onlineCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
              <Zap className="h-3 w-3" /> {onlineCount} online
            </span>
          )}
          {active > 0 && (
            <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              <Shield className="h-3 w-3" /> {active} active
            </span>
          )}
          {excluded > 0 && (
            <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-400">
              <ShieldOff className="h-3 w-3" /> {excluded} excluded
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pt-3 pb-4">
          <p className="mb-3 text-xs text-slate-500 leading-relaxed">{signal.description}</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-medium text-slate-400 border-b border-slate-100">
                  <th className="pb-2 text-left pr-3">Sub-check</th>
                  <th className="pb-2 text-left pr-3">Description</th>
                  <th className="pb-2 text-left pr-3">Phase</th>
                  <th className="pb-2 text-left pr-3">Severity</th>
                  <th className="pb-2 text-left pr-3">Confidence</th>
                  <th className="pb-2 text-right pr-3">Score</th>
                  <th className="pb-2 text-right pr-3">Matches</th>
                  <th className="pb-2 text-right pl-2">Online detection</th>
                </tr>
              </thead>
              <tbody>
                {signal.subChecks.map(check => (
                  <SubCheckRow
                    key={check.subCheckId}
                    check={check}
                    isOnline={onlineOverrides[check.subCheckId] ?? false}
                    action={actionOverrides[check.subCheckId] ?? 'monitor'}
                    onToggleOnline={onToggleOnline}
                    onActionChange={onActionChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Framework section ────────────────────────────────────────────────────────

function FrameworkSection({
  label,
  signals,
  onlineOverrides,
  actionOverrides,
  onToggleOnline,
  onActionChange,
}: {
  label: string
  signals: SignalConfig[]
  onlineOverrides: Record<string, boolean>
  actionOverrides: Record<string, OnlineAction>
  onToggleOnline: (subCheckId: string, online: boolean) => void
  onActionChange: (subCheckId: string, action: OnlineAction) => void
}) {
  const totalActive   = signals.flatMap(s => s.subChecks).filter(c => !c.excluded).length
  const totalExcluded = signals.flatMap(s => s.subChecks).filter(c => c.excluded).length
  const totalChecks   = signals.flatMap(s => s.subChecks).length
  const totalOnline   = signals.flatMap(s => s.subChecks).filter(c => onlineOverrides[c.subCheckId]).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">{label}</h2>
        <p className="text-xs text-slate-400">
          {totalActive} active · {totalExcluded} excluded · {totalChecks} total
          {totalOnline > 0 && (
            <span className="ml-1 text-violet-600 font-medium">· {totalOnline} online</span>
          )}
        </p>
      </div>
      <div className="space-y-2">
        {signals.map(signal => (
          <SignalCard
            key={signal.owaspSignalId}
            signal={signal}
            onlineOverrides={onlineOverrides}
            actionOverrides={actionOverrides}
            onToggleOnline={onToggleOnline}
            onActionChange={onActionChange}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Phase legend ─────────────────────────────────────────────────────────────

function PhaseLegend() {
  const items: Array<{ phase: DetectionPhase; desc: string }> = [
    { phase: 'post_session',  desc: 'Default — runs once per session after completion' },
    { phase: 'online',        desc: 'SDK real-time — toggle enabled on this agent' },
    { phase: 'cross_session', desc: 'Aggregated across multiple sessions' },
    { phase: 'excluded',      desc: 'Requires data unavailable at runtime' },
  ]

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs font-medium text-slate-600">Detection phase key</p>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Zap className="h-3 w-3 text-violet-400" />
          Sub-checks with this icon can be toggled to run online via the SDK
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(({ phase, desc }) => (
          <div key={phase} className="flex items-center gap-1.5">
            <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${PHASE_STYLE[phase]}`}>
              {PHASE_LABEL[phase]}
            </span>
            <span className="text-[10px] text-slate-400">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AgentConfig() {
  const { agentId } = useParams({ from: '/agents/$agentId/config' })
  const { data, isLoading } = useAgentProfile(agentId)
  const { data: subcheckConfig = {} } = useSubcheckConfig(agentId)
  const toggleMutation = useToggleSubcheckOnline(agentId)

  const [activeTab, setActiveTab] = useState<'llm' | 'asi' | 'thresholds'>('llm')

  const agentName = data?.name ?? agentId

  const onlineOverrides: Record<string, boolean> = Object.fromEntries(
    Object.entries(subcheckConfig).map(([id, ov]) => [id, ov.online_detection])
  )

  const actionOverrides: Record<string, OnlineAction> = Object.fromEntries(
    Object.entries(subcheckConfig).map(([id, ov]) => [id, ov.action ?? 'monitor'])
  )

  function handleToggleOnline(subCheckId: string, online: boolean) {
    const currentAction = actionOverrides[subCheckId] ?? 'monitor'
    toggleMutation.mutate({ subCheckId, online_detection: online, action: currentAction })
  }

  function handleActionChange(subCheckId: string, action: OnlineAction) {
    toggleMutation.mutate({ subCheckId, online_detection: true, action })
  }

  const onlineCount = Object.values(onlineOverrides).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <Link to="/agents" className="text-xs text-slate-400 hover:text-slate-600">
          ← Agents
        </Link>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-slate-900">
            {isLoading ? agentId : agentName}
          </h1>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 shrink-0">
            <Link
              to="/agents/$agentId"
              params={{ agentId }}
              className="rounded px-3 py-1.5 text-xs text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm transition-all"
            >
              Profile
            </Link>
            <span className="flex items-center gap-1.5 rounded bg-white px-3 py-1.5 text-xs font-medium text-violet-700 shadow-sm">
              <Settings className="h-3 w-3" /> Config
            </span>
          </div>
        </div>
        <ConfigAgentIdRow agentId={agentId} />
      </div>

      {/* ── System-default notice ── */}
      <div className="flex items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
        <div className="text-xs text-violet-700 leading-relaxed">
          <span className="font-semibold">All checks are post-session by default.</span>
          {' '}Sub-checks marked with a{' '}
          <Zap className="inline h-3 w-3 text-violet-500" />{' '}
          icon have an online (real-time) implementation in the langgraph-sdk. Toggle them on to detect
          threats the moment they occur instead of waiting for session end. Post-session scoring still
          runs — it will skip any sub-checks already handled online and merge results into the final score.
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Signals tracked', value: '20', sub: '10 LLM · 10 ASI' },
          { label: 'Total sub-checks', value: String(TOTAL_CHECKS), sub: 'across all signals' },
          { label: 'Active checks', value: String(TOTAL_ACTIVE), sub: 'system default · always on' },
          { label: 'Online detection', value: String(onlineCount), sub: onlineCount === 0 ? 'all checks post-session' : 'running via SDK in real time' },
        ].map(card => (
          <div key={card.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-slate-200">
        {(
          [
            { id: 'llm',        label: 'LLM Framework',      subtitle: 'OW-LLM01–10' },
            { id: 'asi',        label: 'ASI Framework',       subtitle: 'OW-ASI01–10' },
            { id: 'thresholds', label: 'Alert Thresholds',    subtitle: 'composite & per-signal' },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 pb-2.5 pt-1 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-slate-400">{tab.subtitle}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'llm' ? (
        <>
          <PhaseLegend />
          <FrameworkSection
            label="LLM Security Signals (OWASP LLM Top 10)"
            signals={LLM_SIGNALS}
            onlineOverrides={onlineOverrides}
            actionOverrides={actionOverrides}
            onToggleOnline={handleToggleOnline}
            onActionChange={handleActionChange}
          />
        </>
      ) : activeTab === 'asi' ? (
        <>
          <PhaseLegend />
          <FrameworkSection
            label="Agentic Security Signals (OWASP Agentic Top 10)"
            signals={ASI_SIGNALS}
            onlineOverrides={onlineOverrides}
            actionOverrides={actionOverrides}
            onToggleOnline={handleToggleOnline}
            onActionChange={handleActionChange}
          />
        </>
      ) : (
        <AlertThresholdsTab agentId={agentId} />
      )}
    </div>
  )
}
