import ky from 'ky'
import { useAuthStore } from '../stores/auth'

export const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export const apiClient = ky.create({
  prefixUrl: API_BASE,
  timeout: 30_000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().token
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 401) {
          useAuthStore.getState().clearToken()
          window.location.href = '/login'
        }
      },
    ],
  },
})
