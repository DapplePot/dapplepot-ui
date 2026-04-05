import { useState } from 'react'
import { useTenants } from '../hooks/useTenants'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function Tenants() {
  const { data: tenants, isLoading, isError } = useTenants()
  const [search, setSearch] = useState('')

  const filtered = (tenants ?? []).filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.adminUser?.email.toLowerCase().includes(search.toLowerCase()) ||
    t.adminUser?.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Tenants</h1>
        <p className="mt-1 text-sm text-slate-500">All client tenants and their admin accounts.</p>
      </div>

      <input
        type="search"
        placeholder="Search by tenant or admin…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
      />

      {isLoading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-600">Failed to load tenants.</p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tenant) => (
                <tr key={tenant.tenantId} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">{tenant.name}</div>
                    <div className="font-mono text-xs text-slate-400">{tenant.tenantId}</div>
                  </td>
                  <td className="px-4 py-3">
                    {tenant.adminUser ? (
                      <>
                        <div className="text-sm text-slate-900">{tenant.adminUser.name}</div>
                        <div className="text-xs text-slate-500">{tenant.adminUser.email}</div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No admin assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-700">{tenant.userCount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      tenant.enabled
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tenant.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {formatDate(tenant.createdAt)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                    {tenants?.length === 0 ? 'No tenants onboarded yet.' : 'No tenants match your search.'}
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
