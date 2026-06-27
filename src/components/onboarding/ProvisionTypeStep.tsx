import { useState } from 'react'

export type ProvisionType =
    | 'internal_individual'
    | 'internal_organization'
    | 'enterprise_organization'

export interface ProvisionMeta {
    id:          ProvisionType
    label:       string
    description: string
    kind:        'personal' | 'organization'
    planTier:    'internal' | 'enterprise'
}

export const PROVISION_OPTIONS: ProvisionMeta[] = [
    {
        id:          'internal_individual',
        label:       'Internal — Individual',
        description: "Comped personal account — founders, advisors, friends. Workspace name auto-derived from the admin's name.",
        kind:        'personal',
        planTier:    'internal',
    },
    {
        id:          'internal_organization',
        label:       'Internal — Organisation',
        description: 'Comped multi-seat workspace — community projects, beta partners.',
        kind:        'organization',
        planTier:    'internal',
    },
    {
        id:          'enterprise_organization',
        label:       'Enterprise — Organisation',
        description: 'Post-sale enterprise provisioning.',
        kind:        'organization',
        planTier:    'enterprise',
    },
]

export function provisionMeta(id: ProvisionType): ProvisionMeta {
    return PROVISION_OPTIONS.find(o => o.id === id)!
}

interface ProvisionTypeStepProps {
    initialValue: ProvisionType
    onNext:       (value: ProvisionType) => void
}

export function ProvisionTypeStep({ initialValue, onNext }: ProvisionTypeStepProps) {
    const [provision, setProvision] = useState<ProvisionType>(initialValue)

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                onNext(provision)
            }}
            className="space-y-5"
        >
            <div>
                <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    Account type <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
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
                                <span
                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
                                        isSelected
                                            ? 'border-violet-500 bg-white dark:bg-zinc-900'
                                            : 'border-slate-300 dark:border-zinc-600'
                                    }`}
                                >
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
                <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                    Pro and Team tenants come from self-serve checkout — not provisioned here.
                </p>
            </div>

            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    className="rounded bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500"
                >
                    Next →
                </button>
            </div>
        </form>
    )
}
