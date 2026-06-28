import { create } from 'zustand'
import type { SessionStatus } from '@dapplepot/types/session'

interface SessionFiltersState {
  status: SessionStatus | ''
  agentId: string
  environment: string
  dateRange: '24h' | '7d' | '30d' | ''
  searchQuery: string
  hasAlerts: boolean
  signalId: string
  subCheckId: string

  setStatus: (status: SessionStatus | '') => void
  setAgentId: (agentId: string) => void
  setEnvironment: (environment: string) => void
  setDateRange: (range: '24h' | '7d' | '30d' | '') => void
  setSearchQuery: (q: string) => void
  setHasAlerts: (v: boolean) => void
  setSignalId: (v: string) => void
  setSubCheckId: (v: string) => void
  clearFilters: () => void
  hasActiveFilters: () => boolean
}

const defaults = {
  status: '' as const,
  agentId: '',
  environment: '',
  dateRange: '' as const,
  searchQuery: '',
  hasAlerts: false,
  signalId: '',
  subCheckId: '',
}

export const useSessionFilters = create<SessionFiltersState>((set, get) => ({
  ...defaults,

  setStatus: (status) => set({ status }),
  setAgentId: (agentId) => set({ agentId }),
  setEnvironment: (environment) => set({ environment }),
  setDateRange: (dateRange) => set({ dateRange }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setHasAlerts: (hasAlerts) => set({ hasAlerts }),
  setSignalId: (signalId) => set({ signalId }),
  setSubCheckId: (subCheckId) => set({ subCheckId }),
  clearFilters: () => set(defaults),
  hasActiveFilters: () => {
    const { status, agentId, environment, dateRange, searchQuery, hasAlerts, signalId, subCheckId } = get()
    return !!(status || agentId || environment || dateRange || searchQuery || hasAlerts || signalId || subCheckId)
  },
}))
