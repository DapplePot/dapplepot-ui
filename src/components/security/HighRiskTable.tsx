import { Badge } from '../ui/badge'

interface HighRiskSession {
  sessionId: string
  agentId: string
  riskScore: number
  riskBand: string
  signals: string[]
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

export function HighRiskTable({ sessions, onSelect }: HighRiskTableProps) {
  if (sessions.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No high-risk sessions</p>
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Session</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Agent</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Score</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Band</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Signals</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sessions.map((s) => (
            <tr
              key={s.sessionId}
              onClick={() => onSelect(s.sessionId)}
              className="cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs text-violet-600">
                {s.sessionId.slice(0, 8)}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">{s.agentId}</td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                {s.riskScore.toFixed(1)}
              </td>
              <td className="px-4 py-3">
                <Badge variant={BAND_VARIANT[s.riskBand] ?? 'secondary'}>
                  {s.riskBand}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {s.signals.slice(0, 3).join(', ')}
                {s.signals.length > 3 && ` +${s.signals.length - 3}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
