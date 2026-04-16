import { useState } from 'react'
import { useUsers, useChangeRole, useChangeStatus } from '../../hooks/useUsers'
import { RoleBadge } from './RoleBadge'
import type { UserRole, UserStatus, UserSummary } from '../../types/auth'

function StatusBadge({ status }: { status: UserStatus }) {
  const styles: Record<UserStatus, string> = {
    active:   'bg-emerald-100 text-emerald-700',
    disabled: 'bg-red-100 text-red-600',
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  )
}


export function UserTable() {
  const { data: users, isLoading, isError } = useUsers()
  const [search, setSearch] = useState('')

  const filtered = (users ?? []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Search users…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
      />

      {isLoading && (
        <p className="text-sm text-slate-500">Loading users…</p>
      )}

      {isError && (
        <p className="text-sm text-red-600">Failed to load users.</p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="px-4">
              {filtered.map((u) => (
                <tr key={u.userId} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UserRowActions user={u} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">
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

function UserRowActions({ user }: { user: UserSummary }) {
  const changeRole   = useChangeRole(user.userId)
  const changeStatus = useChangeStatus(user.userId)

  return (
    <div className="flex items-center justify-end gap-2">
      <select
        value={user.role}
        disabled={changeRole.isPending}
        onChange={(e) => changeRole.mutate({ role: e.target.value as UserRole })}
        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-violet-400"
      >
        <option value="viewer">Viewer</option>
        <option value="editor">Editor</option>
        <option value="admin">Admin</option>
      </select>

      {user.status === 'active' ? (
        <button
          disabled={changeStatus.isPending}
          onClick={() => changeStatus.mutate({ status: 'disabled' })}
          className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Disable
        </button>
      ) : user.status === 'disabled' ? (
        <button
          disabled={changeStatus.isPending}
          onClick={() => changeStatus.mutate({ status: 'active' })}
          className="rounded px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
        >
          Reactivate
        </button>
      ) : null}
    </div>
  )
}
