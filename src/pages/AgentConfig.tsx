import React, { useState, useRef, useEffect } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import {
  useAgentProfile, useSubcheckConfig, useToggleSubcheckOnline,
  useAlertConfig,
  useUpdateLlmCompositeThreshold, useUpdateAsiCompositeThreshold,
  useUpdateSignalThreshold,
  useUpdateToolManifest, useUpdateMaxToolCalls, useToolCallBaseline,
  useUpdateAgentProfile, useUpdatePrivilegeScope, useUpdateToolScope,
  useUpdateTokenBudget,
} from '../hooks/useSecurity'
import { useAgentLlmModels, useSetAgentLlmModels } from '../hooks/useAgentLlmModels'
import { useLlmModels } from '../hooks/useLlmModels'
import { useAgentConnectedAgents, useSetAgentConnectedAgents } from '../hooks/useAgentConnectedAgents'
import { useAgents } from '../hooks/useAgents'
import { useTools } from '../hooks/useTools'
import { useMcpServers } from '../hooks/useMcpServers'
import type { OnlineAction } from '../types/security'
import { ChevronDown, ChevronRight, Shield, ShieldCheck, ShieldOff, Settings, Zap, HelpCircle, Copy, Check, Lock, Globe, Package, Clock, Cpu, Bot, X } from 'lucide-react'
import { useAuthStore } from '../stores/auth'
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
  online:        'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800',
  post_session:  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  cross_session: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
  both:          'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
  excluded:      'bg-slate-100 text-slate-400 border-slate-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700',
}

const PHASE_LABEL: Record<DetectionPhase, string> = {
  online:        'Online',
  post_session:  'Post-session',
  cross_session: 'Cross-session',
  both:          'Online + Post',
  excluded:      'Excluded',
}

const SEV_STYLE: Record<Severity, string> = {
  critical: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  high:     'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  medium:   'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  low:      'bg-slate-50 text-slate-500 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
}

const CONF_STYLE: Record<ConfidenceTier, string> = {
  deterministic: 'text-emerald-700 font-semibold dark:text-emerald-400',
  high:          'text-slate-700 dark:text-zinc-300',
  medium:        'text-slate-500 dark:text-zinc-400',
  low:           'text-slate-400 dark:text-zinc-500',
  skeletal:      'text-slate-300 italic dark:text-zinc-600',
}

