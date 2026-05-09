import { Badge } from '../ui/badge'
import { useAgents } from '../../hooks/useAgents'

interface HighRiskSession {
  sessionId:      string
  agentId:        string
  llmScore:       number
  llmBand:        string
  asiScore:       number
  asiBand:        string
  owaspSignalIds: string[]
}

interface HighRiskTableProps {
  sessions: HighRiskSession[]
  onSelect: (sessionId: string) => void
}

const BAND_VARIANT: Record<string, 'destructive' | 'warning' | 'info' | 'secondary'> = {
  critical: 'destructive',
  high:     'destructive',
  medium:   'warning',
  low:      'info',
  clean:    'secondary',
}

const SCORE_COLOR: Record<string, string> = {
  critical: 'text-red-600 dark:text-red-400',
  high:     'text-orange-600 dark:text-orange-400',
  medium:   'text-amber-600 dark:text-amber-400',
  low:      'text-slate-500 dark:text-slate-400',
  clean:    'text-emerald-600 dark:text-emerald-400',
}

export function HighRiskTable({ sessions, onSelect }: HighRiskTableProps) {
  const { data: agentsData } = useAgents()
  const agentMap = Object.fromEntries((agentsData ?? []).map((a) => [a.agentId, a.name]))

  if (sessions.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No high-risk sessions</p>
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Session</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Agent</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">LLM score</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">LLM band</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">ASI score</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">ASI band</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Signals</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
          {sessions.map((s) => (
            <tr
              key={s.sessionId}
              onClick={() => onSelect(s.sessionId)}
              className="cursor-pointer hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/50"
            >
              <td className="px-4 py-3 font-mono text-xs text-violet-600 dark:text-violet-400">
                {s.sessionId.slice(0, 8)}…
              </td>
              <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{agentMap[s.agentId] ?? s.agentId}</td>
              <td className={`px-4 py-3 text-right text-sm font-semibold ${SCORE_COLOR[s.llmBand] ?? 'text-slate-900'}`}>
                {s.llmScore.toFixed(1)}
              </td>
              <td className="px-4 py-3">
                <Badge variant={BAND_VARIANT[s.llmBand] ?? 'secondary'}>{s.llmBand}</Badge>
              </td>
              <td className={`px-4 py-3 text-right text-sm font-semibold ${SCORE_COLOR[s.asiBand] ?? 'text-slate-900'}`}>
                {s.asiScore.toFixed(1)}
              </td>
              <td className="px-4 py-3">
                <Badge variant={BAND_VARIANT[s.asiBand] ?? 'secondary'}>{s.asiBand}</Badge>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                {s.owaspSignalIds.slice(0, 3).join(', ')}
                {s.owaspSignalIds.length > 3 && ` +${s.owaspSignalIds.length - 3}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
