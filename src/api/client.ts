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
      setAccessToken(r.accessToken, r.refreshToken, r.expiresIn)
      scheduleProactiveRefresh(r.expiresIn)
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

// ── Proactive refresh ─────────────────────────────────────────────────────────
// Fires 60 s before the access token expires so the user is never caught with
// an expired token mid-session. Uses the expiresIn value from the login/refresh
// response rather than a hardcoded constant.
let proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleProactiveRefresh(expiresIn: number): void {
  if (proactiveRefreshTimer !== null) clearTimeout(proactiveRefreshTimer)
  const delayMs = Math.max((expiresIn - 60) * 1000, 0)
  proactiveRefreshTimer = setTimeout(() => {
    proactiveRefreshTimer = null
    void tryRefresh()
  }, delayMs)
}

// Re-schedule on page load if a token is already stored
;(function initProactiveRefresh() {
  const { accessTokenExpiresAt, refreshToken } = useAuthStore.getState()
  if (!refreshToken || !accessTokenExpiresAt) return
  const remainingMs = accessTokenExpiresAt - Date.now()
  const fireInMs = Math.max(remainingMs - 60_000, 0)
  if (fireInMs < 0) {
    // Token already expired — attempt immediate refresh
    void tryRefresh()
    return
  }
  proactiveRefreshTimer = setTimeout(() => {
    proactiveRefreshTimer = null
    void tryRefresh()
  }, fireInMs)
})()

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
        // For mutations the body ReadableStream is already consumed by the time
        // afterResponse fires and cannot be replayed. Redirect to /login so the
        // user knows their session expired rather than seeing a silent failure.
        if (request.body !== null) {
          window.location.href = '/login'
          return
        }

        const headers: Record<string, string> = {}
        request.headers.forEach((value, key) => { headers[key] = value })
        headers['Authorization'] = `Bearer ${newToken}`

        return fetch(request.url, { method: request.method, headers })
      },
    ],
  },
})
