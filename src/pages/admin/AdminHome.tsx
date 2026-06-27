import { useAdminUsage } from '../../hooks/useAdmin'

export function AdminHome() {
    const { data: stats, isLoading, isError } = useAdminUsage()

    if (isLoading) return <div className="p-6 text-sm text-slate-500">Loading platform stats…</div>
    if (isError || !stats) return <div className="p-6 text-sm text-red-500">Failed to load stats</div>

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Platform Overview</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                    Cross-tenant operational snapshot. Updated every 5 minutes.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard label="Total tenants"            value={stats.totalTenants} />
                <StatCard label="Active trials"            value={stats.activeTrials} />
                <StatCard label="Trials in grace"          value={stats.expiredTrialsInGrace} />
                <StatCard label="Suspended"                value={stats.suspendedTenants} />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-3 text-sm font-medium text-slate-900 dark:text-zinc-100">Tenants by plan</h2>
                <div className="grid grid-cols-5 gap-2 text-xs">
                    {(['internal', 'trial', 'pro', 'team', 'enterprise'] as const).map(tier => (
                        <div key={tier} className="rounded bg-slate-50 p-2 text-center dark:bg-zinc-800">
                            <div className="font-mono text-base text-slate-900 dark:text-zinc-100">{stats.tenantsByPlan[tier]}</div>
                            <div className="mt-0.5 uppercase tracking-wider text-slate-500 dark:text-zinc-500">{tier}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-3 text-sm font-medium text-slate-900 dark:text-zinc-100">Top 10 tenants by events (last 30 days)</h2>
                <table className="w-full text-xs">
                    <thead className="text-left text-slate-500 dark:text-zinc-500">
                        <tr><th className="pb-2">Tenant</th><th className="pb-2 text-right">Events</th></tr>
                    </thead>
                    <tbody>
                        {stats.topByEvents30d.map(t => (
                            <tr key={t.tenantId} className="border-t border-slate-100 dark:border-zinc-800">
                                <td className="py-2">{t.name}</td>
                                <td className="py-2 text-right font-mono">{t.eventsUsed.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-2xl font-semibold text-slate-900 dark:text-zinc-100">{value.toLocaleString()}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-500">{label}</div>
        </div>
    )
}
