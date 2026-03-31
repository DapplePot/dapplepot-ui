import ky from 'ky'
import { API_BASE } from './client'

export interface LoginRequest {
  email:    string
  password: string
}

export interface LoginResponse {
  token:     string   // JWT — store in localStorage via useAuthStore
  expiresAt: string   // ISO 8601
}

export async function login(body: LoginRequest): Promise<LoginResponse> {
  return ky.post(`${API_BASE}/v1/auth/login`, { json: body }).json()
}
