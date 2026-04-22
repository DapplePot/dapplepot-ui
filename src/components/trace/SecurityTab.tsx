import { useSessionSecurity, useSessionActions } from '../../hooks/useSecurity'
import { SessionRiskPanel } from '../security/SessionRiskPanel'
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
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
    )
  }

  if (score.isError) {
    return (
      <p className="pt-4 text-sm text-red-500">{(score.error as Error).message}</p>
    )
  }

  const postSessionFindings  = findings.data?.filter(f => f.detectionPhase === 'post_session')  ?? []
  const crossSessionFindings = findings.data?.filter(f => f.detectionPhase === 'cross_session') ?? []

  return (
    <div className="space-y-4 pt-3">
      {score.data ? (
        <SessionRiskPanel
          llmScore={score.data.llmScore}
          llmBand={score.data.llmBand}
          asiScore={score.data.asiScore}
          asiBand={score.data.asiBand}
          llmSignalStatus={score.data.llmSignalStatus}
          asiSignalStatus={score.data.asiSignalStatus}
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
        <p className="text-center text-sm text-slate-400">
          No security score yet — scoring runs post-session
        </p>
      )}
      <div>
        <h3 className="mb-2 text-xs font-medium text-slate-500">
          Online Findings
          {(actions.data?.length ?? 0) > 0 && (
            <span className="ml-1.5 text-slate-400">({actions.data!.length})</span>
          )}
        </h3>
        <OnlineFindingsList findings={actions.data ?? []} baseTime={baseTime} />
      </div>
      {(postSessionFindings.length > 0 || crossSessionFindings.length > 0) && (
        <>
          <div>
            <h3 className="mb-2 text-xs font-medium text-slate-500">
              Post-session Findings
              {postSessionFindings.length > 0 && (
                <span className="ml-1.5 text-slate-400">({postSessionFindings.length})</span>
              )}
            </h3>
            <FindingsList findings={postSessionFindings} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium text-slate-500">
              Cross-session Findings
              {crossSessionFindings.length > 0 && (
                <span className="ml-1.5 text-slate-400">({crossSessionFindings.length})</span>
              )}
            </h3>
            <FindingsList findings={crossSessionFindings} />
          </div>
        </>
      )}
    </div>
  )
}
