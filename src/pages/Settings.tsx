import { useState } from 'react'
import { UserPlus, Building2, Copy, Check, User, KeyRound, Users, type LucideIcon } from 'lucide-react'
import { useMe } from '../hooks/useUsers'
import { useTenant } from '../hooks/useTenants'
import { ProfileForm } from '../components/settings/ProfileForm'
import { UserTable } from '../components/settings/UserTable'
import { InviteModal } from '../components/settings/InviteModal'
import { SdkKeySection } from '../components/settings/SdkKeySection'

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionId = 'profile' | 'sdk-keys' | 'users' | 'tenant'

interface NavItem {
  id:          SectionId
  label:       string
  description: string
  icon:        LucideIcon
  adminOnly:   boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'profile',  label: 'Profile',  description: 'Your name, email, and password.',                          icon: User,      adminOnly: false },
  { id: 'sdk-keys', label: 'SDK Keys', description: 'API keys used to authenticate the DapplePot SDK.',         icon: KeyRound,  adminOnly: false },
  { id: 'users',    label: 'Users',    description: 'Manage team members and their roles within this tenant.',   icon: Users,     adminOnly: true  },
  { id: 'tenant',   label: 'Tenant',   description: 'Details and identifiers for your organisation\'s tenant.', icon: Building2, adminOnly: true  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 border-b border-slate-100 pb-4">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && (
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      )}
    </div>
  )
}

function CopyableId({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 font-mono text-xs text-slate-700">{value}</p>
      </div>
      <button
        onClick={handleCopy}
        title={`Copy ${label}`}
        className="ml-4 flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-500 shadow-sm transition-colors hover:border-violet-300 hover:text-violet-600"
      >
        {copied
          ? <><Check className="h-3 w-3 text-emerald-500" /> Copied</>
          : <><Copy className="h-3 w-3" /> Copy</>}
      </button>
    </div>
  )
}

// ─── Section content ──────────────────────────────────────────────────────────

function TenantSection({ tenantId }: { tenantId: string }) {
  const { data: tenant, isLoading } = useTenant(tenantId)

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
  }

  if (!tenant) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
          <Building2 className="h-3.5 w-3.5 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{tenant.name}</p>
          <p className="text-[10px] text-slate-400">
            {tenant.enabled ? 'Active' : 'Disabled'}
            {tenant.tokenBudget != null && ` · ${tenant.tokenBudget.toLocaleString()} token budget`}
            {tenant.rateLimit  != null && ` · ${tenant.rateLimit} req/min rate limit`}
          </p>
        </div>
      </div>
      <CopyableId label="Tenant ID" value={tenant.tenantId} />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Settings() {
  const { data: me, isLoading } = useMe()
  const [activeSection, setActiveSection] = useState<SectionId>('profile')
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

  const isAdmin = me.role === 'admin'
  const visibleNav = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)

  // Guard: if active section was admin-only and user isn't admin, fall back
  const safeActive = visibleNav.find(n => n.id === activeSection)
    ? activeSection
    : visibleNav[0].id

  const activeItem = visibleNav.find(n => n.id === safeActive)!

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex gap-8">

        {/* ── Sidebar nav ── */}
        <nav className="w-44 shrink-0">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Settings
          </p>
          <ul className="space-y-0.5">
            {visibleNav.map(item => {
              const Icon = item.icon
              const isActive = item.id === safeActive
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-violet-50 font-medium text-violet-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-violet-500' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* ── Content panel ── */}
        <div className="min-w-0 flex-1">
          <SectionHeader title={activeItem.label} description={activeItem.description} />

          {safeActive === 'profile' && (
            <ProfileForm user={me} />
          )}

          {safeActive === 'sdk-keys' && (
            <SdkKeySection isAdmin={isAdmin} />
          )}

          {safeActive === 'users' && isAdmin && (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setShowInvite(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite user
                </button>
              </div>
              <UserTable />
            </>
          )}

          {safeActive === 'tenant' && isAdmin && me.tenantId && (
            <TenantSection tenantId={me.tenantId} />
          )}
        </div>

      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  )
}
