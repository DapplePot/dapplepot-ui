/**
 * Session-detail cross-pane highlight state.
 *
 * When a finding row is expanded in the left pane (Security tab), it publishes
 * the set of trigger event IDs here; the EventTimeline (right pane) subscribes,
 * scrolls to the first one, and EventRow renders a highlighted vertical sidebar
 * on every event whose ID is in the set.
 *
 * Kept as a Zustand store (not React context) so that the timeline can react
 * without prop-drilling through TraceLayout, and both left-pane finding lists
 * (session-analysis + Runtime Guard) can write to the same key.
 */
import { create } from 'zustand'

interface HighlightedEventState {
  /**
   * Every event that contributed to the currently-expanded finding. Empty when
   * nothing is highlighted. Held as an array (not Set) so React reference
   * equality behaves predictably; membership checks use `.includes()`.
   */
  eventIds: string[]
  /** Convenience: the first ID we want the timeline to scroll to. */
  primaryEventId: string | null
  /** Replace the highlight set. Pass [] to clear. */
  setHighlight: (ids: string[]) => void
  /** Convenience alias for setHighlight([]). */
  clearHighlight: () => void
}

export const useHighlightedEvent = create<HighlightedEventState>((set) => ({
  eventIds: [],
  primaryEventId: null,
  setHighlight: (ids) => set({
    eventIds: ids,
    primaryEventId: ids[0] ?? null,
  }),
  clearHighlight: () => set({ eventIds: [], primaryEventId: null }),
}))
