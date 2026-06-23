import { useEffect } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { useVerifyEmail } from '../../hooks/useAuth'

export function VerifyEmailForm() {
  const verify = useVerifyEmail()
  const { token } = useSearch({ from: '/verify-email' })

  useEffect(() => {
    if (token && !verify.isPending && !verify.isSuccess && !verify.isError) {
      verify.mutate({ token })
    }
  }, [token, verify])

  if (!token) {
    return (
      <p className="rounded bg-red-950 px-3 py-2 text-sm text-red-400">
        Missing verification token. Please use the link from your email.
      </p>
    )
  }

  if (verify.isPending) {
    return <p className="text-sm text-zinc-400">Verifying your email…</p>
  }

  if (verify.isSuccess) {
    return (
      <div className="space-y-4">
        <div className="rounded bg-emerald-950 px-4 py-3 text-sm text-emerald-400">
          Your email is verified. You can now use DapplePot.
        </div>
        <Link
          to="/"
          className="block w-full rounded bg-violet-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-violet-500"
        >
          Continue
        </Link>
      </div>
    )
  }

  return (
    <p className="rounded bg-red-950 px-3 py-2 text-sm text-red-400">
      This verification link is invalid or expired. Sign in and request a new one.
    </p>
  )
}