const BAND_BG: Record<string, string> = {
  clean:    'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400',
  low:      'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400',
  medium:   'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
  high:     'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400',
  critical: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
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

const TOTAL_ACTIVE  = SIGNAL_REGISTRY.flatMap(s => s.subChecks).filter(c => !c.excluded).length
const TOTAL_CHECKS  = SIGNAL_REGISTRY.flatMap(s => s.subChecks).length
const TOTAL_CAPABLE = SIGNAL_REGISTRY.flatMap(s => s.subChecks).filter(c => c.onlineCapable === true && !c.excluded).length

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
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-lg leading-relaxed whitespace-normal dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
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
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/40">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${accentColor === 'blue' ? 'text-blue-700 dark:text-blue-400' : 'text-purple-700 dark:text-purple-400'}`}>
            {label}
          </span>
          <Tooltip text={tooltip} />
        </div>
        <div className="flex items-center gap-2">
          {isCustom ? (
            <>
              <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                accentColor === 'blue'
                  ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
              }`}>custom</span>
              <button
                onClick={onReset}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 underline"
                title="Reset to platform default (60)"
              >
                reset to default
              </button>
            </>
          ) : (
            <span className="inline-block rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
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
          className={`w-14 rounded-md border border-slate-200 px-2 py-1 text-center text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${focusRing}`}
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
            <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-slate-200 bg-white shadow-lg py-1 dark:border-zinc-700 dark:bg-zinc-800">
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
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium capitalize hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors ${
                    b === band ? 'font-semibold' : ''
                  }`}
                >
                  <span className={`inline-block rounded border px-1.5 py-0.5 ${BAND_BG[b]}`}>{b}</span>
                  <span className="text-slate-400 dark:text-zinc-500 font-normal">≥ {BAND_THRESHOLD[b]}</span>
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
  const updateLlm         = useUpdateLlmCompositeThreshold(agentId)
  const updateAsi         = useUpdateAsiCompositeThreshold(agentId)
  const updateSignal      = useUpdateSignalThreshold(agentId)

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
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Agent trust degradation</h3>
                <Tooltip text="Trust alert fires when the last 3 consecutive sessions all have a trust score below 50. This detects sustained degradation, not a one-off risky session. The threshold is platform-wide and cannot be overridden per-agent." />
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Tracks cross-session trust decay for <span className="font-medium text-slate-700 dark:text-zinc-300">this agent</span>.
                Fires when behaviour is persistently risky, not just once.
              </p>
            </div>
          </div>
          <span className="shrink-0 inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            platform-wide · not configurable per-agent
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs rounded-md bg-slate-50 border border-slate-100 px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700">
          <span className="text-slate-400 dark:text-zinc-500">Alert fires when the</span>
          <span className="font-semibold text-slate-800 dark:text-zinc-200">last 3 consecutive sessions</span>
          <span className="text-slate-400 dark:text-zinc-500">all have trust score</span>
          <span className="font-semibold text-slate-800 dark:text-zinc-200">&lt; 50</span>
        </div>
      </div>

      {/* ── Per-session composite thresholds ── */}
      <div className="rounded-lg bg-white px-4 py-4 dark:bg-zinc-900">
        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Per-session composite alert thresholds</h3>
          <Tooltip text="Each session produces two composite scores — one for LLM threats and one for Agentic (ASI) threats. An alert fires when either score meets or exceeds its threshold. You can tune them independently: lower the LLM threshold if you care more about prompt injection; lower ASI if you care more about rogue tool behaviour." />
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
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
      <div className="rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between dark:border-zinc-800">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Per-signal alert thresholds</h3>
            <Tooltip text="Per session — fires when a single session's effective score for this signal (check score × confidence weight) reaches this threshold. Threshold 999 means the signal never triggers an alert, though findings are still recorded. Platform defaults shown in grey; overrides in violet." />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-medium text-slate-400 dark:border-zinc-800 dark:text-zinc-500">
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
                    className={`border-b border-slate-50 dark:border-zinc-800 ${
                      idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-slate-50/40 dark:bg-zinc-800/30'
                    } ${excluded ? 'opacity-60' : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50'}`}
                  >
                    <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-zinc-400 whitespace-nowrap">{sig.id}</td>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-zinc-300 max-w-xs">
                      <span className="line-clamp-1">{sig.name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                        sig.framework === 'LLM'
                          ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                          : 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400'
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
                                      ? 'border-rose-300 text-rose-600 bg-rose-50 focus:border-rose-400 focus:ring-rose-400 dark:border-rose-800 dark:text-rose-400 dark:bg-rose-900/20'
                                      : overridden
                                        ? 'border-violet-300 text-violet-700 bg-violet-50 focus:border-violet-500 dark:border-violet-700 dark:text-violet-400 dark:bg-violet-900/20'
                                        : 'border-slate-200 text-slate-600 bg-white focus:border-slate-400 dark:border-zinc-700 dark:text-zinc-400 dark:bg-zinc-800'
                                  }`}
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {excluded && !overridden ? (
                              <span className="text-slate-200 dark:text-zinc-700">—</span>
                            ) : (
                              <ToggleSwitch
                                checked={isDirectAlert}
                                onChange={(on) =>
                                  updateSignal.mutate({ signal_id: sig.id, threshold: on ? 0 : null })
                                }
                                label={isDirectAlert ? 'Turn off direct alert' : 'Direct alert: alert on any score'}
                              />
                            )}
                          </td>
                        </>
                      )
                    })()}
                    <td className="px-4 py-2.5 text-right">
                      {excluded && !overridden ? (
                        <span className="inline-block rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
                          no alerts
                        </span>
                      ) : alertConfig.signal_thresholds[sig.id] === 0 ? (
                        <span className="inline-block rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400">
                          direct alert
                        </span>
                      ) : overridden ? (
                        <span className="inline-block rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400">
                          custom
                        </span>
                      ) : (
                        <span className="inline-block whitespace-nowrap rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
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
          ? 'cursor-not-allowed opacity-40 bg-slate-200 dark:bg-zinc-700'
          : checked
          ? 'bg-violet-500 cursor-pointer'
          : 'bg-slate-300 dark:bg-zinc-600 cursor-pointer'
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
  block_call:        'block call',
  terminate_session: 'terminate',
}

const ACTION_DOT: Record<OnlineAction, string> = {
  alert:             'bg-amber-400',
  sanitize:          'bg-teal-400',
  block_call:        'bg-orange-500',
  terminate_session: 'bg-red-500',
}

const ACTION_RING: Record<OnlineAction, string> = {
  alert:             'border-amber-200 dark:border-amber-700',
  sanitize:          'border-teal-200 dark:border-teal-700',
  block_call:        'border-orange-200 dark:border-orange-700',
  terminate_session: 'border-red-200 dark:border-red-700',
}

function ActionSelect({
  value,
  options,
  disabled,
  onChange,
}: {
  value: OnlineAction
  options: OnlineAction[]
  disabled: boolean
  onChange: (a: OnlineAction) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className={`flex w-full items-center justify-between gap-1.5 text-[10px] font-medium text-slate-700 focus:outline-none dark:text-zinc-300 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span>{ACTION_LABELS[value]}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[100px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {options.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { onChange(a); setOpen(false) }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[10px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-zinc-700/60 ${
                a === value ? 'text-violet-600 dark:text-violet-400' : 'text-slate-700 dark:text-zinc-300'
              }`}
            >
              <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${ACTION_DOT[a]}`} />
              {ACTION_LABELS[a]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Subchecks that have a real heuristic fallback when the profile field is null.
// Every other profile-linked subcheck produces zero findings when unconfigured.
const SUBCHECK_HAS_HEURISTIC = new Set([
  'TME-03b',  // URL pattern detects prod endpoints (assumes staging when undeclared)
  'EA-01c',   // read-intent vs write-tool heuristic
  'EA-02a',   // tool-name pattern heuristic
  'TME-03a',  // tool-name pattern heuristic
  'TME-01a',  // pattern-matching fallback when no schema declared
  'IPA-01a',  // pattern-matching runs even without privilege_scope declared
  'ASCV-04a', // always fires on any install command regardless
  'EA-02b',   // statistical baseline (7-day mean + 1σ)
  'TME-01b',  // statistical baseline (7-day per-session avg × 3.0)
])

// Maps each subcheck to the Agent Profile section anchor it configures.
const SUBCHECK_PROFILE_ANCHOR: Partial<Record<string, string>> = {
  'EA-01a':  'profile-tool-manifest',
  'TME-01a': 'profile-tool-manifest',
  'IPA-01a': 'profile-tool-manifest',
  'EA-02b':  'profile-max-tool-calls',
  'TME-01b': 'profile-max-tool-calls',
  'SPL-01a': 'profile-system-prompt', 'SPL-01b': 'profile-system-prompt',
  'EA-02c':  'profile-system-prompt',
  'TME-03b': 'profile-environment',
  'EA-01c':  'profile-write-namespace',
  'EA-02a':  'profile-irreversible-tools', 'TME-03a': 'profile-irreversible-tools',
  'EA-03a':  'profile-working-directory',
  'EA-03b':  'profile-network-allowlist',
  'UBC-01b': 'profile-connected-llms',
  'UBC-02b': 'profile-token-budget',
  'EA-04a':  'profile-connected-llms',
  'IAC-05a': 'profile-connected-agents',
  'RA-01b':  'profile-operating-hours',
  'ASCV-01a': 'profile-mcp-endpoints', 'ASCV-01b': 'profile-mcp-endpoints',
  'ASCV-02b': 'profile-sbom', 'ASCV-04a': 'profile-sbom',
}

// Which alertConfig field each profile-linked subcheck reads at analysis time.
const SUBCHECK_PROFILE_FIELD: Partial<Record<string, string>> = {
  'EA-01a':  'tool_manifest',
  'TME-01a': 'tool_manifest',
  'IPA-01a': 'tool_manifest',
  'EA-02b':  'max_tool_calls_per_session',
  'TME-01b': 'max_tool_calls_per_session',
  'SPL-01a': 'system_prompt',    'SPL-01b': 'system_prompt',
  'EA-02c':  'system_prompt',
  'TME-03b': 'environment',
  'EA-01c':  'write_namespace',
  'EA-02a':  'irreversible_tools', 'TME-03a': 'irreversible_tools',
  'EA-03a':  'working_directory',
  'EA-03b':  'network_allowlist',
  'UBC-01b': 'connected_llms',
  'UBC-02b': 'token_budget_usd',
  'EA-04a':  'connected_llms',
  'IAC-05a': 'connected_agents',
  'RA-01b':  'operating_hours',
  'ASCV-01a': 'mcp_endpoints', 'ASCV-01b': 'mcp_endpoints',
  'ASCV-02b': 'sbom_allowlist', 'ASCV-04a': 'sbom_allowlist',
}

const SUBCHECK_AUTO_DESC: Partial<Record<string, string>> = {
  'EA-01a':  'no tool manifest declared — EA-01a is blind, any tool name is permitted',
  'TME-01a': 'no schema declared — pattern-matching fallback active (shell chain / base64 / code injection / XSS)',
  'IPA-01a': 'no tools declared — pattern-matching active on all tool names and payloads, privilege escalation flagged with no per-tool exceptions',
  'EA-02b':  'statistical detection active — uses 7-day rolling mean + 1σ to flag anomalies',
  'TME-01b': 'no cap set — statistical baseline active, fires when session exceeds 3× the 7-day per-session average (≥5 sessions required)',
  'SPL-01a': 'no system prompt declared — verbatim match disabled',
  'SPL-01b': 'no system prompt declared — probe comparison disabled',
  'EA-02c':  'no system prompt declared — modification diff disabled',
  'TME-03b': 'no environment declared — treated as non-production, TME-03b active post-session',
  'EA-01c':  'no write namespace declared — read-intent heuristic active',
  'EA-02a':  'no tool list declared — name-pattern heuristic active',
  'TME-03a': 'no tool list declared — name-pattern heuristic active',
  'EA-03a':  'no working directory declared — check disabled',
  'EA-03b':  'no host allowlist declared — check disabled',
  'UBC-01b': 'no models declared — context window check disabled; connect models with declared context window sizes under Connected LLMs in Agent Profile',
  'UBC-02b': 'no token budget set — UBC-02b is blind; set a USD budget cap under Token Budget in Agent Profile to fire when session cost exceeds it',
  'EA-04a':  'no models declared — check disabled; map models under Connected LLMs in Agent Config',
  'IAC-05a': 'no connected agents declared — IAC-05a is blind; declare permitted sub-agents under Connected Agents in Agent Profile',
  'RA-01b':  'no schedule declared — check disabled',
  'ASCV-01a': 'no MCP endpoints declared — check disabled',
  'ASCV-01b': 'no MCP endpoints declared — check disabled',
  'ASCV-02b': 'no SBOM declared — unknown-package check disabled',
  'ASCV-04a': 'no SBOM declared — fires on every pip/npm/yarn/gem/cargo install (heuristic mode)',
}

// Per-subcheck manual description formatters. Used instead of the raw profile
// value when the configured limit needs context to be meaningful.
const SUBCHECK_MANUAL_DESC: Partial<Record<string, (value: unknown) => string>> = {
  'UBC-01b': (v) => {
    const count = Array.isArray(v) ? v.length : 0
    return `${count} model${count !== 1 ? 's' : ''} connected — fires when input tokens ≥ 85% of declared context window. Still blind for models used in a session that are not declared here.`
  },
  'UBC-02b': (v) => `budget cap $${Number(v).toFixed(2)} USD — fires when session token cost exceeds this limit. Cost of LLMs not connected to this agent will not be counted.`,
  'TME-01b': (v) => `cap set to ${v} — fires when session count exceeds 3 × ${v} = ${Number(v) * 3} calls`,
  'TME-03b': (v) => v === 'production'
    ? 'production — TME-03b suppressed, this agent is authorised to target production endpoints and no findings will be generated'
    : 'staging — TME-03b active post-session, fires if any tool call URL matches production domain prefixes (prod., production., live.) or versioned API path patterns',
}

function _formatProfileValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) {
    if (value.length === 0) return '(empty list)'
    const preview = (value as string[]).slice(0, 3).join(', ')
    return value.length > 3 ? `${preview} +${value.length - 3} more` : preview
  }
  if (typeof value === 'object' && value !== null && 'days' in value) {
    const h = value as { days: string[]; from: string; to: string }
    return `${h.days.join(', ')} · ${h.from}–${h.to} UTC`
  }
  const s = String(value)
  return s.length > 60 ? `${s.slice(0, 60)}… (${s.length} chars)` : s
}

function SubCheckRow({
  check,
  agentId,
  isOnline,
  action,
  onToggleOnline,
  onActionChange,
  onGoToProfile,
}: {
  check: SubCheck
  agentId?: string
  isOnline: boolean
  action: OnlineAction
  onToggleOnline: (subCheckId: string, online: boolean) => void
  onActionChange: (subCheckId: string, action: OnlineAction) => void
  onGoToProfile?: (anchor: string) => void
}) {
  const [showMatches, setShowMatches] = useState(false)
  const hasMatches = check.matches && check.matches.length > 0
  const canToggle = check.onlineCapable === true && !check.excluded

  // Profile config display
  const profileFieldKey = SUBCHECK_PROFILE_FIELD[check.subCheckId]
  const hasProfileField  = !!profileFieldKey
  const { data: alertConfig }  = useAlertConfig(agentId ?? '')
  const { data: toolInventory } = useTools()
  const profileValue = hasProfileField && alertConfig
    ? (alertConfig as unknown as Record<string, unknown>)[profileFieldKey!]
    : undefined

  // TME-01a: split manifest tools into those with/without a schema
  const tme01aManifest: string[] = check.subCheckId === 'TME-01a' && Array.isArray(profileValue)
    ? profileValue as string[]
    : []
  const tme01aWithSchema    = tme01aManifest.filter(n =>
    (toolInventory ?? []).some(t => t.name === n && t.schema != null && Object.keys(t.schema).length > 0)
  )
  const tme01aWithoutSchema = tme01aManifest.filter(n => !tme01aWithSchema.includes(n))

  // IPA-01a: split manifest tools into privilege-capable vs not
  const ipa01aManifest: string[] = check.subCheckId === 'IPA-01a' && Array.isArray(profileValue)
    ? profileValue as string[]
    : []
  const ipa01aPrivScope: string[] = check.subCheckId === 'IPA-01a' && alertConfig
    ? (alertConfig.privilege_scope ?? [])
    : []
  const ipa01aPrivileged    = ipa01aManifest.filter(n => ipa01aPrivScope.includes(n))
  const ipa01aNotPrivileged = ipa01aManifest.filter(n => !ipa01aPrivScope.includes(n))
  // Empty array counts as "not configured" (tool_manifest = [] means no manifest set)
  const isManualProfile = profileValue !== null && profileValue !== undefined
    && !(Array.isArray(profileValue) && profileValue.length === 0)
  const showPatternsBtn = !check.excluded && (!!hasMatches || hasProfileField)

  const effectivePhase: DetectionPhase =
    check.excluded        ? 'excluded' :
    isOnline              ? 'online' :
    check.phase === 'cross_session' ? 'cross_session' :
    'post_session'

  return (
    <>
      <tr
        className={`border-b border-slate-50 text-xs dark:border-zinc-800 ${check.excluded ? 'opacity-50' : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/40'}`}
      >
        <td className="py-2 pr-3 font-mono text-slate-500 dark:text-zinc-400 whitespace-nowrap">{check.subCheckId}</td>
        <td className="py-2 pr-3 text-slate-700 dark:text-zinc-300">
          <div className="flex items-center gap-1.5">
            {check.excluded
              ? <ShieldOff className="h-3 w-3 shrink-0 text-slate-300" />
              : <Shield className="h-3 w-3 shrink-0 text-violet-400" />
            }
            {check.label}
          </div>
          {check.exclusionReason && (
            <p className="mt-0.5 text-slate-400 dark:text-zinc-500 italic">{check.exclusionReason}</p>
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
              check.score >= 90 ? 'text-red-600 dark:text-red-400' :
              check.score >= 70 ? 'text-orange-500 dark:text-orange-400' :
              check.score >= 50 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-500 dark:text-zinc-400'
            }`}>{check.score}</span>
          )}
        </td>
        <td className="py-2 text-right">
          {showPatternsBtn ? (
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
            <div className="flex items-center justify-end gap-2">
              <Zap className={`h-3 w-3 shrink-0 ${isOnline ? 'text-violet-500' : 'text-slate-300'}`} />
              <ToggleSwitch
                checked={isOnline}
                onChange={v => onToggleOnline(check.subCheckId, v)}
                label={`Toggle ${check.subCheckId} online detection`}
              />
              <div className={`flex w-[104px] items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-colors ${
                isOnline
                  ? `bg-white shadow-sm dark:bg-zinc-800 ${ACTION_RING[action]}`
                  : 'border-slate-200 bg-slate-50 opacity-40 pointer-events-none dark:border-zinc-700 dark:bg-zinc-800/50'
              }`}>
                {isOnline && (
                  <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${ACTION_DOT[action]}`} />
                )}
                <ActionSelect
                  value={action}
                  options={(Object.keys(ACTION_LABELS) as OnlineAction[]).filter(a => !check.validActions || check.validActions.includes(a))}
                  disabled={!isOnline}
                  onChange={(a) => onActionChange(check.subCheckId, a)}
                />
              </div>
            </div>
          ) : check.excluded ? (
            <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
              <ShieldOff className="h-3 w-3" /> Excluded
            </span>
          ) : (
            <span className="text-[10px] text-slate-300 dark:text-zinc-600">post-session only</span>
          )}
        </td>
      </tr>

      {showMatches && (hasMatches || hasProfileField) && (
        <tr className="bg-violet-50/40 border-b border-slate-100 dark:bg-violet-900/10 dark:border-zinc-800">
          <td colSpan={8} className="px-6 py-2 space-y-2">
            {hasProfileField && (
              check.subCheckId === 'IPA-01a' && ipa01aManifest.length > 0 ? (
                <div className="space-y-1">
                  {ipa01aPrivileged.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="rounded border px-2 py-0.5 text-[10px] font-medium font-mono border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                        manual
                      </span>
                      <ShieldCheck className="h-3 w-3 shrink-0 text-amber-500 dark:text-amber-400" />
                      <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-mono">
                        {ipa01aPrivileged.join(', ')}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        — privilege-capable, IPA-01a skips
                      </span>
                    </div>
                  )}
                  {ipa01aNotPrivileged.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="rounded border px-2 py-0.5 text-[10px] font-medium font-mono border-slate-200 bg-white text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                        auto
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-mono">
                        {ipa01aNotPrivileged.join(', ')}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        — not privilege-capable, IPA-01a flags privilege ops
                      </span>
                    </div>
                  )}
                </div>
              ) : check.subCheckId === 'TME-01a' && tme01aManifest.length > 0 ? (
                <div className="space-y-1">
                  {tme01aWithSchema.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="rounded border px-2 py-0.5 text-[10px] font-medium font-mono border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                        manual
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-mono">
                        {tme01aWithSchema.join(', ')}
                      </span>
                    </div>
                  )}
                  {tme01aWithoutSchema.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="rounded border px-2 py-0.5 text-[10px] font-medium font-mono border-slate-200 bg-white text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                        auto
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-mono">
                        {tme01aWithoutSchema.join(', ')}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        — no schema, pattern-matching fallback active
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isManualProfile ? (
                    <span className="rounded border px-2 py-0.5 text-[10px] font-medium font-mono border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                      manual
                    </span>
                  ) : SUBCHECK_HAS_HEURISTIC.has(check.subCheckId) ? (
                    <span className="rounded border px-2 py-0.5 text-[10px] font-medium font-mono border-slate-200 bg-white text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                      auto
                    </span>
                  ) : (
                    <span className="rounded border px-2 py-0.5 text-[10px] font-medium font-mono border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-500">
                      blind
                    </span>
                  )}
                  <span className="text-[10px] text-slate-600 dark:text-zinc-400">
                    {isManualProfile
                      ? (SUBCHECK_MANUAL_DESC[check.subCheckId]?.(profileValue) ?? _formatProfileValue(profileValue))
                      : SUBCHECK_AUTO_DESC[check.subCheckId]}
                  </span>
                  {!isManualProfile && onGoToProfile && SUBCHECK_PROFILE_ANCHOR[check.subCheckId] && (
                    <button
                      type="button"
                      onClick={() => onGoToProfile(SUBCHECK_PROFILE_ANCHOR[check.subCheckId]!)}
                      className="ml-auto shrink-0 inline-flex items-center gap-1 rounded border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-medium text-violet-700 hover:bg-violet-50 hover:border-violet-400 transition-colors dark:border-violet-800 dark:bg-zinc-800 dark:text-violet-400 dark:hover:bg-violet-900/30"
                    >
                      Set in Agent Profile
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )
            )}
            {hasMatches && (
              <>
                <p className="text-[10px] font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wide">
                  Detection patterns
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {check.matches!.map((m, i) => (
                    <li
                      key={i}
                      className="rounded bg-white border border-violet-200 px-2 py-0.5 font-mono text-[10px] text-violet-800 dark:bg-zinc-800 dark:border-violet-800 dark:text-violet-300"
                    >
                      {m}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </td>
        </tr>
      )}

    </>
  )
}


// ─── Sub-component: signal accordion card ────────────────────────────────────

function SignalCard({
  signal,
  agentId,
  defaultOpen = false,
  onlineOverrides,
  actionOverrides,
  onToggleOnline,
  onActionChange,
  onGoToProfile,
}: {
  signal: SignalConfig
  agentId?: string
  defaultOpen?: boolean
  onlineOverrides: Record<string, boolean>
  actionOverrides: Record<string, OnlineAction>
  onToggleOnline: (subCheckId: string, online: boolean) => void
  onActionChange: (subCheckId: string, action: OnlineAction) => void
  onGoToProfile?: (anchor: string) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const active   = countActive(signal)
  const excluded = countExcluded(signal)
  const allExcluded = active === 0
  const onlineCount = signal.subChecks.filter(c => onlineOverrides[c.subCheckId]).length

  return (
    <div className={`rounded-lg border bg-white dark:bg-zinc-900 ${allExcluded ? 'border-slate-200 opacity-70 dark:border-zinc-700' : 'border-slate-200 dark:border-zinc-700'}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
      >
        <span className="shrink-0 text-slate-400 dark:text-zinc-500">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <span className="shrink-0 font-mono text-xs font-semibold text-slate-500 dark:text-zinc-400 w-24">
          {signal.owaspSignalId}
        </span>
        <span className="flex-1 text-sm font-medium text-slate-800 dark:text-zinc-200 text-left">
          {signal.name}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {onlineCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400">
              <Zap className="h-3 w-3" /> {onlineCount} online
            </span>
          )}
          {active > 0 && (
            <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
              <Shield className="h-3 w-3" /> {active} active
            </span>
          )}
          {excluded > 0 && (
            <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
              <ShieldOff className="h-3 w-3" /> {excluded} excluded
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pt-3 pb-4 dark:border-zinc-800">
          <p className="mb-3 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{signal.description}</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-medium text-slate-400 border-b border-slate-100 dark:text-zinc-500 dark:border-zinc-800">
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
                    agentId={agentId}
                    isOnline={onlineOverrides[check.subCheckId] ?? false}
                    action={actionOverrides[check.subCheckId] ?? 'alert'}
                    onToggleOnline={onToggleOnline}
                    onActionChange={onActionChange}
                    onGoToProfile={onGoToProfile}
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
  agentId,
  onlineOverrides,
  actionOverrides,
  onToggleOnline,
  onActionChange,
  onGoToProfile,
}: {
  label: string
  signals: SignalConfig[]
  agentId?: string
  onlineOverrides: Record<string, boolean>
  actionOverrides: Record<string, OnlineAction>
  onToggleOnline: (subCheckId: string, online: boolean) => void
  onActionChange: (subCheckId: string, action: OnlineAction) => void
  onGoToProfile?: (anchor: string) => void
}) {
  const totalActive   = signals.flatMap(s => s.subChecks).filter(c => !c.excluded).length
  const totalExcluded = signals.flatMap(s => s.subChecks).filter(c => c.excluded).length
  const totalChecks   = signals.flatMap(s => s.subChecks).length
  const totalOnline = signals.flatMap(s => s.subChecks).filter(c => onlineOverrides[c.subCheckId]).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{label}</h2>
        <p className="text-xs text-slate-400 dark:text-zinc-500">
          {totalActive} active · {totalExcluded} excluded · {totalChecks} total
          {totalOnline > 0 && (
            <span className="ml-1 font-medium text-violet-600 dark:text-violet-400">· {totalOnline} online</span>
          )}
        </p>
      </div>
      <div className="space-y-2">
        {signals.map(signal => (
          <SignalCard
            key={signal.owaspSignalId}
            signal={signal}
            agentId={agentId}
            onlineOverrides={onlineOverrides}
            actionOverrides={actionOverrides}
            onToggleOnline={onToggleOnline}
            onActionChange={onActionChange}
            onGoToProfile={onGoToProfile}
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
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">Detection phase key</p>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500">
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
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Agent Profile tab ───────────────────────────────────────────────────────
//
// Lets tenant admins declare the agent's expected behaviour: tool allowlist,
// resource boundaries, operating hours, etc. These values are read by the
// post-session scorer to run checks that would otherwise fall back to
// heuristics or be silently skipped.
//
// Role gating:
//   admin / superadmin → all fields editable
//   editor / viewer    → all fields read-only (no save controls rendered)
//
// All fields are persisted in agent_alert_config via PUT /agents/:id/alert-config.

// ── Reusable tag chip list ────────────────────────────────────────────────────

function TagList({
  tags, onRemove, readOnly, emptyText, colorClass,
}: {
  tags: string[]
  onRemove?: (t: string) => void
  readOnly: boolean
  emptyText?: string
  colorClass: string
}) {
  return (
    <div className={`flex flex-wrap gap-1.5${tags.length > 0 || emptyText ? ' min-h-[22px]' : ''}`}>
      {tags.length === 0 ? (
        emptyText ? <span className="text-[11px] text-slate-400 dark:text-zinc-500 italic">{emptyText}</span> : null
      ) : tags.map(tag => (
        <span
          key={tag}
          onClick={() => { if (!readOnly && onRemove) onRemove(tag) }}
          title={!readOnly && onRemove ? 'Click to remove' : undefined}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${colorClass} ${
            !readOnly && onRemove
              ? 'cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:border-red-800 dark:hover:text-red-400 transition-colors'
              : ''
          }`}
        >
          {tag}
          {!readOnly && onRemove && <span className="opacity-50 text-[10px]">×</span>}
        </span>
      ))}
    </div>
  )
}

