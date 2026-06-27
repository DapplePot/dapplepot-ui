import { Link, Outlet, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '../../stores/auth'

/**
 * Layout wrapper for all /admin/* pages. Re-redirects non-superadmin
 * users to the dashboard. The server-side requireRole('superadmin')
 * middleware is the source of truth — this is just a UX guardrail.
 */
export function AdminLayout() {
    const role   = useAuthStore(s => s.user?.role)
    const router = useRouter()

    useEffect(() => {
        if (role && role !== 'superadmin') {
            void router.navigate({ to: '/' })
        }
    }, [role, router])

    if (role !== 'superadmin') {
        return (
            <div className="p-8 text-sm text-slate-500 dark:text-zinc-400">
                Access denied — superadmin role required.
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950">
            <nav className="w-56 border-r border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                    Superadmin
                </h2>
                <ul className="space-y-1 text-sm">
                    <li><Link to="/admin"            className="block rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800">Overview</Link></li>
                    <li><Link to="/admin/tenants"    className="block rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800">Tenants</Link></li>
                    <li><Link to="/admin/users"      className="block rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800">Users</Link></li>
                    <li><Link to="/admin/audit-log"  className="block rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800">Audit Log</Link></li>
                </ul>
                <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-zinc-800 dark:text-zinc-500">
                    <Link to="/" className="hover:underline">← Back to app</Link>
                </div>
            </nav>
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    )
}
