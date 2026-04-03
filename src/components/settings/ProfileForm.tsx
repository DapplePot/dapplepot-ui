import { useState, type FormEvent } from 'react'
import { useUpdateMe } from '../../hooks/useUsers'
import type { UserSummary } from '../../types/auth'

interface ProfileFormProps {
  user: UserSummary
}

export function ProfileForm({ user }: ProfileFormProps) {
  const updateMe = useUpdateMe()

  const [name,        setName]        = useState(user.name)
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [mismatch,    setMismatch]    = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password && password !== confirm) { setMismatch(true); return }
    setMismatch(false)
    updateMe.mutate({
      name:     name !== user.name ? name : undefined,
      password: password || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">Email</label>
        <input
          type="email"
          disabled
          value={user.email}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
        />
      </div>

      <div className="border-t border-slate-200 pt-4">
        <p className="mb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
          Change password (optional)
        </p>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">New password</label>
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
      </div>

      {mismatch && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          Passwords don't match.
        </p>
      )}

      {updateMe.isError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          Update failed. Please try again.
        </p>
      )}

      {updateMe.isSuccess && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Profile updated.
        </p>
      )}

      <button
        type="submit"
        disabled={updateMe.isPending}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {updateMe.isPending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
