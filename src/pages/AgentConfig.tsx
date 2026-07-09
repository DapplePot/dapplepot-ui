import React, { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useParams, Link } from '@tanstack/react-router'
import {
  useAgentProfile, useSubcheckConfig, useToggleSubcheckOnline,
  useAlertConfig,
  useUpdateToolManifest, useUpdateMaxToolCalls,
  useUpdateAgentProfile, useUpdatePrivilegeScope, useUpdateToolScope,
  useUpdateTokenBudget,
  useSubCheckFirings,
} from '../hooks/useSecurity'
import { ShadowEvidenceBadge } from '../components/security/ShadowEvidenceBadge'
import { computeCoverage } from '../utils/coverage'
import { useAgentLlmModels, useSetAgentLlmModels } from '../hooks/useAgentLlmModels'
import { useLlmModels } from '../hooks/useLlmModels'
import { useAgentConnectedAgents, useSetAgentConnectedAgents } from '../hooks/useAgentConnectedAgents'
import { useAgents } from '../hooks/useAgents'
import { useTools } from '../hooks/useTools'
import { useMcpServers } from '../hooks/useMcpServers'
import type { OnlineAction } from '../types/security'
import { ChevronDown, ChevronRight, Shield, ShieldCheck, ShieldOff, Settings, Zap, HelpCircle, Copy, Check, Lock, Unlock, Package, Clock, Cpu, Bot, X } from 'lucide-react'
import { useAuthStore } from '../stores/auth'
import {
  SIGNAL_REGISTRY,
  type SubCheck,
  type Severity,
  type ConfidenceTier,
} from '../data/signalRegistry'

// ─── Style helpers ────────────────────────────────────────────────────────────

// Plane chip on each check row — derived per-row from canonical facets
// (scope + enforceable + status). See `effectivePhase` below.
type PlaneChip = 'online' | 'post_session' | 'cross_session' | 'excluded'

const PHASE_STYLE: Record<PlaneChip, string> = {
  online:        'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800',
  post_session:  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  cross_session: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
  excluded:      'bg-slate-100 text-slate-400 border-slate-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700',
}

// Customer-facing labels — mirror utils/vocabulary.ts phase→plane mapping.
// Both post_session and cross_session belong to the Session Analysis plane;
// cross-session findings are surfaced in a session's report with a "History
// evidence" chip and also feed the Agent Trust score, but the Agent Trust
// plane is an aggregation view — not a container for a category of checks.
const PHASE_LABEL: Record<PlaneChip, string> = {
  online:        'Runtime Guard',
  post_session:  'Session Analysis',
  cross_session: 'Session Analysis · history',
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
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 w-64 rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-lg leading-relaxed whitespace-normal dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {text}
        </span>
      )}
    </span>
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

