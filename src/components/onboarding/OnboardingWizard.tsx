import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Building2, UserCog, Layers, FileBadge } from 'lucide-react'
import {
    ProvisionTypeStep,
    provisionMeta,
    type ProvisionType,
} from './ProvisionTypeStep'
import { TenantInfoStep, type TenantInfoData } from './TenantInfoStep'
import { ContractLimitsStep, type ContractLimitsData } from './ContractLimitsStep'
import { AdminAccountStep, type AdminAccountData } from './AdminAccountStep'
import { useOnboardClient } from '../../hooks/useTenants'
import type { OnboardClientResponse } from '../../types/tenant'
import { cn } from '../../utils/cn'

// Step IDs are stable across all flows so navigation logic (next/back, indicator
// active state) is just integer arithmetic regardless of which steps a given
// provision type actually shows.
//   1 = Account Type
//   2 = Tenant Info
//   3 = Contract Limits   (Enterprise only)
//   4 = Admin Account
type Step = 1 | 2 | 3 | 4

const EMPTY_TENANT:           TenantInfoData     = { name: '' }
const EMPTY_CONTRACT_LIMITS:  ContractLimitsData = { enterpriseSeatsCap: '', enterpriseEventsPerPeriod: '' }

interface OnboardingWizardProps {
  onClose?: () => void
}

export function OnboardingWizard({ onClose }: OnboardingWizardProps = {}) {
  const queryClient = useQueryClient()
  const [currentStep,   setCurrentStep]   = useState<Step>(1)
  const [provision,     setProvision]     = useState<ProvisionType>('internal_individual')
  const [tenantData,    setTenantData]    = useState<TenantInfoData>(EMPTY_TENANT)
  const [contractData,  setContractData]  = useState<ContractLimitsData>(EMPTY_CONTRACT_LIMITS)
  const [result,        setResult]        = useState<OnboardClientResponse | null>(null)

  const onboard = useOnboardClient()

  // Provision type drives which steps are shown:
  //   Internal Individual   → Account Type → Admin Account             (steps 1, 4)
  //   Internal Organisation → Account Type → Tenant Info → Admin       (steps 1, 2, 4)
  //   Enterprise            → Account Type → Tenant Info → Contract → Admin (steps 1, 2, 3, 4)
  // Internal Individual auto-names the workspace from the admin name (matches signup).
  const isIndividual = provision === 'internal_individual'
  const isEnterprise = provision === 'enterprise_organization'

  const STEPS: { step: Step; label: string; icon: typeof Layers }[] = isIndividual
    ? [
        { step: 1, label: 'Account Type',  icon: Layers   },
        { step: 4, label: 'Admin Account', icon: UserCog  },
      ]
    : isEnterprise
      ? [
          { step: 1, label: 'Account Type',     icon: Layers     },
          { step: 2, label: 'Tenant Info',      icon: Building2  },
          { step: 3, label: 'Contract Limits',  icon: FileBadge  },
          { step: 4, label: 'Admin Account',    icon: UserCog    },
        ]
      : [
          { step: 1, label: 'Account Type',  icon: Layers     },
          { step: 2, label: 'Tenant Info',   icon: Building2  },
          { step: 4, label: 'Admin Account', icon: UserCog    },
        ]

  // ── Back-navigation helper — knows which steps to skip based on provision type ──
  function prevStepBefore(step: Step): Step {
    if (step === 4) {
      if (isEnterprise)  return 3
      if (isIndividual)  return 1
      return 2
    }
    if (step === 3) return 2
    if (step === 2) return 1
    return 1
  }

  function handleProvisionNext(value: ProvisionType) {
    setProvision(value)
    // Recompute first "after step 1" jump based on the freshly-picked value.
    if (value === 'internal_individual') setCurrentStep(4)
    else                                 setCurrentStep(2)
  }

  function handleTenantNext(data: TenantInfoData) {
    setTenantData(data)
    setCurrentStep(isEnterprise ? 3 : 4)
  }

  function handleContractNext(data: ContractLimitsData) {
    setContractData(data)
    setCurrentStep(4)
  }

  function handleAdminSubmit(adminData: AdminAccountData) {
    const meta = provisionMeta(provision)
    // Auto-name personal-internal workspaces after the admin (matches signup convention).
    // Trim + collapse whitespace so accidental extra spaces don't produce names like
    // "pushpendra 's workspace".
    const cleanAdminName = adminData.name.trim().replace(/\s+/g, ' ')
    const tenantName = isIndividual
      ? `${cleanAdminName}'s workspace`
      : tenantData.name.trim()

    onboard.mutate(
      {
        tenant: {
          name:        tenantName,
          kind:        meta.kind,
          planTier:    meta.planTier,
          tokenBudget: null,
          rateLimit:   null,
          enterpriseSeatsCap:
            isEnterprise && contractData.enterpriseSeatsCap ? Number(contractData.enterpriseSeatsCap) : null,
          enterpriseEventsPerPeriod:
            isEnterprise && contractData.enterpriseEventsPerPeriod ? Number(contractData.enterpriseEventsPerPeriod) : null,
        },
        admin: adminData,
      },
      {
        onSuccess: (data) => {
          setResult(data)
          void queryClient.invalidateQueries({ queryKey: ['tenants'] })
        },
      },
    )
  }

  function handleReset() {
    setCurrentStep(1)
    setProvision('internal_individual')
    setTenantData(EMPTY_TENANT)
    setContractData(EMPTY_CONTRACT_LIMITS)
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

        <div className="w-full rounded border border-slate-200 bg-slate-50 p-4 text-left text-sm space-y-2 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-zinc-400">Tenant</span>
            <span className="font-medium text-slate-900 dark:text-zinc-100">{result.tenant.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-zinc-400">Tenant ID</span>
            <span className="font-mono text-xs text-slate-600 dark:text-zinc-300">{result.tenant.tenantId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-zinc-400">Account type</span>
            <span className="text-slate-900 dark:text-zinc-100">{provisionMeta(provision).label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-zinc-400">Admin email</span>
            <span className="text-slate-900 dark:text-zinc-100">{result.admin.email}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Onboard another
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              Done
            </button>
          )}
        </div>
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
          <ProvisionTypeStep initialValue={provision} onNext={handleProvisionNext} />
        )}
        {currentStep === 2 && (
          <TenantInfoStep
            initialData={tenantData}
            onBack={() => setCurrentStep(prevStepBefore(2))}
            onNext={handleTenantNext}
          />
        )}
        {currentStep === 3 && (
          <ContractLimitsStep
            initialData={contractData}
            onBack={() => setCurrentStep(prevStepBefore(3))}
            onNext={handleContractNext}
          />
        )}
        {currentStep === 4 && (
          <AdminAccountStep
            provision={provision}
            onBack={() => setCurrentStep(prevStepBefore(4))}
            onSubmit={handleAdminSubmit}
            isPending={onboard.isPending}
            error={errorMessage}
          />
        )}
      </div>
    </div>
  )
}
