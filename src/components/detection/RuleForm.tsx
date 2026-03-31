import { useState } from 'react'
import type { RulePreview, RuleType } from '@dapplepot/types/rule'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { Button } from '../ui/button'
import { DryRunPreview } from './DryRunPreview'
import { useCreateRule } from '../../hooks/useRules'

const RULE_TYPES: { value: RuleType; label: string }[] = [
  { value: 'threshold',       label: 'Threshold' },
  { value: 'content_match',   label: 'Content match' },
  { value: 'schema_violation',label: 'Schema violation' },
  { value: 'state_transition',label: 'State transition' },
  { value: 'rate',            label: 'Rate' },
  { value: 'cumulative_cost', label: 'Cumulative cost' },
  { value: 'sequence',        label: 'Sequence' },
  { value: 'session_duration',label: 'Session duration' },
]

const SEVERITY_OPTIONS = ['info', 'warning', 'medium', 'critical'] as const

interface RuleFormProps {
  onClose: () => void
}

export function RuleForm({ onClose }: RuleFormProps) {
  const [name, setName] = useState('')
  const [ruleType, setRuleType] = useState<RuleType>('threshold')
  const [severity, setSeverity] = useState<typeof SEVERITY_OPTIONS[number]>('warning')
  const [threshold, setThreshold] = useState('')

  const createRule = useCreateRule()
  const [preview, setPreview] = useState<RulePreview['preview'] | null>(null)

  const handleSave = () => {
    createRule.mutate(
      {
        name,
        ruleType,
        evalType: 'stateless',
        enabled: true,
        config: { threshold: Number(threshold) },
        dedupWindowS: 300,
        // @ts-expect-error severity is part of config, not top-level in PolicyRule
        severity,
      },
      {
        onSuccess: (result) => {
          setPreview(result.preview)
        },
      }
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">New rule</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rule name"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Rule type</label>
          <Select
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value as RuleType)}
          >
            {RULE_TYPES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Severity</label>
          <Select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as typeof severity)}
          >
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>

        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">Threshold</label>
          <Input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="e.g. 1000"
          />
        </div>
      </div>

      {preview && (
        <div className="mt-4">
          <DryRunPreview preview={preview} />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!name || createRule.isPending}
        >
          {createRule.isPending ? 'Saving…' : preview ? 'Saved ✓' : 'Save rule'}
        </Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}
