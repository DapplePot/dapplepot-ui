import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

const ROUTE_LABELS: Record<string, string> = {
  '/':               'Overview',
  '/sessions':       'Sessions',
  '/analytics':      'Analytics',
  '/detection':      'Detection',
  '/security':       'Security',
  '/agents':         'Agents',
  '/settings':       'Settings',
  '/tenants':        'Tenants',
  '/onboard-client': 'Onboard Client',
}

type Crumb = { label: string; path: string }

function getBreadcrumbs(pathname: string): Crumb[] {
  if (pathname === '/') return [{ label: 'Overview', path: '/' }]
  const parts = pathname.split('/').filter(Boolean)
  const crumbs: Crumb[] = []
  let path = ''
  for (const part of parts) {
    path += `/${part}`
    crumbs.push({ label: ROUTE_LABELS[path] ?? part, path })
  }
  return crumbs
}

export function Topbar() {
  const pathname    = useRouterState({ select: (s) => s.location.pathname })
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900">
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1
          return (
            <span key={crumb.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />}
              {isLast ? (
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {crumb.label}
                </span>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Link
                  to={crumb.path as any}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
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
