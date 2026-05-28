import { create } from 'zustand'
import type { UserSummary } from '../types/auth'

interface AuthState {
  accessToken:   string | null
  refreshToken:  string | null
  user:          UserSummary | null
  accessTokenExpiresAt: number | null  // unix ms; used by proactive refresh timer
  setTokens:     (accessToken: string, refreshToken: string, user: UserSummary, expiresIn?: number) => void
  setAccessToken:(accessToken: string, refreshToken: string, expiresIn?: number) => void
  clearAuth:     () => void
}

function loadUser(): UserSummary | null {
  try {
    return JSON.parse(localStorage.getItem('dp_user') ?? 'null') as UserSummary | null
  } catch {
    return null
  }
}

function loadExpiresAt(): number | null {
  const v = localStorage.getItem('dp_access_token_expires_at')
  return v ? Number(v) : null
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken:          localStorage.getItem('dp_access_token'),
  refreshToken:         localStorage.getItem('dp_refresh_token'),
  user:                 loadUser(),
  accessTokenExpiresAt: loadExpiresAt(),

  setTokens: (accessToken, refreshToken, user, expiresIn = 900) => {
    const expiresAt = Date.now() + expiresIn * 1000
    localStorage.setItem('dp_access_token', accessToken)
    localStorage.setItem('dp_refresh_token', refreshToken)
    localStorage.setItem('dp_user', JSON.stringify(user))
    localStorage.setItem('dp_access_token_expires_at', String(expiresAt))
    set({ accessToken, refreshToken, user, accessTokenExpiresAt: expiresAt })
  },

  setAccessToken: (accessToken, refreshToken, expiresIn = 900) => {
    const expiresAt = Date.now() + expiresIn * 1000
    localStorage.setItem('dp_access_token', accessToken)
    localStorage.setItem('dp_refresh_token', refreshToken)
    localStorage.setItem('dp_access_token_expires_at', String(expiresAt))
    set({ accessToken, refreshToken, accessTokenExpiresAt: expiresAt })
  },

  clearAuth: () => {
    localStorage.removeItem('dp_access_token')
    localStorage.removeItem('dp_refresh_token')
    localStorage.removeItem('dp_user')
    localStorage.removeItem('dp_access_token_expires_at')
    set({ accessToken: null, refreshToken: null, user: null, accessTokenExpiresAt: null })
  },
}))
