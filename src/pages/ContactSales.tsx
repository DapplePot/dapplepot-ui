import { useState } from 'react'
import { submitContactSales } from '../api/upgrade'

export function ContactSales() {
    const [name, setName]                       = useState('')
    const [email, setEmail]                     = useState('')
    const [company, setCompany]                 = useState('')
    const [monthlyVolumeEstimate, setVolume]    = useState('')
    const [deploymentPreference, setDeployment] = useState<'saas' | 'self_hosted_vpc' | ''>('')
    const [complianceNeeds, setCompliance]      = useState('')
    const [notes, setNotes]                     = useState('')
    const [submitting, setSubmitting]           = useState(false)
    const [submitted, setSubmitted]             = useState(false)
    const [error, setError]                     = useState<string | null>(null)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        setError(null)
        try {
            await submitContactSales({
                name,
                email,
                company:               company || undefined,
                monthlyVolumeEstimate: monthlyVolumeEstimate || undefined,
                deploymentPreference:  deploymentPreference || undefined,
                complianceNeeds:       complianceNeeds || undefined,
                notes:                 notes || undefined,
            })
            setSubmitted(true)
        } catch (err) {
            setError((err as Error).message || 'Submission failed')
        } finally {
            setSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <div className="mx-auto max-w-xl space-y-4 p-8 text-center">
                <div className="text-4xl">✓</div>
                <h1 className="text-xl font-semibold">Thanks — we've got your message.</h1>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                    Our team will reach out within 1 business day to schedule a discovery call.
                </p>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-zinc-100">Contact Sales</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
                    Tell us about your AI agent fleet. We'll come back with a custom Enterprise quote
                    matched to your volume, deployment model, and support needs.
                </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <Field label="Your name *">
                    <input required value={name} onChange={e => setName(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Work email *">
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Company">
                    <input value={company} onChange={e => setCompany(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Monthly event volume (estimate)">
                    <input value={monthlyVolumeEstimate} onChange={e => setVolume(e.target.value)} placeholder="e.g. 2M events / month across 8 agents" className={inputCls} />
                </Field>
                <Field label="Deployment preference">
                    <select value={deploymentPreference} onChange={e => setDeployment(e.target.value as 'saas' | 'self_hosted_vpc' | '')} className={inputCls}>
                        <option value="">— choose —</option>
                        <option value="saas">SaaS (DapplePot-hosted)</option>
                        <option value="self_hosted_vpc">Self-hosted / VPC</option>
                    </select>
                </Field>
                <Field label="Compliance needs (DPDP, SOC2, ISO, RBI, etc.)">
                    <input value={complianceNeeds} onChange={e => setCompliance(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Anything else?">
                    <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} />
                </Field>

                {error && (
                    <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                        {error}
                    </div>
                )}

                <button type="submit" disabled={submitting} className="w-full rounded bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">
                    {submitting ? 'Sending…' : 'Contact Sales'}
                </button>
            </form>
        </div>
    )
}

const inputCls = 'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">{label}</span>
            {children}
        </label>
    )
}
