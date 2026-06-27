import { UpgradeModal } from './UpgradeModal'
import { useUpgradeModalStore } from '../stores/upgradeModal'

/**
 * Single instance mounted at the AppShell level. Driven by useUpgradeModalStore,
 * which the apiClient afterResponse hook fills when the server returns a
 * tier-related error code (AGENT_LIMIT_REACHED, QUOTA_EXCEEDED, TRIAL_EXPIRED,
 * FEATURE_NOT_AVAILABLE, CHANNEL_TYPE_NOT_AVAILABLE).
 */
export function GlobalUpgradeModal() {
    const { open, trigger, closeModal } = useUpgradeModalStore()
    if (!open || !trigger) return null
    return <UpgradeModal open={open} onClose={closeModal} trigger={trigger} />
}
