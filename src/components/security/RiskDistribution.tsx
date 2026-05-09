interface RiskBand {
  label: string
  count: number
  color: string
}

interface RiskDistributionProps {
  bands: RiskBand[]
  total: number
}

export function RiskDistribution({ bands, total }: RiskDistributionProps) {
  return (
    <div className="space-y-2">
      {bands.map(({ label, count, color }) => {
        const pct = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">{label}</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {count} <span className="text-slate-400 dark:text-slate-500">({pct.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
