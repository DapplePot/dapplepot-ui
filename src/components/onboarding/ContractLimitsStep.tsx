import { useState, type FormEvent } from 'react'

export interface ContractLimitsData {
  enterpriseSeatsCap:         string
  enterpriseEventsPerPeriod:  string
}

interface ContractLimitsStepProps {
  initialData: ContractLimitsData
  onBack:      () => void
  onNext:      (data: ContractLimitsData) => void
}

/**
 * Step 3 of the superadmin onboarding wizard for Enterprise tenants only.
 * Captures the two billing-relevant contract numbers — seats included and
 * monthly event quota. Both are required for Enterprise since they
 * override the defaults in planLimits.ts.
 *
 * Non-Enterprise provisions skip this step entirely.
 */
export function ContractLimitsStep({ initialData, onBack, onNext }: ContractLimitsStepProps) {
  const [seatsCap,    setSeatsCap]    = useState(initialData.enterpriseSeatsCap)
  const [eventsQuota, setEventsQuota] = useState(initialData.enterpriseEventsPerPeriod)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onNext({
      enterpriseSeatsCap:        seatsCap,
      enterpriseEventsPerPeriod: eventsQuota,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Seats included <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                required
                value={seatsCap}
                onChange={(e) => setSeatsCap(e.target.value)}
                placeholder="e.g. 25"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
              <span className="shrink-0 text-xs text-slate-500 dark:text-zinc-400">seats</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Max users in this workspace per the signed contract.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Events per month <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                required
                value={eventsQuota}
                onChange={(e) => setEventsQuota(e.target.value)}
                placeholder="e.g. 1000000"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
              <span className="shrink-0 text-xs text-slate-500 dark:text-zinc-400">events / month</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Contracted monthly billed-event quota. Overages billed at the contract rate.
            </p>
          </div>
        </div>
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
