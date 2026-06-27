import { useState, type FormEvent } from 'react'

export interface TenantInfoData {
  name: string
}

interface TenantInfoStepProps {
  initialData: TenantInfoData
  onBack:      () => void
  onNext:      (data: TenantInfoData) => void
}

export function TenantInfoStep({ initialData, onBack, onNext }: TenantInfoStepProps) {
  const [name, setName] = useState(initialData.name)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onNext({ name: name.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
          Tenant Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Acme Corp"
          className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Must be unique across all tenants.</p>
      </div>

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="rounded bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          Next →
        </button>
      </div>
    </form>
  )
}
