import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../hooks/useTheme'

const AUTH_ROUTES = new Set(['/login', '/forgot-password', '/reset-password', '/accept-invite'])

export function AppShell() {
  const pathname  = useRouterState({ select: (s) => s.location.pathname })
  const navigate  = useNavigate()
  const isAuthed  = useAuthStore((s) => !!s.accessToken)
  const mainRef   = useRef<HTMLElement>(null)

  useTheme()

  useEffect(() => {
    if (isAuthed && AUTH_ROUTES.has(pathname)) {
      void navigate({ to: '/' })
    }
  }, [isAuthed, pathname, navigate])

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  if (AUTH_ROUTES.has(pathname)) return <Outlet />

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main ref={mainRef} className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
