import { useState, type FormEvent } from 'react'

export interface TenantInfoData {
  name:        string
  tokenBudget: string   // kept as string for input; converted on submit
  rateLimit:   string
}

interface TenantInfoStepProps {
  initialData: TenantInfoData
  onNext:      (data: TenantInfoData) => void
}

export function TenantInfoStep({ initialData, onNext }: TenantInfoStepProps) {
  const [name,        setName]        = useState(initialData.name)
  const [tokenBudget, setTokenBudget] = useState(initialData.tokenBudget)
  const [rateLimit,   setRateLimit]   = useState(initialData.rateLimit)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onNext({ name: name.trim(), tokenBudget, rateLimit })
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

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
          Token Budget
          <span className="ml-1 font-normal text-slate-400 dark:text-zinc-500">(optional)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={tokenBudget}
            onChange={(e) => setTokenBudget(e.target.value)}
            placeholder="Unlimited"
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <span className="shrink-0 text-xs text-slate-500 dark:text-zinc-400">tokens</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Maximum LLM tokens this tenant may consume. Leave blank for no limit.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
          Rate Limit
          <span className="ml-1 font-normal text-slate-400 dark:text-zinc-500">(optional)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={rateLimit}
            onChange={(e) => setRateLimit(e.target.value)}
            placeholder="Unlimited"
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <span className="shrink-0 text-xs text-slate-500 dark:text-zinc-400">req / min</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Max API requests per minute for this tenant. Leave blank for no limit.
        </p>
      </div>

      <div className="flex justify-end pt-2">
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
