import { create } from 'zustand'

type Tier = 'trial' | 'pro' | 'team'

/**
 * Global UI state for the PlanSelectionModal when opened on-demand by any
 * "Upgrade" button across the app (TrialBanner, QuotaBanner, PlanGate,
 * BillingSection, etc.).
 *
 * The onboarding gate uses the SAME PlanSelectionModal but mounts it
 * directly via OnboardingGate when the user hasn't picked a plan yet —
 * that flow doesn't go through this store. This store is purely for the
 * voluntary upgrade flow used by existing customers.
 */
interface PlanModalState {
    open: boolean
    initialTier?: Tier
    openModal: (tier?: Tier) => void
    closeModal: () => void
}

export const usePlanModalStore = create<PlanModalState>((set) => ({
    open: false,
    initialTier: undefined,
    openModal:  (tier) => set({ open: true, initialTier: tier }),
    closeModal: () => set({ open: false, initialTier: undefined }),
}))
