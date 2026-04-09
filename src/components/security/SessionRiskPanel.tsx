import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '../ui/badge'
import type { OwSignalStatus } from '../../types/security'

interface SessionRiskPanelProps {
  llmScore:         number
  llmBand:          string
  asiScore:         number
  asiBand:          string
  llmSignalStatus:  Record<string, OwSignalStatus>
  asiSignalStatus:  Record<string, OwSignalStatus>
  scoredAt:         string
  scorerVersion:    string
}

const BAND_VARIANT: Record<string, 'destructive' | 'warning' | 'info' | 'secondary'> = {
  critical: 'destructive',
  high:     'destructive',
  medium:   'warning',
  low:      'info',
  clean:    'secondary',
}

const LLM_SIGNAL_ORDER   = ['OW-LLM01','OW-LLM02','OW-LLM03','OW-LLM04','OW-LLM05','OW-LLM06','OW-LLM07','OW-LLM08','OW-LLM09','OW-LLM10']
const AGENT_SIGNAL_ORDER = ['OW-ASI01','OW-ASI02','OW-ASI03','OW-ASI04','OW-ASI05','OW-ASI06','OW-ASI07','OW-ASI08','OW-ASI09','OW-ASI10']

// Fired signal row — expandable sub-checks
function FiredSignalRow({ signalId, s }: { signalId: string; s: OwSignalStatus }) {
  const [expanded, setExpanded] = useState(false)
  const subChecks = Object.entries(s.sub_checks ?? {})
  const firedSubs = subChecks.filter(([, sc]) => sc.status === 'fired')
  const primaryLabel = firedSubs[0]?.[1].label ?? signalId

  return (
    <div className="rounded-md border border-red-200 bg-red-50">
      <div
        className={`flex items-center gap-2 px-3 py-2 ${subChecks.length > 0 ? 'cursor-pointer' : ''}`}
        onClick={() => subChecks.length > 0 && setExpanded(e => !e)}
      >
        <Badge variant="outline" className="font-mono text-xs shrink-0">{signalId}</Badge>
        <span className="text-xs text-slate-700 flex-1 min-w-0 truncate">{primaryLabel}</span>
        <span className="font-mono text-xs font-semibold text-red-700 shrink-0">{s.score}</span>
        <Badge variant="destructive" className="text-xs shrink-0">fired</Badge>
        {subChecks.length > 0 && (
          expanded
            ? <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
            : <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
        )}
      </div>

      {expanded && (
        <div className="border-t border-red-100 px-3 pb-2 space-y-1">
          {subChecks.map(([id, sc]) => (
            <div key={id} className="ml-2 pl-2 border-l border-red-200 py-1">
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sc.status === 'fired' ? 'bg-red-500' : 'bg-green-400'}`} />
                <span className="font-mono text-xs text-slate-500 shrink-0">{id}</span>
                <span className="text-xs text-slate-700 flex-1">{sc.label}</span>
                <span className="font-mono text-xs text-slate-400 shrink-0">{sc.score}</span>
              </div>
              {sc.detail && (
                <p className="mt-0.5 text-xs text-slate-400 pl-4">{sc.detail}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Section showing all 10 signals — fired ones prominent, clean ones collapsed
function OwSignalStatusSection({
  title,
  order,
  statusMap,
}: {
  title: string
  order: string[]
  statusMap: Record<string, OwSignalStatus>
}) {
  const [cleanExpanded, setCleanExpanded] = useState(false)

  const fired = order.filter(id => statusMap[id]?.status === 'fired')
  const clean = order.filter(id => !statusMap[id] || statusMap[id].status === 'clean')

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <div className="flex gap-2 text-xs">
          {fired.length > 0 && <span className="text-red-600 font-medium">{fired.length} fired</span>}
          <span className="text-green-700 font-medium">{clean.length} clean</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {/* Fired signals — always visible */}
        {fired.map(id => (
          <FiredSignalRow key={id} signalId={id} s={statusMap[id]} />
        ))}

        {fired.length === 0 && (
          <p className="text-xs text-green-700 font-medium py-1">All signals clean ✓</p>
        )}

        {/* Clean signals — collapsed */}
        {clean.length > 0 && (
          <div>
            <button
              onClick={() => setCleanExpanded(e => !e)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mt-1"
            >
              {cleanExpanded
                ? <ChevronDown className="h-3 w-3" />
                : <ChevronRight className="h-3 w-3" />}
              {cleanExpanded ? 'Hide' : 'Show'} {clean.length} passed signals
            </button>

            {cleanExpanded && (
              <div className="mt-1.5 space-y-1">
                {clean.map(id => {
                  const s = statusMap[id]
                  return (
                    <div key={id} className="flex items-center gap-2 rounded-md border border-green-100 bg-green-50 px-3 py-1.5">
                      <Badge variant="outline" className="font-mono text-xs shrink-0">{id}</Badge>
                      <span className="text-xs text-slate-400 flex-1">{id}</span>
                      <span className="font-mono text-xs text-slate-400 shrink-0">{s?.score ?? 0}</span>
                      <span className="text-xs font-medium text-green-700 shrink-0">✓ clean</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function SessionRiskPanel({
  llmScore,
  llmBand,
  asiScore,
  asiBand,
  llmSignalStatus,
  asiSignalStatus,
  scoredAt,
  scorerVersion,
}: SessionRiskPanelProps) {
  return (
    <div className="space-y-4">
      {/* Score summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">LLM risk score</p>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-5xl font-bold text-slate-900">{llmScore}</span>
            <Badge variant={BAND_VARIANT[llmBand] ?? 'secondary'} className="mb-1">
              {llmBand}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            scored {new Date(scoredAt).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400 font-mono">{scorerVersion}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Agent risk score (ASI)</p>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-5xl font-bold text-slate-900">{asiScore}</span>
            <Badge variant={BAND_VARIANT[asiBand] ?? 'secondary'} className="mb-1">
              {asiBand}
            </Badge>
          </div>
        </div>
      </div>

      <OwSignalStatusSection
        title="LLM signals (OWASP LLM Top 10)"
        order={LLM_SIGNAL_ORDER}
        statusMap={llmSignalStatus}
      />
      <OwSignalStatusSection
        title="Agent signals (OWASP Agentic AI Top 10)"
        order={AGENT_SIGNAL_ORDER}
        statusMap={asiSignalStatus}
      />
    </div>
  )
}
