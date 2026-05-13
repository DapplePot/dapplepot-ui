import { useState } from 'react'
import { CheckCircle2, Building2, UserCog } from 'lucide-react'
import { TenantInfoStep, type TenantInfoData } from './TenantInfoStep'
import { AdminAccountStep, type AdminAccountData } from './AdminAccountStep'
import { useOnboardClient } from '../../hooks/useTenants'
import type { OnboardClientResponse } from '../../types/tenant'
import { cn } from '../../utils/cn'

type Step = 1 | 2

const STEPS = [
  { step: 1 as Step, label: 'Tenant Info',    icon: Building2 },
  { step: 2 as Step, label: 'Admin Account',  icon: UserCog   },
]

const EMPTY_TENANT: TenantInfoData = { name: '', tokenBudget: '', rateLimit: '' }

export function OnboardingWizard() {
  const [currentStep,  setCurrentStep]  = useState<Step>(1)
  const [tenantData,   setTenantData]   = useState<TenantInfoData>(EMPTY_TENANT)
  const [result,       setResult]       = useState<OnboardClientResponse | null>(null)

  const onboard = useOnboardClient()

  function handleTenantNext(data: TenantInfoData) {
    setTenantData(data)
    setCurrentStep(2)
  }

  function handleAdminSubmit(adminData: AdminAccountData) {
    onboard.mutate(
      {
        tenant: {
          name:        tenantData.name,
          tokenBudget: tenantData.tokenBudget ? Number(tenantData.tokenBudget) : null,
          rateLimit:   tenantData.rateLimit   ? Number(tenantData.rateLimit)   : null,
        },
        admin: adminData,
      },
      { onSuccess: (data) => setResult(data) },
    )
  }

  function handleReset() {
    setCurrentStep(1)
    setTenantData(EMPTY_TENANT)
    setResult(null)
    onboard.reset()
  }

  const errorMessage = onboard.isError
    ? (onboard.error as Error)?.message ?? 'Something went wrong. Please try again.'
    : null

  // ── Success state ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Client onboarded successfully</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">The tenant and admin account have been created.</p>
        </div>

        <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm space-y-2 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-zinc-400">Tenant</span>
            <span className="font-medium text-slate-900 dark:text-zinc-100">{result.tenant.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-zinc-400">Tenant ID</span>
            <span className="font-mono text-xs text-slate-600 dark:text-zinc-300">{result.tenant.tenantId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-zinc-400">Admin email</span>
            <span className="text-slate-900 dark:text-zinc-100">{result.admin.email}</span>
          </div>
          {result.tenant.tokenBudget !== null && (
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">Token budget</span>
              <span className="text-slate-900 dark:text-zinc-100">{result.tenant.tokenBudget.toLocaleString()} tokens</span>
            </div>
          )}
          {result.tenant.rateLimit !== null && (
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">Rate limit</span>
              <span className="text-slate-900 dark:text-zinc-100">{result.tenant.rateLimit} req/min</span>
            </div>
          )}
        </div>

        <button
          onClick={handleReset}
          className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          Onboard another client
        </button>
      </div>
    )
  }

  // ── Wizard ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map(({ step, label, icon: Icon }, idx) => {
          const isComplete = currentStep > step
          const isActive   = currentStep === step
          return (
            <div key={step} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isComplete
                      ? 'bg-violet-600 text-white'
                      : isActive
                        ? 'border-2 border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                        : 'border-2 border-slate-300 text-slate-400 dark:border-zinc-600 dark:text-zinc-500',
                  )}
                >
                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    isActive   ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-400 dark:text-zinc-500',
                  )}
                >
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-3 h-px w-10 transition-colors',
                    currentStep > step ? 'bg-violet-600' : 'bg-slate-200 dark:bg-zinc-700',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div>
        {currentStep === 1 && (
          <TenantInfoStep initialData={tenantData} onNext={handleTenantNext} />
        )}
        {currentStep === 2 && (
          <AdminAccountStep
            onBack={() => setCurrentStep(1)}
            onSubmit={handleAdminSubmit}
            isPending={onboard.isPending}
            error={errorMessage}
          />
        )}
      </div>
    </div>
  )
}
