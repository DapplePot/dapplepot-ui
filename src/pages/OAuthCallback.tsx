import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../stores/auth'
import { scheduleProactiveRefresh } from '../api/client'
import type { UserSummary } from '../types/auth'

// Backend redirects here with everything in the URL fragment so tokens
// never appear in HTTP logs:
//   /oauth/callback#accessToken=...&refreshToken=...&user=<base64url JSON>&expiresIn=900
// or on failure:
//   /oauth/callback#error=OAUTH_STATE_INVALID
//
// We parse, push the session into the auth store, strip the fragment, and
// navigate to the dashboard. Nothing renders on the success path — the user
// just sees a brief flash before the dashboard loads. An error card only
// appears for actual failures.

// Capture the fragment ONCE at module load, before React's StrictMode dev
// double-mount can wipe it. Sub-second timing matters here.
const initialFragment = (() => {
  const raw = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  return new URLSearchParams(raw)
})()

function describeError(code: string, params: URLSearchParams): string {
  switch (code) {
    case 'OAUTH_NOT_CONFIGURED':
      return 'Google sign-in isn\'t set up on this server yet. Contact your admin.'
    case 'OAUTH_STATE_MISSING':
    case 'OAUTH_STATE_INVALID':
    case 'OAUTH_STATE_EXPIRED':
      return 'Sign-in link expired or was tampered with. Please start again.'
    case 'OAUTH_TOKEN_EXCHANGE_FAILED':
    case 'OAUTH_USERINFO_FAILED':
    case 'OAUTH_USERINFO_INVALID':
      return 'Google sign-in failed. Please try again.'
    case 'OAUTH_EMAIL_NOT_VERIFIED':
      return 'Your Google account email isn\'t verified. Verify it with Google and try again.'
    case 'ACCOUNT_DISABLED':
      return 'This account is disabled. Contact your admin.'
    case 'OAUTH_CREATE_FAILED':
    case 'OAUTH_UNKNOWN_FAILURE':
      return 'Couldn\'t finish sign-in. Please try again.'
    case 'INVALID_INVITE_TOKEN':
      return 'This invite is invalid or has expired.'
    case 'INVITE_EMAIL_MISMATCH': {
      const invited = params.get('inviteEmail') ?? 'the invited address'
      const googleEmail = params.get('googleEmail') ?? 'a different account'
      return `This invite was issued to ${invited}, but you signed in as ${googleEmail}. Sign in to Google as ${invited} and try again.`
    }
    default:
      return 'Sign-in failed. Please try again.'
  }
}

export function OAuthCallback() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // StrictMode runs effects twice in dev. Guard against double-processing.
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const params = initialFragment

    const err = params.get('error')
    if (err) {
      setErrorMessage(describeError(err, params))
      window.history.replaceState(null, '', window.location.pathname)
      return
    }

    const accessToken  = params.get('accessToken')
    const refreshToken = params.get('refreshToken')
    const userBlob     = params.get('user')
    const expiresIn    = Number(params.get('expiresIn') ?? '900')

    if (!accessToken || !refreshToken || !userBlob) {
      setErrorMessage('Sign-in response was incomplete. Please try again.')
      window.history.replaceState(null, '', window.location.pathname)
      return
    }

    let user: UserSummary
    try {
      const json = atob(userBlob.replace(/-/g, '+').replace(/_/g, '/'))
      user = JSON.parse(json) as UserSummary
    } catch {
      setErrorMessage('Sign-in response was malformed. Please try again.')
      window.history.replaceState(null, '', window.location.pathname)
      return
    }

    setTokens(accessToken, refreshToken, user, expiresIn)
    scheduleProactiveRefresh(expiresIn)
    window.history.replaceState(null, '', window.location.pathname)
    void navigate({ to: '/' })
  }, [navigate, setTokens])

  // Success path: render nothing — user sees a brief blank, then the dashboard.
  if (!errorMessage) return null

  // Error path: show the card so the user knows what to do.
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <div className="w-full max-w-md rounded border border-zinc-800 bg-zinc-900 p-8 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-white">DapplePot</h1>
        <p className="mb-4 text-sm text-red-400">{errorMessage}</p>
        <Link to="/login" className="text-sm text-violet-400 hover:text-violet-300">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
