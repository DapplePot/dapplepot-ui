import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { TrialBanner } from '../components/TrialBanner'
import { QuotaBanner } from '../components/QuotaBanner'
import { PastDueBanner } from '../components/PastDueBanner'
import { GlobalUpgradeModal } from '../components/GlobalUpgradeModal'
import { OnboardingGate } from '../components/OnboardingGate'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../hooks/useTheme'

const AUTH_ROUTES = new Set([
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/accept-invite',
  '/contact-sales',   // public Enterprise sales page — no app chrome
])

export function AppShell() {
  const pathname  = useRouterState({ select: (s) => s.location.pathname })
  const navigate  = useNavigate()
  const isAuthed  = useAuthStore((s) => !!s.accessToken)
  const mainRef   = useRef<HTMLElement>(null)

  useTheme()

  useEffect(() => {
    // /verify-email and /accept-invite are exempt — both are email-link-driven
    // flows where the page itself issues login tokens for the email's owner.
    // Without this exemption, a user who's already signed in to a different
    // workspace clicks "Accept Invitation" → app silently redirects to / →
    // the invite is never actually accepted.
    if (
      isAuthed
      && AUTH_ROUTES.has(pathname)
      && pathname !== '/verify-email'
      && pathname !== '/accept-invite'
    ) {
      void navigate({ to: '/' })
    }
  }, [isAuthed, pathname, navigate])

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  if (AUTH_ROUTES.has(pathname)) return <Outlet />

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950">
      {/* Page-level banners — span full width above sidebar + topbar */}
      <PastDueBanner />
      <TrialBanner />
      <QuotaBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main ref={mainRef} className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <GlobalUpgradeModal />
      <OnboardingGate />
    </div>
  )
}
