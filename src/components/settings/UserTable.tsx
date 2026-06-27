import { useEffect, useState } from 'react'
import { useUsers, useChangeRole, useRemoveMember } from '../../hooks/useUsers'
import { RoleBadge } from './RoleBadge'
import type { UserRole, UserSummary } from '../../types/auth'

function OwnerBadge() {
  return (
    <span
      title="Workspace owner — protected from role changes and removal."
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    >
      Owner
    </span>
  )
}



export function UserTable({ search = '' }: { search?: string }) {
  const { data: users, isLoading, isError } = useUsers()

  const filtered = (users ?? []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  // A tenant must always have at least one admin. If this user is the only
  // admin in the workspace, their role is locked until someone else is
  // promoted to admin.
  const adminCount = (users ?? []).filter(u => u.role === 'admin').length

  return (
    <div className="space-y-3">
      {isLoading && (
        <p className="text-sm text-slate-500">Loading users…</p>
      )}

      {isError && (
        <p className="text-sm text-red-600">Failed to load users.</p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="px-4">
              {filtered.map((u) => (
                <tr key={u.userId} className="border-b border-slate-100 last:border-0 dark:border-zinc-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-slate-900 dark:text-zinc-100">{u.name}</div>
                      {u.isOwner && <OwnerBadge />}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UserRowActions
                      user={u}
                      isLastAdmin={u.role === 'admin' && adminCount === 1}
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-400 dark:text-zinc-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function UserRowActions({ user, isLastAdmin }: { user: UserSummary; isLastAdmin: boolean }) {
  const changeRole   = useChangeRole(user.userId)
  const [showRemove, setShowRemove] = useState(false)

  // Owners are protected: role can't be changed and they can't be removed
  // from the workspace. Must transfer ownership first.
  const isOwner       = !!user.isOwner
  const roleLocked    = isOwner || isLastAdmin
  const removeLocked  = isOwner || isLastAdmin
  const roleLockReason = isOwner
    ? 'Workspace owner — transfer ownership before changing this role.'
    : isLastAdmin
      ? 'Promote another user to admin before changing this role.'
      : undefined
  const removeLockReason = isOwner
    ? 'Workspace owner — transfer ownership before removing this user.'
    : isLastAdmin
      ? 'Promote another user to admin before removing this user.'
      : undefined

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <select
          value={user.role}
          disabled={changeRole.isPending || roleLocked}
          title={roleLockReason}
          onChange={(e) => changeRole.mutate({ role: e.target.value as UserRole })}
          className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-violet-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>

        <button
          type="button"
          onClick={() => setShowRemove(true)}
          disabled={removeLocked}
          title={removeLockReason}
          className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Remove
        </button>
      </div>

      {showRemove && (
        <RemoveMemberDialog
          user={user}
          onClose={() => setShowRemove(false)}
        />
      )}
    </>
  )
}

function RemoveMemberDialog({ user, onClose }: { user: UserSummary; onClose: () => void }) {
  const removeMut = useRemoveMember(user.userId)
  const [confirmEmail, setConfirmEmail] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !removeMut.isPending) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, removeMut.isPending])

  const canRemove =
    confirmEmail.trim().toLowerCase() === user.email.toLowerCase() && !removeMut.isPending

  function handleRemove() {
    if (!canRemove) return
    removeMut.mutate(undefined, { onSuccess: onClose })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 text-left"
      onClick={() => { if (!removeMut.isPending) onClose() }}
    >
      <div
        className="w-full max-w-md rounded border border-slate-200 bg-white p-6 text-left shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-zinc-100">
          Remove user from workspace
        </h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-zinc-400">
          <strong>{user.name}</strong> ({user.email}) will lose access to this workspace.
        </p>

        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
          Type <span className="font-mono text-slate-900 dark:text-zinc-100">{user.email}</span> to confirm
        </label>
        <input
          type="text"
          autoFocus
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          disabled={removeMut.isPending}
          className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />

        {removeMut.isError && (
          <p className="mt-3 rounded bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {(removeMut.error as Error)?.message ?? 'Failed to remove user from workspace.'}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2 text-sm">
          <button
            type="button"
            onClick={onClose}
            disabled={removeMut.isPending}
            className="rounded px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={!canRemove}
            className="rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {removeMut.isPending ? 'Removing…' : 'Remove from workspace'}
          </button>
        </div>
      </div>
    </div>
  )
}
