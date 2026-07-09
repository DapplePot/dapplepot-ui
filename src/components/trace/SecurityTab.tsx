import { useSessionSecurity, useSessionActions } from '../../hooks/useSecurity'
import { SessionRiskPanel } from '../security/SessionRiskPanel'
import { EngineVisibilityStrip } from '../security/EngineVisibilityStrip'
import { FindingsList } from '../security/FindingsList'
import { OnlineFindingsList } from '../security/OnlineFindingsList'
import { Skeleton } from '../ui/skeleton'

interface SecurityTabProps {
  sessionId: string
  baseTime:  string | null
}

export function SecurityTab({ sessionId, baseTime }: SecurityTabProps) {
  const { score, findings } = useSessionSecurity(sessionId)
  const actions = useSessionActions(sessionId)

  if (score.isLoading) {
    return (
      <div className="space-y-3 pt-3">
        <Skeleton className="h-28 rounded" />
        <Skeleton className="h-16 rounded" />
        <Skeleton className="h-16 rounded" />
      </div>
    )
  }

  if (score.isError) {
    return (
      <p className="pt-4 text-sm text-red-500 dark:text-red-400">{(score.error as Error).message}</p>
    )
  }

  const postSessionFindings  = findings.data?.filter(f => f.detectionPhase === 'post_session')  ?? []
  const crossSessionFindings = findings.data?.filter(f => f.detectionPhase === 'cross_session') ?? []

  const totalFindings = (actions.data?.length ?? 0)
                      + postSessionFindings.length
                      + crossSessionFindings.length

  return (
    <div className="space-y-4 pt-3">
      <EngineVisibilityStrip
        score={score.data ?? undefined}
        findingCount={totalFindings}
        agentId={score.data?.agentId}
      />
      {score.data ? (
        <SessionRiskPanel
          llmScore={score.data.llmScore}
          llmBand={score.data.llmBand}
          asiScore={score.data.asiScore}
          asiBand={score.data.asiBand}
          scoredAt={score.data.scoredAt}
          scorerVersion={score.data.scorerVersion}
          trustScore={score.data.trustScore}
          trustTrend={score.data.trustTrend}
          attackChainsDetected={score.data.attackChainsDetected}
          amplification={score.data.amplification}
          rawLlmComposite={score.data.rawLlmComposite}
          rawAsiComposite={score.data.rawAsiComposite}
          confidenceBand={score.data.confidenceBand}
        />
      ) : (
        <p className="text-center text-sm text-slate-400 dark:text-zinc-500">
          No security score yet — scoring runs post-session
        </p>
      )}
      <div>
        <h3 className="mb-2 text-xs font-medium text-slate-500 dark:text-zinc-400">
          Runtime Guard
          {(actions.data?.length ?? 0) > 0 && (
            <span className="ml-1.5 text-slate-400 dark:text-zinc-500">({actions.data!.length})</span>
          )}
        </h3>
        <OnlineFindingsList findings={actions.data ?? []} baseTime={baseTime} />
      </div>
      {(postSessionFindings.length > 0 || crossSessionFindings.length > 0) ? (
        <>
          <div>
            <h3 className="mb-2 text-xs font-medium text-slate-500 dark:text-zinc-400">
              Found in analysis
              {postSessionFindings.length > 0 && (
                <span className="ml-1.5 text-slate-400 dark:text-zinc-500">({postSessionFindings.length})</span>
              )}
            </h3>
            <FindingsList findings={postSessionFindings} />
          </div>
          {crossSessionFindings.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-medium text-slate-500 dark:text-zinc-400">
                Found in analysis · history evidence
                <span className="ml-1.5 text-slate-400 dark:text-zinc-500">({crossSessionFindings.length})</span>
              </h3>
              <FindingsList findings={crossSessionFindings} />
            </div>
          )}
        </>
      ) : (
        // Clean session, engine ran — reframe "no findings" as a deliverable.
        totalFindings === 0 && score.data?.checksEvaluated !== undefined && (
          <div className="rounded border border-emerald-100 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-900/10">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Session cleared analysis
            </p>
            <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
              {score.data.checksEvaluated} checks evaluated · no findings above threshold
            </p>
          </div>
        )
      )}
    </div>
  )
}
