import { useAdminAuditLog } from '../../hooks/useAdmin'

export function AdminAuditLog() {
    const { data: entries, isLoading } = useAdminAuditLog({ limit: 200 })

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Admin Audit Log</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                    Every superadmin write is recorded here for forensic review.
                </p>
            </div>

            {isLoading ? (
                <div className="text-sm text-slate-500">Loading…</div>
            ) : (
                <table className="w-full text-xs">
                    <thead className="text-left uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                        <tr>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">When</th>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">Actor</th>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">Action</th>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">Target</th>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">Change</th>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(entries ?? []).map(e => (
                            <tr key={e.logId} className="border-b border-slate-100 align-top dark:border-zinc-800">
                                <td className="py-2 text-slate-500">{new Date(e.createdAt).toLocaleString()}</td>
                                <td className="py-2 font-mono">{e.actorEmail ?? e.actorUserId.slice(0, 8)}</td>
                                <td className="py-2"><code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-zinc-800">{e.action}</code></td>
                                <td className="py-2 font-mono">{e.targetType}/{e.targetId?.slice(0, 8) ?? '—'}</td>
                                <td className="py-2 font-mono text-slate-500">
                                    {e.beforeValue && e.afterValue
                                        ? `${JSON.stringify(e.beforeValue)} → ${JSON.stringify(e.afterValue)}`
                                        : JSON.stringify(e.afterValue ?? e.beforeValue ?? {})}
                                </td>
                                <td className="py-2 text-slate-500">{e.note ?? ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}
