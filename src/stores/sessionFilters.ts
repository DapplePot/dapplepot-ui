import { create } from 'zustand'
import type { SessionStatus } from '@dapplepot/types/session'

interface SessionFiltersState {
  status: SessionStatus | ''
  agentId: string
  environment: string
  dateRange: '24h' | '7d' | '30d' | ''
  searchQuery: string

  setStatus: (status: SessionStatus | '') => void
  setAgentId: (agentId: string) => void
  setEnvironment: (environment: string) => void
  setDateRange: (range: '24h' | '7d' | '30d' | '') => void
  setSearchQuery: (q: string) => void
  clearFilters: () => void
  hasActiveFilters: () => boolean
}

const defaults = {
  status: '' as const,
  agentId: '',
  environment: '',
  dateRange: '' as const,
  searchQuery: '',
}

export const useSessionFilters = create<SessionFiltersState>((set, get) => ({
  ...defaults,

  setStatus: (status) => set({ status }),
  setAgentId: (agentId) => set({ agentId }),
  setEnvironment: (environment) => set({ environment }),
  setDateRange: (dateRange) => set({ dateRange }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  clearFilters: () => set(defaults),
  hasActiveFilters: () => {
    const { status, agentId, environment, dateRange, searchQuery } = get()
    return !!(status || agentId || environment || dateRange || searchQuery)
  },
}))
