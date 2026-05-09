import { cn } from '../../utils/cn'

type Window = '24h' | '7d' | '30d'

interface DateRangePickerProps {
  window: Window
  agentId: string
  agents: string[]
  onWindowChange: (w: Window) => void
  onAgentChange: (agentId: string) => void
}

const WINDOWS: { value: Window; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d',  label: '7d' },
  { value: '30d', label: '30d' },
]

export function DateRangePicker({
  window,
  agentId,
  agents,
  onWindowChange,
  onAgentChange,
}: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Segmented control */}
      <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
        {WINDOWS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onWindowChange(value)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              window === value
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Agent filter */}
      <select
        value={agentId}
        onChange={(e) => onAgentChange(e.target.value)}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      >
        <option value="">All agents</option>
        {agents.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  )
}
