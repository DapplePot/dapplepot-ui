import { create } from 'zustand'
import type { AlertStatus } from '@dapplepot/types/alert'

type AlertSeverity = 'info' | 'warning' | 'medium' | 'critical' | ''

interface AlertFiltersState {
  severity: AlertSeverity
  status: AlertStatus | ''
  ruleId: string

  setSeverity: (severity: AlertSeverity) => void
  setStatus: (status: AlertStatus | '') => void
  setRuleId: (ruleId: string) => void
  clearFilters: () => void
}

export const useAlertFilters = create<AlertFiltersState>((set) => ({
  severity: '',
  status: '',
  ruleId: '',

  setSeverity: (severity) => set({ severity }),
  setStatus: (status) => set({ status }),
  setRuleId: (ruleId) => set({ ruleId }),
  clearFilters: () => set({ severity: '', status: '', ruleId: '' }),
}))
