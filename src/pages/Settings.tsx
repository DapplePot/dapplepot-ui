import { useState } from 'react'
import { UserPlus, Building2, Copy, Check, User, KeyRound, Users, Palette, Sun, Moon, Monitor, type LucideIcon } from 'lucide-react'
import { useMe } from '../hooks/useUsers'
import { useTenant } from '../hooks/useTenants'
import { ProfileForm } from '../components/settings/ProfileForm'
import { UserTable } from '../components/settings/UserTable'
import { InviteModal } from '../components/settings/InviteModal'
import { SdkKeySection } from '../components/settings/SdkKeySection'
import { useTheme } from '../hooks/useTheme'
import type { Theme } from '../stores/theme'

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionId = 'profile' | 'sdk-keys' | 'users' | 'tenant' | 'preferences'

interface NavItem {
  id:          SectionId
  label:       string
  description: string
  icon:        LucideIcon
  adminOnly:   boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'profile',     label: 'Profile',      description: 'Your name, email, and password.',                          icon: User,      adminOnly: false },
  { id: 'sdk-keys',    label: 'SDK Keys',     description: 'API keys used to authenticate the DapplePot SDK.',         icon: KeyRound,  adminOnly: false },
  { id: 'preferences', label: 'Preferences',  description: 'Appearance and display settings.',                         icon: Palette,   adminOnly: false },
  { id: 'users',       label: 'Users',        description: 'Manage team members and their roles within this tenant.',   icon: Users,     adminOnly: true  },
  { id: 'tenant',      label: 'Tenant',       description: 'Details and identifiers for your organisation\'s tenant.', icon: Building2, adminOnly: true  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 border-b border-slate-100 pb-4 dark:border-zinc-800">
      <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">{title}</h2>
      {description && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{description}</p>
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
    <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-zinc-500">{label}</p>
        <p className="mt-0.5 font-mono text-xs text-slate-700 dark:text-zinc-300">{value}</p>
      </div>
      <button
        onClick={handleCopy}
        title={`Copy ${label}`}
        className="ml-4 flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-500 shadow-sm transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:border-violet-500 dark:hover:text-violet-400"
      >
        {copied
          ? <><Check className="h-3 w-3 text-emerald-500" /> Copied</>
          : <><Copy className="h-3 w-3" /> Copy</>}
      </button>
    </div>
  )
}

// ─── Appearance section ───────────────────────────────────────────────────────

const THEME_OPTIONS: { value: Theme; label: string; icon: LucideIcon; desc: string }[] = [
  { value: 'light',  label: 'Light',  icon: Sun,     desc: 'Always use the light theme' },
  { value: 'dark',   label: 'Dark',   icon: Moon,    desc: 'Always use the dark theme' },
  { value: 'system', label: 'System', icon: Monitor, desc: 'Follow your device setting' },
]

function PreferencesSection() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Appearance</h3>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">Choose how DapplePot looks to you.</p>

        <div className="mt-4 flex gap-3">
          {THEME_OPTIONS.map(({ value, label, icon: Icon, desc }) => {
            const isActive = theme === value
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={[
                  'flex flex-1 flex-col items-center gap-2 rounded border-2 px-4 py-5 text-sm transition-all',
                  isActive
                    ? 'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/40'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-750',
                ].join(' ')}
              >
                <Icon className={[
                  'h-6 w-6',
                  isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-zinc-500',
                ].join(' ')} />
                <span className={[
                  'font-medium',
                  isActive ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-zinc-300',
                ].join(' ')}>
                  {label}
                </span>
                <span className="text-[11px] text-center text-slate-400 dark:text-zinc-500">{desc}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Section content ──────────────────────────────────────────────────────────

function TenantSection({ tenantId }: { tenantId: string }) {
  const { data: tenant, isLoading } = useTenant(tenantId)

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded bg-slate-100 dark:bg-zinc-800" />
  }

  if (!tenant) return null

  return (
    <div className="rounded border border-slate-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800">
          <Building2 className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{tenant.name}</p>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500">
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
          <div key={i} className="h-10 animate-pulse rounded bg-slate-100 dark:bg-zinc-800" />
        ))}
      </div>
    )
  }

  if (!me) return null

  const isAdmin = me.role === 'admin'
  const visibleNav = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)

  const safeActive = visibleNav.find(n => n.id === activeSection)
    ? activeSection
    : visibleNav[0].id

  const activeItem = visibleNav.find(n => n.id === safeActive)!

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex gap-8">

        {/* ── Sidebar nav ── */}
        <nav className="w-44 shrink-0">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
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
                    className={`flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-violet-50 font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-violet-500 dark:text-violet-400' : 'text-slate-400 dark:text-zinc-500'}`} />
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

          {safeActive === 'preferences' && (
            <PreferencesSection />
          )}

          {safeActive === 'users' && isAdmin && (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setShowInvite(true)}
                  className="flex items-center gap-1.5 rounded bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500"
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
