import { useSessionSecurity, useSessionActions } from '../../hooks/useSecurity'
import { SessionRiskPanel } from '../security/SessionRiskPanel'
import { FindingsList } from '../security/FindingsList'
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
      {(actions.data?.length ?? 0) > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-slate-500">Online Actions</h3>
          <div className="space-y-1">
            {actions.data!.map(a => (
              <div
                key={a.id}
                className="flex items-center gap-2 rounded border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
              >
                <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                  a.actionTaken === 'terminate_session'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-orange-200 bg-orange-50 text-orange-700'
                }`}>
                  {a.actionTaken === 'terminate_session' ? 'terminated' : 'blocked'}
                </span>
                <span className="font-mono text-slate-500">{a.subCheckId}</span>
                <span className="text-slate-300">·</span>
                <span className="capitalize text-slate-500">{a.severity}</span>
                <span className="ml-auto text-slate-400">
                  {new Date(a.triggeredAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <h3 className="mb-2 text-xs font-medium text-slate-500">Findings</h3>
        <FindingsList findings={findings.data ?? []} />
      </div>
    </div>
  )
}
