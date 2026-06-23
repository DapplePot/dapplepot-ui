import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { useLogin } from '../../hooks/useAuth'

export function LoginForm() {
  const login = useLogin()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    login.mutate({ email, password })
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

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-300">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
      </div>

      <div className="flex justify-end">
        <Link
          to="/forgot-password"
          className="text-xs text-zinc-400 hover:text-violet-400"
        >
          Forgot password?
        </Link>
      </div>

      {login.isError && (
        <p className="rounded bg-red-950 px-3 py-2 text-xs text-red-400">
          Invalid credentials — check your email and password.
        </p>
      )}

      <button
        type="submit"
        disabled={login.isPending}
        className="w-full rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-center text-xs text-zinc-400">
        Don't have an account?{' '}
        <Link to="/signup" className="text-violet-400 hover:text-violet-300">Sign up</Link>
      </p>
    </form>
  )
}
