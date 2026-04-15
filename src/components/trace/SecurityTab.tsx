import { useSessionSecurity, useSessionActions } from '../../hooks/useSecurity'
import { SessionRiskPanel } from '../security/SessionRiskPanel'
import { FindingsList } from '../security/FindingsList'
import { OnlineFindingsList } from '../security/OnlineFindingsList'
import { Skeleton } from '../ui/skeleton'

interface SecurityTabProps {
  sessionId: string
}

export function SecurityTab({ sessionId }: SecurityTabProps) {
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

  if (!score.data) {
    return (
      <p className="pt-12 text-center text-sm text-slate-400">
        No security score yet — scoring runs post-session
      </p>
    )
  }

  return (
    <div className="space-y-4 pt-3">
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
      <div>
        <h3 className="mb-2 text-xs font-medium text-slate-500">
          Online Findings
          {(actions.data?.length ?? 0) > 0 && (
            <span className="ml-1.5 text-slate-400">({actions.data!.length})</span>
          )}
        </h3>
        <OnlineFindingsList findings={actions.data ?? []} />
      </div>
      <div>
        <h3 className="mb-2 text-xs font-medium text-slate-500">
          Post-session Findings
          {(findings.data?.length ?? 0) > 0 && (
            <span className="ml-1.5 text-slate-400">({findings.data!.length})</span>
          )}
        </h3>
        <FindingsList findings={findings.data ?? []} />
      </div>
    </div>
  )
}
