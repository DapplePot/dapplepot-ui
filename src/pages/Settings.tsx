import { useState } from 'react'
import { UserPlus, Building2, Copy, Check, User, KeyRound, Users, Palette, Sun, Moon, Monitor, CreditCard, type LucideIcon } from 'lucide-react'
import { useMe } from '../hooks/useUsers'
import { useTenant, useDeleteOwnWorkspace } from '../hooks/useTenants'
import { usePlan } from '../hooks/usePlan'
import { ProfileForm } from '../components/settings/ProfileForm'
import { UserTable } from '../components/settings/UserTable'
import { InviteModal } from '../components/settings/InviteModal'
import { SdkKeySection } from '../components/settings/SdkKeySection'
import { BillingSection } from '../components/settings/BillingSection'
import { useTheme } from '../hooks/useTheme'
import type { Theme } from '../stores/theme'

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionId = 'profile' | 'sdk-keys' | 'billing' | 'users' | 'tenant' | 'preferences'

interface NavItem {
  id:          SectionId
  label:       string
  description: string
  icon:        LucideIcon
  adminOnly:   boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'profile',     label: 'Profile',      description: 'Your name, email, and password.',                          icon: User,       adminOnly: false },
  { id: 'sdk-keys',    label: 'SDK Keys',     description: 'API keys used to authenticate the DapplePot SDK.',         icon: KeyRound,   adminOnly: false },
  { id: 'billing',     label: 'Billing & Usage', description: 'Your current plan, event quota, and usage history.',    icon: CreditCard, adminOnly: true  },
  { id: 'preferences', label: 'Preferences',  description: 'Appearance and display settings.',                         icon: Palette,    adminOnly: false },
  { id: 'users',       label: 'Users',        description: 'Manage team members and their roles within this tenant.',   icon: Users,      adminOnly: true  },
  { id: 'tenant',      label: 'Tenant',       description: 'Details and identifiers for your organisation\'s tenant.', icon: Building2,  adminOnly: true  },
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

function TenantSection({ tenantId, label, currentUserId }: { tenantId: string; label: string; currentUserId: string }) {
  const { data: tenant, isLoading } = useTenant(tenantId)
  const [showDelete, setShowDelete] = useState(false)

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded bg-slate-100 dark:bg-zinc-800" />
  }

  if (!tenant) return null

  // Only the owner can self-serve delete the workspace.
  const isOwner = tenant.ownerUserId === currentUserId

  return (
    <div className="space-y-4">
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
        <CopyableId label={`${label} ID`} value={tenant.tenantId} />
      </div>

      {/* Danger zone — owner-only, irreversible. */}
      {isOwner && (
        <div className="rounded border border-red-200 bg-white px-4 py-3 dark:border-red-900/50 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
            Danger zone
          </p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">Delete this {label.toLowerCase()}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                Permanently removes the {label.toLowerCase()}, all member access, agents, sessions, alerts,
                audit archives, and any active subscription. This cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="shrink-0 rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              Delete {label.toLowerCase()}
            </button>
          </div>
        </div>
      )}

      {showDelete && (
        <DeleteWorkspaceModal
          tenantName={tenant.name}
          label={label}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}

function DeleteWorkspaceModal({ tenantName, label, onClose }: { tenantName: string; label: string; onClose: () => void }) {
  const deleteMut = useDeleteOwnWorkspace()
  const [confirmName, setConfirmName] = useState('')

  const canDelete = confirmName.trim() === tenantName && !deleteMut.isPending

  function handleDelete() {
    if (!canDelete) return
    // On success the mutation clears auth + navigates to /login.
    deleteMut.mutate(confirmName.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => { if (!deleteMut.isPending) onClose() }}
    >
      <div
        className="w-full max-w-md rounded border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-zinc-100">
          Delete {label.toLowerCase()}
        </h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-zinc-400">
          This permanently removes <strong>{tenantName}</strong> and every piece of data inside it.
          This cannot be undone.
        </p>

        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
          Type <span className="font-mono text-slate-900 dark:text-zinc-100">{tenantName}</span> to confirm
        </label>
        <input
          type="text"
          autoFocus
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          disabled={deleteMut.isPending}
          className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />

        {deleteMut.isError && (
          <p className="mt-3 rounded bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {(deleteMut.error as Error)?.message ?? `Failed to delete ${label.toLowerCase()}.`}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2 text-sm">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteMut.isPending}
            className="rounded px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete}
            className="rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {deleteMut.isPending ? `Deleting…` : `Delete ${label.toLowerCase()}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Settings() {
  // ── All hooks at the top, before any early returns (Rules of Hooks) ──
  const { data: me, isLoading } = useMe()
  const { data: tenant } = useTenant(me?.tenantId ?? null)
  const { plan } = usePlan()
  const [activeSection, setActiveSection] = useState<SectionId>('profile')
  const [showInvite, setShowInvite] = useState(false)
  const [userSearch, setUserSearch] = useState('')

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
  // Personal workspaces are single-user dev sandboxes: the team-management ('users')
  // and tenant-configuration ('tenant') tabs aren't relevant.
  const isPersonalTenant = tenant?.kind === 'personal'
  const isInternal       = plan?.planTier === 'internal'
  const isEnterprise     = plan?.planTier === 'enterprise'

  // Customer-facing tiers (Free/Pro/Team/Internal) say "Workspace" — friendlier
  // and consistent with the sidebar's workspace switcher. Enterprise customers
  // are used to the technical term "Tenant" from MSAs / B2B contracts.
  const tenantLabel = isEnterprise ? 'Tenant' : 'Workspace'

  const visibleNav = NAV_ITEMS
    .filter(item => {
      if (item.adminOnly && !isAdmin) return false
      // Personal workspaces are single-user — hide the Users tab. The
      // Workspace tab is still relevant (workspace ID, settings) so it stays.
      if (item.id === 'users' && isPersonalTenant) return false
      // Internal tenants are comp accounts with no caps — Billing & Usage isn't meaningful.
      if (item.id === 'billing' && isInternal) return false
      return true
    })
    .map(item =>
      item.id === 'tenant'
        ? {
            ...item,
            label:       tenantLabel,
            description: `Details and identifiers for your ${tenantLabel.toLowerCase()}.`,
          }
        : item
    )

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

          {safeActive === 'billing' && (
            <BillingSection />
          )}

          {safeActive === 'preferences' && (
            <PreferencesSection />
          )}

          {safeActive === 'users' && isAdmin && (
            <>
              <div className="mb-4 flex items-center gap-3">
                <input
                  type="search"
                  placeholder="Search users…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full max-w-xs rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
                <button
                  onClick={() => setShowInvite(true)}
                  className="ml-auto flex shrink-0 items-center gap-1.5 rounded bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite user
                </button>
              </div>
              <UserTable search={userSearch} />
            </>
          )}

          {safeActive === 'tenant' && isAdmin && me.tenantId && (
            <TenantSection tenantId={me.tenantId} label={tenantLabel} currentUserId={me.userId} />
          )}
        </div>

      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  )
}
