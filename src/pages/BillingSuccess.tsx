import { useEffect, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { usePlan } from '../hooks/usePlan'

/**
 * Stripe Checkout redirects here on success with ?session_id={CHECKOUT_SESSION_ID}.
 * We poll /me/plan until the webhook has flipped plan_tier (typically <2s),
 * then redirect to the dashboard.
 */
export function BillingSuccess() {
    const router = useRouter()
    const qc     = useQueryClient()
    const { plan } = usePlan()
    const [waited, setWaited] = useState(0)

    useEffect(() => {
        // Poll the plan endpoint every 1.5s until we see a paid tier
        const i = setInterval(async () => {
            await qc.invalidateQueries({ queryKey: ['me', 'plan'] })
            setWaited(w => w + 1)
        }, 1500)
        return () => clearInterval(i)
    }, [qc])

    useEffect(() => {
        if (plan?.planTier === 'pro' || plan?.planTier === 'team') {
            // Webhook landed — redirect to dashboard
            setTimeout(() => router.navigate({ to: '/' }), 1200)
        }
    }, [plan?.planTier, router])

    const isPaid = plan?.planTier === 'pro' || plan?.planTier === 'team'

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-zinc-950">
            <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-lg dark:bg-zinc-900">
                {isPaid ? (
                    <>
                        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                        <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-zinc-100">
                            You're all set on {plan.limits.displayName}!
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
                            Redirecting you to the dashboard…
                        </p>
                    </>
                ) : (
                    <>
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-violet-500" />
                        <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-zinc-100">
                            Activating your subscription…
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
                            Stripe is sending us the confirmation. This usually takes a second.
                        </p>
                        {waited > 8 && (
                            <p className="mt-4 text-xs text-slate-400">
                                Still waiting? Webhooks can occasionally be slow.{' '}
                                <Link to="/" className="text-violet-600 hover:underline">Go to dashboard</Link>{' '}
                                — your plan will appear once Stripe finishes the handshake.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
