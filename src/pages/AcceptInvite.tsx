import { InviteAcceptForm } from '../components/auth/InviteAcceptForm'

export function AcceptInvite() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm rounded border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <h1 className="mb-1 text-xl font-semibold text-white">Accept invite</h1>
        <p className="mb-6 text-sm text-slate-400">Set your name and password to get started.</p>
        <InviteAcceptForm />
      </div>
    </div>
  )
}