// Fixed popup width — sized to comfortably fit the longest action label
// ("terminate_session"). Predictable width lets us clamp horizontal position
// deterministically instead of chasing content-sized popup edges.
const ACTION_POPUP_WIDTH = 160

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
  const [open, setOpen]     = useState(false)
  const [pos, setPos]       = useState<{ top: number; left: number } | null>(null)
  const buttonRef           = useRef<HTMLButtonElement>(null)
  const popupRef            = useRef<HTMLDivElement>(null)

  // Actual rendered row height in the popup: py-1.5 (12px) + text-[10px] line
  // ≈ 26–28px; add 8px for py-1 wrapper. Conservative estimate for flip-up.
  const estimatedPopupHeight = options.length * 30 + 8

  function computePosition(r: DOMRect) {
    // Vertical: prefer opening downward. Flip up if that overflows viewport.
    const openDown = r.bottom + estimatedPopupHeight <= window.innerHeight - 8
    const top = openDown
      ? r.bottom + 4
      : Math.max(4, r.top - estimatedPopupHeight - 4)

    // Horizontal: right-align popup to the button's right edge, then clamp
    // to stay inside the viewport with a 4px safety margin on either side.
    const rawLeft = r.right - ACTION_POPUP_WIDTH
    const left = Math.max(4, Math.min(rawLeft, window.innerWidth - ACTION_POPUP_WIDTH - 4))

    return { top, left }
  }

  function toggleOpen() {
    if (disabled) return
    if (!open && buttonRef.current) {
      setPos(computePosition(buttonRef.current.getBoundingClientRect()))
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const t = e.target as Node
      if (
        (buttonRef.current && buttonRef.current.contains(t))
        || (popupRef.current  && popupRef.current.contains(t))
      ) return
      setOpen(false)
    }
    function onScrollOrResize() { setOpen(false) }
    document.addEventListener('mousedown', handler)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      document.removeEventListener('mousedown', handler)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open])

  return (
    <div className="relative flex-1">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`flex w-full items-center justify-between gap-1.5 text-[10px] font-medium text-slate-700 focus:outline-none dark:text-zinc-300 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span>{ACTION_LABELS[value]}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
      </button>

      {open && !disabled && pos && createPortal(
        <div
          ref={popupRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: ACTION_POPUP_WIDTH }}
          className="z-50 rounded border border-slate-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
        >
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
        </div>,
        document.body,
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
  'MIS-03a',  // HIGH_STAKES_TOOL_PATTERNS heuristic when no approval policy declared
  'TME-03a',  // tool-name pattern heuristic
  'TME-01a',  // pattern-matching fallback when no schema declared
  'IPA-01a',  // pattern-matching runs even without privilege_scope declared
  'ASCV-04a', // always fires on any install command regardless
  'EA-02b',   // statistical baseline (7-day mean + 1Ïƒ)
  'TME-01b',  // statistical baseline (7-day per-session avg × 3.0)
  'SPL-03a',  // heuristic phrase detection active even without system prompt declared
])

// Maps each subcheck to the Agent Profile section anchor it configures.
const SUBCHECK_PROFILE_ANCHOR: Partial<Record<string, string>> = {
  'EA-01a':  'profile-tool-manifest',
  'TME-01a': 'profile-tool-manifest',
  'TME-06a': 'profile-tool-manifest',
  'IPA-01a': 'profile-tool-manifest',
  'EA-02b':  'profile-max-tool-calls',
  'TME-01b': 'profile-max-tool-calls',
  'SPL-01a': 'profile-system-prompt', 'SPL-01b': 'profile-system-prompt',
  'SPL-03a': 'profile-system-prompt',
  'EA-02c':  'profile-system-prompt',
  'TME-03b': 'profile-environment',
  'EA-01c':  'profile-write-namespace',
  'MIS-03a': 'profile-tool-manifest',
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
  'SPL-03b':  'profile-system-prompt',
  'VEW-02a':  'profile-write-namespace',
}

// Which alertConfig field each profile-linked subcheck reads at analysis time.
const SUBCHECK_PROFILE_FIELD: Partial<Record<string, string>> = {
  'EA-01a':  'tool_manifest',
  'TME-01a': 'tool_manifest',
  'IPA-01a': 'tool_manifest',
  'EA-02b':  'max_tool_calls_per_session',
  'TME-01b': 'max_tool_calls_per_session',
  'SPL-01a': 'system_prompt',    'SPL-01b': 'system_prompt',
  'SPL-03a': 'system_prompt',
  'EA-02c':  'system_prompt',
  'TME-03b': 'environment',
  'EA-01c':  'write_namespace',
  'MIS-03a': 'tool_approval_policy',
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
  'EA-02b':  'statistical detection active — uses 7-day rolling mean + 1Ïƒ to flag anomalies',
  'TME-01b': 'no cap set — statistical baseline active, fires when session exceeds 3× the 7-day per-session average (≥5 sessions required)',
  'SPL-01a': 'no system prompt declared — verbatim match disabled',
  'SPL-01b': 'no system prompt declared — probe comparison disabled',
  'SPL-03a': 'heuristic phrase detection active ("you are a … agent", "your primary objective is", "do not reveal") — declare system prompt to enable LCS match (≥ 60 chars)',
  'EA-02c':  'no system prompt declared — modification diff disabled',
  'TME-03b': 'no environment declared — treated as non-production, TME-03b active post-session',
  'EA-01c':  'no write namespace declared — read-intent heuristic active',
  'MIS-03a': 'no approval policy declared — HIGH_STAKES_TOOL_PATTERNS heuristic active (payment · charge · transfer · purchase · buy · send_email · send_message · notify · deploy · publish). Any unlisted tool that runs without a node_start(human_review | hitl | approval_gate | checkpoint | …) gate fires this check.',
  'EA-02a':  'no approval policy declared — HIGH_STAKES_TOOL_PATTERNS heuristic active (payment · charge · transfer · purchase · deploy · publish …). Set tool approval policy in Tool Manifest to use it as the primary irreversibility source.',
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
  'MIS-03a': (v) => {
    const policy = (v && typeof v === 'object' && !Array.isArray(v)) ? v as Record<string, string> : {}
    const count = Object.keys(policy).length
    return `${count} tool${count !== 1 ? 's' : ''} with explicit policy · any tool not in manifest → needs approval`
  },
  'UBC-01b': (v) => {
    const count = Array.isArray(v) ? v.length : 0
    return `${count} model${count !== 1 ? 's' : ''} connected — fires when input tokens ≥ 85% of declared context window. Still blind for models used in a session that are not declared here.`
  },
  'UBC-02b': (v) => `budget cap $${Number(v).toFixed(2)} USD — fires when session token cost exceeds this limit. Cost of LLMs not connected to this agent will not be counted.`,
  'TME-01b': (v) => `cap set to ${v} — fires when session count exceeds 3 × ${v} = ${Number(v) * 3} calls`,
  'TME-03b': (v) => v === 'production'
    ? 'production — TME-03b suppressed, this agent is authorised to target production endpoints and no findings will be generated'
    : 'staging — TME-03b active post-session, fires if any tool call URL matches production domain prefixes (prod., production., live.) or versioned API path patterns',
  'SPL-03a': () => 'LCS(system_prompt, tool_input payload) ≥ 60 chars — fires when log tool payload contains a verbatim segment of the declared system prompt',
  'EA-02c': (v) => {
    const len = typeof v === 'string' ? v.length : 0
    return `SequenceMatcher(declared_system_prompt, llm_start system message) < 0.75 — fires when any system-role message in an LLM call differs from the declared system prompt by more than 25% (declared system prompt: ${len} chars)`
  },
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
  isNeedsSetup = false,
  onToggleOnline,
  onActionChange,
  onGoToProfile,
}: {
  check: SubCheck
  agentId?: string
  isOnline: boolean
  action: OnlineAction
  /** True when the check requires a policy field that is not declared. Row swaps its rightmost cell for a Configure-in-Governance CTA. */
  isNeedsSetup?: boolean
  onToggleOnline: (subCheckId: string, online: boolean) => void
  onActionChange: (subCheckId: string, action: OnlineAction) => void
  onGoToProfile?: (anchor: string) => void
}) {
  const [showMatches, setShowMatches] = useState(false)
  const hasMatches = check.matches && check.matches.length > 0
  const canToggle = check.enforceable && check.status === 'active'

  // Shadow-mode evidence — one React Query call is de-duplicated by queryKey
  // across every SubCheckRow on the page, so this scales with agents, not rows.
  const { data: firings } = useSubCheckFirings(agentId ?? '', 7)
  const firing = firings?.firings[check.id]

  // Profile config display
  const profileFieldKey = SUBCHECK_PROFILE_FIELD[check.id]
  const hasProfileField  = !!profileFieldKey
  const { data: alertConfig }  = useAlertConfig(agentId ?? '')
  const { data: toolInventory } = useTools()
  const profileValue = hasProfileField && alertConfig
    ? (alertConfig as unknown as Record<string, unknown>)[profileFieldKey!]
    : undefined

  // TME-01a: split manifest tools into those with/without a schema
  const tme01aManifest: string[] = check.id === 'TME-01a' && Array.isArray(profileValue)
    ? profileValue as string[]
    : []
  const tme01aWithSchema    = tme01aManifest.filter(n =>
    (toolInventory ?? []).some(t => t.name === n && t.schema != null && Object.keys(t.schema).length > 0)
  )
  const tme01aWithoutSchema = tme01aManifest.filter(n => !tme01aWithSchema.includes(n))

  // IPA-01a: split manifest tools into privilege-capable vs not
  const ipa01aManifest: string[] = check.id === 'IPA-01a' && Array.isArray(profileValue)
    ? profileValue as string[]
    : []
  const ipa01aPrivScope: string[] = check.id === 'IPA-01a' && alertConfig
    ? (alertConfig.privilege_scope ?? [])
    : []
  const ipa01aPrivileged    = ipa01aManifest.filter(n => ipa01aPrivScope.includes(n))
  const ipa01aNotPrivileged = ipa01aManifest.filter(n => !ipa01aPrivScope.includes(n))

  // MIS-03a: split tool_approval_policy into needs_approval and always_allow
  const mis03aPolicy: Record<string, string> =
    check.id === 'MIS-03a' && profileValue && typeof profileValue === 'object' && !Array.isArray(profileValue)
      ? profileValue as Record<string, string>
      : {}
  const mis03aHasPolicy = Object.keys(mis03aPolicy).length > 0

  // EA-02a: reads tool_approval_policy (primary) and irreversible_tools (secondary)
  const ea02aPolicy: Record<string, string> =
    check.id === 'EA-02a' && alertConfig?.tool_approval_policy &&
    typeof alertConfig.tool_approval_policy === 'object' && !Array.isArray(alertConfig.tool_approval_policy)
      ? alertConfig.tool_approval_policy as Record<string, string>
      : {}
  const ea02aHasPolicy = Object.keys(ea02aPolicy).length > 0
  const ea02aIrreversible: string[] =
    check.id === 'EA-02a' && Array.isArray(alertConfig?.irreversible_tools)
      ? alertConfig!.irreversible_tools as string[]
      : []

  // Empty array or empty object counts as "not configured"
  const isManualProfile = profileValue !== null && profileValue !== undefined
    && !(Array.isArray(profileValue) && profileValue.length === 0)
    && !(typeof profileValue === 'object' && !Array.isArray(profileValue) && Object.keys(profileValue as object).length === 0)
  const showPatternsBtn = check.status === 'active' && (!!hasMatches || hasProfileField)

  // Row plane chip — derived from the canonical facets. Enforceable checks
  // live in Runtime Guard; history-scope in cross-session; everything else
  // in Session Analysis. Excluded / not-active checks render as such.
  const effectivePhase: PlaneChip =
    check.status !== 'active' ? 'excluded' :
    isOnline                  ? 'online' :
    check.scope === 'history' ? 'cross_session' :
    'post_session'

  return (
    <>
      <tr
        className={`border-b border-slate-50 text-xs dark:border-zinc-800 ${check.status !== 'active' ? 'opacity-50' : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/40'}`}
      >
        <td className="py-2 pr-3 font-mono text-slate-500 dark:text-zinc-400 whitespace-nowrap">{check.id}</td>
        <td className="py-2 pr-3 font-mono text-slate-500 dark:text-zinc-400 whitespace-nowrap">{check.signalId}</td>
        <td className="py-2 pr-3 text-slate-700 dark:text-zinc-300">
          <div className="flex items-center gap-1.5">
            {check.status !== 'active'
              ? <ShieldOff className="h-3 w-3 shrink-0 text-slate-300" />
              : <Shield className="h-3 w-3 shrink-0 text-violet-400" />
            }
            <span>{check.label}</span>
            {check.status === 'active' && firing && (
              <ShadowEvidenceBadge firing={firing} windowDays={firings?.window_days ?? 7} className="ml-1" />
            )}
          </div>
          {check.statusReason && (
            <p className="mt-0.5 text-slate-400 dark:text-zinc-500 italic">{check.statusReason}</p>
          )}
        </td>
        <td className="py-2 pr-3 whitespace-nowrap">
          <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${PHASE_STYLE[effectivePhase]}`}>
            {PHASE_LABEL[effectivePhase]}
          </span>
        </td>
        <td className="py-2 pr-3 whitespace-nowrap">
          {check.status === 'active' && (
            <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize ${SEV_STYLE[check.severity]}`}>
              {check.severity}
            </span>
          )}
        </td>
        <td className={`py-2 pr-3 text-[10px] capitalize whitespace-nowrap ${CONF_STYLE[check.confidenceTier]}`}>
          {check.status === 'active' ? check.confidenceTier : '—'}
        </td>
        <td className="py-2 pr-3 text-right tabular-nums">
          {check.status !== 'active' ? (
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
          {isNeedsSetup && check.status === 'active' && onGoToProfile && SUBCHECK_PROFILE_ANCHOR[check.id] ? (
            <button
              type="button"
              onClick={() => onGoToProfile(SUBCHECK_PROFILE_ANCHOR[check.id]!)}
              className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
              title="Declare the required policy field in the Governance tab"
            >
              Configure in Governance <ChevronRight className="h-3 w-3" />
            </button>
          ) : canToggle && !isOnline ? (
            // Could Enforce state: single "↑ Enforce" button. Click promotes
            // the row to Enforcing with a sensible default action.
            <button
              type="button"
              onClick={() => onToggleOnline(check.id, true)}
              className="inline-flex items-center gap-1 rounded border border-violet-300 bg-violet-50 px-2 py-1 text-[10px] font-medium text-violet-700 hover:border-violet-400 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-900/20 dark:text-violet-300 dark:hover:bg-violet-900/30"
              title="Promote this check to Runtime Guard enforcement"
            >
              <Zap className="h-3 w-3" /> Enforce
            </button>
          ) : canToggle ? (
            // Enforcing state: normal toggle + action dropdown. Toggle OFF
            // demotes back to Could Enforce; action change persists inline.
            <div className="flex items-center justify-end gap-2">
              <Zap className="h-3 w-3 shrink-0 text-violet-500" />
              <ToggleSwitch
                checked={isOnline}
                onChange={v => onToggleOnline(check.id, v)}
                label={`Toggle ${check.id} online detection`}
              />
              <div className={`flex w-[104px] items-center gap-1.5 rounded border px-2.5 py-1.5 bg-white shadow-sm dark:bg-zinc-800 ${ACTION_RING[action]}`}>
                <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${ACTION_DOT[action]}`} />
                <ActionSelect
                  value={action}
                  options={(Object.keys(ACTION_LABELS) as OnlineAction[])
                    .filter(a => a !== 'alert')
                    .filter(a => !check.capableActions || check.capableActions.includes(a))}
                  disabled={false}
                  onChange={(a) => onActionChange(check.id, a)}
                />
              </div>
            </div>
          ) : check.status !== 'active' ? (
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
          <td colSpan={9} className="px-6 py-2 space-y-2">
            {hasProfileField && (
              check.id === 'MIS-03a' ? (
                <div className="space-y-1">
                  {mis03aHasPolicy && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded border px-2 py-0.5 text-[10px] font-medium font-mono border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                        manual
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                        — see tool manifest ·
                        <Unlock className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                        always allow ·
                        <Lock className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                        needs approval
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="rounded border px-2 py-0.5 text-[10px] font-medium font-mono border-slate-200 bg-white text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                      auto
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                      {mis03aHasPolicy
                        ? 'any tool not in manifest → MIS-03a requires a gate before it can run'
                        : 'no policy declared — HIGH_STAKES_TOOL_PATTERNS heuristic active (payment · transfer · deploy · …)'}
                    </span>
                    {!mis03aHasPolicy && onGoToProfile && (
                      <button
                        type="button"
                        onClick={() => onGoToProfile('profile-tool-manifest')}
                        className="ml-auto shrink-0 inline-flex items-center gap-1 rounded border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-medium text-violet-700 hover:bg-violet-50 hover:border-violet-400 transition-colors dark:border-violet-800 dark:bg-zinc-800 dark:text-violet-400 dark:hover:bg-violet-900/30"
                      >
                        Set in Agent Profile
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ) : check.id === 'IPA-01a' && ipa01aManifest.length > 0 ? (
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
              ) : check.id === 'TME-01a' && tme01aManifest.length > 0 ? (
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
              ) : check.id === 'EA-02a' ? (
                <div className="space-y-1">
                  {(ea02aHasPolicy || ea02aIrreversible.length > 0) && (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded border px-2 py-0.5 text-[10px] font-medium font-mono border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                          manual
                        </span>
                        {ea02aHasPolicy && (
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                            — tool manifest ·
                            <Lock className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                            needs approval → irreversible
                          </span>
                        )}
                        {ea02aIrreversible.length > 0 && (
                          <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-mono">
                            {ea02aHasPolicy ? '· ' : '— '}{ea02aIrreversible.join(', ')} (irreversible_tools)
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 pl-1">
                        fires when two consecutive tool_start events hit an irreversible tool with no llm_start (user confirmation turn) in between
                      </p>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded border px-2 py-0.5 text-[10px] font-medium font-mono border-slate-200 bg-white text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                        auto
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {ea02aHasPolicy
                          ? 'any tool not in manifest → treated as needs approval'
                          : 'no approval policy — HIGH_STAKES_TOOL_PATTERNS heuristic (payment · charge · transfer · deploy · publish …)'}
                      </span>
                      {!ea02aHasPolicy && onGoToProfile && (
                        <button
                          type="button"
                          onClick={() => onGoToProfile('profile-tool-manifest')}
                          className="ml-auto shrink-0 inline-flex items-center gap-1 rounded border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-medium text-violet-700 hover:bg-violet-50 hover:border-violet-400 transition-colors dark:border-violet-800 dark:bg-zinc-800 dark:text-violet-400 dark:hover:bg-violet-900/30"
                        >
                          Set in Agent Profile
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 pl-1">
                      {ea02aHasPolicy
                        ? 'checks every tool_start for the irreversibility verdict — if the preceding relevant event was also a tool_start with no llm_start gate between, EA-02a fires'
                        : 'tool name matched against pattern — if irreversible AND the preceding event was a tool_start with no llm_start gate between, EA-02a fires'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isManualProfile ? (
                    <span className="rounded border px-2 py-0.5 text-[10px] font-medium font-mono border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                      manual
                    </span>
                  ) : SUBCHECK_HAS_HEURISTIC.has(check.id) ? (
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
                      ? (SUBCHECK_MANUAL_DESC[check.id]?.(profileValue) ?? _formatProfileValue(profileValue))
                      : SUBCHECK_AUTO_DESC[check.id]}
                  </span>
                  {!isManualProfile && onGoToProfile && SUBCHECK_PROFILE_ANCHOR[check.id] && (
                    <button
                      type="button"
                      onClick={() => onGoToProfile(SUBCHECK_PROFILE_ANCHOR[check.id]!)}
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



// ─── Checks tab — plane-grouped view ─────────────────────────────────────────
//
// Groups all 155 sub-checks by execution plane (Runtime Guard / Session
// Analysis / History-scoped) then by mode within each plane. Framework
// (LLM/ASI) is a row-level attribute, not a top-level split — a security lead
// cares about "what is protecting me right now", not which OWASP top-10 the
// check descends from.

type ChecksTabProps = {
  plane:            'runtimeGuard' | 'sessionAnalysis'
  agentId:          string
  alertConfig:      import('../api/security').AgentAlertConfig | undefined
  subcheckConfig:   Record<string, { online_detection: boolean; action?: string }>
  onlineOverrides:  Record<string, boolean>
  actionOverrides:  Record<string, OnlineAction>
  onToggleOnline:   (subCheckId: string, online: boolean) => void
  onActionChange:   (subCheckId: string, action: OnlineAction) => void
  onGoToProfile:    (anchor: string) => void
}

type SubGroup = {
  key:        string
  label:      string
  checks:     SubCheck[]
  /** Force-open by default. Auto-defaults to open when count > 0 for actionable groups. */
  defaultOpen?: boolean
  /** Rendered above the row list when the subsection is open. */
  helper?:    React.ReactNode
}


function CheckRowsTable({
  checks, agentId, isNeedsSetup = false, onlineOverrides, actionOverrides, onToggleOnline, onActionChange, onGoToProfile,
}: {
  checks: SubCheck[]
  agentId: string
  isNeedsSetup?: boolean
  onlineOverrides: Record<string, boolean>
  actionOverrides: Record<string, OnlineAction>
  onToggleOnline: (id: string, on: boolean) => void
  onActionChange: (id: string, a: OnlineAction) => void
  onGoToProfile: (anchor: string) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-[10px] font-medium text-slate-400 border-b border-slate-100 dark:text-zinc-500 dark:border-zinc-800">
            <th className="pb-2 text-left pr-3">Sub-check</th>
            <th className="pb-2 text-left pr-3">Signal</th>
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
          {checks.map(check => (
            <SubCheckRow
              key={check.id}
              check={check}
              agentId={agentId}
              isOnline={onlineOverrides[check.id] ?? false}
              action={actionOverrides[check.id] ?? 'alert'}
              isNeedsSetup={isNeedsSetup}
              onToggleOnline={onToggleOnline}
              onActionChange={onActionChange}
              onGoToProfile={onGoToProfile}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SubGroupBlock({
  group, agentId, onlineOverrides, actionOverrides, onToggleOnline, onActionChange, onGoToProfile,
}: {
  group: SubGroup
  agentId: string
  onlineOverrides: Record<string, boolean>
  actionOverrides: Record<string, OnlineAction>
  onToggleOnline: (id: string, on: boolean) => void
  onActionChange: (id: string, a: OnlineAction) => void
  onGoToProfile: (anchor: string) => void
}) {
  const [open, setOpen] = useState(group.defaultOpen ?? false)
  const count = group.checks.length
  if (count === 0) return null

  return (
    <div className="border-t border-slate-100 dark:border-zinc-800 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <span className="shrink-0 text-slate-400 dark:text-zinc-500">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </span>
        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">{group.label}</span>
        <span className="text-xs tabular-nums text-slate-500 dark:text-zinc-400">({count})</span>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-4 pt-2 pb-3 dark:border-zinc-800">
          {group.helper && (
            <p className="mb-2.5 text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">{group.helper}</p>
          )}
          <CheckRowsTable
            checks={group.checks}
            agentId={agentId}
            isNeedsSetup={group.key === 'needs-setup'}
            onlineOverrides={onlineOverrides}
            actionOverrides={actionOverrides}
            onToggleOnline={onToggleOnline}
            onActionChange={onActionChange}
            onGoToProfile={onGoToProfile}
          />
        </div>
      )}
    </div>
  )
}

function PlaneSection({
  title, subtitle, subgroups,
  agentId, onlineOverrides, actionOverrides, onToggleOnline, onActionChange, onGoToProfile,
}: {
  title: string
  subtitle: string
  subgroups: SubGroup[]
  agentId: string
  onlineOverrides: Record<string, boolean>
  actionOverrides: Record<string, OnlineAction>
  onToggleOnline: (id: string, on: boolean) => void
  onActionChange: (id: string, a: OnlineAction) => void
  onGoToProfile: (anchor: string) => void
}) {
  const totalCount = subgroups.reduce((s, g) => s + g.checks.length, 0)
  return (
    <section className="rounded border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <header className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{title}</h2>
          <span className="text-[11px] tabular-nums text-slate-400 dark:text-zinc-500">{totalCount} checks</span>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">{subtitle}</p>
      </header>
      <div>
        {subgroups.map(g => (
          <SubGroupBlock
            key={g.key}
            group={g}
            agentId={agentId}
            onlineOverrides={onlineOverrides}
            actionOverrides={actionOverrides}
            onToggleOnline={onToggleOnline}
            onActionChange={onActionChange}
            onGoToProfile={onGoToProfile}
          />
        ))}
      </div>
    </section>
  )
}

function ChecksTab({
  plane, agentId, alertConfig, subcheckConfig,
  onlineOverrides, actionOverrides, onToggleOnline, onActionChange, onGoToProfile,
}: ChecksTabProps) {
  const coverage = useMemo(
    () => computeCoverage(alertConfig, subcheckConfig),
    [alertConfig, subcheckConfig],
  )

  const groups = useMemo(() => {
    const rg = { enforcing: [] as SubCheck[], couldEnforce: [] as SubCheck[], needsSetup: [] as SubCheck[] }
    const sa = { detecting: [] as SubCheck[], needsSetup: [] as SubCheck[] }
    const hist = [] as SubCheck[]

    for (const signal of SIGNAL_REGISTRY) {
      for (const check of signal.subChecks) {
        if (check.status !== 'active') continue
        const bucket = coverage.byId[check.id]

        // Scope decides plane: event → Runtime Guard, session → Session
        // Analysis, history → History-scoped. Registry invariant guarantees
        // event ⟺ enforceable, so no special-case needed here.
        if (check.scope === 'event') {
          if (bucket === 'enforcing')            rg.enforcing.push(check)
          else if (bucket === 'needs-setup')     rg.needsSetup.push(check)
          else                                   rg.couldEnforce.push(check)
        } else if (check.scope === 'session') {
          if (bucket === 'needs-setup') sa.needsSetup.push(check)
          else                          sa.detecting.push(check)
        } else if (check.scope === 'history') {
          hist.push(check)
        }
      }
    }
    return { rg, sa, hist }
  }, [coverage])

  const rowProps = {
    agentId, onlineOverrides, actionOverrides, onToggleOnline, onActionChange, onGoToProfile,
  } as const

  return (
    <div className="space-y-4">
      {plane === 'runtimeGuard' && (
        <PlaneSection
          title="Runtime Guard"
          subtitle="Real-time blocking in the SDK path"
          subgroups={[
            {
              key:  'enforcing',
              label:'Enforcing',
              checks: groups.rg.enforcing,
              helper: 'These checks intercept the agent in real time and block, sanitize, or terminate when the pattern fires.',
            },
            {
              key:  'could-enforce',
              label:'Could enforce',
              checks: groups.rg.couldEnforce,
              helper: 'Currently detecting. All required policy fields are declared — click Enforce on a row to promote it to blocking mode.',
            },
            {
              key:  'needs-setup',
              label:'Needs setup',
              checks: groups.rg.needsSetup,
              helper: 'These checks require a declaration in the Governance tab before they can activate.',
            },
          ]}
          {...rowProps}
        />
      )}

      {plane === 'sessionAnalysis' && (
        <>
          <PlaneSection
            title="Post-session"
            subtitle="Detection over the full transcript after each session ends"
            subgroups={[
              {
                key:  'detecting',
                label:'Detecting',
                checks: groups.sa.detecting,
                helper: 'These checks run after each session ends and produce alerts — session-scope checks cannot block in real time.',
              },
              {
                key:  'needs-setup',
                label:'Needs setup',
                checks: groups.sa.needsSetup,
                helper: 'Blind — declare the required field in the Governance tab to activate.',
              },
            ]}
            {...rowProps}
          />

          <PlaneSection
            title="History-scoped"
            subtitle="Multi-session patterns; contribute to the Agent Trust score"
            subgroups={[
              {
                key:  'detecting',
                label:'Detecting',
                checks: groups.hist,
                helper: 'Passive checks — fire when a pattern crosses session boundaries. No mode dial.',
              },
            ]}
            {...rowProps}
          />
        </>
      )}
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
    <div className="rounded border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 overflow-hidden">
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

type ProfileStatus = 'declared' | 'undeclared'

// Field-name → the sub-checks that consume it, derived once from the registry.
// A field "powers" every active check that lists it in `requiresPolicyFields`.
// Split by scope so we can show a Runtime-Guard vs Session-Analysis breakdown
// without leaking individual sub-check IDs into the Governance tab.
const FIELD_POWERS: Record<string, { protects: string[]; runtimeGuard: number; sessionAnalysis: number }> = (() => {
  const acc: Record<string, { protects: string[]; runtimeGuard: number; sessionAnalysis: number }> = {}
  for (const signal of SIGNAL_REGISTRY) {
    for (const check of signal.subChecks) {
      if (check.status !== 'active') continue
      for (const field of check.requiresPolicyFields ?? []) {
        const bucket = (acc[field] ??= { protects: [], runtimeGuard: 0, sessionAnalysis: 0 })
        if (!bucket.protects.includes(check.label)) bucket.protects.push(check.label)
        if (check.scope === 'event')  bucket.runtimeGuard++
        else                          bucket.sessionAnalysis++
      }
    }
  }
  return acc
})()

function ProfileRow({ label, fieldName, tooltip, id, status, statusNode, onReset, children }: {
  label: string
  /**
   * alertConfig key(s) this row governs. Drives the auto-derived
   * "Protects against" + "Powers" summary. Accepts an array when a single UI
   * control edits multiple underlying fields (e.g. the tool manifest editor
   * co-manages tool_manifest, tool_approval_policy, and privilege_scope).
   */
  fieldName?: string | string[]
  tooltip: string
  id?: string
  /** Drives reset-button visibility. Not shown as a badge. */
  status: ProfileStatus
  /** Optional trailing header content (e.g. custom control on the right). */
  statusNode?: React.ReactNode
  onReset?: () => void
  children?: React.ReactNode
}) {
  const isDeclared = status === 'declared'
  const powers = useMemo(() => {
    if (!fieldName) return undefined
    const names = Array.isArray(fieldName) ? fieldName : [fieldName]
    const protects: string[] = []
    let runtimeGuard = 0, sessionAnalysis = 0
    for (const n of names) {
      const p = FIELD_POWERS[n]
      if (!p) continue
      for (const t of p.protects) if (!protects.includes(t)) protects.push(t)
      runtimeGuard    += p.runtimeGuard
      sessionAnalysis += p.sessionAnalysis
    }
    return { protects, runtimeGuard, sessionAnalysis }
  }, [fieldName])

  return (
    <div id={id} className="px-4 py-4">
      {/* Header: label + tooltip + reset (right) */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{label}</span>
        <Tooltip text={tooltip} />
        {statusNode}
        {isDeclared && onReset && (
          <button type="button" onClick={onReset}
            className="ml-auto rounded border border-slate-200 px-2 py-0.5 text-[10px] text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors dark:border-zinc-700 dark:text-zinc-500 dark:hover:text-red-400 dark:hover:border-red-800">
            reset
          </button>
        )}
      </div>

      {/* Impact summary — one line: Protects · Powers */}
      {powers && (powers.runtimeGuard > 0 || powers.sessionAnalysis > 0) && (
        <p className="mb-3 text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">
          {powers.protects.length > 0 && (
            <>
              <span className="text-slate-500 dark:text-zinc-400">{powers.protects.join(' · ')}</span>
              <span className="mx-1.5 text-slate-300 dark:text-zinc-600">•</span>
            </>
          )}
          {powers.runtimeGuard > 0 && (
            <span className="text-violet-700 dark:text-violet-400">
              {powers.runtimeGuard} Runtime Guard
            </span>
          )}
          {powers.runtimeGuard > 0 && powers.sessionAnalysis > 0 && (
            <span className="text-slate-400 dark:text-zinc-500"> · </span>
          )}
          {powers.sessionAnalysis > 0 && (
            <span className="text-emerald-700 dark:text-emerald-400">
              {powers.sessionAnalysis} Session Analysis
            </span>
          )}
        </p>
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
  const status: ProfileStatus = mapped.length > 0 ? 'declared' : 'undeclared'

  function handleAdd(modelId: string) {
    setAddValue('')
    setModels.mutate([...Array.from(mappedIds), modelId])
  }
  function handleRemove(modelId: string) {
    setModels.mutate(Array.from(mappedIds).filter(id => id !== modelId))
  }


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
        fieldName="connected_llms"
        tooltip="Map the LLM models this agent uses. Required for per-model cost calculations, context window enforcement, accurate statistical baselines, and detecting use of undeclared models."
        status={status}
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
        fieldName="token_budget_usd"
        tooltip="Set a per-session USD spend limit. UBC-02b fires when total token cost for a session exceeds this cap. Requires Connected LLMs to have input/output cost rates set in Inventory."
        status={alertConfig?.token_budget_usd != null ? 'declared' : 'undeclared'}
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
  const status: ProfileStatus = connected.length > 0 ? 'declared' : 'undeclared'

  function handleAdd(id: string) {
    setAddValue('')
    setConnected.mutate([...Array.from(connectedIds), id])
  }
  function handleRemove(id: string) {
    setConnected.mutate(Array.from(connectedIds).filter(cid => cid !== id))
  }


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
        fieldName="connected_agents"
        tooltip="Declare which sub-agents this agent is permitted to delegate to. Without a declared list IAC-05a is blind. Once set, any delegation whose target is not in this list fires a critical finding."
        status={status}
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

type GovSectionKey = 'tools' | 'protection' | 'costRate' | 'supply' | 'identity'

const ANCHOR_SECTION: Record<string, GovSectionKey> = {
  'profile-tool-manifest':      'tools',
  'profile-max-tool-calls':     'protection',
  'profile-irreversible-tools': 'protection',
  'profile-network-allowlist':  'protection',
  'profile-working-directory':  'protection',
  'profile-write-namespace':    'protection',
  'profile-operating-hours':    'costRate',
  'profile-sbom':               'supply',
  'profile-mcp-endpoints':      'supply',
  'profile-system-prompt':      'identity',
  'profile-environment':        'identity',
}

function AgentProfileTab({ agentId, isAdmin, scrollTo }: { agentId: string; isAdmin: boolean; scrollTo?: string }) {
  const { data: alertConfig } = useAlertConfig(agentId)
  const updateManifest       = useUpdateToolManifest(agentId)
  const updatePrivilegeScope = useUpdatePrivilegeScope(agentId)
  const updateToolScope      = useUpdateToolScope(agentId)
  const updateMaxCalls       = useUpdateMaxToolCalls(agentId)
  const updateProfile        = useUpdateAgentProfile(agentId)

  const [maxCallsDraft,    setMaxCallsDraft]    = useState('')
  const [addValue,         setAddValue]         = useState('')
  const [pendingAdd,       setPendingAdd]        = useState<string | null>(null)
  const [pendingPrivilege, setPendingPrivilege]  = useState(false)
  const [pendingApproval,  setPendingApproval]   = useState<'always_allow' | 'needs_approval'>('needs_approval')

  const manifest: string[]       = Array.isArray(alertConfig?.tool_manifest)   ? alertConfig!.tool_manifest   : []
  const privilegeScope: string[] = Array.isArray(alertConfig?.privilege_scope) ? alertConfig!.privilege_scope : []
  const approvalPolicy: Record<string, 'always_allow' | 'needs_approval'> =
    (alertConfig?.tool_approval_policy && typeof alertConfig.tool_approval_policy === 'object')
      ? alertConfig.tool_approval_policy
      : {}

  const { data: toolInventory } = useTools()
  const availableTools = (toolInventory ?? []).filter(t => !manifest.includes(t.name))

  function addFromInventory(name: string, isPrivileged: boolean, approval: 'always_allow' | 'needs_approval') {
    setAddValue('')
    setPendingAdd(null)
    setPendingPrivilege(false)
    setPendingApproval('needs_approval')
    if (!name || manifest.includes(name)) return
    updateToolScope.mutate({
      tool_manifest:        [...manifest, name],
      privilege_scope:      isPrivileged ? [...privilegeScope, name] : privilegeScope,
      tool_approval_policy: { ...approvalPolicy, [name]: approval },
    })
  }

  function toggleApproval(name: string) {
    const current = approvalPolicy[name] ?? 'needs_approval'
    const next = current === 'always_allow' ? 'needs_approval' : 'always_allow'
    updateToolScope.mutate({
      tool_manifest:        manifest,
      privilege_scope:      privilegeScope,
      tool_approval_policy: { ...approvalPolicy, [name]: next },
    })
  }

  function togglePrivilege(name: string) {
    const next = privilegeScope.includes(name)
      ? privilegeScope.filter(x => x !== name)
      : [...privilegeScope, name]
    updatePrivilegeScope.mutate(next)
  }

  function removeTool(name: string) {
    const { [name]: _dropped, ...restPolicy } = approvalPolicy
    updateToolScope.mutate({
      tool_manifest:        manifest.filter(x => x !== name),
      privilege_scope:      privilegeScope.filter(x => x !== name),
      tool_approval_policy: Object.keys(restPolicy).length > 0 ? restPolicy : null,
    })
  }

  function commitMaxCalls() {
    const n = parseInt(maxCallsDraft, 10)
    if (!isNaN(n) && n >= 1) { updateMaxCalls.mutate(n); setMaxCallsDraft('') }
  }

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
  const [openSections, setOpenSections] = useState<Record<GovSectionKey, boolean>>({
    tools: false, protection: false, costRate: false, supply: false, identity: false,
  })
  function toggleSection(key: GovSectionKey) {
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

  const hostColor = 'border-blue-200 bg-white text-blue-700 dark:border-blue-800 dark:bg-zinc-800 dark:text-blue-400'
  const pkgColor  = 'border-teal-200 bg-white text-teal-700 dark:border-teal-800 dark:bg-zinc-800 dark:text-teal-400'

  return (
    <div className="space-y-4">
      {/* ════════ SECTION 0a — Connected LLMs ════════ */}
      <ConnectedLlmsSection agentId={agentId} isAdmin={isAdmin} scrollTo={scrollTo} />

      {/* ════════ SECTION 0b — Connected Agents ════════ */}
      <ConnectedAgentsSection agentId={agentId} isAdmin={isAdmin} scrollTo={scrollTo} />

      {/* ════════ SECTION Tools — declared tools + per-tool config in table form ════════ */}
      <ProfileSection title="Tools" icon={<Package className="h-3.5 w-3.5" />} open={openSections.tools} onToggle={() => toggleSection('tools')}>

        <ProfileRow
          id="profile-tool-manifest"
          label="Tool manifest"
          fieldName={['tool_manifest', 'tool_approval_policy', 'privilege_scope']}
          tooltip="Declare which tools this agent is allowed to call and set per-tool policy. EA-01a (Runtime Guard) blocks any unlisted tool. TME-01a validates inputs against declared schemas. IPA-01a suppresses privilege-escalation findings for tools you mark Privilege-capable. MIS-03a fires when a high-stakes tool runs without a HITL gate — Always allow exempts, Needs approval enforces. EA-02a treats Needs-approval tools as irreversible."
          status={manifest.length > 0 ? 'declared' : 'undeclared'}
          onReset={() => updateManifest.mutate([])}
        >
          <div className="flex flex-col">
            {/* ── Header + Add-tool inline ── */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 dark:border-zinc-800">
              <div className="grid grid-cols-[minmax(0,1fr)_80px_128px_112px_28px] gap-3 text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-zinc-500 flex-1 pr-3">
                <span>Tool</span>
                <span>Schema</span>
                <span>Approval</span>
                <span>Privileged</span>
                <span />
              </div>
            </div>

            {/* ── Tool rows ── */}
            {manifest.length === 0 ? (
              <div className="px-1 py-3 text-[11px] italic text-slate-400 dark:text-zinc-500">
                {isAdmin ? 'No tools declared yet — pick one from the dropdown below.' : 'No tools in manifest.'}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
                {manifest.map(name => {
                  const toolSchema   = (toolInventory ?? []).find(t => t.name === name)?.schema
                  const paramCount   = toolSchema ? Object.keys(toolSchema).length : 0
                  const isPrivileged = privilegeScope.includes(name)
                  const ap           = approvalPolicy[name] ?? 'needs_approval'
                  return (
                    <li
                      key={name}
                      className="grid grid-cols-[minmax(0,1fr)_80px_128px_112px_28px] items-center gap-3 py-1.5 text-[11px]"
                    >
                      <span className="min-w-0 truncate font-mono font-medium text-slate-800 dark:text-zinc-200" title={name}>
                        {name}
                      </span>
                      <span className="text-slate-500 dark:text-zinc-400">
                        {paramCount > 0
                          ? `${paramCount} param${paramCount === 1 ? '' : 's'}`
                          : <span className="italic text-slate-400 dark:text-zinc-500">—</span>}
                      </span>
                      <span>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => toggleApproval(name)}
                            title={ap === 'always_allow' ? 'Always allow — no gate required. Click to require approval.' : 'Needs approval — HITL gate required. Click to always allow.'}
                            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium transition-colors ${
                              ap === 'always_allow'
                                ? 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                                : 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20'
                            }`}
                          >
                            {ap === 'always_allow'
                              ? <><Unlock className="h-3 w-3" /> Always allow</>
                              : <><Lock className="h-3 w-3" /> Needs approval</>}
                          </button>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${ap === 'always_allow' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {ap === 'always_allow'
                              ? <><Unlock className="h-3 w-3" /> Always allow</>
                              : <><Lock className="h-3 w-3" /> Needs approval</>}
                          </span>
                        )}
                      </span>
                      <span>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => togglePrivilege(name)}
                            title={isPrivileged ? 'Privilege-capable — IPA-01a suppressed for this tool. Click to revoke.' : 'Not privilege-capable — click to mark.'}
                            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium transition-colors ${
                              isPrivileged
                                ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'
                            }`}
                          >
                            <ShieldCheck className="h-3 w-3" />
                            {isPrivileged ? 'Yes' : 'No'}
                          </button>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${isPrivileged ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-zinc-500'}`}>
                            <ShieldCheck className="h-3 w-3" />
                            {isPrivileged ? 'Yes' : 'No'}
                          </span>
                        )}
                      </span>
                      <span className="text-right">
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => removeTool(name)}
                            title={`Remove ${name} from manifest`}
                            className="rounded p-0.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}

            {/* ── Add-tool controls ── */}
            {isAdmin && !pendingAdd && (
              <div className="mt-2">
                <select
                  value={addValue}
                  disabled={availableTools.length === 0}
                  onChange={e => {
                    const val = e.target.value
                    setAddValue(val)
                    if (val) { setPendingAdd(val); setPendingPrivilege(false) }
                  }}
                  className="rounded border border-dashed border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-500 outline-none hover:border-violet-400 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-violet-600"
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
              </div>
            )}

            {/* ── Pending-add confirmation strip (shown after selecting) ── */}
            {isAdmin && pendingAdd && (
              <div className="flex flex-wrap items-center gap-3 rounded border border-violet-200 bg-violet-50/60 px-3 py-2 dark:border-violet-800 dark:bg-violet-900/10">
                <span className="font-mono text-xs font-medium text-violet-700 dark:text-violet-400">{pendingAdd}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">Approval</span>
                  {(['always_allow', 'needs_approval'] as const).map(policy => (
                    <button
                      key={policy}
                      type="button"
                      onClick={() => setPendingApproval(policy)}
                      className={`rounded border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        pendingApproval === policy
                          ? policy === 'always_allow'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-500'
                          : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-600'
                      }`}
                    >
                      {policy === 'always_allow' ? 'Always allow' : 'Needs approval'}
                    </button>
                  ))}
                  <Tooltip text="Always allow: this tool runs without requiring a human-approval gate — MIS-03a will not fire for it. Needs approval: MIS-03a fires if a node_start(human_review · hitl · approval_gate · checkpoint) gate is absent before this tool call." />
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pendingPrivilege}
                    onChange={e => setPendingPrivilege(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 accent-amber-500"
                  />
                  <span className="text-[10px] text-slate-600 dark:text-zinc-400">Privilege-capable</span>
                  <Tooltip text="Mark this tool as authorized to perform privilege-level operations for this agent — IAM role assumption, SQL DDL (GRANT / CREATE ROLE), Kubernetes RBAC, and similar. IPA-01a will not flag calls from this tool. Only tick this if the agent's role genuinely requires it." />
                </label>
                <button
                  onClick={() => addFromInventory(pendingAdd, pendingPrivilege, pendingApproval)}
                  className="ml-auto rounded-full bg-violet-600 px-3 py-0.5 text-xs font-medium text-white hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600"
                >
                  Add
                </button>
                <button
                  onClick={() => { setPendingAdd(null); setPendingPrivilege(false); setPendingApproval('needs_approval'); setAddValue('') }}
                  className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </ProfileRow>

      </ProfileSection>

      {/* ════════ SECTION A — Protection gates ════════ */}
      <ProfileSection title="Protection gates" icon={<Shield className="h-3.5 w-3.5" />} open={openSections.protection} onToggle={() => toggleSection('protection')}>

        <ProfileRow
          id="profile-max-tool-calls"
          label="Max tool calls per session"
          fieldName="max_tool_calls_per_session"
          tooltip="Set a hard cap on total tool calls per session. Without a manual cap, EA-02b uses statistical anomaly detection (mean + 1Ïƒ) and TME-01b uses a 3× average spike threshold."
          status={alertConfig?.max_tool_calls_per_session != null ? 'declared' : 'undeclared'}
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
          fieldName="irreversible_tools"
          tooltip="Which of this agent's tools perform actions that cannot be undone? EA-02a fires when one is called without a confirm-gate event. Without a declaration, a name-pattern heuristic is used."
          status={alertConfig?.irreversible_tools != null ? 'declared' : 'undeclared'}
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

        <ProfileRow
          id="profile-network-allowlist"
          label="Network allowlist"
          fieldName="network_allowlist"
          tooltip="Which hosts is this agent allowed to contact? EA-03b fires on any tool call targeting a host not on this list. Without a list, EA-03b cannot fire."
          status={alertConfig?.network_allowlist != null ? 'declared' : 'undeclared'}
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
          fieldName="working_directory"
          tooltip="Declare the filesystem path the agent should stay within. EA-03a fires when file-read tool calls reference paths outside this prefix. Without it, EA-03a cannot fire."
          status={alertConfig?.working_directory != null ? 'declared' : 'undeclared'}
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
          fieldName="write_namespace"
          tooltip="Declare the path or namespace prefix this agent is permitted to write to. EA-01c fires when write calls target outside it. Without a declaration, a read-intent heuristic is used."
          status={alertConfig?.write_namespace != null ? 'declared' : 'undeclared'}
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

      {/* ════════ SECTION B — Cost & rate controls ════════ */}
      <ProfileSection title="Cost & rate controls" icon={<Clock className="h-3.5 w-3.5" />} open={openSections.costRate} onToggle={() => toggleSection('costRate')}>
        <ProfileRow
          id="profile-operating-hours"
          label="Operating hours"
          fieldName="operating_hours"
          tooltip="Declare the days and UTC time window when this agent should be active. Sessions starting outside this window fire RA-01b. Without a schedule, RA-01b cannot fire."
          status={alertConfig?.operating_hours != null ? 'declared' : 'undeclared'}
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

      {/* ════════ SECTION C — Supply chain ════════ */}
      <ProfileSection title="Supply chain" icon={<Package className="h-3.5 w-3.5" />} open={openSections.supply} onToggle={() => toggleSection('supply')}>

        <ProfileRow
          id="profile-sbom"
          label="Approved packages (SBOM)"
          fieldName="sbom_allowlist"
          tooltip="List the package names this agent is allowed to install. Both ASCV-04a and ASCV-02b skip approved packages — only installs outside this list fire."
          status={alertConfig?.sbom_allowlist != null ? 'declared' : 'undeclared'}
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
          fieldName="mcp_endpoints"
          tooltip="Select MCP servers this agent is authorised to connect to. Without a declaration, ASCV-01a and ASCV-01b cannot fire."
          status={alertConfig?.mcp_endpoints != null ? 'declared' : 'undeclared'}
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

      {/* ════════ SECTION D — Identity & delegation ════════ */}
      <ProfileSection title="Identity & delegation" icon={<Settings className="h-3.5 w-3.5" />} open={openSections.identity} onToggle={() => toggleSection('identity')}>

        <ProfileRow
          id="profile-system-prompt"
          label="System prompt"
          fieldName="system_prompt"
          tooltip="Paste the agent's exact system prompt. Without it SPL-01a, SPL-01b, SPL-03a (LCS path), and EA-02c cannot run."
          status={alertConfig?.system_prompt != null ? 'declared' : 'undeclared'}
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
          fieldName="environment"
          tooltip="Is this agent running in production or staging? Declaring 'production' suppresses TME-03b. Without a declaration the agent is treated as non-production and TME-03b remains active."
          status={alertConfig?.environment != null ? 'declared' : 'undeclared'}
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
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AgentConfig() {
  const { agentId } = useParams({ from: '/inventory/agents/$agentId/config' })
  const { data, isLoading } = useAgentProfile(agentId)
  const { data: subcheckConfig = {} } = useSubcheckConfig(agentId)
  // Alert config drives coverage classification — which checks are actually
  // protected by declared policy fields vs waiting on setup.
  const { data: alertConfig } = useAlertConfig(agentId)
  const toggleMutation = useToggleSubcheckOnline(agentId)

  const user     = useAuthStore(s => s.user)
  const isAdmin  = user?.role === 'admin' || user?.role === 'editor' || user?.role === 'superadmin'

  const [activeTab, setActiveTab] = useState<'governance' | 'runtimeGuard' | 'sessionAnalysis'>('governance')
  const [profileScrollTo, setProfileScrollTo] = useState<string | undefined>(undefined)

  const agentName = data?.name ?? agentId

  const onlineOverrides: Record<string, boolean> = Object.fromEntries(
    Object.entries(subcheckConfig).map(([id, ov]) => [id, ov.online_detection])
  )

  const actionOverrides: Record<string, OnlineAction> = Object.fromEntries(
    Object.entries(subcheckConfig).map(([id, ov]) => [id, ov.action ?? 'alert'])
  )

  function findCheck(subCheckId: string) {
    for (const s of SIGNAL_REGISTRY) {
      for (const c of s.subChecks) if (c.id === subCheckId) return c
    }
    return null
  }

  function handleToggleOnline(subCheckId: string, online: boolean) {
    if (!isAdmin) return
    if (online) {
      // Enforce promotion: pick a sensible default action. Prefer block_call;
      // fall back to the first non-alert action the check supports.
      const check = findCheck(subCheckId)
      const raw = (check?.capableActions as OnlineAction[] | undefined)
        ?? ['block_call', 'sanitize', 'terminate_session']
      const enforceActions = raw.filter(a => a !== 'alert')
      const defaultAction: OnlineAction = enforceActions.includes('block_call')
        ? 'block_call'
        : (enforceActions[0] ?? 'block_call')
      toggleMutation.mutate({ subCheckId, online_detection: true, action: defaultAction })
      return
    }
    toggleMutation.mutate({ subCheckId, online_detection: false, action: 'alert' })
  }

  function handleActionChange(subCheckId: string, action: OnlineAction) {
    if (!isAdmin) return
    if (action === 'alert') return  // alert is not a Runtime Guard action
    toggleMutation.mutate({ subCheckId, online_detection: true, action })
  }

  function handleGoToProfile(anchor: string) {
    setProfileScrollTo(undefined)         // reset first so useEffect fires even if same anchor
    setActiveTab('governance')
    setTimeout(() => setProfileScrollTo(anchor), 0)
  }

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
          <div className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 p-1 shrink-0 dark:border-zinc-700 dark:bg-zinc-800">
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

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-zinc-700">
        {(
          [
            { id: 'governance',      label: 'Governance',       subtitle: isAdmin ? 'declare what the agent is allowed to do' : 'view only' },
            { id: 'runtimeGuard',    label: 'Runtime Guard',    subtitle: 'real-time in the SDK path' },
            { id: 'sessionAnalysis', label: 'Session Analysis', subtitle: 'post-session + history' },
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
      {activeTab === 'governance' && (
        <AgentProfileTab agentId={agentId} isAdmin={isAdmin} scrollTo={profileScrollTo} />
      )}
      {(activeTab === 'runtimeGuard' || activeTab === 'sessionAnalysis') && (
        <ChecksTab
          plane={activeTab}
          agentId={agentId}
          alertConfig={alertConfig}
          subcheckConfig={subcheckConfig}
          onlineOverrides={onlineOverrides}
          actionOverrides={actionOverrides}
          onToggleOnline={handleToggleOnline}
          onActionChange={handleActionChange}
          onGoToProfile={handleGoToProfile}
        />
      )}

    </div>
  )
}
