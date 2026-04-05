import { useAuthStore } from '../stores/auth'
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard'

export function OnboardClient() {
  const user = useAuthStore((s) => s.user)

  if (user?.role !== 'superadmin') {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-slate-500">You don't have permission to access this page.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Onboard New Client</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a new tenant and their first admin account.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <OnboardingWizard />
      </div>
    </div>
  )
}
