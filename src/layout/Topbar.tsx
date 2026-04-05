import { useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { ChevronRight, Building2, Copy, Check } from 'lucide-react'
import { useAuthStore } from '../stores/auth'

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

function TenantIdBadge({ tenantId }: { tenantId: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(tenantId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy tenant ID"
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
    >
      <Building2 className="h-3.5 w-3.5 shrink-0" />
      <span className="font-mono">{tenantId}</span>
      {copied
        ? <Check className="h-3 w-3 shrink-0 text-emerald-500" />
        : <Copy className="h-3 w-3 shrink-0 opacity-50" />
      }
    </button>
  )
}

export function Topbar() {
  const pathname  = useRouterState({ select: (s) => s.location.pathname })
  const user      = useAuthStore((s) => s.user)
  const breadcrumbs = getBreadcrumbs(pathname)

  const showTenantId = user?.role !== 'superadmin' && user?.tenantId

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
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

      {showTenantId && <TenantIdBadge tenantId={user.tenantId!} />}
    </header>
  )
}
