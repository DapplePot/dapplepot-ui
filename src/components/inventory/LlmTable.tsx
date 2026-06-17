import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { useLlmModels, useCreateLlmModel } from '../../hooks/useLlmModels'
import { useMe } from '../../hooks/useUsers'

const PROVIDERS = ['OpenAI', 'Anthropic', 'Google', 'Meta', 'Mistral', 'Cohere', 'Custom']

function formatCost(val: number | null): string {
  if (val == null) return '—'
  return `$${val.toFixed(4)}`
}

function formatCtx(val: number | null): string {
  if (val == null) return '—'
  return val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val)
}

function CreateLlmModal({ onClose }: { onClose: () => void }) {
  const create = useCreateLlmModel()
  const [name,    setName]    = useState('')
  const [provider, setProvider] = useState('')
  const [ctx,     setCtx]     = useState('')
  const [inCost,  setInCost]  = useState('')
  const [outCost, setOutCost] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    create.mutate(
      {
        name:                name.trim(),
        provider:            provider || null,
        contextWindowTokens: ctx     ? parseInt(ctx,     10) : null,
        inputCostPer1k:      inCost  ? parseFloat(inCost)    : null,
        outputCostPer1k:     outCost ? parseFloat(outCost)   : null,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Add LLM</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Model name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. gpt-4o"
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Use the exact model identifier your agents send.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Provider</label>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Select provider</option>
              {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Context window (tokens)</label>
            <input
              type="number"
              min={1}
              value={ctx}
              onChange={e => setCtx(e.target.value)}
              placeholder="e.g. 128000"
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Input cost / 1k tokens ($)</label>
              <input
                type="number"
                min={0}
                step="0.000001"
                value={inCost}
                onChange={e => setInCost(e.target.value)}
                placeholder="e.g. 0.005"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Output cost / 1k tokens ($)</label>
              <input
                type="number"
                min={0}
                step="0.000001"
                value={outCost}
                onChange={e => setOutCost(e.target.value)}
                placeholder="e.g. 0.015"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>
          </div>

          {create.isError && (
            <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {(create.error as Error)?.message ?? 'Failed to add model.'}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <button type="submit" disabled={create.isPending} className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">
              {create.isPending ? 'Adding…' : 'Add model'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function LlmTable() {
  const { data: models, isLoading, isError } = useLlmModels()
  const { data: me } = useMe()
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = (models ?? []).filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.provider ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          type="search"
          placeholder="Search models…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-xs rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-violet-400"
        />
        {me?.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex shrink-0 items-center gap-1.5 rounded bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" />
            Add LLM
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-500 dark:text-zinc-400">Loading…</p>}
      {isError   && <p className="text-sm text-red-600 dark:text-red-400">Failed to load models.</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Context window</th>
                <th className="px-4 py-3">Input / 1k</th>
                <th className="px-4 py-3">Output / 1k</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.modelId} className="border-b border-slate-100 last:border-0 dark:border-zinc-800">
                  <td className="px-4 py-3 font-mono text-sm font-medium text-slate-900 dark:text-zinc-100">{m.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-zinc-400">{m.provider ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-zinc-400">{formatCtx(m.contextWindowTokens)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-zinc-400">{formatCost(m.inputCostPer1k)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-zinc-400">{formatCost(m.outputCostPer1k)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400 dark:text-zinc-500">
                    {models?.length === 0
                      ? 'No LLMs added yet. Add your first model to enable cost and context window checks.'
                      : 'No models match your search.'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <CreateLlmModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
