import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import {
  login,
  logout,
  forgotPassword,
  resetPassword,
  acceptInvite,
} from '../api/auth'
import { useAuthStore } from '../stores/auth'
import { scheduleProactiveRefresh } from '../api/client'
import type {
  LoginRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AcceptInviteRequest,
} from '../types/auth'

export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const router    = useRouter()

  return useMutation({
    mutationFn: (body: LoginRequest) => login(body),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken, data.user, data.expiresIn)
      scheduleProactiveRefresh(data.expiresIn)
      void router.navigate({ to: '/' })
    },
  })
}

export function useLogout() {
  const router = useRouter()

  return useMutation({
    mutationFn: () => {
      const { refreshToken } = useAuthStore.getState()
      if (!refreshToken) return Promise.resolve()
      return logout({ refreshToken } satisfies LogoutRequest)
    },
    onSettled: () => {
      useAuthStore.getState().clearAuth()
      void router.navigate({ to: '/login' })
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (body: ForgotPasswordRequest) => forgotPassword(body),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (body: ResetPasswordRequest) => resetPassword(body),
  })
}

export function useAcceptInvite() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const router    = useRouter()

  return useMutation({
    mutationFn: (body: AcceptInviteRequest) => acceptInvite(body),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken, data.user, data.expiresIn)
      scheduleProactiveRefresh(data.expiresIn)
      void router.navigate({ to: '/' })
    },
  })
}