function InlineTagInput({ onAdd, placeholder }: { onAdd: (t: string) => void; placeholder: string }) {
  const [val, setVal] = useState('')
  function commit() {
    const t = val.trim().replace(/,$/, '')
    if (t) { onAdd(t); setVal('') }
  }
  return (
    <div className="flex gap-2 mt-2">
      <input
        type="text"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() } }}
        placeholder={placeholder}
        className="w-52 rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder-zinc-500"
      />
      <button type="button" onClick={commit}
        className="rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-violet-700 dark:hover:bg-violet-900/20 dark:hover:text-violet-400">
        Add
      </button>
    </div>
  )
}

function McpServerPicker({ selected, onChange }: {
  selected: string[]
  onChange: (urls: string[]) => void
}) {
  const { data: servers = [] } = useMcpServers()
  const [addValue, setAddValue] = useState('')
  const available = servers.filter(s => !selected.includes(s.url))

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selected.map(url => {
        const server = servers.find(s => s.url === url)
        return (
          <span
            key={url}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {server?.name ?? url}
            <button
              onClick={() => onChange(selected.filter(u => u !== url))}
              className="ml-0.5 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )
      })}

      {available.length > 0 && (
        <select
          value={addValue}
          onChange={e => {
            const val = e.target.value
            setAddValue(val)
            if (val) { onChange([...selected, val]); setAddValue('') }
          }}
          className="rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-500 outline-none hover:border-violet-400 hover:text-violet-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-violet-600"
        >
          <option value="">+ Add server</option>
          {available.map(s => (
            <option key={s.mcpServerId} value={s.url}>{s.name}</option>
          ))}
        </select>
      )}

      {servers.length === 0 && (
        <span className="text-xs text-slate-400 dark:text-zinc-500">
          No MCP servers registered —{' '}
          <Link to="/inventory" className="text-violet-500 hover:underline dark:text-violet-400">add in Inventory</Link>.
        </span>
      )}

      {servers.length > 0 && available.length === 0 && selected.length > 0 && (
        <span className="text-xs text-slate-400 dark:text-zinc-500">All registered servers declared.</span>
      )}

      {selected.length === 0 && servers.length > 0 && (
        <span className="text-xs text-slate-400 dark:text-zinc-500">No servers declared.</span>
      )}
    </div>
  )
}

