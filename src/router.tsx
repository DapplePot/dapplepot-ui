import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { AppShell } from './layout/AppShell'
import { Overview }       from './pages/Overview'
import { Sessions }       from './pages/Sessions'
import { SessionDetail }  from './pages/SessionDetail'
import { Analytics }      from './pages/Analytics'
import { Detection }      from './pages/Detection'
import { Security }       from './pages/Security'
import { Settings }       from './pages/Settings'
import { OnboardClient }  from './pages/OnboardClient'
import { Tenants }        from './pages/Tenants'
import { Agents }                from './pages/Agents'
import { AgentSecurityProfile } from './pages/AgentSecurityProfile'
import { Login }          from './pages/Login'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword }  from './pages/ResetPassword'
import { AcceptInvite }   from './pages/AcceptInvite'
import { useAuthStore }   from './stores/auth'

function requireAuth() {
  const token = useAuthStore.getState().accessToken
  if (!token) throw redirect({ to: '/login' })
}

const rootRoute = createRootRoute({
  component: AppShell,
})

// Auth routes (no AppShell chrome)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
})

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPassword,
})

const tokenSearchSchema = z.object({
  token: z.string().optional(),
})

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  component: ResetPassword,
  validateSearch: tokenSearchSchema,
})

const acceptInviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accept-invite',
  component: AcceptInvite,
  validateSearch: tokenSearchSchema,
})

// Authenticated routes
const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: requireAuth,
  component: Overview,
})

const sessionListSearchSchema = z.object({
  page: z.number().default(1),
})

const sessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sessions',
  beforeLoad: requireAuth,
  component: Sessions,
  validateSearch: sessionListSearchSchema,
})

const sessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sessions/$id',
  beforeLoad: requireAuth,
  component: SessionDetail,
})

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  beforeLoad: requireAuth,
  component: Analytics,
})

const detectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/detection',
  beforeLoad: requireAuth,
  component: Detection,
})

const securityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/security',
  beforeLoad: requireAuth,
  component: Security,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  beforeLoad: requireAuth,
  component: Settings,
})

const onboardClientRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboard-client',
  beforeLoad: requireAuth,
  component: OnboardClient,
})

const tenantsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tenants',
  beforeLoad: requireAuth,
  component: Tenants,
})

const agentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/agents',
  beforeLoad: requireAuth,
  component: Agents,
})

const agentSecurityProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/agents/$agentId',
  beforeLoad: requireAuth,
  component: AgentSecurityProfile,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  acceptInviteRoute,
  overviewRoute,
  sessionsRoute,
  sessionRoute,
  analyticsRoute,
  detectionRoute,
  securityRoute,
  settingsRoute,
  onboardClientRoute,
  tenantsRoute,
  agentsRoute,
  agentSecurityProfileRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
