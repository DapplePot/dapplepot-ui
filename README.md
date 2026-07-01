# dapplepot-ui

React dashboard for DapplePot. Two personas in one app: **tenant operators** (sessions, security, alerts, agents, billing, settings) and **superadmin operators** (cross-tenant management, onboarding, audit log). All data comes from `dapplepot-api` over REST + SSE.

**Stack:** React 19, TypeScript (strict), Vite 6, TanStack Router + Query, Zustand, Tailwind CSS v4, ky, Recharts.

## Quick Start

```bash
pnpm install
cp .env.example .env          # set VITE_API_BASE_URL=http://localhost:3000
pnpm dev                      # → http://localhost:5173
```

The Vite dev server proxies `/v1/*` → `VITE_API_BASE_URL` so there are no CORS issues in dev.

## Env vars

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000` | dapplepot-api base URL |
| `VITE_APP_ENV` | `development` | `development` / `staging` / `production` |

## Layout

```
src/
  main.tsx              Entry — mounts the router + QueryClient + ThemeProvider
  router.tsx            TanStack Router route tree
  index.css             Tailwind v4 root + dark-mode tokens
  api/                  Thin ky wrappers per resource
  hooks/                React Query + Zustand hooks (usePlan, useMe, useTenants, …)
  pages/                One file per route (Overview, Sessions, Detection, …)
  pages/admin/          Superadmin-only pages (Tenants, Users, AuditLog, …)
  components/           Cross-page UI (PlanSelectionModal, OnboardingGate, banners, …)
  layout/               AppShell, Sidebar, Topbar
  stores/               Zustand: auth, ui, theme, *Filters, planModal, upgradeModal
  types/                Shared with dapplepot-api — copied via `pnpm sync-types`
```

## Pages

| Persona | Routes |
|---|---|
| **Auth** | `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`, `/accept-invite` |
| **Tenant operator** | `/` (Overview), `/sessions`, `/sessions/:id`, `/analytics`, `/detection`, `/security`, `/inventory`, `/inventory/agents/:id`, `/audit`, `/settings`, `/tenants` |
| **Superadmin** | `/admin` (Home), `/admin/tenants`, `/admin/tenants/:id`, `/admin/users`, `/admin/audit-log` |
| **Other** | `/blogs`, `/billing/success` |

## Auth

Short-lived JWT access tokens (15m) + rotatable refresh tokens (7d). The `ky` client auto-refreshes on 401 with deduplication — concurrent failures share one refresh call, GET/HEAD requests retry transparently, mutations bounce to `/login` (body already consumed).

## State

- **Server state** — TanStack Query everywhere. Stale times tuned per endpoint. SSE pushes update the cache via `queryClient.setQueryData`, no polling.
- **UI state** — Zustand stores: `auth` (tokens, persisted), `ui` (sidebar collapse), `theme` (dark/light), `sessionFilters` / `alertFilters` / `traceFilters` (survive back-nav), `planModal` / `upgradeModal` (controls the plan-picker modal).

## Scripts

```bash
pnpm dev          # Vite dev server
pnpm build        # tsc -b && vite build → dist/
pnpm preview      # serve dist/ locally
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint src/
pnpm sync-types   # cp ../dapplepot-api/src/types/*.ts src/types/
```
