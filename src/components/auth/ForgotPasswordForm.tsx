import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { useForgotPassword } from '../../hooks/useAuth'

export function ForgotPasswordForm() {
  const forgot = useForgotPassword()
  const [email, setEmail] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    forgot.mutate({ email })
  }

  if (forgot.isSuccess) {
    return (
      <div className="rounded bg-emerald-950 px-4 py-3 text-sm text-emerald-400">
        If that email is registered you'll receive a reset link shortly.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-300">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {forgot.isError && (
        <p className="rounded bg-red-950 px-3 py-2 text-xs text-red-400">
          Something went wrong. Please try again.
        </p>
      )}

      <button
        type="submit"
        disabled={forgot.isPending}
        className="w-full rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {forgot.isPending ? 'Sending…' : 'Send reset link'}
      </button>

      <div className="text-center">
        <Link to="/login" className="text-xs text-zinc-400 hover:text-violet-400">
          Back to sign in
        </Link>
      </div>
    </form>
  )
}
