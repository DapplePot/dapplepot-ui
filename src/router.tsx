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
import { OAuthCallback }  from './pages/OAuthCallback'
import { Blogs }          from './pages/Blogs'
import { BlogForm }       from './pages/BlogForm'
import { BillingSuccess }    from './pages/BillingSuccess'
import { AdminLayout }       from './pages/admin/AdminLayout'
import { AdminHome }         from './pages/admin/AdminHome'
import { AdminTenants }      from './pages/admin/AdminTenants'
import { AdminTenantDetail } from './pages/admin/AdminTenantDetail'
import { AdminUsers }        from './pages/admin/AdminUsers'
import { AdminAuditLog }     from './pages/admin/AdminAuditLog'
import { useAuthStore }   from './stores/auth'

function requireSuperadmin() {
  const user = useAuthStore.getState().user
  if (!user || user.role !== 'superadmin') throw redirect({ to: '/' })
}

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

const oauthCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/oauth/callback',
  component: OAuthCallback,
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
  hasAlerts: z.boolean().optional(),
  signalId: z.string().optional(),
  subCheckId: z.string().optional(),
  agentId: z.string().optional(),
})

const sessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sessions',
  beforeLoad: requireAuth,
  component: Sessions,
  validateSearch: sessionListSearchSchema,
})

// `?finding=SUB-CHECK-ID` is the deep-link the SDK's DapplePotBlockedError
// URL uses to scroll straight to the firing check on the timeline.
const sessionSearchSchema = z.object({
  finding: z.string().optional(),
})

const sessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sessions/$id',
  beforeLoad: requireAuth,
  component: SessionDetail,
  validateSearch: sessionSearchSchema,
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

const billingSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/billing/success',
  beforeLoad: requireAuth,
  component: BillingSuccess,
})

// Admin (superadmin-only) routes
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  beforeLoad: () => { requireAuth(); requireSuperadmin() },
  component: AdminLayout,
})

const adminHomeRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/',
  component: AdminHome,
})

const adminTenantsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/tenants',
  component: AdminTenants,
})

const adminTenantDetailRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/tenants/$id',
  component: AdminTenantDetail,
})

const adminUsersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/users',
  component: AdminUsers,
})

const adminAuditLogRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/audit-log',
  component: AdminAuditLog,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  signupRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  verifyEmailRoute,
  acceptInviteRoute,
  oauthCallbackRoute,
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
  billingSuccessRoute,
  adminRoute.addChildren([
    adminHomeRoute,
    adminTenantsRoute,
    adminTenantDetailRoute,
    adminUsersRoute,
    adminAuditLogRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
