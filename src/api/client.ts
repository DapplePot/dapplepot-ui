import ky from 'ky'
import { useAuthStore } from '../stores/auth'
import { refresh } from './auth'

export const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

// Deduplicates concurrent token refreshes so only one /refresh call goes out
let refreshPromise: Promise<string | null> | null = null

async function tryRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  const { refreshToken, setAccessToken, clearAuth } = useAuthStore.getState()
  if (!refreshToken) return null

  refreshPromise = refresh({ refreshToken })
    .then((r) => {
      setAccessToken(r.accessToken, r.refreshToken)
      return r.accessToken
    })
    .catch(() => {
      clearAuth()
      return null
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export const apiClient = ky.create({
  prefixUrl: API_BASE,
  timeout: 30_000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().accessToken
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status !== 401) return  // void → ky uses original response

        const newToken = await tryRefresh()
        if (!newToken) {
          window.location.href = '/login'
          return
        }

        // Only retry requests with no body (GETs, HEADs).
        // For mutations the request body ReadableStream is already consumed by
        // the time afterResponse fires and cannot be replayed. In that case the
        // token is now refreshed so the user can retry the action themselves.
        if (request.body !== null) return

        const headers: Record<string, string> = {}
        request.headers.forEach((value, key) => { headers[key] = value })
        headers['Authorization'] = `Bearer ${newToken}`

        return fetch(request.url, { method: request.method, headers })
      },
    ],
  },
})
