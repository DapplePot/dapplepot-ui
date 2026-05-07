import { useParams } from '@tanstack/react-router'
import { useSessionDetail, useSessionTrace } from '../hooks/useSessions'
import { useSessionAlerts } from '../hooks/useAlerts'
import { useSessionActions } from '../hooks/useSecurity'
import { TraceLayout } from '../components/trace/TraceLayout'
import { MetricStripSkeleton } from '../components/trace/MetricStrip'
import { EventTimelineSkeleton } from '../components/trace/EventTimeline'
import { Skeleton } from '../components/ui/skeleton'
import type { TraceEvent } from '../types/session'

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
      {message}
    </div>
  )
}

export function SessionDetail() {
  const { id } = useParams({ from: '/sessions/$id' })

  const { data: session, isLoading: sessionLoading, isError: sessionError, error: sessionErr } =
    useSessionDetail(id)

  const { data: tracePages, isLoading: traceLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSessionTrace(id, session?.status)

  const { data: alerts } = useSessionAlerts(id)
  const { data: sessionActions } = useSessionActions(id)

  if (sessionLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-lg" />
        <MetricStripSkeleton />
        <EventTimelineSkeleton />
      </div>
    )
  }

  if (sessionError) {
    return <ErrorCard message={(sessionErr as Error).message} />
  }

  if (!session) return null

  const traceEvents = tracePages?.pages.flatMap((p) => p.events) ?? []

  // ClickHouse returns timestamps without timezone (e.g. "2026-04-22 12:00:00.000"),
  // which browsers parse as local time. Postgres returns ISO8601 with Z (UTC).
  // Strip the Z/offset so both are parsed consistently by the browser.
  const toChFormat = (iso: string) =>
    iso.replace('T', ' ').replace(/Z$/, '').replace(/\+\d{2}:\d{2}$/, '')

  // The SDK interceptor pushes security_finding events to ClickHouse *and* Postgres.
  // Only use the Postgres source (sessionActions) to avoid duplicates.
  const chSecurityFindings = traceEvents.filter(e => e.eventType === 'security_finding')
  const nonSecurityTraceEvents = traceEvents.filter(e => e.eventType !== 'security_finding')

  // Map regular ClickHouse event UUIDs → sequenceIndex for normal trigger lookup.
  const triggerSeqMap = new Map(nonSecurityTraceEvents.map(e => [e.eventId, e.sequenceIndex]))

  // For block_call/terminate_session: the trigger event (e.g. llm_start) is never
  // buffered to ClickHouse because _process_event raises before self._buffer.push().
  // The security_finding itself IS buffered (pushed inside evaluate() before raising).
  // Build two fallback maps keyed by trigger_event_id:
  //   sfSeqByTriggerEventId  → security_finding sequenceIndex (for positioning)
  //   sfOrigPayloadByTrigger → original trigger event payload (messages, model, etc.)
  //     stripped of security-specific keys the interceptor merged in.
  const _SF_INJECTED_KEYS = new Set([
    'trigger_event_id', 'trigger_event_type', 'signal', 'reason', 'action_taken',
    'owasp_signal_id', 'sub_check_id', 'check_label', 'check_score',
    'category', 'severity', 'matched_text', 'confidence_tier', 'detection_phase',
  ])
  const sfSeqByTriggerEventId    = new Map<string, number>()
  const sfOrigPayloadByTrigger   = new Map<string, Record<string, unknown>>()
  for (const sf of chSecurityFindings) {
    const p      = sf.payload as Record<string, unknown>
    const trigId = p?.['trigger_event_id'] as string | undefined
    if (!trigId) continue
    sfSeqByTriggerEventId.set(trigId, sf.sequenceIndex)
    const origPayload = Object.fromEntries(
      Object.entries(p).filter(([k]) => !_SF_INJECTED_KEYS.has(k))
    )
    sfOrigPayloadByTrigger.set(trigId, origPayload)
  }

  const securityEvents: TraceEvent[] = []
  for (let i = 0; i < (sessionActions ?? []).length; i++) {
    const a = sessionActions![i]
    const triggerSeq = triggerSeqMap.get(a.eventId) ?? sfSeqByTriggerEventId.get(a.eventId)
    const sfSeq = triggerSeq != null ? triggerSeq + 0.5 : 999_000 + i

    // For block_call/terminate_session, the trigger event was never written to ClickHouse.
    // Synthesize it so the timeline shows what was attempted before the block.
    if (
      (a.actionTaken === 'block_call' || a.actionTaken === 'terminate_session') &&
      !triggerSeqMap.has(a.eventId) &&
      sfSeqByTriggerEventId.has(a.eventId)
    ) {
      const trigType = a.triggerEventType ?? 'llm_start'
      securityEvents.push({
        eventId:         `dp-blocked-trigger-${a.id}`,
        eventType:       trigType,
        eventCategory:   trigType.startsWith('tool') ? 'tool' : 'llm',
        emittedAt:       toChFormat(a.triggeredAt),
        sequenceIndex:   sfSeq - 0.25,
        nodeRunId:       null,
        llmRunId:        null,
        toolRunId:       null,
        nodeName:        '',
        nodeStatus:      '',
        llmModel:        '',
        llmInputTokens:  0,
        llmOutputTokens: 0,
        llmLatencyMs:    0,
        toolName:        '',
        toolStatus:      '',
        errorCode:       '',
        payload:         sfOrigPayloadByTrigger.get(a.eventId) ?? {},
      })
    }

    securityEvents.push({
      eventId:         a.id,
      eventType:       'security_finding',
      eventCategory:   'security',
      emittedAt:       toChFormat(a.triggeredAt),
      sequenceIndex:   sfSeq,
      nodeRunId:       null,
      llmRunId:        null,
      toolRunId:       null,
      nodeName:        '',
      nodeStatus:      '',
      llmModel:        '',
      llmInputTokens:  0,
      llmOutputTokens: 0,
      llmLatencyMs:    0,
      toolName:        '',
      toolStatus:      '',
      errorCode:       '',
      payload: {
        action_taken:    a.actionTaken,
        check_label:     a.checkLabel,
        sub_check_id:    a.subCheckId,
        owasp_signal_id: a.owaspSignalId,
        severity:        a.severity,
        category:        a.category,
        matched_text:    a.matchedText ?? undefined,
      },
    })
  }

  const events = [...nonSecurityTraceEvents, ...securityEvents].sort(
    (a, b) => {
      const tDiff = new Date(a.emittedAt).getTime() - new Date(b.emittedAt).getTime()
      return tDiff !== 0 ? tDiff : a.sequenceIndex - b.sequenceIndex
    }
  )

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14)-theme(spacing.6)*2)] flex-col">
      {traceLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <MetricStripSkeleton />
          <EventTimelineSkeleton />
        </div>
      ) : (
        <TraceLayout
          session={session}
          events={events}
          alerts={alerts ?? []}
          hasMore={hasNextPage ?? false}
          isFetchingMore={isFetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
        />
      )}
    </div>
  )
}
