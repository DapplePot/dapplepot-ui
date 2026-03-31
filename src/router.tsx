import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { z } from 'zod'
import { AppShell } from './layout/AppShell'
import { Overview } from './pages/Overview'
import { Sessions } from './pages/Sessions'
import { SessionDetail } from './pages/SessionDetail'
import { Analytics } from './pages/Analytics'
import { Detection } from './pages/Detection'
import { Security } from './pages/Security'

const rootRoute = createRootRoute({
  component: AppShell,
})

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Overview,
})

const sessionListSearchSchema = z.object({
  page: z.number().default(1),
})

const sessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sessions',
  component: Sessions,
  validateSearch: sessionListSearchSchema,
})

const sessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sessions/$id',
  component: SessionDetail,
})

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: Analytics,
})

const detectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/detection',
  component: Detection,
})

const securityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/security',
  component: Security,
})

const routeTree = rootRoute.addChildren([
  overviewRoute,
  sessionsRoute,
  sessionRoute,
  analyticsRoute,
  detectionRoute,
  securityRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