// ── Layout helpers ────────────────────────────────────────────────────────────

function ProfileSection({ title, icon, children, open, onToggle }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 hover:bg-slate-100/60 transition-colors dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:bg-zinc-700/40"
      >
        <span className="text-slate-400 dark:text-zinc-500">{icon}</span>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400">{title}</h3>
        <span className="ml-auto text-slate-400 dark:text-zinc-500">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </span>
      </button>
      {open && <div className="divide-y divide-slate-50 dark:divide-zinc-800/60">{children}</div>}
    </div>
  )
}

// Lookup: subcheck ID → parent OWASP signal ID (for badge display in Agent Profile)
const SUBCHECK_SIGNAL: Record<string, string> = {
  'SPL-01a': 'OW-LLM07', 'SPL-01b': 'OW-LLM07',
  'EA-02c':  'OW-LLM06',
  'TME-01a': 'OW-ASI02', 'TME-01b': 'OW-ASI02', 'TME-03b': 'OW-ASI02', 'TME-03a': 'OW-ASI02',
  'EA-01a':  'OW-LLM06', 'EA-01b':  'OW-LLM06', 'EA-01c': 'OW-LLM06',
  'EA-02a':  'OW-LLM06', 'EA-02b':  'OW-LLM06',
  'EA-03a':  'OW-LLM06', 'EA-03b':  'OW-LLM06',
  'RA-01b':  'OW-ASI10',
  'ASCV-01a': 'OW-ASI04', 'ASCV-01b': 'OW-ASI04', 'ASCV-01c': 'OW-ASI04',
  'ASCV-02a': 'OW-ASI04', 'ASCV-02b': 'OW-ASI04', 'ASCV-04a': 'OW-ASI04',
  'UBC-01a': 'OW-LLM10', 'UBC-01b': 'OW-LLM10',
  'UBC-02a': 'OW-LLM10', 'UBC-02b': 'OW-LLM10',
  'UBC-05a': 'OW-LLM10',
  'EA-04a':  'OW-LLM06',
  'IAC-05a': 'OW-ASI07',
  'IPA-01a': 'OW-ASI03',
}


const PROFILE_STATUS_STYLE: Record<'auto' | 'manual' | 'blind', string> = {
  auto:   'border-slate-200 bg-white text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
  manual: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  blind:  'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-500',
}

