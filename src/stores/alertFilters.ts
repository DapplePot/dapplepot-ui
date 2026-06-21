import { create } from 'zustand'
import type { AlertStatus } from '@dapplepot/types/alert'

type AlertSeverity = 'info' | 'warning' | 'medium' | 'critical' | ''

interface AlertFiltersState {
  severity: AlertSeverity
  status: AlertStatus | ''

  setSeverity: (severity: AlertSeverity) => void
  setStatus: (status: AlertStatus | '') => void
  clearFilters: () => void
}

export const useAlertFilters = create<AlertFiltersState>((set) => ({
  severity: '',
  status: '',

  setSeverity: (severity) => set({ severity }),
  setStatus: (status) => set({ status }),
  clearFilters: () => set({ severity: '', status: '' }),
}))
