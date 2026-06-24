import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

const ROUTE_LABELS: Record<string, string> = {
  '/':               'Overview',
  '/sessions':       'Sessions',
  '/analytics':      'Analytics',
  '/detection':      'Detection',
  '/security':       'Security',
  '/inventory':          'Inventory',
  '/inventory/agents':   'Agents',
  '/settings':       'Settings',
  '/tenants':        'Tenants',
  '/users':          'Users',
}

type Crumb = { label: string; path: string }

function getBreadcrumbs(pathname: string): Crumb[] {
  if (pathname === '/') return [{ label: 'Overview', path: '/' }]
  const parts = pathname.split('/').filter(Boolean)
  const crumbs: Crumb[] = []
  let path = ''
  for (const part of parts) {
    path += `/${part}`
    const label = ROUTE_LABELS[path] ?? (part.length > 12 ? `${part.slice(0, 8)}…` : part)
    crumbs.push({ label, path })
  }
  return crumbs
}

export function Topbar() {
  const pathname    = useRouterState({ select: (s) => s.location.pathname })
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-4 dark:border-zinc-700 dark:bg-zinc-900">
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1
          return (
            <span key={crumb.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />}
              {isLast ? (
                <span className="font-medium text-slate-900 dark:text-zinc-100">
                  {crumb.label}
                </span>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Link
                  to={crumb.path as any}
                  className="text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          )
        })}
      </nav>
    </header>
  )
}
