import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { useCreateAgent } from '../../hooks/useAgents'

interface CreateAgentModalProps {
  onClose: () => void
}

export function CreateAgentModal({ onClose }: CreateAgentModalProps) {
  const create = useCreateAgent()
  const [name,           setName]           = useState('')
  const [latestVersion,  setLatestVersion]  = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    create.mutate(
      {
        name: name.trim(),
        ...(latestVersion.trim() ? { latestVersion: latestVersion.trim() } : {}),
      },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">New agent</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Agent Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. support-bot"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
            <p className="mt-1 text-xs text-slate-500">Must be unique within your tenant.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Latest Version
              <span className="ml-1 font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={latestVersion}
              onChange={(e) => setLatestVersion(e.target.value)}
              placeholder="e.g. 1.0.0"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {create.isError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {(create.error as Error)?.message ?? 'Failed to create agent. Please try again.'}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {create.isPending ? 'Creating…' : 'Create agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
