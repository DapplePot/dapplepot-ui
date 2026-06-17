import { Link, useRouterState } from '@tanstack/react-router'
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
} from 'lucide-react'
import { cn } from '../utils/cn'
import { useUiStore } from '../stores/ui'
import { useLogout } from '../hooks/useAuth'
import { useAuthStore } from '../stores/auth'
import { useTenant } from '../hooks/useTenants'

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
]

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle    = useUiStore((s) => s.toggleSidebar)
  const pathname  = useRouterState({ select: (s) => s.location.pathname })
  const user      = useAuthStore((s) => s.user)
  const logout    = useLogout()
  const { data: tenant } = useTenant(user?.tenantId ?? null)

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-slate-200 bg-white transition-all duration-200 dark:border-zinc-700 dark:bg-zinc-900',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-slate-200 px-3 dark:border-zinc-700">
        <img src="/dapplePotLogo.png" alt="DapplePot" className="h-5 w-5 shrink-0 rounded invert dark:invert-0" />
        {!collapsed && (
          <span className="ml-2.5 truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">
            DapplePot
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {NAV_ITEMS.filter(({ exclude }) =>
          !exclude.includes(user?.role as 'superadmin')
        ).map(({ path, label, icon: Icon }) => {
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
          <div className="px-2 py-1.5">
            <p className="truncate text-xs font-medium text-slate-900 dark:text-zinc-100">{tenant?.name ?? '—'}</p>
            <p className="truncate text-xs text-slate-500 dark:text-zinc-400">{user.name}</p>
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

      {/* Edge-pinned collapse toggle */}
      <button
        onClick={toggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-400 hover:border-violet-300 hover:text-violet-600 hover:shadow-md transition-all duration-150 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:border-violet-600 dark:hover:text-violet-400"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  )
}
