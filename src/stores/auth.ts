import { create } from 'zustand'
import type { UserSummary } from '../types/auth'

interface AuthState {
  accessToken:  string | null
  refreshToken: string | null
  user:         UserSummary | null
  setTokens:    (accessToken: string, refreshToken: string, user: UserSummary) => void
  setAccessToken: (accessToken: string, refreshToken: string) => void
  clearAuth:    () => void
}

function loadUser(): UserSummary | null {
  try {
    return JSON.parse(localStorage.getItem('dp_user') ?? 'null') as UserSummary | null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken:  localStorage.getItem('dp_access_token'),
  refreshToken: localStorage.getItem('dp_refresh_token'),
  user:         loadUser(),

  setTokens: (accessToken, refreshToken, user) => {
    localStorage.setItem('dp_access_token', accessToken)
    localStorage.setItem('dp_refresh_token', refreshToken)
    localStorage.setItem('dp_user', JSON.stringify(user))
    set({ accessToken, refreshToken, user })
  },

  setAccessToken: (accessToken, refreshToken) => {
    localStorage.setItem('dp_access_token', accessToken)
    localStorage.setItem('dp_refresh_token', refreshToken)
    set({ accessToken, refreshToken })
  },

  clearAuth: () => {
    localStorage.removeItem('dp_access_token')
    localStorage.removeItem('dp_refresh_token')
    localStorage.removeItem('dp_user')
    set({ accessToken: null, refreshToken: null, user: null })
  },
}))
