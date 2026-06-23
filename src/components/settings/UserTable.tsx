import { useUsers, useChangeRole, useChangeStatus } from '../../hooks/useUsers'
import { RoleBadge } from './RoleBadge'
import type { UserRole, UserStatus, UserSummary } from '../../types/auth'

function StatusBadge({ status }: { status: UserStatus }) {
  const styles: Record<UserStatus, string> = {
    active:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    disabled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
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
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="px-4">
              {filtered.map((u) => (
                <tr key={u.userId} className="border-b border-slate-100 last:border-0 dark:border-zinc-800">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900 dark:text-zinc-100">{u.name}</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UserRowActions user={u} isLastAdmin={u.role === 'admin' && adminCount === 1} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400 dark:text-zinc-500">
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
  const changeStatus = useChangeStatus(user.userId)

  return (
    <div className="flex items-center justify-end gap-2">
      <select
        value={user.role}
        disabled={changeRole.isPending || isLastAdmin}
        title={isLastAdmin ? 'Promote another user to admin before changing this role.' : undefined}
        onChange={(e) => changeRole.mutate({ role: e.target.value as UserRole })}
        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-violet-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      >
        <option value="viewer">Viewer</option>
        <option value="editor">Editor</option>
        <option value="admin">Admin</option>
      </select>

      {user.status === 'active' ? (
        <button
          disabled={changeStatus.isPending}
          onClick={() => changeStatus.mutate({ status: 'disabled' })}
          className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Disable
        </button>
      ) : user.status === 'disabled' ? (
        <button
          disabled={changeStatus.isPending}
          onClick={() => changeStatus.mutate({ status: 'active' })}
          className="rounded px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
        >
          Reactivate
        </button>
      ) : null}
    </div>
  )
}
