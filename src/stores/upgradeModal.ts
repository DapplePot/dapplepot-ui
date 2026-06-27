import { create } from 'zustand'
import type { UpgradeTrigger } from '../api/upgrade'

/**
 * Global UI state for the UpgradeModal. The apiClient afterResponse hook
 * opens it when the server returns a gate-related error code; the
 * <GlobalUpgradeModal /> mounted in AppShell reads from this store.
 */
interface UpgradeModalState {
    open:    boolean
    trigger: UpgradeTrigger | null
    openModal:  (trigger: UpgradeTrigger) => void
    closeModal: () => void
}

export const useUpgradeModalStore = create<UpgradeModalState>((set) => ({
    open:    false,
    trigger: null,
    openModal:  (trigger) => set({ open: true, trigger }),
    closeModal: () => set({ open: false, trigger: null }),
}))

/**
 * Map server error.code values to UpgradeTrigger variants.
 * Returns null if the error code isn't an upgrade trigger.
 */
export function triggerForErrorCode(code: string | undefined): UpgradeTrigger | null {
    if (!code) return null
    switch (code) {
        case 'AGENT_LIMIT_REACHED':       return 'agent_cap'
        case 'QUOTA_EXCEEDED':            return 'event_quota'
        case 'TRIAL_EXPIRED':             return 'day_31_expired'
        case 'TRIAL_GRACE_PERIOD':        return 'day_31_expired'
        case 'FEATURE_NOT_AVAILABLE':     return 'manual'
        case 'CHANNEL_TYPE_NOT_AVAILABLE': return 'manual'
        default:                          return null
    }
}
