import { create } from 'zustand'

type EventCategory = 'all' | 'graph' | 'node' | 'llm' | 'tool' | 'state'

interface TraceFiltersState {
  activeCategory: EventCategory
  setActiveCategory: (category: EventCategory) => void
}

export const useTraceFilters = create<TraceFiltersState>((set) => ({
  activeCategory: 'all',
  setActiveCategory: (activeCategory) => set({ activeCategory }),
}))
