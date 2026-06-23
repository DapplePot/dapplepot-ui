import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm'

export function ForgotPassword() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <div className="w-full max-w-md rounded border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="mb-1 text-2xl font-semibold text-white">DapplePot</h1>
        <p className="mb-6 text-sm text-zinc-400">Reset your password</p>
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
