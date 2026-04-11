import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { useAgentProfile, useSubcheckConfig, useToggleSubcheckOnline } from '../hooks/useSecurity'
import { ChevronDown, ChevronRight, Shield, ShieldOff, Settings, Zap } from 'lucide-react'
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

const TOTAL_ACTIVE = SIGNAL_REGISTRY.flatMap(s => s.subChecks).filter(c => !c.excluded).length
const TOTAL_EXCLUDED = SIGNAL_REGISTRY.flatMap(s => s.subChecks).filter(c => c.excluded).length
const TOTAL_CHECKS = SIGNAL_REGISTRY.flatMap(s => s.subChecks).length

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

function SubCheckRow({
  check,
  isOnline,
  onToggleOnline,
}: {
  check: SubCheck
  isOnline: boolean
  onToggleOnline: (subCheckId: string, online: boolean) => void
}) {
  const [showMatches, setShowMatches] = useState(false)
  const hasMatches = check.matches && check.matches.length > 0
  const canToggle = check.onlineCapable === true && !check.excluded

  // Effective phase to display.
  // All sub-checks default to post_session (that's where they actually run now).
  // cross_session is the only phase that stays as-is — it runs in the scorer regardless.
  // When a toggle is on, show online.
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
        {/* Sub-check ID */}
        <td className="py-2 pr-3 font-mono text-slate-500 whitespace-nowrap">{check.subCheckId}</td>

        {/* Label */}
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

        {/* Detection phase — reflects effective state */}
        <td className="py-2 pr-3 whitespace-nowrap">
          <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${PHASE_STYLE[effectivePhase]}`}>
            {PHASE_LABEL[effectivePhase]}
          </span>
        </td>

        {/* Severity */}
        <td className="py-2 pr-3 whitespace-nowrap">
          {!check.excluded && (
            <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize ${SEV_STYLE[check.severity]}`}>
              {check.severity}
            </span>
          )}
        </td>

        {/* Confidence tier */}
        <td className={`py-2 pr-3 text-[10px] capitalize whitespace-nowrap ${CONF_STYLE[check.confidenceTier]}`}>
          {!check.excluded ? check.confidenceTier : '—'}
        </td>

        {/* Score */}
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

        {/* Detection matches toggle */}
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

        {/* Online detection toggle */}
        <td className="py-2 pl-2 text-right whitespace-nowrap">
          {canToggle ? (
            <div className="flex items-center justify-end gap-1.5">
              <Zap className={`h-3 w-3 ${isOnline ? 'text-violet-500' : 'text-slate-300'}`} />
              <ToggleSwitch
                checked={isOnline}
                onChange={v => onToggleOnline(check.subCheckId, v)}
                label={`Toggle ${check.subCheckId} online detection`}
              />
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

      {/* Expanded pattern matches */}
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
  onToggleOnline,
}: {
  signal: SignalConfig
  defaultOpen?: boolean
  onlineOverrides: Record<string, boolean>
  onToggleOnline: (subCheckId: string, online: boolean) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const active   = countActive(signal)
  const excluded = countExcluded(signal)
  const allExcluded = active === 0
  const onlineCount = signal.subChecks.filter(c => onlineOverrides[c.subCheckId]).length

  return (
    <div className={`rounded-lg border bg-white ${allExcluded ? 'border-slate-200 opacity-70' : 'border-slate-200'}`}>
      {/* Signal header — click to expand */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors"
      >
        {/* Expand icon */}
        <span className="shrink-0 text-slate-400">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>

        {/* Signal ID */}
        <span className="shrink-0 font-mono text-xs font-semibold text-slate-500 w-24">
          {signal.owaspSignalId}
        </span>

        {/* Name */}
        <span className="flex-1 text-sm font-medium text-slate-800 text-left">
          {signal.name}
        </span>

        {/* Active / excluded / online counts */}
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

      {/* Expanded content */}
      {open && (
        <div className="border-t border-slate-100 px-4 pt-3 pb-4">
          {/* Signal description */}
          <p className="mb-3 text-xs text-slate-500 leading-relaxed">{signal.description}</p>

          {/* Sub-checks table */}
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
                    onToggleOnline={onToggleOnline}
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
  onToggleOnline,
}: {
  label: string
  signals: SignalConfig[]
  onlineOverrides: Record<string, boolean>
  onToggleOnline: (subCheckId: string, online: boolean) => void
}) {
  const totalActive   = signals.flatMap(s => s.subChecks).filter(c => !c.excluded).length
  const totalExcluded = signals.flatMap(s => s.subChecks).filter(c => c.excluded).length
  const totalChecks   = signals.flatMap(s => s.subChecks).length
  const totalOnline   = signals.flatMap(s => s.subChecks).filter(c => onlineOverrides[c.subCheckId]).length

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">{label}</h2>
        <p className="text-xs text-slate-400">
          {totalActive} active · {totalExcluded} excluded · {totalChecks} total
          {totalOnline > 0 && (
            <span className="ml-1 text-violet-600 font-medium">· {totalOnline} online</span>
          )}
        </p>
      </div>

      {/* Signal cards */}
      <div className="space-y-2">
        {signals.map(signal => (
          <SignalCard
            key={signal.owaspSignalId}
            signal={signal}
            onlineOverrides={onlineOverrides}
            onToggleOnline={onToggleOnline}
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

  const [activeTab, setActiveTab] = useState<'llm' | 'asi'>('llm')

  const agentName = data?.name ?? agentId

  // Flatten overrides to a simple subCheckId → boolean map
  const onlineOverrides: Record<string, boolean> = Object.fromEntries(
    Object.entries(subcheckConfig).map(([id, ov]) => [id, ov.online_detection])
  )

  function handleToggleOnline(subCheckId: string, online: boolean) {
    toggleMutation.mutate({ subCheckId, online_detection: online })
  }

  const onlineCount = Object.values(onlineOverrides).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/agents" className="text-xs text-slate-400 hover:text-slate-600">
            ← Agents
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            {isLoading ? agentId : agentName}
          </h1>
          <p className="mt-0.5 font-mono text-xs text-slate-400">{agentId}</p>
        </div>

        {/* Page navigation: Profile ↔ Config */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
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

      {/* ── Phase legend ── */}
      <PhaseLegend />

      {/* ── Framework tabs ── */}
      <div className="flex gap-1 border-b border-slate-200">
        {(
          [
            { id: 'llm', label: 'LLM Framework', subtitle: 'OW-LLM01–10' },
            { id: 'asi', label: 'ASI Framework', subtitle: 'OW-ASI01–10' },
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

      {/* ── Signal list ── */}
      {activeTab === 'llm' ? (
        <FrameworkSection
          label="LLM Security Signals (OWASP LLM Top 10)"
          signals={LLM_SIGNALS}
          onlineOverrides={onlineOverrides}
          onToggleOnline={handleToggleOnline}
        />
      ) : (
        <FrameworkSection
          label="Agentic Security Signals (OWASP Agentic Top 10)"
          signals={ASI_SIGNALS}
          onlineOverrides={onlineOverrides}
          onToggleOnline={handleToggleOnline}
        />
      )}
    </div>
  )
}
