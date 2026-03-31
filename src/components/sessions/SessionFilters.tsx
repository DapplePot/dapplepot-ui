import { useEffect, useRef } from 'react'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { useSessionFilters } from '../../stores/sessionFilters'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'stub', label: 'Stub' },
  { value: 'open', label: 'Open' },
  { value: 'finalised', label: 'Finalised' },
  { value: 'interrupted', label: 'Interrupted' },
  { value: 'killed', label: 'Killed' },
  { value: 'error', label: 'Error' },
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

interface SessionFiltersProps {
  agents: string[]
  onFiltersChange: () => void
}

export function SessionFilters({ agents, onFiltersChange }: SessionFiltersProps) {
  const {
    status, agentId, environment, dateRange, searchQuery,
    setStatus, setAgentId, setEnvironment, setDateRange, setSearchQuery,
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
    ...agents.map((a) => ({ value: a, label: a })),
  ]

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

      {hasActiveFilters() && (
        <button
          onClick={() => { clearFilters(); onFiltersChange() }}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          Clear filters ×
        </button>
      )}
    </div>
  )
}
