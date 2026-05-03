import { useRouterState } from '@tanstack/react-router'
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

function getBreadcrumbs(pathname: string): string[] {
  if (pathname === '/') return ['Overview']
  const parts = pathname.split('/').filter(Boolean)
  const crumbs: string[] = []
  let path = ''
  for (const part of parts) {
    path += `/${part}`
    crumbs.push(ROUTE_LABELS[path] ?? part)
  }
  return crumbs
}

export function Topbar() {
  const pathname    = useRouterState({ select: (s) => s.location.pathname })
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-4">
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            <span
              className={
                i === breadcrumbs.length - 1
                  ? 'font-medium text-slate-900'
                  : 'text-slate-500'
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>
    </header>
  )
}
