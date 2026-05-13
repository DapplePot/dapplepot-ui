import { useState, type FormEvent } from 'react'

export interface AdminAccountData {
  name:     string
  email:    string
  password: string
}

interface AdminAccountStepProps {
  onBack:    () => void
  onSubmit:  (data: AdminAccountData) => void
  isPending: boolean
  error:     string | null
}

export function AdminAccountStep({ onBack, onSubmit, isPending, error }: AdminAccountStepProps) {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [mismatch, setMismatch] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    onSubmit({ name: name.trim(), email: email.trim(), password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
          Admin Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
          Admin Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@client.com"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setMismatch(false) }}
          placeholder="Min. 8 characters"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setMismatch(false) }}
          placeholder="Re-enter password"
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 ${
            mismatch
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-600'
              : 'border-slate-300 focus:border-violet-500 focus:ring-violet-500 dark:border-zinc-700'
          }`}
        />
        {mismatch && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">Passwords do not match.</p>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {isPending ? 'Creating…' : 'Create Client'}
        </button>
      </div>
    </form>
  )
}
