import { create } from 'zustand'

interface AuthState {
  token: string | null
  setToken: (token: string) => void
  clearToken: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('dp_token'),
  setToken: (token) => {
    localStorage.setItem('dp_token', token)
    set({ token })
  },
  clearToken: () => {
    localStorage.removeItem('dp_token')
    set({ token: null })
  },
}))
