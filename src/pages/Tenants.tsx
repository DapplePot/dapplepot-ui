import { useEffect, useState } from 'react'
import { Trash2, UserPlus, X } from 'lucide-react'
import { useTenants, useDeleteTenant } from '../hooks/useTenants'
import { OnboardClientModal } from '../components/onboarding/OnboardClientModal'
import { useAuthStore } from '../stores/auth'
import type { TenantWithStats } from '../types/tenant'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function Tenants() {
  const { data: tenants, isLoading, isError } = useTenants()
  const [search, setSearch] = useState('')
  const [onboardOpen, setOnboardOpen] = useState(false)
  const [toDelete, setToDelete] = useState<TenantWithStats | null>(null)
  const isSuperadmin = useAuthStore((s) => s.user?.role === 'superadmin')

  const filtered = (tenants ?? []).filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.adminUser?.email.toLowerCase().includes(search.toLowerCase()) ||
    t.adminUser?.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Tenants</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">All client tenants and their admin accounts.</p>
        </div>
        {isSuperadmin && (
          <button
            type="button"
            onClick={() => setOnboardOpen(true)}
            className="flex items-center gap-2 rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            <UserPlus className="h-4 w-4" />
            Onboard a client
          </button>
        )}
      </div>

      <input
        type="search"
        placeholder="Search by tenant or admin…"
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
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load tenants.</p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                {isSuperadmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tenant) => (
                <tr key={tenant.tenantId} className="border-b border-slate-100 last:border-0 dark:border-zinc-800">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900 dark:text-zinc-100">{tenant.name}</div>
                    <div className="font-mono text-xs text-slate-400 dark:text-zinc-500">{tenant.tenantId}</div>
                  </td>
                  <td className="px-4 py-3">
                    {tenant.adminUser ? (
                      <>
                        <div className="text-sm text-slate-900 dark:text-zinc-100">{tenant.adminUser.name}</div>
                        <div className="text-xs text-slate-500 dark:text-zinc-400">{tenant.adminUser.email}</div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic dark:text-zinc-500">No admin assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-700 dark:text-zinc-300">{tenant.userCount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      tenant.enabled
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {tenant.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-zinc-400">
                    {formatDate(tenant.createdAt)}
                  </td>
                  {isSuperadmin && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setToDelete(tenant)}
                        aria-label={`Delete ${tenant.name}`}
                        className="inline-flex items-center justify-center rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isSuperadmin ? 6 : 5} className="px-4 py-8 text-center text-sm text-slate-400 dark:text-zinc-500">
                    {tenants?.length === 0 ? 'No tenants onboarded yet.' : 'No tenants match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {onboardOpen && <OnboardClientModal onClose={() => setOnboardOpen(false)} />}
      {toDelete && (
        <DeleteTenantDialog
          tenant={toDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  )
}

interface DeleteTenantDialogProps {
  tenant:  TenantWithStats
  onClose: () => void
}

function DeleteTenantDialog({ tenant, onClose }: DeleteTenantDialogProps) {
  const deleteMut = useDeleteTenant()
  const [confirmName, setConfirmName] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !deleteMut.isPending) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, deleteMut.isPending])

  const canDelete = confirmName.trim() === tenant.name && !deleteMut.isPending

  function handleDelete() {
    if (!canDelete) return
    deleteMut.mutate(tenant.tenantId, { onSuccess: onClose })
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
          <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Delete tenant</h2>
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
            This permanently removes <span className="font-semibold">{tenant.name}</span> and every
            session, alert, agent, audit archive, and user that belongs only to it. This cannot be
            undone.
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Type <span className="font-mono text-slate-900 dark:text-zinc-100">{tenant.name}</span> to confirm
            </label>
            <input
              type="text"
              autoFocus
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              disabled={deleteMut.isPending}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>

          {deleteMut.isError && (
            <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {(deleteMut.error as Error)?.message ?? 'Failed to delete tenant.'}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={deleteMut.isPending}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              {deleteMut.isPending ? 'Deleting…' : 'Delete tenant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
