/**
 * Coverage — bucket the 155 sub-checks per the current agent's config.
 *
 * Four buckets:
 *   enforcing   — override on + block/sanitize/terminate action
 *   detecting   — default working state (in-flight, non-acting)
 *   observing   — future "observe" toggle (currently unreachable)
 *   needs-setup — required Governance field is not declared, so the check is
 *                 silent and dishonest to call detecting
 *
 * "Needs setup" is the interesting one: a check that requires a policy field
 * (e.g. `write_namespace`) and has none declared is silent, not protective.
 * Surfacing this makes the declare → activate loop legible.
 */
import { SIGNAL_REGISTRY } from '../data/signalRegistry'
import type { AgentAlertConfig } from '../api/security'

// ── Bucket a check falls into ────────────────────────────────────────────────
export type CoverageBucket = 'enforcing' | 'detecting' | 'observing' | 'needs-setup'

export interface CoverageBreakdown {
  total:        number          // active (non-excluded) checks in the registry
  enforcing:    string[]        // sub-check IDs, one bucket per
  detecting:    string[]
  observing:    string[]
  needsSetup:   string[]
  /**
   * subCheckId → 'enforcing' | 'detecting' | 'observing' | 'needs-setup'.
   * Handy for the Checks tab to render the same colour per row.
   */
  byId: Record<string, CoverageBucket>
}

// ── Field-name → "is configured" predicate ───────────────────────────────────
// The registry uses `requires_policy_fields` values like 'write_namespace',
// 'tool_manifest'. Some of them map to keys on AgentAlertConfig (declared in
// the Governance tab); others map to state owned by Inventory (tool schemas,
// tool versions, registered MCP server names) or by the platform itself
// (delegation auth field allowlist). Only the Governance-managed set is
// relevant for Needs-setup classification — a customer can't unblock an
// Inventory-managed requirement from the Governance tab, so flagging those
// as "Needs setup" would misdirect the user.
const GOVERNANCE_FIELDS = new Set<string>([
  'tool_manifest', 'tool_approval_policy', 'privilege_scope',
  'max_tool_calls_per_session',
  'system_prompt', 'environment',
  'irreversible_tools',
  'network_allowlist', 'working_directory', 'write_namespace',
  'operating_hours',
  'sbom_allowlist', 'mcp_endpoints',
  'connected_llms', 'connected_agents',
  'token_budget_usd',
])

const _isNonEmptyArray = (v: unknown) => Array.isArray(v) && v.length > 0
const _isNonEmptyObject = (v: unknown) =>
  v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length > 0
const _isNonEmptyString = (v: unknown) => typeof v === 'string' && v.trim() !== ''

function fieldIsConfigured(fieldName: string, cfg: AgentAlertConfig | undefined): boolean {
  if (!cfg) return false
  const v = (cfg as unknown as Record<string, unknown>)[fieldName]
  if (v === null || v === undefined) return false
  if (Array.isArray(v))         return _isNonEmptyArray(v)
  if (typeof v === 'object')    return _isNonEmptyObject(v)
  if (typeof v === 'string')    return _isNonEmptyString(v)
  if (typeof v === 'number')    return true          // e.g. token_budget_usd, max_tool_calls_per_session
  if (typeof v === 'boolean')   return true
  return false
}

// ── Compute breakdown ────────────────────────────────────────────────────────
export function computeCoverage(
  alertConfig: AgentAlertConfig | undefined,
  subcheckOverrides: Record<string, { online_detection: boolean; action?: string }>,
): CoverageBreakdown {
  const enforcing:  string[] = []
  const detecting:  string[] = []
  const observing:  string[] = []
  const needsSetup: string[] = []
  const byId: Record<string, CoverageBucket> = {}

  for (const signal of SIGNAL_REGISTRY) {
    for (const check of signal.subChecks) {
      // Excluded checks never count — they're structural constants.
      if (check.status !== 'active') continue

      // Needs-setup wins the classification: a policy check with no field is
      // silent, so calling it "detecting" would be dishonest. But only count
      // Governance-managed requirements — Inventory / platform-managed fields
      // aren't unblockable from the Governance tab so flagging them as
      // Needs-setup would misdirect the customer.
      const required = (check.requiresPolicyFields ?? []).filter(f => GOVERNANCE_FIELDS.has(f))
      const missing  = required.filter(f => !fieldIsConfigured(f, alertConfig))
      if (missing.length > 0) {
        needsSetup.push(check.id)
        byId[check.id] = 'needs-setup'
        continue
      }

      // Override map is the customer's mode dial: on + block/sanitize/terminate = enforcing;
      // on + alert = detecting (in-flight but non-acting).
      // No override at all = detecting (default mode).
      const ov = subcheckOverrides[check.id]
      if (check.enforceable && ov?.online_detection && ov.action && ov.action !== 'alert') {
        enforcing.push(check.id)
        byId[check.id] = 'enforcing'
      } else if (ov && !ov.online_detection && ov.action === undefined) {
        // A future explicit "observe" toggle would land here.
        observing.push(check.id)
        byId[check.id] = 'observing'
      } else {
        detecting.push(check.id)
        byId[check.id] = 'detecting'
      }
    }
  }

  return {
    total: enforcing.length + detecting.length + observing.length + needsSetup.length,
    enforcing, detecting, observing, needsSetup,
    byId,
  }
}
