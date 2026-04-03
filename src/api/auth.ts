import ky from 'ky'
import type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AcceptInviteRequest,
} from '../types/auth'

// Bare client — no auth header, used for token-lifecycle endpoints
const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
const bare = ky.create({ prefixUrl: API_BASE, timeout: 30_000 })

export function login(body: LoginRequest): Promise<LoginResponse> {
  return bare.post('v1/auth/login', { json: body }).json()
}

export function refresh(body: RefreshRequest): Promise<RefreshResponse> {
  return bare.post('v1/auth/refresh', { json: body }).json()
}

export async function logout(body: LogoutRequest): Promise<void> {
  await bare.post('v1/auth/logout', { json: body })
}

export async function forgotPassword(body: ForgotPasswordRequest): Promise<void> {
  await bare.post('v1/auth/forgot-password', { json: body })
}

export async function resetPassword(body: ResetPasswordRequest): Promise<void> {
  await bare.post('v1/auth/reset-password', { json: body })
}

export function acceptInvite(body: AcceptInviteRequest): Promise<LoginResponse> {
  return bare.post('v1/auth/accept-invite', { json: body }).json()
}
