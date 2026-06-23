import { Link, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard,
  List,
  BarChart2,
  Bell,
  Shield,
  Settings,
  Boxes,
  Building2,
  UserPlus,
  FileCheck2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronsUpDown,
  Plus,
  FileText,
} from 'lucide-react'
import { cn } from '../utils/cn'
import { useUiStore } from '../stores/ui'
import { useLogout } from '../hooks/useAuth'
import { useAuthStore } from '../stores/auth'
import { useTenant, useMyTenants, useSwitchTenant, useCreatePersonalWorkspace } from '../hooks/useTenants'

const NAV_ITEMS = [
  { path: '/',          label: 'Overview',  icon: LayoutDashboard, exclude: ['superadmin'] },
  { path: '/sessions',  label: 'Sessions',  icon: List,            exclude: ['superadmin'] },
  { path: '/detection', label: 'Detection', icon: Bell,            exclude: ['superadmin'] },
  { path: '/analytics', label: 'Analytics', icon: BarChart2,       exclude: ['superadmin'] },
  { path: '/security',  label: 'Security',  icon: Shield,          exclude: ['superadmin'] },
  { path: '/inventory', label: 'Inventory', icon: Boxes,           exclude: ['superadmin'] },
  { path: '/audit',     label: 'Audit',     icon: FileCheck2,      exclude: ['superadmin', 'editor', 'viewer'] },
  { path: '/settings',  label: 'Settings',  icon: Settings,        exclude: ['superadmin'] },
  { path: '/tenants',         label: 'Tenants',         icon: Building2,       exclude: ['admin', 'editor', 'viewer'] },
  { path: '/onboard-client',  label: 'Onboard Client',  icon: UserPlus,        exclude: ['admin', 'editor', 'viewer'] },
  { path: '/blogs',           label: 'Blogs',           icon: FileText,        exclude: ['admin', 'editor', 'viewer'] },
]

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle    = useUiStore((s) => s.toggleSidebar)
  const pathname  = useRouterState({ select: (s) => s.location.pathname })
  const user      = useAuthStore((s) => s.user)
  const logout    = useLogout()
  const { data: tenant } = useTenant(user?.tenantId ?? null)
  const { data: myTenants } = useMyTenants()
  const switchTenantMut = useSwitchTenant()
  const createPersonalMut = useCreatePersonalWorkspace()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const otherTenants = (myTenants ?? []).filter(t => t.tenantId !== user?.tenantId)
  const hasPersonalTenant = (myTenants ?? []).some(t => t.kind === 'personal')
  const activeIsPersonal = tenant?.kind === 'personal'
  // The block is interactive whenever the dropdown has something to offer:
  // another workspace to switch to, or the option to create a personal one.
  const hasSwitcher = !collapsed && (otherTenants.length > 0 || !hasPersonalTenant)

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-slate-200 bg-white transition-all duration-200 dark:border-zinc-700 dark:bg-zinc-900',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-3 dark:border-zinc-700">
        {collapsed ? (
          <button
            onClick={toggle}
            aria-label="Expand sidebar"
            className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <>
            <div className="flex min-w-0 items-center">
              <img src="/dapplePotLogo.png" alt="DapplePot" className="h-5 w-5 shrink-0 rounded invert dark:invert-0" />
              <span className="ml-2.5 truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">
                DapplePot
              </span>
            </div>
            <button
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {NAV_ITEMS.filter(({ exclude, path }) => {
          if (exclude.includes(user?.role as 'superadmin')) return false
          // Audit isn't available on personal workspaces (no sealed archives are produced).
          if (path === '/audit' && activeIsPersonal) return false
          return true
        }).map(({ path, label, icon: Icon }) => {
          const isActive = path === '/'
            ? pathname === '/'
            : pathname.startsWith(path)
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 rounded px-2 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-violet-50 text-violet-700 font-medium dark:bg-violet-950 dark:text-violet-300'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-slate-200 px-2 py-2 space-y-1 dark:border-zinc-700">
        {!collapsed && user && (
          <div
            className="relative"
            onMouseEnter={() => hasSwitcher && setSwitcherOpen(true)}
            onMouseLeave={() => setSwitcherOpen(false)}
          >
            {hasSwitcher ? (
              <button
                type="button"
                onClick={() => setSwitcherOpen(o => !o)}
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-900 dark:text-zinc-100">{tenant?.name ?? '—'}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                    {user.name}
                    {tenant?.kind === 'organization' && ` · ${user.role}`}
                  </p>
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
              </button>
            ) : (
              <div className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-900 dark:text-zinc-100">{tenant?.name ?? '—'}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                    {user.name}
                    {tenant?.kind === 'organization' && ` · ${user.role}`}
                  </p>
                </div>
              </div>
            )}

            {hasSwitcher && switcherOpen && (
              <div className="absolute bottom-full left-0 z-20 mb-1 w-full rounded border border-slate-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-zinc-500">
                  Workspaces
                </div>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-zinc-800"
                  disabled
                >
                  <span className="truncate text-slate-900 dark:text-zinc-100">{tenant?.name}</span>
                  <Check className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                </button>
                {otherTenants.map((t) => (
                  <button
                    key={t.tenantId}
                    type="button"
                    onClick={() => {
                      setSwitcherOpen(false)
                      switchTenantMut.mutate(t.tenantId)
                    }}
                    disabled={switchTenantMut.isPending}
                    className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-zinc-800"
                  >
                    <span className="truncate text-slate-700 dark:text-zinc-300">{t.name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">{t.role}</span>
                  </button>
                ))}

                {!hasPersonalTenant && (
                  <>
                    <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setSwitcherOpen(false)
                        createPersonalMut.mutate()
                      }}
                      disabled={createPersonalMut.isPending}
                      className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-violet-600 hover:bg-violet-50 disabled:opacity-50 dark:text-violet-400 dark:hover:bg-zinc-800"
                    >
                      <Plus className="h-3.5 w-3.5 shrink-0" />
                      <span>{createPersonalMut.isPending ? 'Creating…' : 'Create personal workspace'}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="flex w-full items-center gap-3 rounded px-2 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-red-600 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

    </aside>
  )
}
