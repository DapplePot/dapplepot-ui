import { create } from 'zustand'

interface UiState {
  sidebarCollapsed: boolean
  activeTab: string
  selectedSessionId: string | null

  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  setActiveTab: (tab: string) => void
  setSelectedSessionId: (id: string | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  activeTab: 'overview',
  selectedSessionId: null,

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedSessionId: (id) => set({ selectedSessionId: id }),
}))
