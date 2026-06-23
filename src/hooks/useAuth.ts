import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import {
  login,
  logout,
  forgotPassword,
  resetPassword,
  acceptInvite,
  signup,
  verifyEmail,
  resendVerification,
} from '../api/auth'
import { useAuthStore } from '../stores/auth'
import { scheduleProactiveRefresh } from '../api/client'
import type {
  LoginRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AcceptInviteRequest,
  SignupRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
} from '../types/auth'

export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const router    = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: LoginRequest) => login(body),
    onSuccess: (data) => {
      // Drop any cache from a previous session before installing new tokens.
      queryClient.clear()
      setTokens(data.accessToken, data.refreshToken, data.user, data.expiresIn)
      scheduleProactiveRefresh(data.expiresIn)
      void router.navigate({ to: '/' })
    },
  })
}

export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => {
      const { refreshToken } = useAuthStore.getState()
      if (!refreshToken) return Promise.resolve()
      return logout({ refreshToken } satisfies LogoutRequest)
    },
    onSettled: () => {
      useAuthStore.getState().clearAuth()
      // Wipe any cached responses (users/me, tenants, etc.) so the next
      // signed-in user doesn't see leftover data from this session.
      queryClient.clear()
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

export function useSignup() {
  // No token storage and no navigation: signup just stages the request.
  // The SignupForm shows a "check your email" success state on completion.
  return useMutation({
    mutationFn: (body: SignupRequest) => signup(body),
  })
}

export function useVerifyEmail() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const router    = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: VerifyEmailRequest) => verifyEmail(body),
    onSuccess: (data) => {
      queryClient.clear()
      setTokens(data.accessToken, data.refreshToken, data.user, data.expiresIn)
      scheduleProactiveRefresh(data.expiresIn)
      void router.navigate({ to: '/' })
    },
  })
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (body: ResendVerificationRequest) => resendVerification(body),
  })
}

export function useAcceptInvite() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const router    = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: AcceptInviteRequest) => acceptInvite(body),
    onSuccess: (data) => {
      queryClient.clear()
      setTokens(data.accessToken, data.refreshToken, data.user, data.expiresIn)
      scheduleProactiveRefresh(data.expiresIn)
      void router.navigate({ to: '/' })
    },
  })
}
