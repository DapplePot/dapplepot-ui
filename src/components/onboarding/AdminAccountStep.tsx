import { useEffect, useState, type FormEvent } from 'react'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { lookupUserByEmail, type UserLookupResult } from '../../api/tenants'

export interface AdminAccountData {
  name:     string
  email:    string
  password: string
}

interface AdminAccountStepProps {
  /** Used to detect Internal-Individual + already-has-personal-tenant conflict. */
  provision: 'internal_individual' | 'internal_organization' | 'enterprise_organization'
  onBack:    () => void
  onSubmit:  (data: AdminAccountData) => void
  isPending: boolean
  error:     string | null
}

export function AdminAccountStep({ provision, onBack, onSubmit, isPending, error }: AdminAccountStepProps) {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [mismatch, setMismatch] = useState(false)

  // ── Lookup state: debounced check for existing DapplePot user. ─────────
  const [lookup, setLookup]   = useState<UserLookupResult | null>(null)
  const [looking, setLooking] = useState(false)

  useEffect(() => {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setLookup(null)
      return
    }
    setLooking(true)
    const t = setTimeout(async () => {
      try {
        const r = await lookupUserByEmail(trimmed)
        setLookup(r)
      } catch {
        setLookup(null)
      } finally {
        setLooking(false)
      }
    }, 350)
    return () => { clearTimeout(t); setLooking(false) }
  }, [email])

  const isExistingUser   = lookup?.exists === true
  const isExistingSuperadmin = isExistingUser && lookup?.role === 'superadmin'
  const isExistingDisabled   = isExistingUser && lookup?.status === 'disabled'
  // Internal-Individual + existing user with an existing personal workspace:
  // not a conflict any more — backend will upgrade their existing workspace
  // to plan_tier='internal'. We just surface a notice so the superadmin knows.
  const willUpgradeExistingPersonal =
    provision === 'internal_individual' && isExistingUser && lookup?.hasPersonalTenant === true

  const blocked = isExistingSuperadmin || isExistingDisabled

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (isExistingUser) {
      // No name/password needed — backend will reuse the existing user.
      onSubmit({ name: '', email: email.trim(), password: '' })
      return
    }
    if (password !== confirm) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    onSubmit({ name: name.trim(), email: email.trim(), password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email always first now, so the lookup result can drive the rest of the form */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
          Admin Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@client.com"
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          {looking && (
            <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-slate-400" />
          )}
        </div>
      </div>

      {/* Existing-user confirmation card */}
      {isExistingUser && !blocked && (
        <div className="rounded border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                Found existing DapplePot user
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
                <strong>{lookup?.name || lookup?.email}</strong> — {lookup?.email}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                {willUpgradeExistingPersonal
                  ? <>Their existing personal workspace will be upgraded to <strong>Internal</strong> — no new workspace is created and they keep their data, password, and SDK key. Any active paid subscription on that workspace will be cancelled.</>
                  : <>This new workspace will be added to their existing account. They keep their current password and can switch between workspaces from the sidebar.</>}
              </p>
            </div>
          </div>
        </div>
      )}

      {isExistingSuperadmin && (
        <div className="rounded border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-xs text-red-700 dark:text-red-300">
              This email belongs to a superadmin. Superadmins manage workspaces from the admin
              portal and can't be added as tenant members.
            </p>
          </div>
        </div>
      )}

      {isExistingDisabled && (
        <div className="rounded border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-xs text-red-700 dark:text-red-300">
              This user account is disabled. Reactivate it before linking to a new workspace.
            </p>
          </div>
        </div>
      )}

      {/* New-user-only fields */}
      {!isExistingUser && (
        <>
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
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
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
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
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
              className={`w-full rounded border bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 ${
                mismatch
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-600'
                  : 'border-slate-300 focus:border-violet-500 focus:ring-violet-500 dark:border-zinc-700'
              }`}
            />
            {mismatch && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">Passwords do not match.</p>
            )}
          </div>
        </>
      )}

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isPending || blocked}
          className="rounded bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {isPending
            ? 'Creating…'
            : willUpgradeExistingPersonal
              ? 'Upgrade existing workspace'
              : isExistingUser
                ? 'Add to new workspace'
                : 'Create Client'}
        </button>
      </div>
    </form>
  )
}
