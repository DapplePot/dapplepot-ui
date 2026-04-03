import { LoginForm } from '../components/auth/LoginForm'

export function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <h1 className="mb-1 text-xl font-semibold text-white">Dapplepot</h1>
        <p className="mb-6 text-sm text-slate-400">Sign in to your account</p>
        <LoginForm />
      </div>
    </div>
  )
}
