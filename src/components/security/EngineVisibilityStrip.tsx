/**
 * EngineVisibilityStrip — proves the engine ran on this session.
 *
 * Empty findings on their own read as "product doing nothing"; the strip
 * reframes it as "product evaluated N checks against this session and
 * cleared it (or found M issues)".
 *
 * Single line, plane vocabulary matching the rest of the product (Session
 * Analysis / Runtime Guard) instead of raw internal terms like
 * "handled online". "Need setup" links to the agent's Governance page when
 * an agentId is available (lands on the Checks tab manually — the page
 * doesn't URL-sync its tab state yet).
 *
 * Data comes from session_risk_scores columns added in migration 031.
 * Older sessions (before the migration) won't have this data — the strip
 * renders nothing rather than showing zeros that read as bugs.
 */
import { Link } from '@tanstack/react-router'
import type { SessionRiskScore } from '../../types/security'

interface EngineVisibilityStripProps {
  score:        SessionRiskScore | undefined
  findingCount: number
  agentId?:     string | null
}

function _formatDuration(ms: number): string {
  if (ms < 1000)   return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms / 1000 / 60)}m`
}

export function EngineVisibilityStrip({ score, findingCount, agentId }: EngineVisibilityStripProps) {
  // Older sessions or in-flight scoring — hide the strip rather than
  // rendering half-truths.
  if (!score || score.checksEvaluated === undefined) return null

  const evaluated  = score.checksEvaluated
  const durationMs = score.analysisDurationMs
  const needsSetup = score.checksSkippedByReason?.needs_setup ?? []
  const runtime    = score.checksSkippedByReason?.handled_online ?? []

  const needsSetupTitle = needsSetup.slice(0, 20).join(', ') + (needsSetup.length > 20 ? '…' : '')

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-400">
      <span>
        <span className="font-semibold tabular-nums text-blue-700 dark:text-blue-400">{evaluated}</span>{' '}
        checks in session analysis
      </span>

      {runtime.length > 0 && (
        <>
          <span className="text-slate-300 dark:text-zinc-600">·</span>
          <span>
            <span className="font-semibold tabular-nums text-violet-700 dark:text-violet-400">{runtime.length}</span>{' '}
            checks in runtime
          </span>
        </>
      )}

      {needsSetup.length > 0 && (
        <>
          <span className="text-slate-300 dark:text-zinc-600">·</span>
          {agentId ? (
            <Link
              to="/inventory/agents/$agentId/config"
              params={{ agentId }}
              title={needsSetupTitle}
              className="hover:underline"
            >
              <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">{needsSetup.length}</span>{' '}
              need setup
            </Link>
          ) : (
            <span title={needsSetupTitle}>
              <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">{needsSetup.length}</span>{' '}
              need setup
            </span>
          )}
        </>
      )}

      <span className="mx-2 text-slate-300 dark:text-zinc-600">|</span>

      <span>
        <span className={`font-semibold tabular-nums ${
          findingCount === 0
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-slate-800 dark:text-zinc-200'
        }`}>
          {findingCount}
        </span>{' '}
        finding{findingCount === 1 ? '' : 's'}
      </span>

      {durationMs !== undefined && (
        <span className="ml-auto text-slate-500 dark:text-zinc-500">
          analysed in {_formatDuration(durationMs)}
        </span>
      )}
    </div>
  )
}