function ProfileRow({ label, subChecks, tooltip, id, status, statusNode, autoDesc, manualDesc, how, howPatterns, onReset, children }: {
  label: string
  subChecks: string[]
  tooltip: string
  id?: string
  status: 'auto' | 'manual' | 'blind'
  statusNode?: React.ReactNode
  autoDesc: string
  manualDesc?: string
  how?: string
  howPatterns?: string[]
  onReset?: () => void
  children?: React.ReactNode
}) {
  const [howOpen, setHowOpen] = useState(false)
  const isManual = status === 'manual'

  return (
    <div id={id} className="px-4 py-4">
      {/* Header: label + subcheck badges + status badge */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{label}</span>
        <Tooltip text={tooltip} />
        {subChecks.map(sc => (
          <span key={sc} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-500 dark:bg-zinc-700 dark:text-zinc-400">
            {sc}{SUBCHECK_SIGNAL[sc] ? ` | ${SUBCHECK_SIGNAL[sc]}` : ''}
          </span>
        ))}
        {statusNode ?? (
          <span className={`ml-auto rounded border px-1.5 py-0.5 text-[9px] font-medium ${PROFILE_STATUS_STYLE[status]}`}>
            {status}
          </span>
        )}
      </div>

      {/* Description line + how? or reset */}
      <div className="flex items-start gap-3 mb-3">
        <p className="flex-1 text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">
          {isManual && manualDesc ? manualDesc : autoDesc}
        </p>
        {isManual ? (
          onReset && (
            <button type="button" onClick={onReset}
              className="shrink-0 rounded border border-slate-200 px-2 py-0.5 text-[10px] text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors dark:border-zinc-700 dark:text-zinc-500 dark:hover:text-red-400 dark:hover:border-red-800">
              reset
            </button>
          )
        ) : (
          how && (
            <button type="button" onClick={() => setHowOpen(v => !v)}
              className="shrink-0 flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500 hover:border-violet-300 hover:text-violet-700 transition-colors dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-violet-400">
              <HelpCircle className="h-3 w-3" /> how?
            </button>
          )
        )}
      </div>

      {/* Expandable how? */}
      {howOpen && !isManual && how && (
        <div className="mb-3 rounded-md border border-violet-100 bg-violet-50/60 px-3 py-2 space-y-2 dark:border-violet-900 dark:bg-violet-900/10">
          <p className="text-[11px] text-violet-800 dark:text-violet-300 leading-relaxed">{how}</p>
          {howPatterns && howPatterns.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {howPatterns.map(p => (
                <code key={p} className="rounded border border-violet-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-violet-800 dark:border-violet-800 dark:bg-zinc-900 dark:text-violet-300">
                  {p}
                </code>
              ))}
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  )
}


// ── Connected LLMs section ────────────────────────────────────────────────────

function ConnectedLlmsSection({ agentId, isAdmin, scrollTo }: { agentId: string; isAdmin: boolean; scrollTo?: string }) {
  const { data: mapped = [], isLoading } = useAgentLlmModels(agentId)
  const { data: allModels = [] }         = useLlmModels()
  const setModels                        = useSetAgentLlmModels(agentId)
  const { data: alertConfig }            = useAlertConfig(agentId)
  const updateTokenBudget                = useUpdateTokenBudget(agentId)
  const [open, setOpen]                  = useState(false)
  const [addValue, setAddValue]          = useState('')
  const [budgetDraft, setBudgetDraft]    = useState('')

  useEffect(() => {
    if (scrollTo === 'profile-token-budget') {
      setOpen(true)
      setTimeout(() => {
        document.getElementById('profile-token-budget')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 120)
    }
  }, [scrollTo])

  const mappedIds = new Set(mapped.map(m => m.modelId))
  const available = allModels.filter(m => !mappedIds.has(m.modelId))
  const status: 'auto' | 'manual' = mapped.length > 0 ? 'manual' : 'auto'

  function handleAdd(modelId: string) {
    setAddValue('')
    setModels.mutate([...Array.from(mappedIds), modelId])
  }
  function handleRemove(modelId: string) {
    setModels.mutate(Array.from(mappedIds).filter(id => id !== modelId))
  }

  const modelNames = mapped.map(m => m.name).join(', ')

  return (
    <ProfileSection
      title="Connected LLMs"
      icon={<Cpu className="h-3.5 w-3.5" />}
      open={open}
      onToggle={() => setOpen(v => !v)}
    >
      <ProfileRow
        id="profile-connected-llms"
        label="Connected LLMs"
        subChecks={['UBC-01a', 'UBC-01b', 'UBC-02a', 'UBC-05a', 'EA-04a']}
        tooltip="Map the LLM models this agent uses. Required for per-model cost calculations, context window enforcement, accurate statistical baselines, and detecting use of undeclared models."
        status={status}
        autoDesc="No models declared — UBC-05a uses a global cost rate for all models. Baselines for UBC-01a and UBC-02a mix token counts across models. UBC-01b context window check and EA-04a undeclared-model detection cannot run."
        manualDesc={`${mapped.length} model${mapped.length !== 1 ? 's' : ''} connected (${modelNames}) — UBC-05a uses per-model cost rates. Baselines scoped per model. UBC-01b fires if input tokens exceed 85% of declared context window. EA-04a fires if a session uses a model not in this list.`}
        how="UBC-05a looks up input_cost_per_1k and output_cost_per_1k from the registered model in Inventory to compute accurate cost per session instead of a global fallback rate. UBC-01a and UBC-02a build a separate 7-day baseline per model so a token spike in GPT-4o doesn't get masked by lower-usage sessions on Claude Haiku. UBC-01b fires when session input tokens exceed 85% of the declared context_window_tokens — indicating a context stuffing attempt. EA-04a fires post-session if any llm_end event carries a model name not in this declared list."
        onReset={isAdmin ? () => setModels.mutate([]) : undefined}
      >
        {isLoading ? (
          <div className="h-6 w-32 animate-pulse rounded bg-slate-100 dark:bg-zinc-800" />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {mapped.map(m => (
              <span
                key={m.modelId}
                className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400"
              >
                <span className="font-mono">{m.name}</span>
                {m.provider && (
                  <span className="text-violet-400 dark:text-violet-600">· {m.provider}</span>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleRemove(m.modelId)}
                    className="ml-0.5 text-violet-400 hover:text-violet-700 dark:text-violet-600 dark:hover:text-violet-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}

            {isAdmin && available.length > 0 && (
              <select
                value={addValue}
                onChange={e => {
                  const val = e.target.value
                  setAddValue(val)
                  if (val) handleAdd(val)
                }}
                className="rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-500 outline-none hover:border-violet-400 hover:text-violet-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-violet-600"
              >
                <option value="">+ Add model</option>
                {available.map(m => (
                  <option key={m.modelId} value={m.modelId}>
                    {m.name}{m.provider ? ` (${m.provider})` : ''}
                  </option>
                ))}
              </select>
            )}

            {isAdmin && allModels.length === 0 && (
              <span className="text-xs text-slate-400 dark:text-zinc-500">
                No models in inventory —{' '}
                <Link to="/inventory" className="text-violet-500 hover:underline dark:text-violet-400">add in Inventory</Link>.
              </span>
            )}

            {isAdmin && allModels.length > 0 && available.length === 0 && mapped.length > 0 && (
              <span className="text-xs text-slate-400 dark:text-zinc-500">All inventory models connected.</span>
            )}

            {mapped.length === 0 && !isAdmin && (
              <span className="text-xs text-slate-400 dark:text-zinc-500">No models connected.</span>
            )}
          </div>
        )}
      </ProfileRow>

      <ProfileRow
        id="profile-token-budget"
        label="Token budget cap"
        subChecks={['UBC-02b']}
        tooltip="Set a per-session USD spend limit. UBC-02b fires when total token cost for a session exceeds this cap. Requires Connected LLMs to have input/output cost rates set in Inventory."
        status={alertConfig?.token_budget_usd != null ? 'manual' : 'blind'}
        autoDesc="No budget cap set — UBC-02b is blind. Set a USD limit to detect sessions that exceed expected token cost."
        manualDesc={alertConfig?.token_budget_usd != null ? `Budget cap $${alertConfig.token_budget_usd.toFixed(2)} USD — UBC-02b fires when session token cost exceeds this limit. Cost of LLMs not connected to this agent will not be counted.` : ''}
        how="UBC-02b multiplies each model's input and output token counts by the per-1k rates declared in Inventory → LLM Models, sums across all LLM calls in the session, and fires when the total exceeds this cap. Without cost rates for a model, those tokens contribute $0 to the total — so Connected LLMs with declared pricing are required for full coverage."
        onReset={isAdmin ? () => updateTokenBudget.mutate(null) : undefined}
      >
        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 dark:text-zinc-500">$</span>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={budgetDraft}
              onChange={e => setBudgetDraft(e.target.value)}
              onBlur={() => {
                const n = parseFloat(budgetDraft)
                if (!isNaN(n) && n > 0) { updateTokenBudget.mutate(n); setBudgetDraft('') }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const n = parseFloat(budgetDraft)
                  if (!isNaN(n) && n > 0) { updateTokenBudget.mutate(n); setBudgetDraft('') }
                }
              }}
              placeholder={alertConfig?.token_budget_usd != null
                ? String(alertConfig.token_budget_usd.toFixed(2))
                : 'e.g. 0.50'}
              className="w-40 rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 placeholder-slate-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder-zinc-500"
            />
            <span className="text-[11px] text-slate-400 dark:text-zinc-500">USD per session</span>
          </div>
        )}
      </ProfileRow>
    </ProfileSection>
  )
}

// ── Connected Agents section ──────────────────────────────────────────────────

function ConnectedAgentsSection({ agentId, isAdmin, scrollTo }: { agentId: string; isAdmin: boolean; scrollTo?: string }) {
  const { data: connected = [], isLoading } = useAgentConnectedAgents(agentId)
  const { data: allAgents = [] }            = useAgents()
  const setConnected                        = useSetAgentConnectedAgents(agentId)
  const [open, setOpen]                     = useState(false)
  const [addValue, setAddValue]             = useState('')

  useEffect(() => {
    if (scrollTo === 'profile-connected-agents') {
      setOpen(true)
      setTimeout(() => {
        document.getElementById('profile-connected-agents')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 120)
    }
  }, [scrollTo])

  const connectedIds = new Set(connected.map(a => a.agentId))
  // Exclude the agent itself and already-connected agents from the dropdown
  const available = allAgents.filter(a => a.agentId !== agentId && !connectedIds.has(a.agentId))
  const status: 'auto' | 'manual' = connected.length > 0 ? 'manual' : 'auto'

  function handleAdd(id: string) {
    setAddValue('')
    setConnected.mutate([...Array.from(connectedIds), id])
  }
  function handleRemove(id: string) {
    setConnected.mutate(Array.from(connectedIds).filter(cid => cid !== id))
  }

  const agentNames = connected.map(a => a.name).join(', ')

  return (
    <ProfileSection
      title="Connected Agents"
      icon={<Bot className="h-3.5 w-3.5" />}
      open={open}
      onToggle={() => setOpen(v => !v)}
    >
      <ProfileRow
        id="profile-connected-agents"
        label="Connected Agents"
        subChecks={['IAC-05a']}
        tooltip="Declare which sub-agents this agent is permitted to delegate to. Without a declared list IAC-05a is blind. Once set, any delegation whose target is not in this list fires a critical finding."
        status={status}
        autoDesc="No connected agents declared — IAC-05a is blind and cannot detect delegations to unknown or compromised sub-agents."
        manualDesc={`${connected.length} agent${connected.length !== 1 ? 's' : ''} connected (${agentNames}) — IAC-05a fires if a session delegates to an agent not in this list.`}
        how="IAC-05a checks every invoke_agent / delegate / call_agent tool call and looks up the target name against this allowlist. If the target is absent, a critical finding is emitted — indicating delegation to an unregistered or potentially compromised agent."
        onReset={isAdmin ? () => setConnected.mutate([]) : undefined}
      >
        {isLoading ? (
          <div className="h-6 w-32 animate-pulse rounded bg-slate-100 dark:bg-zinc-800" />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {connected.map(a => (
              <span
                key={a.agentId}
                className="flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-400"
              >
                <span className="font-mono">{a.name}</span>
                {isAdmin && (
                  <button
                    onClick={() => handleRemove(a.agentId)}
                    className="ml-0.5 text-teal-400 hover:text-teal-700 dark:text-teal-600 dark:hover:text-teal-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}

            {isAdmin && available.length > 0 && (
              <select
                value={addValue}
                onChange={e => {
                  const val = e.target.value
                  setAddValue(val)
                  if (val) handleAdd(val)
                }}
                className="rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-500 outline-none hover:border-teal-400 hover:text-teal-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-teal-600"
              >
                <option value="">+ Add agent</option>
                {available.map(a => (
                  <option key={a.agentId} value={a.agentId}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}

            {isAdmin && allAgents.filter(a => a.agentId !== agentId).length === 0 && (
              <span className="text-xs text-slate-400 dark:text-zinc-500">
                No other agents in tenant yet.
              </span>
            )}

            {isAdmin && available.length === 0 && connected.length > 0 && allAgents.filter(a => a.agentId !== agentId).length > 0 && (
              <span className="text-xs text-slate-400 dark:text-zinc-500">All tenant agents connected.</span>
            )}

            {connected.length === 0 && !isAdmin && (
              <span className="text-xs text-slate-400 dark:text-zinc-500">No agents connected.</span>
            )}
          </div>
        )}
      </ProfileRow>
    </ProfileSection>
  )
}

// ── AgentProfileTab ──────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

// ── AgentProfileTab ──────────────────────────────────────────────────────────

const ANCHOR_SECTION: Record<string, 'identity' | 'toolScope' | 'network' | 'schedule' | 'supply'> = {
  'profile-system-prompt':      'identity',
  'profile-environment':        'identity',
  'profile-tool-manifest':      'toolScope',
  'profile-max-tool-calls':     'toolScope',
  'profile-irreversible-tools': 'toolScope',
  'profile-network-allowlist':  'network',
  'profile-working-directory':  'network',
  'profile-write-namespace':    'network',
  'profile-operating-hours':    'schedule',
  'profile-sbom':               'supply',
  'profile-mcp-endpoints':      'supply',
}

function AgentProfileTab({ agentId, isAdmin, scrollTo }: { agentId: string; isAdmin: boolean; scrollTo?: string }) {
  const { data: alertConfig } = useAlertConfig(agentId)
  const { data: baseline }    = useToolCallBaseline(agentId)
  const updateManifest       = useUpdateToolManifest(agentId)
  const updatePrivilegeScope = useUpdatePrivilegeScope(agentId)
  const updateToolScope      = useUpdateToolScope(agentId)
  const updateMaxCalls       = useUpdateMaxToolCalls(agentId)
  const updateProfile        = useUpdateAgentProfile(agentId)

  const [maxCallsDraft,    setMaxCallsDraft]    = useState('')
  const [addValue,         setAddValue]         = useState('')
  const [pendingAdd,       setPendingAdd]        = useState<string | null>(null)
  const [pendingPrivilege, setPendingPrivilege]  = useState(false)

  const manifest: string[]      = Array.isArray(alertConfig?.tool_manifest)   ? alertConfig!.tool_manifest   : []
  const privilegeScope: string[] = Array.isArray(alertConfig?.privilege_scope) ? alertConfig!.privilege_scope : []

  const { data: toolInventory } = useTools()
  const availableTools = (toolInventory ?? []).filter(t => !manifest.includes(t.name))

  const manifestSchemaCount = manifest.filter(name =>
    (toolInventory ?? []).some(t => t.name === name && t.schema != null && Object.keys(t.schema).length > 0)
  ).length
  const tme01aStatus: 'auto' | 'manual' | 'manual/auto' =
    manifest.length === 0       ? 'auto' :
    manifestSchemaCount === 0   ? 'auto' :
    manifestSchemaCount === manifest.length ? 'manual' :
    'manual/auto'

  function addFromInventory(name: string, isPrivileged: boolean) {
    setAddValue('')
    setPendingAdd(null)
    setPendingPrivilege(false)
    if (!name || manifest.includes(name)) return
    // Single combined request — avoids race where manifest refetch overwrites
    // the privilege_scope optimistic update before it reaches the server.
    updateToolScope.mutate({
      tool_manifest:   [...manifest, name],
      privilege_scope: isPrivileged ? [...privilegeScope, name] : privilegeScope,
    })
  }

  function togglePrivilege(name: string) {
    const next = privilegeScope.includes(name)
      ? privilegeScope.filter(x => x !== name)
      : [...privilegeScope, name]
    updatePrivilegeScope.mutate(next)
  }

  function removeTool(name: string) {
    // Combined to keep manifest and privilege_scope consistent in one write.
    updateToolScope.mutate({
      tool_manifest:   manifest.filter(x => x !== name),
      privilege_scope: privilegeScope.filter(x => x !== name),
    })
  }

  function commitMaxCalls() {
    const n = parseInt(maxCallsDraft, 10)
    if (!isNaN(n) && n >= 1) { updateMaxCalls.mutate(n); setMaxCallsDraft('') }
  }

  const hasBaseline = baseline && baseline.sessionCount >= 2 && baseline.mean != null

  const [systemPromptDraft, setSystemPromptDraft] = useState('')
  const [workingDirDraft,   setWorkingDirDraft]   = useState('')
  const [writeNSDraft,      setWriteNSDraft]      = useState('')

  const [activeDays,    setActiveDays]    = useState<string[]>([])
  const [hoursFrom,     setHoursFrom]     = useState('09:00')
  const [hoursTo,       setHoursTo]       = useState('18:00')
  const [daysEdited,    setDaysEdited]    = useState(false)

  useEffect(() => {
    if (!alertConfig) return
    if (alertConfig.system_prompt != null)     setSystemPromptDraft(alertConfig.system_prompt)
    if (alertConfig.working_directory != null) setWorkingDirDraft(alertConfig.working_directory)
    if (alertConfig.write_namespace != null)   setWriteNSDraft(alertConfig.write_namespace)
    if (alertConfig.operating_hours != null) {
      setActiveDays(alertConfig.operating_hours.days)
      setHoursFrom(alertConfig.operating_hours.from)
      setHoursTo(alertConfig.operating_hours.to)
    }
    setDaysEdited(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertConfig?.system_prompt, alertConfig?.working_directory,
      alertConfig?.write_namespace, alertConfig?.operating_hours])

  const irreversible = alertConfig?.irreversible_tools ?? []
  const networkAllow = alertConfig?.network_allowlist  ?? []
  const sbom         = alertConfig?.sbom_allowlist     ?? []
  const mcpEndpoints = alertConfig?.mcp_endpoints      ?? []

  // Section open state — all collapsed by default
  const [openSections, setOpenSections] = useState({
    identity: false, toolScope: false, network: false, schedule: false, supply: false,
  })
  function toggleSection(key: keyof typeof openSections) {
    setOpenSections(s => ({ ...s, [key]: !s[key] }))
  }

  // When navigated here from a subcheck link, open the target section then scroll
  useEffect(() => {
    if (!scrollTo) return
    const section = ANCHOR_SECTION[scrollTo]
    if (section) setOpenSections(s => ({ ...s, [section]: true }))
    setTimeout(() => {
      document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
  }, [scrollTo])

  const tagColor  = 'border-violet-200 bg-white text-violet-700 dark:border-violet-800 dark:bg-zinc-800 dark:text-violet-400'
  const hostColor = 'border-blue-200 bg-white text-blue-700 dark:border-blue-800 dark:bg-zinc-800 dark:text-blue-400'
  const pkgColor  = 'border-teal-200 bg-white text-teal-700 dark:border-teal-800 dark:bg-zinc-800 dark:text-teal-400'
  const mcpColor  = 'border-slate-200 bg-white text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'

  return (
    <div className="space-y-4">
      {!isAdmin ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800">
          <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            View only — contact your tenant admin to modify agent profile settings.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-800 dark:bg-violet-900/20">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
          <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
            Declare what is <strong>normal</strong> for this agent. Fields marked{' '}
            <span className="rounded border border-amber-200 bg-amber-50 px-1 py-px text-[9px] font-medium text-amber-600 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">blind</span>
            {' '}cannot fire without a declared value.
            Fields marked{' '}
            <span className="rounded border border-slate-200 bg-white px-1 py-px text-[9px] font-medium text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">auto</span>
            {' '}use a heuristic — click <strong>how?</strong> to understand it.
            Once you declare a value it turns{' '}
            <span className="rounded border border-emerald-200 bg-emerald-50 px-1 py-px text-[9px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">manual</span>
            {' '}and the heuristic is bypassed. Use <strong>reset</strong> to revert.
          </p>
        </div>
      )}

      {/* ════════ SECTION 0a — Connected LLMs ════════ */}
      <ConnectedLlmsSection agentId={agentId} isAdmin={isAdmin} scrollTo={scrollTo} />

      {/* ════════ SECTION 0b — Connected Agents ════════ */}
      <ConnectedAgentsSection agentId={agentId} isAdmin={isAdmin} scrollTo={scrollTo} />

      {/* ════════ SECTION 1 — Agent Identity ════════ */}
      <ProfileSection title="Agent Identity" icon={<Settings className="h-3.5 w-3.5" />} open={openSections.identity} onToggle={() => toggleSection('identity')}>

        <ProfileRow
          id="profile-system-prompt"
          label="System prompt"
          subChecks={['SPL-01a', 'SPL-01b', 'EA-02c']}
          tooltip="Paste the agent's exact system prompt. Without it SPL-01a, SPL-01b, and EA-02c cannot run."
          status={alertConfig?.system_prompt != null ? 'manual' : 'blind'}
          autoDesc="No system prompt declared — SPL-01a, SPL-01b, and EA-02c are blind. These checks cannot run without it."
          manualDesc={`System prompt declared (${alertConfig?.system_prompt?.length ?? 0} chars) — SPL-01a verbatim match, SPL-01b probe detection, and EA-02c self-modification diff are active.`}
          how="SPL-01a uses SequenceMatcher to detect verbatim segments of the declared prompt in LLM output. SPL-01b checks if the agent confirms its instructions when probed. EA-02c diffs the declared prompt against subsequent system messages to detect self-modification."
          onReset={() => { updateProfile.mutate({ system_prompt: null }); setSystemPromptDraft('') }}
        >
          {isAdmin && (
            <div className="space-y-2">
              <textarea
                rows={4}
                value={systemPromptDraft}
                onChange={e => setSystemPromptDraft(e.target.value)}
                placeholder="Paste the agent's system prompt here…"
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder-zinc-500 resize-none font-mono leading-relaxed"
              />
              <button type="button"
                onClick={() => updateProfile.mutate({ system_prompt: systemPromptDraft || null })}
                className="rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-violet-700 dark:hover:bg-violet-900/20 dark:hover:text-violet-400">
                Save
              </button>
            </div>
          )}
        </ProfileRow>

        <ProfileRow
          id="profile-environment"
          label="Environment"
          subChecks={['TME-03b']}
          tooltip="Is this agent running in production or staging? Declaring 'production' suppresses TME-03b. Without a declaration the agent is treated as non-production and TME-03b remains active."
          status={alertConfig?.environment != null ? 'manual' : 'auto'}
          autoDesc="No environment declared — treated as non-production. TME-03b is active and will fire post-session if any tool call targets a production URL."
          manualDesc={alertConfig?.environment === 'production'
            ? 'Declared production — TME-03b suppressed for this agent. Calling production endpoints is expected behaviour and will not generate findings.'
            : 'Declared staging — TME-03b active post-session. Any tool call where a URL matches production domain or versioned API patterns will generate a critical finding at session end.'}
          how="TME-03b runs at session end and inspects every tool call across the session. It scans all URL-like values in tool inputs — not just the url key — for production domain prefixes (prod., production., live.) and versioned API path structures. Declare this agent as production to suppress the check entirely; declare staging to make the active state explicit."
          onReset={() => updateProfile.mutate({ environment: null })}
        >
          {isAdmin && (
            <div className="flex gap-2">
              {(['staging', 'production'] as const).map(env => (
                <button key={env} type="button"
                  onClick={() => updateProfile.mutate({ environment: env })}
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors capitalize ${
                    alertConfig?.environment === env
                      ? env === 'production'
                        ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                  }`}
                >{env}</button>
              ))}
            </div>
          )}
        </ProfileRow>
      </ProfileSection>

      {/* ════════ SECTION 2 — Tool Scope ════════ */}
      <ProfileSection title="Tool Scope" icon={<Shield className="h-3.5 w-3.5" />} open={openSections.toolScope} onToggle={() => toggleSection('toolScope')}>

        <ProfileRow
          id="profile-tool-manifest"
          label="Tool manifest"
          subChecks={['EA-01a', 'TME-01a', 'IPA-01a']}
          tooltip="Declare which tool names this agent is allowed to call, then define their parameter schemas in Inventory → Tools. EA-01a (online) blocks any unlisted tool name in real time. TME-01a (online) validates each tool_start input against its declared schema — fires when the input carries undeclared parameters. IPA-01a (post-session) detects privilege escalation in tool names and payloads — mark each tool as Privilege-capable (🔒) to suppress false positives for tools whose role requires privilege operations."
          status={manifest.length > 0 ? 'manual' : 'auto'}
          statusNode={
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500">EA-01a</span>
                <span className={`rounded border px-1.5 py-0.5 text-[9px] font-medium ${
                  manifest.length > 0 ? PROFILE_STATUS_STYLE.manual : PROFILE_STATUS_STYLE.blind
                }`}>
                  {manifest.length > 0 ? 'manual' : 'blind'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500">TME-01a</span>
                <span className={`rounded border px-1.5 py-0.5 text-[9px] font-medium ${
                  tme01aStatus === 'manual'      ? PROFILE_STATUS_STYLE.manual :
                  tme01aStatus === 'manual/auto' ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400' :
                  PROFILE_STATUS_STYLE.auto
                }`}>
                  {tme01aStatus}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500">IPA-01a</span>
                <span className={`rounded border px-1.5 py-0.5 text-[9px] font-medium ${
                  privilegeScope.length > 0 ? PROFILE_STATUS_STYLE.manual : PROFILE_STATUS_STYLE.auto
                }`}>
                  {privilegeScope.length > 0 ? 'manual' : 'auto'}
                </span>
              </div>
            </div>
          }
          autoDesc="No tools declared — EA-01a and TME-01a are blind. IPA-01a runs in auto mode: privilege escalation in tool names and payloads is flagged with no per-tool exceptions."
          manualDesc={`${manifest.length} tool${manifest.length === 1 ? '' : 's'} in manifest${privilegeScope.length > 0 ? ` · ${privilegeScope.length} privilege-capable (🛡 admin icon)` : ' · none privilege-capable'}. EA-01a blocks unlisted calls in real time. TME-01a validates schemas. IPA-01a flags privilege operations from any tool not marked privilege-capable.`}
          how="EA-01a: online check in the SDK — if a tool_start event names a tool not in this list, the call is blocked before any LLM sees it. TME-01a: if a parameter schema is defined for the tool in Inventory → Tools, the tool_input keys are checked against the declared schema properties; any undeclared key fires the check (deterministic, score 80). When no schema is declared, TME-01a falls back to scanning the serialised tool_input for shell-chaining characters, base64 blobs ≥ 40 chars, Python code injection, and XSS patterns (score 65). IPA-01a (post-session): checks tool names against privilege-escalation keywords and scans tool_input payloads for embedded privilege ops (SQL GRANT, IAM AssumeRole / AttachPolicy, GCP setIamPolicy, K8s ClusterRoleBinding). Tools marked Privilege-capable (🔒) are skipped — use this for agents whose role legitimately requires these operations."
          howPatterns={[
            'name: admin · sudo · su · impersonate · elevate · assume_role · switch_user · become · run_as · escalate · grant_access · set_permissions',
            'payload: GRANT … ON · ALTER ROLE · CREATE ROLE · AssumeRole · AttachRolePolicy · setIamPolicy · cluster-admin · ClusterRoleBinding',
          ]}
          onReset={() => updateManifest.mutate([])}
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {manifest.map(name => {
                const toolSchema = (toolInventory ?? []).find(t => t.name === name)?.schema
                const paramCount = toolSchema ? Object.keys(toolSchema).length : 0
                const isPrivileged = privilegeScope.includes(name)
                return (
                  <span
                    key={name}
                    className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400"
                  >
                    <span className="font-mono">{name}</span>
                    {paramCount > 0 && (
                      <span className="text-violet-400 dark:text-violet-600">· {paramCount} param{paramCount !== 1 ? 's' : ''}</span>
                    )}
                    {isAdmin && isPrivileged && (
                      <button
                        onClick={() => togglePrivilege(name)}
                        title="Privilege-capable — click to revoke"
                        className="ml-0.5 text-amber-500 hover:text-amber-700 transition-colors dark:text-amber-400 dark:hover:text-amber-300"
                      >
                        <ShieldCheck className="h-3 w-3" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => removeTool(name)}
                        className="ml-0.5 text-violet-400 hover:text-violet-700 dark:text-violet-600 dark:hover:text-violet-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                )
              })}

              {isAdmin && !pendingAdd && (
                <select
                  value={addValue}
                  disabled={availableTools.length === 0}
                  onChange={e => {
                    const val = e.target.value
                    setAddValue(val)
                    if (val) { setPendingAdd(val); setPendingPrivilege(false) }
                  }}
                  className="rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-500 outline-none hover:border-violet-400 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-violet-600"
                >
                  {availableTools.length === 0 ? (
                    <option value="">
                      {(toolInventory?.length ?? 0) === 0 ? 'No tools in inventory' : 'All tools added'}
                    </option>
                  ) : (
                    <>
                      <option value="">+ Add tool</option>
                      {availableTools.map(t => (
                        <option key={t.toolId} value={t.name}>
                          {t.name}{t.category ? ` (${t.category})` : ''}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              )}

              {manifest.length === 0 && !isAdmin && (
                <span className="text-xs text-slate-400 dark:text-zinc-500">No tools in manifest.</span>
              )}
            </div>

            {/* Pending-add confirmation row — shown after selecting a tool from the dropdown */}
            {isAdmin && pendingAdd && (
              <div className="flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2 dark:border-violet-800 dark:bg-violet-900/10">
                <span className="font-mono text-xs font-medium text-violet-700 dark:text-violet-400">{pendingAdd}</span>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pendingPrivilege}
                    onChange={e => setPendingPrivilege(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 accent-amber-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-zinc-400">Privilege-capable</span>
                  <Tooltip text="Mark this tool as authorized to perform privilege-level operations for this agent — IAM role assumption, SQL DDL (GRANT / CREATE ROLE), Kubernetes RBAC, and similar. IPA-01a will not flag calls from this tool. Only tick this if the agent's role genuinely requires it." />
                </label>
                <button
                  onClick={() => addFromInventory(pendingAdd, pendingPrivilege)}
                  className="ml-auto rounded-full bg-violet-600 px-3 py-0.5 text-xs font-medium text-white hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600"
                >
                  Add
                </button>
                <button
                  onClick={() => { setPendingAdd(null); setPendingPrivilege(false); setAddValue('') }}
                  className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </ProfileRow>

        <ProfileRow
          id="profile-max-tool-calls"
          label="Max tool calls per session"
          subChecks={['EA-02b', 'TME-01b']}
          tooltip="Set a hard cap on total tool calls per session. Without a manual cap, EA-02b uses statistical anomaly detection (mean + 1σ) and TME-01b uses a 3× average spike threshold."
          status={alertConfig?.max_tool_calls_per_session != null ? 'manual' : 'auto'}
          autoDesc={hasBaseline
            ? `Statistical baseline: ~${Math.round(baseline!.mean!)} calls/session (7-day mean, ${baseline!.sessionCount} sessions) — EA-02b fires above mean + 1σ; TME-01b fires above 3× average.`
            : 'Statistical baseline warming up — need ≥2 sessions for EA-02b and ≥5 sessions for TME-01b to activate.'}
          manualDesc={`Hard cap: ${alertConfig?.max_tool_calls_per_session} calls/session — EA-02b fires immediately when exceeded; TME-01b fires when count exceeds 3× the cap.`}
          how="EA-02b enforces the hard cap (or mean + 1σ statistically) and flags any overage. TME-01b detects runaway spikes — it only fires when the session is more than 3× above the configured cap or 7-day average, targeting exfiltration loops rather than accidental overruns."
          onReset={() => updateMaxCalls.mutate(null)}
        >
          {isAdmin && (
            <div className="flex items-center gap-3">
              <input type="number" min={1} value={maxCallsDraft}
                onChange={e => setMaxCallsDraft(e.target.value)}
                onBlur={commitMaxCalls}
                onKeyDown={e => { if (e.key === 'Enter') commitMaxCalls() }}
                placeholder={alertConfig?.max_tool_calls_per_session != null
                  ? String(alertConfig.max_tool_calls_per_session)
                  : 'Set hard cap…'}
                className="w-44 rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 placeholder-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder-zinc-500"
              />
            </div>
          )}
        </ProfileRow>

        <ProfileRow
          id="profile-irreversible-tools"
          label="Irreversible / destructive tools"
          subChecks={['EA-02a', 'TME-03a']}
          tooltip="Which of this agent's tools perform actions that cannot be undone? EA-02a fires when one is called without a confirm-gate event. Without a declaration, a name-pattern heuristic is used."
          status={alertConfig?.irreversible_tools != null ? 'manual' : 'auto'}
          autoDesc="Name-pattern heuristic active — EA-02a and TME-03a flag tools matching write/delete/send/deploy patterns."
          manualDesc={`${irreversible.length} tool${irreversible.length === 1 ? '' : 's'} declared — EA-02a and TME-03a use this exact list (heuristic patterns bypassed).`}
          how="Two regex patterns are applied to every tool_start event tool name. Declaring an explicit list narrows detection to only tools you consider irreversible, reducing false positives."
          howPatterns={['write|create|insert|update|delete|remove|send|post|put|patch|drop|exec', 'payment|charge|transfer|purchase|deploy|publish']}
          onReset={() => updateProfile.mutate({ irreversible_tools: null })}
        >
          {isAdmin && (
            <>
              <TagList
                tags={irreversible}
                onRemove={t => updateProfile.mutate({ irreversible_tools: irreversible.filter(x => x !== t) })}
                readOnly={false}
                colorClass="border-red-200 bg-white text-red-700 dark:border-red-800 dark:bg-zinc-800 dark:text-red-400"
              />
              <InlineTagInput
                onAdd={t => { if (!irreversible.includes(t)) updateProfile.mutate({ irreversible_tools: [...irreversible, t] }) }}
                placeholder="e.g. delete_record, send_email …"
              />
            </>
          )}
        </ProfileRow>
      </ProfileSection>

      {/* ════════ SECTION 3 — Network & Filesystem ════════ */}
      <ProfileSection title="Network & Filesystem" icon={<Globe className="h-3.5 w-3.5" />} open={openSections.network} onToggle={() => toggleSection('network')}>

        <ProfileRow
          id="profile-network-allowlist"
          label="Network allowlist"
          subChecks={['EA-03b']}
          tooltip="Which hosts is this agent allowed to contact? EA-03b fires on any tool call targeting a host not on this list. Without a list, EA-03b cannot fire."
          status={alertConfig?.network_allowlist != null ? 'manual' : 'blind'}
          autoDesc="No host allowlist declared — EA-03b is blind. All outbound hosts are implicitly permitted."
          manualDesc={`${networkAllow.length} host${networkAllow.length === 1 ? '' : 's'} in allowlist — EA-03b active, any unlisted outbound host fires.`}
          how="EA-03b requires an explicit allowlist. Without one, every outbound call is implicitly allowed and the check produces no findings. Declaring a list is the only way to enable host-based egress control."
          onReset={() => updateProfile.mutate({ network_allowlist: null })}
        >
          {isAdmin && (
            <>
              <TagList
                tags={networkAllow}
                onRemove={t => updateProfile.mutate({ network_allowlist: networkAllow.filter(x => x !== t) })}
                readOnly={false}
                colorClass={hostColor}
              />
              <InlineTagInput
                onAdd={t => { if (!networkAllow.includes(t)) updateProfile.mutate({ network_allowlist: [...networkAllow, t] }) }}
                placeholder="e.g. api.openai.com, *.internal.example.com …"
              />
            </>
          )}
        </ProfileRow>

        <ProfileRow
          id="profile-working-directory"
          label="Working directory"
          subChecks={['EA-03a']}
          tooltip="Declare the filesystem path the agent should stay within. EA-03a fires when file-read tool calls reference paths outside this prefix. Without it, EA-03a cannot fire."
          status={alertConfig?.working_directory != null ? 'manual' : 'blind'}
          autoDesc="No working directory declared — EA-03a is blind. File-read paths cannot be validated."
          manualDesc={`Boundary set to ${alertConfig?.working_directory} — EA-03a fires on any file-read outside this path.`}
          how="EA-03a checks every file-read tool call's path argument against the declared prefix. There is no heuristic fallback — without a declared directory, the check produces no findings."
          onReset={() => { updateProfile.mutate({ working_directory: null }); setWorkingDirDraft('') }}
        >
          {isAdmin && (
            <div className="flex items-center gap-2">
              <input type="text" value={workingDirDraft}
                onChange={e => setWorkingDirDraft(e.target.value)}
                onBlur={() => updateProfile.mutate({ working_directory: workingDirDraft || null })}
                onKeyDown={e => { if (e.key === 'Enter') updateProfile.mutate({ working_directory: workingDirDraft || null }) }}
                placeholder="e.g. /app/workspace"
                className="w-72 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-mono text-slate-700 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder-zinc-500"
              />
              {alertConfig?.working_directory && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Saved</span>
              )}
            </div>
          )}
        </ProfileRow>

        <ProfileRow
          id="profile-write-namespace"
          label="Write namespace"
          subChecks={['EA-01c']}
          tooltip="Declare the path or namespace prefix this agent is permitted to write to. EA-01c fires when write calls target outside it. Without a declaration, a read-intent heuristic is used."
          status={alertConfig?.write_namespace != null ? 'manual' : 'auto'}
          autoDesc="Read-intent heuristic active — EA-01c fires when a session's opening prompt signals read-intent but a write-named tool is called."
          manualDesc={`Write namespace declared (${alertConfig?.write_namespace}) — EA-01c uses this boundary (heuristic bypassed).`}
          how="We check the session's initial_input against a read-intent regex. If it matches AND a write-named tool is subsequently called, EA-01c fires. Declaring a namespace lets the scorer be more precise."
          howPatterns={['show|list|get|find|search|lookup|read|view|fetch|retrieve  (read intent)', 'write|create|insert|update|delete|remove|send|post|put|patch|drop|exec  (write tools)']}
          onReset={() => { updateProfile.mutate({ write_namespace: null }); setWriteNSDraft('') }}
        >
          {isAdmin && (
            <div className="flex items-center gap-2">
              <input type="text" value={writeNSDraft}
                onChange={e => setWriteNSDraft(e.target.value)}
                onBlur={() => updateProfile.mutate({ write_namespace: writeNSDraft || null })}
                onKeyDown={e => { if (e.key === 'Enter') updateProfile.mutate({ write_namespace: writeNSDraft || null }) }}
                placeholder="e.g. /app/output or s3://my-bucket/agent/"
                className="w-80 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-mono text-slate-700 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder-zinc-500"
              />
              {alertConfig?.write_namespace && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Saved</span>
              )}
            </div>
          )}
        </ProfileRow>
      </ProfileSection>

      {/* ════════ SECTION 4 — Operating Schedule ════════ */}
      <ProfileSection title="Operating Schedule" icon={<Clock className="h-3.5 w-3.5" />} open={openSections.schedule} onToggle={() => toggleSection('schedule')}>
        <ProfileRow
          id="profile-operating-hours"
          label="Operating hours"
          subChecks={['RA-01b']}
          tooltip="Declare the days and UTC time window when this agent should be active. Sessions starting outside this window fire RA-01b. Without a schedule, RA-01b cannot fire."
          status={alertConfig?.operating_hours != null ? 'manual' : 'blind'}
          autoDesc="No schedule declared — RA-01b is blind. The agent is assumed to be active 24/7."
          manualDesc={`Schedule: ${activeDays.join(', ')} · ${hoursFrom}–${hoursTo} UTC — RA-01b fires on sessions starting outside this window.`}
          how="RA-01b requires a declared operating window to compare session start times against. Without one, every session start time is implicitly within-schedule and the check produces no findings."
          onReset={() => updateProfile.mutate({ operating_hours: null })}
        >
          {isAdmin && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map(day => (
                  <button key={day} type="button"
                    onClick={() => {
                      setDaysEdited(true)
                      setActiveDays(activeDays.includes(day) ? activeDays.filter(d => d !== day) : [...activeDays, day])
                    }}
                    className={`rounded border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer hover:opacity-80 ${
                      (alertConfig?.operating_hours != null || daysEdited) && activeDays.includes(day)
                        ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400'
                        : 'border-slate-200 bg-white text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500'
                    }`}
                  >{day}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-zinc-400">
                <span className="text-slate-400">From</span>
                <input type="time" value={hoursFrom} onChange={e => setHoursFrom(e.target.value)}
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" />
                <span className="text-slate-400">to</span>
                <input type="time" value={hoursTo} onChange={e => setHoursTo(e.target.value)}
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" />
                <span className="text-slate-400">(UTC)</span>
              </div>
              <button type="button"
                onClick={() => updateProfile.mutate({ operating_hours: { days: activeDays, from: hoursFrom, to: hoursTo } })}
                className="rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-violet-700 dark:hover:bg-violet-900/20 dark:hover:text-violet-400">
                Save schedule
              </button>
            </div>
          )}
        </ProfileRow>
      </ProfileSection>

      {/* ════════ SECTION 5 — Supply Chain ════════ */}
      <ProfileSection title="Supply Chain" icon={<Package className="h-3.5 w-3.5" />} open={openSections.supply} onToggle={() => toggleSection('supply')}>

        <ProfileRow
          id="profile-sbom"
          label="Approved packages (SBOM)"
          subChecks={['ASCV-02b', 'ASCV-04a']}
          tooltip="List the package names this agent is allowed to install. Both ASCV-04a and ASCV-02b skip approved packages — only installs outside this list fire."
          status={alertConfig?.sbom_allowlist != null ? 'manual' : 'auto'}
          autoDesc="No SBOM declared — ASCV-04a fires on every package install command (heuristic mode); ASCV-02b is blind without a declared allowlist."
          manualDesc={`${sbom.length} approved package${sbom.length === 1 ? '' : 's'} declared — installs of approved packages are skipped; ASCV-04a and ASCV-02b fire only for unlisted packages.`}
          how="We scan tool_start event inputs for install commands and extract the package name. If a SBOM is declared, approved packages are skipped. Any unlisted package fires ASCV-04a online and ASCV-02b post-session."
          howPatterns={['pip install', 'npm install', 'yarn add', 'gem install', 'cargo install']}
          onReset={() => updateProfile.mutate({ sbom_allowlist: null })}
        >
          {isAdmin && (
            <>
              <TagList
                tags={sbom}
                onRemove={t => updateProfile.mutate({ sbom_allowlist: sbom.filter(x => x !== t) })}
                readOnly={false}
                colorClass={pkgColor}
              />
              <InlineTagInput
                onAdd={t => { if (!sbom.includes(t)) updateProfile.mutate({ sbom_allowlist: [...sbom, t] }) }}
                placeholder="e.g. requests, langchain, numpy …"
              />
            </>
          )}
        </ProfileRow>

        <ProfileRow
          id="profile-mcp-endpoints"
          label="Declared MCP server endpoints"
          subChecks={['ASCV-01a', 'ASCV-01b']}
          tooltip="Select MCP servers this agent is authorised to connect to. Without a declaration, ASCV-01a and ASCV-01b cannot fire."
          status={alertConfig?.mcp_endpoints != null ? 'manual' : 'blind'}
          autoDesc="No MCP endpoints declared — ASCV-01a and ASCV-01b are blind."
          manualDesc={`${mcpEndpoints.length} server${mcpEndpoints.length === 1 ? '' : 's'} declared — ASCV-01a URL anomaly and ASCV-01b TLS cert anomaly detection are active.`}
          how="ASCV-01a fires when a tool call targets an MCP server URL not on this list. ASCV-01b fires when a TLS error occurs or TLS verification is disabled on a declared endpoint."
          onReset={() => updateProfile.mutate({ mcp_endpoints: null })}
        >
          {isAdmin && (
            <McpServerPicker
              selected={mcpEndpoints}
              onChange={urls => updateProfile.mutate({ mcp_endpoints: urls.length > 0 ? urls : null })}
            />
          )}
        </ProfileRow>
      </ProfileSection>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AgentConfig() {
  const { agentId } = useParams({ from: '/inventory/agents/$agentId/config' })
  const { data, isLoading } = useAgentProfile(agentId)
  const { data: subcheckConfig = {} } = useSubcheckConfig(agentId)
  const toggleMutation = useToggleSubcheckOnline(agentId)

  const user     = useAuthStore(s => s.user)
  const isAdmin  = user?.role === 'admin' || user?.role === 'superadmin'

  const [activeTab, setActiveTab] = useState<'profile' | 'llm' | 'asi' | 'thresholds'>('profile')
  const [profileScrollTo, setProfileScrollTo] = useState<string | undefined>(undefined)

  const agentName = data?.name ?? agentId

  const onlineOverrides: Record<string, boolean> = Object.fromEntries(
    Object.entries(subcheckConfig).map(([id, ov]) => [id, ov.online_detection])
  )

  const actionOverrides: Record<string, OnlineAction> = Object.fromEntries(
    Object.entries(subcheckConfig).map(([id, ov]) => [id, ov.action ?? 'alert'])
  )

  function handleToggleOnline(subCheckId: string, online: boolean) {
    const currentAction = actionOverrides[subCheckId] ?? 'alert'
    toggleMutation.mutate({ subCheckId, online_detection: online, action: currentAction })
  }

  function handleActionChange(subCheckId: string, action: OnlineAction) {
    toggleMutation.mutate({ subCheckId, online_detection: true, action })
  }

  function handleGoToProfile(anchor: string) {
    setProfileScrollTo(undefined)         // reset first so useEffect fires even if same anchor
    setActiveTab('profile')
    setTimeout(() => setProfileScrollTo(anchor), 0)
  }

  const onlineCount = Object.values(onlineOverrides).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <Link to="/inventory" className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
          ← Agents
        </Link>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
            {isLoading ? agentId : agentName}
          </h1>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 shrink-0 dark:border-zinc-700 dark:bg-zinc-800">
            <Link
              to="/inventory/agents/$agentId"
              params={{ agentId }}
              className="rounded px-3 py-1.5 text-xs text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm transition-all dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            >
              Health
            </Link>
            <span className="flex items-center gap-1.5 rounded bg-white px-3 py-1.5 text-xs font-medium text-violet-700 shadow-sm dark:bg-zinc-700 dark:text-violet-300">
              <Settings className="h-3 w-3" /> Config
            </span>
          </div>
        </div>
        <ConfigAgentIdRow agentId={agentId} />
      </div>

      {/* ── System-default notice ── */}
      <div className="flex items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-800 dark:bg-violet-900/20">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-violet-500 dark:text-violet-400" />
        <div className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
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
        {(
          [
            { label: 'Signals tracked',  value: '20',               sub: '10 LLM · 10 ASI' },
            { label: 'Total sub-checks', value: String(TOTAL_CHECKS), sub: 'across all signals' },
            { label: 'Active checks',    value: String(TOTAL_ACTIVE), sub: 'system default · always on' },
            { label: 'Online detection', value: (
              <>{onlineCount}<span className="text-lg font-medium text-slate-400 dark:text-zinc-500">/{TOTAL_CAPABLE}</span></>
            ), sub: onlineCount === 0 ? 'all checks post-session' : 'running via SDK in real time' },
          ] as { label: string; value: React.ReactNode; sub: string }[]
        ).map(card => (
          <div key={card.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-zinc-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-zinc-100">{card.value}</p>
            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-zinc-500">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-zinc-700">
        {(
          [
            { id: 'profile',    label: 'Agent Profile',       subtitle: isAdmin ? 'editable' : 'view only' },
            { id: 'llm',        label: 'LLM Framework',       subtitle: 'OW-LLM01–10' },
            { id: 'asi',        label: 'ASI Framework',        subtitle: 'OW-ASI01–10' },
            { id: 'thresholds', label: 'Alert Thresholds',     subtitle: 'composite & per-signal' },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 pb-2.5 pt-1 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-violet-600 text-violet-700 dark:border-violet-400 dark:text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-slate-400 dark:text-zinc-500">{tab.subtitle}</span>
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
            agentId={agentId}
            onlineOverrides={onlineOverrides}
            actionOverrides={actionOverrides}
            onToggleOnline={handleToggleOnline}
            onActionChange={handleActionChange}
            onGoToProfile={handleGoToProfile}
          />
        </>
      ) : activeTab === 'asi' ? (
        <>
          <PhaseLegend />
          <FrameworkSection
            label="Agentic Security Signals (OWASP Agentic Top 10)"
            signals={ASI_SIGNALS}
            agentId={agentId}
            onlineOverrides={onlineOverrides}
            actionOverrides={actionOverrides}
            onToggleOnline={handleToggleOnline}
            onActionChange={handleActionChange}
            onGoToProfile={handleGoToProfile}
          />
        </>
      ) : activeTab === 'thresholds' ? (
        <AlertThresholdsTab agentId={agentId} />
      ) : (
        <AgentProfileTab agentId={agentId} isAdmin={isAdmin} scrollTo={profileScrollTo} />
      )}
    </div>
  )
}
