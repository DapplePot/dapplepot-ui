import { useEffect, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { useAllUsers, useDeleteUser, useForceDeleteUser } from '../hooks/useUsers'
import { useAuthStore } from '../stores/auth'
import type { UserMembership, UserWithMemberships } from '../types/auth'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

const ROLE_STYLES: Record<string, string> = {
  superadmin: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  admin:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  editor:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  viewer:     'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300',
}

export function Users() {
  const { data: users, isLoading, isError, error } = useAllUsers()
  const [search, setSearch] = useState('')
  const [toDelete, setToDelete] = useState<UserWithMemberships | null>(null)
  const currentUserId = useAuthStore((s) => s.user?.userId)

  const filtered = (users ?? []).filter((u) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.activeTenantName?.toLowerCase().includes(q) ||
      u.memberships.some((m) => m.tenantName.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Users</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          Every account across all tenants and the workspaces they belong to.
        </p>
      </div>

      <input
        type="search"
        placeholder="Search by name, email, or tenant…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-xs rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-violet-400"
      />

      {isLoading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded bg-slate-100 dark:bg-zinc-800" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load users: {(error as Error)?.message ?? 'Unknown error'}
        </p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Active role</th>
                <th className="px-4 py-3">Active workspace</th>
                <th className="px-4 py-3">Workspaces</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.userId} className="border-b border-slate-100 align-top last:border-0 dark:border-zinc-800">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900 dark:text-zinc-100">{user.name || '—'}</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[user.role] ?? ROLE_STYLES.viewer}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.role === 'superadmin' ? (
                      <span className="text-xs text-slate-400 italic dark:text-zinc-500">Platform-level</span>
                    ) : user.activeTenantName ? (
                      <>
                        <div className="text-sm text-slate-900 dark:text-zinc-100">{user.activeTenantName}</div>
                        <div className="font-mono text-[10px] text-slate-400 dark:text-zinc-500">{user.activeTenantId}</div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic dark:text-zinc-500">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <MembershipList memberships={user.memberships} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {user.status === 'active' ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-zinc-400">
                    {user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : (
                      <span className="text-xs italic">Unverified</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-zinc-400">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.userId === currentUserId ? (
                      <span className="text-[10px] italic text-slate-400 dark:text-zinc-500">You</span>
                    ) : user.role === 'superadmin' ? (
                      <span className="text-[10px] italic text-slate-400 dark:text-zinc-500">Protected</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setToDelete(user)}
                        aria-label={`Delete ${user.email}`}
                        className="inline-flex items-center justify-center rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400 dark:text-zinc-500">
                    {users?.length === 0 ? 'No users yet.' : 'No users match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {toDelete && (
        <DeleteUserDialog user={toDelete} onClose={() => setToDelete(null)} />
      )}
    </div>
  )
}

interface DeleteUserDialogProps {
  user:    UserWithMemberships
  onClose: () => void
}

function DeleteUserDialog({ user, onClose }: DeleteUserDialogProps) {
  const deleteMut      = useDeleteUser()
  const forceDeleteMut = useForceDeleteUser()
  const [confirmEmail, setConfirmEmail] = useState('')
  // Set when the normal delete returned 409 OWNER_REMOVAL_FORBIDDEN — surfaces
  // a "Force delete" escalation path. The user has to re-confirm their typed
  // email to proceed (since the destruction blast radius is bigger).
  const [ownerBlock, setOwnerBlock] = useState(false)

  const isAnyPending = deleteMut.isPending || forceDeleteMut.isPending

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isAnyPending) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, isAnyPending])

  const emailMatches = confirmEmail.trim().toLowerCase() === user.email.toLowerCase()
  const canDelete    = emailMatches && !isAnyPending

  // ky wraps HTTP errors in HTTPError where the body lives on `err.response`.
  // The default Error.message just says "Request failed with status code 409 ..."
  // so we must crack open the response body to read our own error.code field.
  async function isOwnerBlockError(err: unknown): Promise<boolean> {
    const response = (err as { response?: Response })?.response
    if (!response) return false
    if (response.status !== 409) return false
    try {
      const body = await response.clone().json() as { error?: { code?: string } }
      return body?.error?.code === 'OWNER_REMOVAL_FORBIDDEN'
    } catch {
      return false
    }
  }

  function handleDelete() {
    if (!canDelete) return
    deleteMut.mutate(user.userId, {
      onSuccess: onClose,
      onError: async (err) => {
        if (await isOwnerBlockError(err)) setOwnerBlock(true)
      },
    })
  }

  function handleForceDelete() {
    if (!canDelete) return
    forceDeleteMut.mutate(user.userId, { onSuccess: onClose })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => { if (!deleteMut.isPending) onClose() }}
    >
      <div
        className="w-full max-w-md rounded border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Delete user</h2>
          <button
            onClick={onClose}
            disabled={deleteMut.isPending}
            aria-label="Close"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            This permanently removes <span className="font-semibold">{user.email}</span>, every
            workspace they belong to (including any personal workspaces they own), refresh tokens,
            password reset records, and outgoing invites. This cannot be undone.
          </div>

          {user.memberships.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-slate-700 dark:text-zinc-300">
                Will be removed from:
              </p>
              <div className="flex flex-wrap gap-1">
                {user.memberships.map((m) => (
                  <span
                    key={m.tenantId}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {m.tenantName}
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">· {m.role}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Type <span className="font-mono text-slate-900 dark:text-zinc-100">{user.email}</span> to confirm
            </label>
            <input
              type="text"
              autoFocus
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              disabled={deleteMut.isPending}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>

          {/* Owner-block escalation panel — appears after the first delete hits 409 */}
          {ownerBlock && (
            <div className="rounded border border-orange-300 bg-orange-50 p-3 text-xs text-orange-900 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-200">
              <p className="font-semibold">This user owns an organisation workspace.</p>
              <p className="mt-1">
                The normal delete won't run while they own an active org. You can either
                cancel and reassign ownership manually, or <strong>force delete</strong>{' '}
                — which permanently destroys this user AND every workspace they own,
                including all member data, sessions, alerts, agents, audit archives,
                and billing periods. This cannot be undone.
              </p>
            </div>
          )}

          {/* Error display — suppress the 409 we're handling above */}
          {(deleteMut.isError && !ownerBlock) && (
            <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {(deleteMut.error as Error)?.message ?? 'Failed to delete user.'}
            </p>
          )}
          {forceDeleteMut.isError && (
            <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {(forceDeleteMut.error as Error)?.message ?? 'Force delete failed.'}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isAnyPending}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            {ownerBlock ? (
              <button
                type="button"
                onClick={handleForceDelete}
                disabled={!canDelete}
                className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {forceDeleteMut.isPending ? 'Force deleting…' : 'Force delete user + workspaces'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canDelete}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleteMut.isPending ? 'Deleting…' : 'Delete user'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MembershipList({ memberships }: { memberships: UserMembership[] }) {
  if (memberships.length === 0) {
    return <span className="text-xs text-slate-400 italic dark:text-zinc-500">None</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {memberships.map((m) => (
        <span
          key={m.tenantId}
          title={`${m.tenantName} · ${m.role}`}
          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <span>{m.tenantName}</span>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500">· {m.role}</span>
        </span>
      ))}
    </div>
  )
}
