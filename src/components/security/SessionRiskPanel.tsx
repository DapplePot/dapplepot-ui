import { Badge } from '../ui/badge'

interface ScoreBreakdown {
  signal: string
  points: number
}

interface SessionRiskPanelProps {
  sessionId: string
  agentId: string
  riskScore: number
  riskBand: string
  signalCount: number
  scoredAfterMs: number
  breakdown: ScoreBreakdown[]
  owaspCategories: string[]
}

const BAND_VARIANT: Record<string, 'destructive' | 'warning' | 'info' | 'secondary'> = {
  critical: 'destructive',
  high:     'destructive',
  medium:   'warning',
  low:      'info',
  clean:    'secondary',
}

export function SessionRiskPanel({
  riskScore,
  riskBand,
  signalCount,
  scoredAfterMs,
  breakdown,
  owaspCategories,
}: SessionRiskPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Score card */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium text-slate-500">Risk score</p>
        <div className="mt-2 flex items-end gap-3">
          <span className="text-5xl font-bold text-slate-900">{riskScore.toFixed(1)}</span>
          <Badge variant={BAND_VARIANT[riskBand] ?? 'secondary'} className="mb-1">
            {riskBand}
          </Badge>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {signalCount} signal{signalCount !== 1 ? 's' : ''} · scored {(scoredAfterMs / 1000).toFixed(1)}s after session_end
        </p>

        <div className="mt-4 divide-y divide-slate-50">
          {breakdown.map(({ signal, points }) => (
            <div key={signal} className="flex justify-between py-1.5 text-xs">
              <span className="text-slate-600">{signal}</span>
              <span className="font-medium text-slate-800">+{points}</span>
            </div>
          ))}
        </div>
      </div>

      {/* OWASP exposure card */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium text-slate-500 mb-3">OWASP exposure</p>
        {owaspCategories.length === 0 ? (
          <p className="text-sm text-slate-400">No OWASP categories triggered</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {owaspCategories.map((cat) => (
              <Badge key={cat} variant="destructive" className="font-mono text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
