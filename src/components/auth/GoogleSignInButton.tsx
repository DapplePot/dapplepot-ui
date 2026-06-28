import { API_BASE } from '../../api/client'

interface GoogleSignInButtonProps {
  // When set, the backend will accept the invite (strict email match) after
  // a successful Google sign-in. Used on the Accept Invite page.
  inviteToken?: string
  // Optional override label (default "Continue with Google").
  label?: string
}

// Sends the user through the server-side OAuth code flow. The backend handles
// state, code exchange, find-or-create, and (optionally) invite acceptance,
// then redirects back to /oauth/callback with tokens in the URL fragment.
export function GoogleSignInButton({ inviteToken, label = 'Continue with Google' }: GoogleSignInButtonProps) {
  function handleClick() {
    const apiBase = API_BASE.replace(/\/+$/, '')
    const url = inviteToken
      ? `${apiBase}/v1/auth/google/start?inviteToken=${encodeURIComponent(inviteToken)}`
      : `${apiBase}/v1/auth/google/start`
    window.location.href = url
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2 rounded border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700"
    >
      <GoogleGlyph />
      {label}
    </button>
  )
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.49h4.84a4.14 4.14 0 01-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 009 18z" />
      <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 013.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.86 11.43 0 9 0A9 9 0 00.96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}
