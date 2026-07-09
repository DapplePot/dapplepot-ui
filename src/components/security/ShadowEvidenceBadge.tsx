/**
 * ShadowEvidenceBadge
 *
 * Renders the "fired N× last 7d" ambient stat next to a sub-check row on the
 * Checks tab, and inside the Enforce confirmation modal ("would have blocked
 * 3 sessions — review →"). Single component, one wire format — see
 * `useSubCheckFirings` for how the data arrives.
 *
 * Design intent (see platform_taxonomy_plan.md § UX funnel):
 *   * Silent when count === 0. Enforce is trust-building; empty state doesn't
 *     need to advertise itself.
 *   * Colour scales with volume — high firing counts *earn* a warmer tint,
 *     matching the customer's intuition that "this check catches things."
 *   * Never blocks click-through; the label is a plain span, not a button.
 */
import type { SubCheckFiring } from '../../api/security'

interface ShadowEvidenceBadgeProps {
  firing?: SubCheckFiring
  windowDays: number
  /** When true, renders the wider "fired N× in last N days across M sessions"
   * form used inside the Enforce confirmation modal. */
  verbose?: boolean
  className?: string
}

// Color intensity by count. Cold ← rare ← common → hot.
function toneClass(count: number): string {
  if (count === 0) return ''
  if (count < 3)  return 'text-slate-500 dark:text-zinc-400'
  if (count < 10) return 'text-amber-600 dark:text-amber-400'
  return 'text-orange-600 dark:text-orange-400'
}

export function ShadowEvidenceBadge({
  firing,
  windowDays,
  verbose = false,
  className,
}: ShadowEvidenceBadgeProps) {
  const count = firing?.count ?? 0
  if (count === 0) return null

  const tone = toneClass(count)
  const sessions = firing?.distinct_sessions ?? count

  if (verbose) {
    return (
      <span className={`${tone} text-xs ${className ?? ''}`}>
        Fired {count}× in the last {windowDays} days across {sessions} session{sessions === 1 ? '' : 's'}
      </span>
    )
  }

  // Compact ambient form
  return (
    <span
      className={`${tone} text-[11px] font-medium tabular-nums ${className ?? ''}`}
      title={`${count} firing${count === 1 ? '' : 's'} across ${sessions} session${sessions === 1 ? '' : 's'} in the last ${windowDays} days`}
    >
      Fired {count}× · {windowDays}d
    </span>
  )
}
