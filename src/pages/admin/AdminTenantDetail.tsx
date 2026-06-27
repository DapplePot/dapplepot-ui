import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { useAdminTenant, usePatchAdminTenant } from '../../hooks/useAdmin'
import type { PlanTier } from '../../api/admin'

const PLAN_TIERS: PlanTier[] = ['internal', 'trial', 'pro', 'team', 'enterprise']

export function AdminTenantDetail() {
    const { id } = useParams({ strict: false }) as { id: string }
    const { data, isLoading, isError } = useAdminTenant(id)
    const patch = usePatchAdminTenant()
    const [newPlan, setNewPlan] = useState<PlanTier | ''>('')
    const [note, setNote]       = useState('')

    if (isLoading) return <div className="p-6 text-sm text-slate-500">Loading…</div>
    if (isError || !data) return <div className="p-6 text-sm text-red-500">Tenant not found.</div>

    const { tenant, snapshot } = data

    async function changePlan() {
        if (!newPlan) return
        await patch.mutateAsync({ tenantId: id, body: { planTier: newPlan, note: note || undefined } })
        setNewPlan('')
        setNote('')
    }

    async function toggleSuspend() {
        await patch.mutateAsync({
            tenantId: id,
            body: tenant.enabled ? { suspend: true, note: note || undefined }
                                 : { restore: true, note: note || undefined },
        })
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <Link to="/admin/tenants" className="text-xs text-violet-600 hover:underline">← Back to tenants</Link>
                <h1 className="mt-2 text-lg font-semibold text-slate-900 dark:text-zinc-100">{tenant.name}</h1>
                <p className="mt-1 font-mono text-xs text-slate-500">{tenant.tenantId}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Stat label="Plan"          value={tenant.planTier} />
                <Stat label="Status"        value={tenant.enabled ? 'active' : 'suspended'} />
                <Stat label="Kind"          value={tenant.kind} />
                <Stat label="Created"       value={new Date(tenant.createdAt).toLocaleDateString()} />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-3 text-sm font-medium">Current Usage</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
                    <div>
                        <div className="text-xs text-slate-500">Events</div>
                        <div className="font-mono">{snapshot.usage.eventsUsed.toLocaleString()} / {snapshot.usage.eventsQuota.toLocaleString()}</div>
                        <div className="mt-1 text-xs text-slate-500">{(snapshot.usage.pct * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Agents</div>
                        <div className="font-mono">{snapshot.agentCount}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Seats</div>
                        <div className="font-mono">{snapshot.seatCount}</div>
                    </div>
                    {snapshot.trialDaysLeft !== null && (
                        <div>
                            <div className="text-xs text-slate-500">Trial days left</div>
                            <div className="font-mono">{snapshot.trialDaysLeft}</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-3 text-sm font-medium">Admin Actions</h2>
                <div className="space-y-3 text-sm">
                    <label className="block">
                        <span className="text-slate-700 dark:text-zinc-300">Note (for audit log)</span>
                        <input value={note} onChange={e => setNote(e.target.value)}
                               placeholder="Reason for the change…"
                               className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800" />
                    </label>
                    <div className="flex flex-wrap items-end gap-3">
                        <label className="block">
                            <span className="text-xs text-slate-500">Change plan to…</span>
                            <select value={newPlan} onChange={e => setNewPlan(e.target.value as PlanTier | '')}
                                    className="mt-1 block rounded border border-slate-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                                <option value="">— pick plan —</option>
                                {PLAN_TIERS.filter(t => t !== tenant.planTier).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </label>
                        <button type="button" onClick={changePlan} disabled={!newPlan || patch.isPending}
                                className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">
                            Apply plan change
                        </button>
                        <button type="button" onClick={toggleSuspend} disabled={patch.isPending}
                                className={`rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                                    tenant.enabled ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
                                }`}>
                            {tenant.enabled ? 'Suspend' : 'Restore'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-base font-semibold capitalize text-slate-900 dark:text-zinc-100">{value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-500">{label}</div>
        </div>
    )
}
