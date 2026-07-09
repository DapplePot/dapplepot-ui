/**
 * Vocabulary translation layer — internal terms → customer-facing labels.
 *
 * The engine speaks in phases (`online`, `post_session`, `cross_session`),
 * flags (`online_detection`), and scopes (`event`, `session`, `history`).
 * Customers see planes (Runtime Guard, Session Analysis, Agent Trust) and
 * modes (Observe, Detect, Enforce). This module is the ONLY place that
 * translation should happen — never render an internal term directly.
 *
 * If you're adding a new customer-visible string derived from an internal
 * value, add it here first.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Planes
// ─────────────────────────────────────────────────────────────────────────────
// The four planes are how customers navigate the product. Agent Trust is an
// aggregation *view* over per-session findings (Bayesian trust score + trend),
// NOT a container for a category of sub-checks. Agent Governance is the
// declaration surface (policy/config). Neither derives from a finding phase.

export type Plane =
  | 'agent-governance'
  | 'runtime-guard'
  | 'session-analysis'
  | 'agent-trust'
  | 'excluded'

const PLANE_LABEL: Record<Plane, string> = {
  'agent-governance': 'Agent Governance',
  'runtime-guard':    'Runtime Guard',
  'session-analysis': 'Session Analysis',
  'agent-trust':      'Agent Trust',
  'excluded':         'Excluded',
}

export function planeLabel(plane: Plane): string {
  return PLANE_LABEL[plane]
}


// ─────────────────────────────────────────────────────────────────────────────
// Detection phase (legacy) → Plane
// ─────────────────────────────────────────────────────────────────────────────
// Legacy `detectionPhase` values still ship on findings until the backend
// migrates to the new facet model. Only two planes ever originate a finding:
// Runtime Guard (online) and Session Analysis (post_session + cross_session).
// Cross-session findings are surfaced in the session's report with a
// "history evidence" chip; they also *inform* the Agent Trust score, but the
// Agent Trust plane is not their home.

export type DetectionPhase = 'online' | 'post_session' | 'cross_session' | 'excluded'
export type PhaseOrigin    = 'per-event' | 'per-session' | 'history-scoped'

const PHASE_TO_PLANE: Record<DetectionPhase, Plane> = {
  online:         'runtime-guard',
  post_session:   'session-analysis',
  cross_session:  'session-analysis',
  excluded:       'excluded',
}

const PHASE_TO_ORIGIN: Record<DetectionPhase, PhaseOrigin | undefined> = {
  online:         'per-event',
  post_session:   'per-session',
  cross_session:  'history-scoped',
  excluded:       undefined,
}

export function phaseToPlane(phase: DetectionPhase | string | undefined | null): Plane {
  if (!phase) return 'session-analysis'
  return (PHASE_TO_PLANE as Record<string, Plane>)[phase] ?? 'session-analysis'
}

/**
 * Sub-modifier describing where the finding's evidence came from. Both
 * `per-session` and `history-scoped` findings live under Session Analysis;
 * this lets the UI show a "history evidence" chip on the cross-session ones
 * without inventing a separate plane for them.
 */
export function phaseOrigin(phase: DetectionPhase | string | undefined | null): PhaseOrigin | undefined {
  if (!phase) return undefined
  return (PHASE_TO_ORIGIN as Record<string, PhaseOrigin | undefined>)[phase]
}

// Verb form for finding-group headers within a session report
const PHASE_GROUP_LABEL: Record<DetectionPhase, string> = {
  online:         'Stopped in real time',
  post_session:   'Found in analysis',
  cross_session:  'History evidence',
  excluded:       'Not applicable',
}
export function phaseGroupLabel(phase: DetectionPhase | string | undefined | null): string {
  if (!phase) return 'Found in analysis'
  return (PHASE_GROUP_LABEL as Record<string, string>)[phase] ?? 'Found in analysis'
}

/** Convenience: `detectionPhase` value → plane label. */
export function phaseLabel(phase: DetectionPhase | string | undefined | null): string {
  return planeLabel(phaseToPlane(phase))
}


// ─────────────────────────────────────────────────────────────────────────────
// Facet labels (registry model)
// ─────────────────────────────────────────────────────────────────────────────

export type Scope     = 'event' | 'session' | 'history'
export type Subject   = 'agent' | 'user' | 'tenant'
export type Mechanism = 'policy' | 'signature' | 'statistical' | 'behavioral' | 'model'
export type Mode      = 'observe' | 'detect' | 'enforce'
export type Status    = 'active' | 'coming-soon' | 'not-applicable'

const SCOPE_LABEL: Record<Scope, string> = {
  event:   'Event',
  session: 'Session',
  history: 'History',
}
export function scopeLabel(s: Scope): string { return SCOPE_LABEL[s] }

const SUBJECT_LABEL: Record<Subject, string> = {
  agent:  'Agent',
  user:   'User',
  tenant: 'Tenant',
}
export function subjectLabel(s: Subject): string { return SUBJECT_LABEL[s] }

const MECHANISM_LABEL: Record<Mechanism, string> = {
  policy:       'Policy',
  signature:    'Signature',
  statistical:  'Statistical',
  behavioral:   'Behavioral',
  model:        'Model',
}
export function mechanismLabel(m: Mechanism): string { return MECHANISM_LABEL[m] }

const MODE_LABEL: Record<Mode, string> = {
  observe: 'Observe',
  detect:  'Detect',
  enforce: 'Enforce',
}
export function modeLabel(m: Mode): string { return MODE_LABEL[m] }

const STATUS_LABEL: Record<Status, string> = {
  'active':          'Active',
  'coming-soon':     'Coming soon',
  'not-applicable':  'Not applicable',
}
export function statusLabel(s: Status): string { return STATUS_LABEL[s] }


// ─────────────────────────────────────────────────────────────────────────────
// Actions — what the enforcer did
// ─────────────────────────────────────────────────────────────────────────────

export type OnlineAction = 'alert' | 'sanitize' | 'block_call' | 'terminate_session'

const ACTION_LABEL: Record<OnlineAction, string> = {
  alert:              'Alerted',
  sanitize:           'Sanitized',
  block_call:         'Blocked',
  terminate_session:  'Terminated session',
}
export function actionLabel(a: OnlineAction): string {
  return ACTION_LABEL[a] ?? 'Alerted'
}

// Verbs used inside the Enforce confirmation modal (present tense)
const ACTION_VERB: Record<OnlineAction, string> = {
  alert:              'Alert',
  sanitize:           'Sanitize content',
  block_call:         'Block the call',
  terminate_session:  'Terminate session',
}
export function actionVerb(a: OnlineAction): string {
  return ACTION_VERB[a] ?? 'Alert'
}
