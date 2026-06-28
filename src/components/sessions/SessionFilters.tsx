import { useEffect, useMemo, useRef } from 'react'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { useSessionFilters } from '../../stores/sessionFilters'
import { SIGNAL_REGISTRY } from '../../data/signalRegistry'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'stub', label: 'Stub' },
  { value: 'open', label: 'Open' },
  { value: 'finalised', label: 'Finalised' },
  { value: 'terminated', label: 'Terminated' },
]

const ENV_OPTIONS = [
  { value: '', label: 'All environments' },
  { value: 'production', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'dev', label: 'Dev' },
]

const DATE_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7d' },
  { value: '30d', label: 'Last 30d' },
]

interface AgentOption {
  value: string
  label: string
}

interface SessionFiltersProps {
  agents: AgentOption[]
  onFiltersChange: () => void
}

export function SessionFilters({ agents, onFiltersChange }: SessionFiltersProps) {
  const {
    status, agentId, environment, dateRange, searchQuery,
    hasAlerts, signalId, subCheckId,
    setStatus, setAgentId, setEnvironment, setDateRange, setSearchQuery,
    setHasAlerts, setSignalId, setSubCheckId,
    clearFilters, hasActiveFilters,
  } = useSessionFilters()

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onFiltersChange(), 300)
  }
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const agentOptions = [
    { value: '', label: 'All agents' },
    ...agents,
  ]

  // Signal + sub-check options come from the canonical UI registry
  // (see src/data/signalRegistry.ts, which mirrors the security service seed).
  // We skip anything flagged `excluded` so users don't see disabled checks.
  const signalOptions = useMemo(() => {
    const opts = SIGNAL_REGISTRY
      .filter((sig) => sig.subChecks.some((sc) => !sc.excluded))
      .map((sig) => ({ value: sig.owaspSignalId, label: `${sig.owaspSignalId} — ${sig.name}` }))
    return [{ value: '', label: 'All signals' }, ...opts]
  }, [])

  const subCheckOptions = useMemo(() => {
    const rows = SIGNAL_REGISTRY.flatMap((sig) =>
      sig.subChecks
        .filter((sc) => !sc.excluded && (!signalId || sig.owaspSignalId === signalId))
        .map((sc) => ({ subCheckId: sc.subCheckId, label: sc.label })),
    )
    const opts = rows.map((r) => ({
      value: r.subCheckId,
      label: `${r.subCheckId} — ${r.label}`,
    }))
    return [{ value: '', label: 'All sub-checks' }, ...opts]
  }, [signalId])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search session ID or user…"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-56"
      />

      <Select
        value={status}
        onChange={(e) => { setStatus(e.target.value as typeof status); onFiltersChange() }}
        className="w-40"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>

      <Select
        value={agentId}
        onChange={(e) => { setAgentId(e.target.value); onFiltersChange() }}
        className="w-40"
      >
        {agentOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>

      <Select
        value={environment}
        onChange={(e) => { setEnvironment(e.target.value); onFiltersChange() }}
        className="w-40"
      >
        {ENV_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>

      <Select
        value={dateRange}
        onChange={(e) => { setDateRange(e.target.value as typeof dateRange); onFiltersChange() }}
        className="w-36"
      >
        {DATE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>

      <label className="flex h-9 items-center gap-1.5 rounded border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
        <input
          type="checkbox"
          checked={hasAlerts}
          onChange={(e) => { setHasAlerts(e.target.checked); onFiltersChange() }}
          className="h-3.5 w-3.5"
        />
        Has alerts
      </label>

      <Select
        value={signalId}
        onChange={(e) => {
          const next = e.target.value
          setSignalId(next)
          // Clear sub-check if it no longer belongs to the selected signal
          if (next && subCheckId) {
            const stillValid = SIGNAL_REGISTRY.some(
              (sig) => sig.owaspSignalId === next
                    && sig.subChecks.some((sc) => sc.subCheckId === subCheckId && !sc.excluded),
            )
            if (!stillValid) setSubCheckId('')
          }
          onFiltersChange()
        }}
        className="w-40"
      >
        {signalOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>

      <Select
        value={subCheckId}
        onChange={(e) => { setSubCheckId(e.target.value); onFiltersChange() }}
        className="w-56"
      >
        {subCheckOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>

      {hasActiveFilters() && (
        <button
          onClick={() => { clearFilters(); onFiltersChange() }}
          className="text-sm text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Clear filters ×
        </button>
      )}
    </div>
  )
}
