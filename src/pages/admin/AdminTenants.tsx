import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useAdminTenants, useCreateAdminTenant } from '../../hooks/useAdmin'
import type { PlanTier } from '../../api/admin'

const PLAN_TIERS: PlanTier[] = ['internal', 'trial', 'pro', 'team', 'enterprise']

export function AdminTenants() {
    const [search, setSearch]      = useState('')
    const [planFilter, setPlanFilter] = useState<PlanTier | ''>('')
    const [createOpen, setCreateOpen] = useState(false)

    const { data: tenants, isLoading } = useAdminTenants({
        search:   search.length >= 2 ? search : undefined,
        planTier: planFilter || undefined,
    })

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Tenants</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">All tenants across the platform.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
                >
                    + Create tenant (Internal / Enterprise)
                </button>
            </div>

            <div className="flex gap-3">
                <input
                    type="search"
                    placeholder="Search by name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64 rounded border border-slate-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
                <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value as PlanTier | '')}
                    className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                    <option value="">All plans</option>
                    {PLAN_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {isLoading ? (
                <div className="text-sm text-slate-500">Loading…</div>
            ) : (
                <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                        <tr>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">Name</th>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">Kind</th>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">Plan</th>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">Status</th>
                            <th className="border-b border-slate-200 pb-2 dark:border-zinc-800">Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(tenants ?? []).map(t => (
                            <tr key={t.tenantId} className="border-b border-slate-100 dark:border-zinc-800">
                                <td className="py-2">
                                    <Link to="/admin/tenants/$id" params={{ id: t.tenantId }} className="text-violet-600 hover:underline">
                                        {t.name}
                                    </Link>
                                </td>
                                <td className="py-2 text-slate-600 dark:text-zinc-400">{t.kind}</td>
                                <td className="py-2"><PlanBadge plan={t.planTier} /></td>
                                <td className="py-2">
                                    {t.enabled
                                        ? <span className="text-emerald-600">active</span>
                                        : <span className="text-red-600">suspended</span>}
                                </td>
                                <td className="py-2 text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {createOpen && <CreateTenantModal onClose={() => setCreateOpen(false)} />}
        </div>
    )
}

function PlanBadge({ plan }: { plan: PlanTier }) {
    const colour =
        plan === 'enterprise' ? 'bg-amber-100 text-amber-800' :
        plan === 'team'       ? 'bg-indigo-100 text-indigo-800' :
        plan === 'pro'        ? 'bg-blue-100 text-blue-800' :
        plan === 'trial'      ? 'bg-slate-100 text-slate-700' :
                                'bg-purple-100 text-purple-800'
    return <span className={`rounded px-2 py-0.5 text-xs font-medium ${colour}`}>{plan}</span>
}

// Three valid (plan_tier + kind) combinations the superadmin can provision.
// Pro/Team are NOT in this list — those come from self-serve checkout only.
type ProvisionType = 'internal_individual' | 'internal_organization' | 'enterprise_organization'

const PROVISION_OPTIONS: { id: ProvisionType; label: string; description: string; planTier: PlanTier; kind: 'personal' | 'organization' }[] = [
    {
        id:          'internal_individual',
        label:       'Internal — Individual',
        description: 'Comped personal account — founders, advisors, friends.',
        planTier:    'internal',
        kind:        'personal',
    },
    {
        id:          'internal_organization',
        label:       'Internal — Organisation',
        description: 'Comped multi-seat workspace — community projects, beta partners.',
        planTier:    'internal',
        kind:        'organization',
    },
    {
        id:          'enterprise_organization',
        label:       'Enterprise — Organisation',
        description: 'Post-sale enterprise provisioning.',
        planTier:    'enterprise',
        kind:        'organization',
    },
]

function CreateTenantModal({ onClose }: { onClose: () => void }) {
    const [name, setName]         = useState('')
    const [provision, setProvision] = useState<ProvisionType>('internal_individual')
    const [note, setNote]         = useState('')

    const create = useCreateAdminTenant()
    const selected = PROVISION_OPTIONS.find(o => o.id === provision)!

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        await create.mutateAsync({
            name,
            kind:     selected.kind,
            planTier: selected.planTier,
            note:     note || undefined,
        })
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={submit} className="w-full max-w-md rounded bg-white p-6 dark:bg-zinc-900">
                <h2 className="mb-1 text-base font-semibold">Create tenant</h2>
                <p className="mb-5 text-xs text-slate-500">
                    Pro and Team tenants come from self-serve checkout — superadmin only provisions
                    Internal (comped) and Enterprise (post-sale) accounts.
                </p>

                <div className="space-y-4 text-sm">
                    <label className="block">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">Tenant name</span>
                        <input value={name} onChange={e => setName(e.target.value)} required
                               placeholder="e.g. Acme Inc."
                               className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800" />
                    </label>

                    <div className="block">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">Account type</span>
                        <div className="mt-2 space-y-2">
                            {PROVISION_OPTIONS.map(o => {
                                const isSelected = provision === o.id
                                return (
                                    <button
                                        key={o.id}
                                        type="button"
                                        onClick={() => setProvision(o.id)}
                                        className={`flex w-full items-start gap-3 rounded border p-3 text-left transition ${
                                            isSelected
                                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                                                : 'border-slate-200 hover:border-slate-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                                        }`}
                                    >
                                        <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
                                            isSelected
                                                ? 'border-violet-500 bg-white dark:bg-zinc-900'
                                                : 'border-slate-300 dark:border-zinc-600'
                                        }`}>
                                            {isSelected && <span className="h-2 w-2 rounded-full bg-violet-500" />}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-medium text-slate-900 dark:text-zinc-100">{o.label}</span>
                                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-zinc-400">{o.description}</span>
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <label className="block">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">Note (for audit log)</span>
                        <input value={note} onChange={e => setNote(e.target.value)}
                               placeholder="Optional — reason for creating this tenant"
                               className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800" />
                    </label>
                </div>

                <div className="mt-5 rounded bg-slate-50 p-3 text-xs text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                    After creating, you'll be taken to the tenant detail page to invite the owner.
                </div>
                <div className="mt-3 flex justify-end gap-2 text-sm">
                    <button type="button" onClick={onClose}
                            className="rounded px-3 py-2 text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                        Cancel
                    </button>
                    <button type="submit" disabled={create.isPending || !name}
                            className="rounded bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-500 disabled:opacity-50">
                        {create.isPending ? 'Creating…' : 'Create tenant'}
                    </button>
                </div>
            </form>
        </div>
    )
}
