import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Mail } from 'lucide-react'
import { useSignup, useResendVerification } from '../../hooks/useAuth'
import { GoogleSignInButton } from './GoogleSignInButton'

export function SignupForm() {
  const signup = useSignup()
  const resend = useResendVerification()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  const errorBody = signup.error as { response?: { status?: number } } | undefined
  const status = errorBody?.response?.status
  const errorMsg =
    status === 409 ? 'An account with this email already exists.' :
    status === 429 ? 'Too many attempts. Please try again later.' :
    signup.isError ? 'Signup failed. Please try again.' : null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    signup.mutate({ name, email, password })
  }

  if (signup.isSuccess) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded border border-zinc-800 bg-zinc-900 p-4">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />
          <div className="text-sm text-zinc-300">
            We sent a verification link to{' '}
            <span className="font-medium text-zinc-100">{email}</span>.
            Click the link to finish creating your account.
          </div>
        </div>

        <button
          onClick={() => resend.mutate({ email })}
          disabled={resend.isPending || resend.isSuccess}
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
        >
          {resend.isPending ? 'Sending…' : resend.isSuccess ? 'Email sent — check your inbox' : 'Resend verification email'}
        </button>

        <p className="text-center text-xs text-zinc-400">
          Wrong email?{' '}
          <button
            onClick={() => signup.reset()}
            className="text-violet-400 hover:text-violet-300"
          >
            Start over
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <GoogleSignInButton label="Sign up with Google" />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-[10px] uppercase tracking-wide text-zinc-500">or</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-300">Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
      </div>

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

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-300">Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {errorMsg && (
        <p className="rounded bg-red-950 px-3 py-2 text-xs text-red-400">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={signup.isPending}
        className="w-full rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {signup.isPending ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-xs text-zinc-400">
        Already have an account?{' '}
        <Link to="/login" className="text-violet-400 hover:text-violet-300">Sign in</Link>
      </p>
      </form>
    </div>
  )
}
