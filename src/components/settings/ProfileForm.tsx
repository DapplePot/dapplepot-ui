import { useState, type FormEvent } from 'react'
import { useUpdateMe } from '../../hooks/useUsers'
import type { UserSummary } from '../../types/auth'

interface ProfileFormProps {
  user: UserSummary
}

export function ProfileForm({ user }: ProfileFormProps) {
  const updateMe = useUpdateMe()

  const [name, setName] = useState(user.name)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    updateMe.mutate({
      name: name !== user.name ? name : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-violet-400"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Email</label>
        <input
          type="email"
          disabled
          value={user.email}
          className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        />
      </div>

      {updateMe.isError && (
        <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
          Update failed. Please try again.
        </p>
      )}

      {updateMe.isSuccess && (
        <p className="rounded bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          Profile updated.
        </p>
      )}

      <button
        type="submit"
        disabled={updateMe.isPending}
        className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {updateMe.isPending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
