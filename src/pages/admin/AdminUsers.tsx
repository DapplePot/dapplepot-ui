import { useState } from 'react'
import { useAdminUserSearch } from '../../hooks/useAdmin'

export function AdminUsers() {
    const [search, setSearch] = useState('')
    const { data: users, isLoading } = useAdminUserSearch(search)

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">User Lookup</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                    Search across all tenants. Type at least 2 characters.
                </p>
            </div>

            <input
                type="search"
                placeholder="Search by email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full max-w-md rounded border border-slate-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />

            {isLoading && search.length >= 2 && <div className="text-sm text-slate-500">Searching…</div>}

            {users && users.length > 0 && (
                <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                        <tr>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">Email</th>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">Name</th>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">Role</th>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">Tenant</th>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.userId} className="border-b border-slate-100 dark:border-zinc-800">
                                <td className="py-2 font-mono text-xs">{u.email}</td>
                                <td className="py-2">{u.name}</td>
                                <td className="py-2"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">{u.role}</code></td>
                                <td className="py-2 text-slate-600 dark:text-zinc-400">{u.tenantName ?? '—'}</td>
                                <td className="py-2 text-xs">{u.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {search.length >= 2 && users && users.length === 0 && !isLoading && (
                <div className="text-sm text-slate-500">No users match this search.</div>
            )}
        </div>
    )
}
