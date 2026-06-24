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
import { Tenants }        from './pages/Tenants'
import { Users }          from './pages/Users'
import { Inventory }            from './pages/Inventory'
import { AgentSecurityProfile } from './pages/AgentSecurityProfile'
import { AgentConfig }          from './pages/AgentConfig'
import { Audit }          from './pages/Audit'
import { Login }          from './pages/Login'
import { Signup }         from './pages/Signup'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword }  from './pages/ResetPassword'
import { VerifyEmail }    from './pages/VerifyEmail'
import { AcceptInvite }   from './pages/AcceptInvite'
import { Blogs }          from './pages/Blogs'
import { BlogForm }       from './pages/BlogForm'
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

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: Signup,
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

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify-email',
  component: VerifyEmail,
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

const tenantsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tenants',
  beforeLoad: requireAuth,
  component: Tenants,
})

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  beforeLoad: requireAuth,
  component: Users,
})

const inventorySearchSchema = z.object({
  tab: z.enum(['agents', 'llms']).optional(),
})

const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inventory',
  beforeLoad: requireAuth,
  component: Inventory,
  validateSearch: inventorySearchSchema,
})

const inventoryAgentsRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inventory/agents',
  beforeLoad: () => { throw redirect({ to: '/inventory', search: { tab: 'agents' } }) },
})

const agentsRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/agents',
  beforeLoad: () => { throw redirect({ to: '/inventory' }) },
})

const agentSecurityProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inventory/agents/$agentId',
  beforeLoad: requireAuth,
  component: AgentSecurityProfile,
})

const agentConfigRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inventory/agents/$agentId/config',
  beforeLoad: requireAuth,
  component: AgentConfig,
})

const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/audit',
  beforeLoad: requireAuth,
  component: Audit,
})

const blogsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/blogs',
  beforeLoad: requireAuth,
  component: Blogs,
})

const blogNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/blogs/new',
  beforeLoad: requireAuth,
  component: BlogForm,
})

const blogEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/blogs/$id',
  beforeLoad: requireAuth,
  component: BlogForm,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  signupRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  verifyEmailRoute,
  acceptInviteRoute,
  overviewRoute,
  sessionsRoute,
  sessionRoute,
  analyticsRoute,
  detectionRoute,
  securityRoute,
  settingsRoute,
  tenantsRoute,
  usersRoute,
  inventoryRoute,
  inventoryAgentsRedirectRoute,
  agentsRedirectRoute,
  agentSecurityProfileRoute,
  agentConfigRoute,
  auditRoute,
  blogsRoute,
  blogNewRoute,
  blogEditRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
