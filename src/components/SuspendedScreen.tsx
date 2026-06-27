import { PlanSelectionModal } from './PlanSelectionModal'

/**
 * Pure hard-lock screen shown when tenant.lifecycle_state === 'suspended'.
 *
 * Nothing else is reachable — no sidebar, no topbar, no dashboard data
 * fetching. The only things on the page are the plan-selection cards
 * (Pro / Team) and a Logout link. There is no X close and no escape.
 *
 * After a successful upgrade the LS webhook flips lifecycle_state back
 * to 'active' and OnboardingGate stops rendering this screen.
 */
export function SuspendedScreen() {
    return <PlanSelectionModal mode="suspended" />
}
