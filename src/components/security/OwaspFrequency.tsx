interface SignalFrequencyEntry {
  signalId: string
  count: number
}

interface OwaspFrequencyProps {
  entries: SignalFrequencyEntry[]
}

export function OwaspFrequency({ entries }: OwaspFrequencyProps) {
  const max = Math.max(...entries.map((e) => e.count), 1)

  return (
    <div className="space-y-2">
      {entries.map(({ signalId, count }) => (
        <div key={signalId}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-600 font-mono">{signalId}</span>
            <span className="font-medium text-slate-800">{count}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-red-400"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {entries.length === 0 && (
        <p className="text-sm text-slate-400">No signals detected</p>
      )}
    </div>
  )
}
