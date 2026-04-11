import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAuthStore } from '../stores/auth'

const AUTH_ROUTES = new Set(['/login', '/forgot-password', '/reset-password', '/accept-invite'])

export function AppShell() {
  const pathname  = useRouterState({ select: (s) => s.location.pathname })
  const navigate  = useNavigate()
  const isAuthed  = useAuthStore((s) => !!s.accessToken)
  const mainRef   = useRef<HTMLElement>(null)

  // Redirect already-authenticated users away from auth pages
  useEffect(() => {
    if (isAuthed && AUTH_ROUTES.has(pathname)) {
      void navigate({ to: '/' })
    }
  }, [isAuthed, pathname, navigate])

  // Scroll main content area to top on every route change
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  // Auth pages render full-screen without chrome
  if (AUTH_ROUTES.has(pathname)) return <Outlet />

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
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
