import { Badge } from '../ui/badge'

interface SessionRiskPanelProps {
  riskScore:    number
  riskBand:     string
  signalCount:  number
  signalIds:    string[]
  scoredAt:     string
  scorerVersion: string
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
  signalIds,
  scoredAt,
  scorerVersion,
}: SessionRiskPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Score card */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium text-slate-500">Risk score</p>
        <div className="mt-2 flex items-end gap-3">
          <span className="text-5xl font-bold text-slate-900">{riskScore}</span>
          <Badge variant={BAND_VARIANT[riskBand] ?? 'secondary'} className="mb-1">
            {riskBand}
          </Badge>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {signalCount} signal{signalCount !== 1 ? 's' : ''} · scored {new Date(scoredAt).toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-slate-400 font-mono">{scorerVersion}</p>
      </div>

      {/* Signal IDs card */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium text-slate-500 mb-3">Signals triggered</p>
        {signalIds.length === 0 ? (
          <p className="text-sm text-slate-400">No signals</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {signalIds.map((id) => (
              <Badge key={id} variant="secondary" className="font-mono text-xs">
                {id}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
