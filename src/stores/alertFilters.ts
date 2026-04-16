import { create } from 'zustand'
import type { AlertStatus } from '@dapplepot/types/alert'

type AlertSeverity = 'info' | 'warning' | 'medium' | 'critical' | ''
type AlertSource   = 'security' | ''

interface AlertFiltersState {
  severity: AlertSeverity
  status: AlertStatus | ''
  ruleId: string
  source: AlertSource

  setSeverity: (severity: AlertSeverity) => void
  setStatus: (status: AlertStatus | '') => void
  setRuleId: (ruleId: string) => void
  setSource: (source: AlertSource) => void
  clearFilters: () => void
}

export const useAlertFilters = create<AlertFiltersState>((set) => ({
  severity: '',
  status: '',
  ruleId: '',
  source: '',

  setSeverity: (severity) => set({ severity }),
  setStatus: (status) => set({ status }),
  setRuleId: (ruleId) => set({ ruleId }),
  setSource: (source) => set({ source }),
  clearFilters: () => set({ severity: '', status: '', ruleId: '', source: '' }),
}))
