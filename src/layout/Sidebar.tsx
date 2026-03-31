import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  List,
  BarChart2,
  Bell,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../utils/cn'
import { useUiStore } from '../stores/ui'

const NAV_ITEMS = [
  { path: '/',           label: 'Overview',   icon: LayoutDashboard },
  { path: '/sessions',   label: 'Sessions',   icon: List },
  { path: '/analytics',  label: 'Analytics',  icon: BarChart2 },
  { path: '/detection',  label: 'Detection',  icon: Bell },
  { path: '/security',   label: 'Security',   icon: Shield },
]

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle = useUiStore((s) => s.toggleSidebar)
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-slate-200 bg-white transition-all duration-200',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-slate-200 px-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600">
          <span className="text-xs font-bold text-white">dp</span>
        </div>
        {!collapsed && (
          <span className="ml-2.5 text-sm font-semibold text-slate-900">Dapplepot</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = path === '/'
            ? currentPath === '/'
            : currentPath.startsWith(path)
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-violet-50 text-violet-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-slate-200 p-2">
        <button
          onClick={toggle}
          className="flex w-full items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  )
}
