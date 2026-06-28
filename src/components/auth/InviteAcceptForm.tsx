import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { useAcceptInvite } from '../../hooks/useAuth'
import { getInviteInfo } from '../../api/auth'
import { GoogleSignInButton } from './GoogleSignInButton'

export function InviteAcceptForm() {
  const accept = useAcceptInvite()
  const { token } = useSearch({ from: '/accept-invite' })

  const info = useQuery({
    queryKey: ['invite-info', token],
    queryFn:  () => getInviteInfo(token!),
    enabled:  !!token,
    retry:    false,
  })

  const [name,     setName]     = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [mismatch, setMismatch] = useState(false)

  if (!token) {
    return (
      <p className="rounded bg-red-950 px-3 py-2 text-sm text-red-400">
        Invalid or missing invite link. Please ask your admin to resend the invite.
      </p>
    )
  }

  if (info.isLoading) {
    return <p className="text-sm text-zinc-400">Loading invite…</p>
  }

  if (info.isError || !info.data) {
    return (
      <p className="rounded bg-red-950 px-3 py-2 text-sm text-red-400">
        This invite is invalid or expired. Ask your admin to send a new one.
      </p>
    )
  }

  const { email, role, tenantName, accountExists } = info.data

  const InviteSummary = (
    <div className="flex items-start gap-3 rounded border border-zinc-700 bg-zinc-800/50 p-3">
      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
      <div className="min-w-0 text-xs">
        <p className="text-zinc-300">
          You've been invited to join{' '}
          <span className="font-medium text-white">{tenantName ?? 'this workspace'}</span>{' '}
          as <span className="font-medium text-white">{role}</span>.
        </p>
        <p className="mt-1 text-zinc-400">Invited: <span className="font-mono">{email}</span></p>
      </div>
    </div>
  )

  // Case 1: invitee already has a DapplePot account. No name/password needed —
  // a single confirm click adds the membership and signs them in.
  if (accountExists) {
    return (
      <div className="space-y-4">
        {InviteSummary}
        <p className="text-xs text-zinc-400">
          You already have a DapplePot account with this email. Click below to add
          this workspace to your account.
        </p>
        {accept.isError && (
          <p className="rounded bg-red-950 px-3 py-2 text-xs text-red-400">
            Couldn't accept invite. It may be invalid or already used.
          </p>
        )}
        <button
          onClick={() => accept.mutate({ token: token! })}
          disabled={accept.isPending}
          className="w-full rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {accept.isPending ? 'Joining…' : `Join ${tenantName ?? 'workspace'}`}
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-[10px] uppercase tracking-wide text-zinc-500">or</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <GoogleSignInButton inviteToken={token!} label="Continue with Google" />
      </div>
    )
  }

  // Case 2: brand-new account — collect name + password.
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setMismatch(true); return }
    setMismatch(false)
    accept.mutate({ token: token!, name, password })
  }

  return (
    <div className="space-y-4">
      {InviteSummary}

      <GoogleSignInButton inviteToken={token!} label="Sign up with Google" />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-[10px] uppercase tracking-wide text-zinc-500">or</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-300">Full name</label>
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
        <label className="mb-1 block text-xs font-medium text-zinc-300">Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-300">Confirm password</label>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {mismatch && (
        <p className="rounded bg-red-950 px-3 py-2 text-xs text-red-400">
          Passwords don't match.
        </p>
      )}

      {accept.isError && (
        <p className="rounded bg-red-950 px-3 py-2 text-xs text-red-400">
          Invite link is invalid or expired.
        </p>
      )}

      <button
        type="submit"
        disabled={accept.isPending}
        className="w-full rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {accept.isPending ? 'Setting up…' : 'Accept invite'}
      </button>
      </form>
    </div>
  )
}
