import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useMe } from '../hooks/useUsers'
import { ProfileForm } from '../components/settings/ProfileForm'
import { UserTable } from '../components/settings/UserTable'
import { InviteModal } from '../components/settings/InviteModal'
import { SdkKeySection } from '../components/settings/SdkKeySection'

export function Settings() {
  const { data: me, isLoading } = useMe()
  const [showInvite, setShowInvite] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    )
  }

  if (!me) return null

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/* Profile */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Profile</h2>
        <ProfileForm user={me} />
      </section>

      {/* User management — admin only */}
      {me.role === 'admin' && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Users</h2>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500"
            >
              <UserPlus className="h-4 w-4" />
              Invite user
            </button>
          </div>
          <UserTable />
        </section>
      )}

      {/* SDK Keys — visible to all, reveal only for admin */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-900">SDK Keys</h2>
        <SdkKeySection isAdmin={me.role === 'admin'} />
      </section>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  )
}
