import { useState, type FormEvent } from 'react'
import { useSearch } from '@tanstack/react-router'
import { useResetPassword } from '../../hooks/useAuth'

export function ResetPasswordForm() {
  const reset = useResetPassword()
  const { token } = useSearch({ from: '/reset-password' })

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [mismatch,  setMismatch]  = useState(false)

  if (!token) {
    return (
      <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-400">
        Invalid or missing reset link. Please request a new one.
      </p>
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setMismatch(true); return }
    setMismatch(false)
    reset.mutate({ token: token!, password })
  }

  if (reset.isSuccess) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-emerald-950 px-4 py-3 text-sm text-emerald-400">
          Password updated. You can now sign in with your new password.
        </div>
        <a
          href="/login"
          className="block w-full rounded-lg bg-violet-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-violet-500"
        >
          Sign in
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-300">New password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-300">Confirm password</label>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {mismatch && (
        <p className="rounded-lg bg-red-950 px-3 py-2 text-xs text-red-400">
          Passwords don't match.
        </p>
      )}

      {reset.isError && (
        <p className="rounded-lg bg-red-950 px-3 py-2 text-xs text-red-400">
          Reset link is invalid or expired.
        </p>
      )}

      <button
        type="submit"
        disabled={reset.isPending}
        className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {reset.isPending ? 'Updating…' : 'Set new password'}
      </button>
    </form>
  )
}
