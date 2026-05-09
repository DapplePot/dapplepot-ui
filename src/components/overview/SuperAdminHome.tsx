import { Link } from '@tanstack/react-router'
import { UserPlus } from 'lucide-react'

export function SuperAdminHome() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 mb-5">
        <span className="text-lg font-bold text-white">dp</span>
      </div>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Welcome, Dapplepot Admin</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-sm dark:text-slate-400">
        You have system-level access. Use the option below to onboard new client tenants.
      </p>
      <Link
        to="/onboard-client"
        className="mt-6 flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
      >
        <UserPlus className="h-4 w-4" />
        Onboard a client
      </Link>
    </div>
  )
}
