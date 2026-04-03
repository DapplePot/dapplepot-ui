# dapplepot_ui

**Dapplepot — Dashboard UI**

Zone 5 of the Dapplepot observability platform. The React dashboard for
monitoring LangGraph agents — session traces, analytics, alert management,
and security posture.

**Language: TypeScript + React 19 + Vite**

---

## What this is

The frontend that makes the platform usable. Seven surfaces built on top of
`dapplepot_api`:

| Surface | Route | What it shows |
|---------|-------|--------------|
| 1 | `/` | Live overview — session feed, metrics, alerts, agent health |
| 2 | `/sessions` | Filterable session list with inline expand |
| 3 | `/sessions/:id` | Full session trace view — event timeline, payload inspector, graph state |
| 4 | `/analytics` | Token usage, error rates, latency charts, cost attribution |
| 5 | `/detection` | Alert inbox, rule builder with dry-run, channel config |
| 6 | `/security` | Security posture, risk scores, OWASP findings, remediation |
| 7 | `/settings` | User profile, user management (admin), invite users |

---

## Related repositories

| Repo | Zone | Language | What it is |
|------|------|----------|-----------|
| `dapplepot_sim` | 1 | Python | Simulation agent |
| `dapplepot_langgraph` | 2 | Python | SDK |
| `dapplepot_pipeline` | 3 | Python | Event ingestion + pipeline |
| `dapplepot_api` | 4 | TypeScript / Hono | Platform API — this UI talks to it |
| **`dapplepot_ui`** | **5** | **TypeScript / React** | **This repo** |
| `dapplepot_security` | 6 | Python | OWASP detection + risk scoring |

---

## Tech stack

| Layer | Library | Version |
|-------|---------|---------|
| Framework | React | 19 |
| Build | Vite | ≥ 6 |
| Language | TypeScript | 5.x strict |
| Routing | TanStack Router | ≥ 1.x |
| Server state | TanStack Query | v5 |
| UI state | Zustand | ≥ 5 |
| Styling | Tailwind CSS | v4 |
| Components | shadcn/ui (copied in) | — |
| Charts | Recharts | ≥ 2.12 |
| HTTP | ky | ≥ 1.5 |
| SSE | @microsoft/fetch-event-source | ≥ 2 |
| Virtualisation | @tanstack/react-virtual | ≥ 3 |
| Package manager | pnpm | ≥ 9 |

### Shared types with `dapplepot_api`

`dapplepot_api` and `dapplepot_ui` are deployed separately, so types are
**copied** into `src/types/` rather than imported via a path alias to the
API repo. When the API types change, copy the updated files from
`dapplepot_api/src/types/` into `src/types/` — TypeScript will immediately
surface any mismatches.

```typescript
import type { SessionDetail, TracePage } from '@dapplepot/types/session'
import type { OverviewMetrics }          from '@dapplepot/types/analytics'
import type { AlertSummary }             from '@dapplepot/types/alert'
import type { Paginated }                from '@dapplepot/types/common'
import type { UserSummary, LoginResponse } from '@dapplepot/types/auth'
```

The `@dapplepot/types/*` alias resolves to `src/types/*` (configured in
`tsconfig.json` and `vite.config.ts`).

---

## Repo layout

```
dapplepot_ui/
├── agent.md                            ← full IDE agent context
├── README.md                           ← this file
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json                       ← strict, @dapplepot/types alias → src/types/
├── vite.config.ts                      ← dev proxy to dapplepot_api, path aliases
├── tailwind.css                        ← @import "tailwindcss"
├── eslint.config.js
├── .env.example
│
└── src/
    ├── main.tsx                        ← React root, QueryClient, RouterProvider
    ├── router.tsx                      ← TanStack Router route tree (incl. /login, /accept-invite,
    │                                      /forgot-password, /reset-password, /settings)
    │                                      requireAuth guard on all protected routes
    ├── index.css                       ← imports tailwind.css
    ├── vite-env.d.ts                   ← Vite env type declarations
    │
    ├── types/                          ← copied from dapplepot_api/src/types/
    │   ├── session.ts
    │   ├── analytics.ts
    │   ├── alert.ts
    │   ├── auth.ts                     ← UserSummary, UserRole, UserStatus, LoginRequest/Response,
    │   │                                  RefreshRequest/Response, LogoutRequest, ForgotPasswordRequest,
    │   │                                  ResetPasswordRequest, AcceptInviteRequest, InviteSummary,
    │   │                                  InviteUserRequest, UpdateMeRequest, ChangeRoleRequest,
    │   │                                  ChangeStatusRequest
    │   ├── rule.ts
    │   ├── channel.ts
    │   ├── common.ts
    │   └── security.ts                 ← Zone 6: RiskBand, SessionRiskScore, SecurityFinding, SecurityOverview, RemediationCard
    │
    ├── api/                            ← typed HTTP functions (ky)
    │   ├── client.ts                   ← ky instance, JWT interceptor, 401 → auto-refresh → retry;
    │   │                                  on refresh failure: clearAuth + redirect /login
    │   │                                  Only GET/HEAD requests are retried (POST body can't be replayed)
    │   ├── auth.ts                     ← bare ky (no auth header): login, refresh, logout,
    │   │                                  forgotPassword, resetPassword, acceptInvite
    │   ├── sessions.ts
    │   ├── analytics.ts
    │   ├── alerts.ts
    │   ├── rules.ts
    │   ├── channels.ts
    │   ├── control.ts
    │   ├── security.ts
    │   └── sse.ts                      ← useLiveSessions, useControlChannel
    │
    ├── hooks/                          ← TanStack Query hooks
    │   ├── useAuth.ts                  ← useLogin, useLogout, useForgotPassword,
    │   │                                  useResetPassword, useAcceptInvite
    │   ├── useUsers.ts                 ← useMe, useUpdateMe, useUsers, useInviteUser,
    │   │                                  useInvites, useChangeRole, useChangeStatus
    │   ├── useSessions.ts
    │   ├── useAnalytics.ts
    │   ├── useAlerts.ts
    │   ├── useRules.ts
    │   ├── useChannels.ts
    │   ├── useControl.ts
    │   └── useSecurity.ts
    │
    ├── stores/                         ← Zustand (UI state only, not server state)
    │   ├── auth.ts                     ← accessToken + refreshToken (localStorage: dp_access_token,
    │   │                                  dp_refresh_token) + user profile (dp_user)
    │   │                                  setTokens (login/accept-invite), setAccessToken (refresh),
    │   │                                  clearAuth (logout/401)
    │   ├── sessionFilters.ts           ← status, agentId, environment, dateRange, q
    │   ├── alertFilters.ts             ← severity, status, ruleId
    │   ├── traceFilters.ts             ← active category on event timeline
    │   └── ui.ts                       ← sidebar, activeTab, selectedSessionId
    │
    ├── pages/                          ← one file per route
    │   ├── Login.tsx                   ← /login — full-screen, no AppShell chrome
    │   ├── AcceptInvite.tsx            ← /accept-invite?token=... — set name + password, auto-login
    │   ├── ForgotPassword.tsx          ← /forgot-password — email input, success state
    │   ├── ResetPassword.tsx           ← /reset-password?token=... — new password form
    │   ├── Overview.tsx
    │   ├── Sessions.tsx
    │   ├── SessionDetail.tsx
    │   ├── Analytics.tsx
    │   ├── Detection.tsx
    │   ├── Security.tsx
    │   └── Settings.tsx                ← /settings — profile form + user management (admin only)
    │
    ├── layout/
    │   ├── AppShell.tsx                ← bypasses sidebar/topbar for auth routes; redirects
    │   │                                  authenticated users away from auth routes
    │   ├── Sidebar.tsx                 ← nav items, Settings link, user name/email, Sign out button
    │   └── Topbar.tsx                  ← breadcrumbs (includes Settings)
    │
    ├── components/
    │   ├── auth/                       ← LoginForm, ForgotPasswordForm, ResetPasswordForm,
    │   │                                  InviteAcceptForm
    │   ├── settings/                   ← ProfileForm, UserTable, InviteModal, RoleBadge
    │   ├── overview/                   ← MetricCards, SessionFeed, AlertPanel, AgentHealth
    │   ├── sessions/                   ← SessionTable, SessionRow, SessionFilters, StatusBadge, SessionPagination
    │   ├── trace/                      ← TraceLayout, TraceHeader, MetricStrip, EventTimeline,
    │   │                                  EventRow, EventPayload, RightPanel, GraphStateTab,
    │   │                                  SessionInfoTab, AlertsTab, SecurityTab
    │   ├── analytics/                  ← DateRangePicker, TokenChart, ErrorRateChart, LatencyChart, CostTable
    │   ├── detection/                  ← AlertFeed, AlertDrawer, RuleList, RuleForm, DryRunPreview, ChannelList
    │   ├── security/                   ← RiskDistribution, OwaspFrequency, HighRiskTable,
    │   │                                  SessionRiskPanel, FindingsList, RemediationGuide
    │   └── ui/                         ← button, badge, input, select, table, tabs, toggle, skeleton
    │
    └── utils/
        ├── format.ts                   ← formatTokens, formatDuration, formatAgo, formatLatency, formatCost
        ├── eventColors.ts              ← event category → hex color
        └── cn.ts                       ← clsx + tailwind-merge
```

---

## Prerequisites

- Node.js 22 LTS
- pnpm 9+
- `dapplepot_api` running on port 3000

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/dapplepot/dapplepot_ui
cd dapplepot_ui
pnpm install
```

### 2. Configure

```bash
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:3000  ← default, no changes needed for local dev
```

### 3. Start

```bash
# Make sure dapplepot_api is running first
pnpm dev     # Vite dev server on http://localhost:5173
```

Vite proxies all `/v1/` requests to `dapplepot_api` so there are no CORS issues in development.

---

## Auth flow

The UI uses access + refresh tokens from `dapplepot_api`.

### Token lifecycle

| Step | Behaviour |
|------|-----------|
| Login | `POST /v1/auth/login` → `{ accessToken, refreshToken, expiresIn, user }` |
| Token storage | `accessToken` and `refreshToken` in `localStorage` (`dp_access_token`, `dp_refresh_token`). User profile stored in `dp_user`. All loaded into Zustand on init. |
| Request auth | Every `ky` request adds `Authorization: Bearer <accessToken>` via `beforeRequest` hook in `client.ts` |
| Auto-refresh | On 401, `client.ts` calls `POST /v1/auth/refresh`. On success: stores new tokens, retries the original GET request. POST/PATCH bodies cannot be replayed — token is refreshed silently and the mutation's error state is shown. On refresh failure: `clearAuth()` + redirect to `/login`. Concurrent 401s share a single refresh call (deduplicated). |
| Logout | `POST /v1/auth/logout` with `{ refreshToken }` → `clearAuth()` → redirect to `/login`. Fires `onSettled` so local state always clears even if the API call fails. |

### Auth routes (no AppShell chrome)

| Route | Page | Notes |
|-------|------|-------|
| `/login` | `Login.tsx` | Authenticated users are redirected to `/` |
| `/forgot-password` | `ForgotPassword.tsx` | Shows success state on submit; no redirect |
| `/reset-password?token=...` | `ResetPassword.tsx` | Shows error if token param is missing |
| `/accept-invite?token=...` | `AcceptInvite.tsx` | Auto-logs in on success, navigates to `/` |

### Role-based UI gating

The user's `role` (`admin` | `editor` | `viewer`) comes from `useMe()` (server-fresh). Use it to:

| Role | Visible actions |
|------|----------------|
| admin | Everything — kill-switch, rules CRUD, channels CRUD, user management (UserTable + InviteModal), alert acknowledge |
| editor | Rules create/edit, alert acknowledge/resolve, kill-switch/interrupt — no channel config, no user management |
| viewer | Read-only — all dashboards, no action buttons |

Hide action buttons (not just disable) for roles that can't use them. The API enforces the same
permissions server-side — the UI gating is cosmetic but important for UX.

### Default local dev credentials

After running `pnpm seed-admin` in `dapplepot_api`:
```
Email:    admin@dapplepot.dev
Password: changeme123
```

---

## Scripts

```bash
pnpm dev            # Vite dev server with HMR (port 5173)
pnpm build          # TypeScript check + Vite production build → dist/
pnpm preview        # Preview the production build locally
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint src/
pnpm lint:fix       # eslint --fix src/
pnpm sync-types     # Copy updated types from ../dapplepot-api/src/types/ → src/types/
```

---

## Security module (Zone 6)

The `/security` page connects to `dapplepot_security` via the `dapplepot_api` proxy. All security
endpoints live under `/v1/security/`.

| Endpoint | Hook | Stale time | Description |
|---|---|---|---|
| `GET /v1/security/overview?windowHours=168` | `useSecurityOverview(windowHours?)` | 2 min | Tenant risk summary — band distribution, OWASP frequency, top sessions |
| `GET /v1/security/sessions/:id/score` | `useSessionSecurity(id).score` | 5 min | Per-session `SessionRiskScore` (stable once written by scorer) |
| `GET /v1/security/sessions/:id/findings` | `useSessionSecurity(id).findings` | 5 min | `SecurityFinding[]` for the session |
| `GET /v1/security/remediation?windowHours=168` | `useRemediation(windowHours?)` | 5 min | Top signals with fix steps and optional SDK snippet |

Types live in `src/types/security.ts`. Stale times are intentionally matched to the API cache TTLs
(`CACHE_TTL_SECURITY_OVERVIEW = 120`, `CACHE_TTL_SESSION_SCORE = 300`).

---

## Updating shared types

When `dapplepot_api` updates its types, run:

```bash
pnpm sync-types
# equivalent to: cp ../dapplepot-api/src/types/*.ts src/types/
```

TypeScript will immediately flag any UI component that needs updating.

---

## Key design decisions

| # | Decision | Reason |
|---|----------|--------|
| 1 | Types copied into `src/types/`, not imported from API repo | Repos deploy separately — path alias to `../dapplepot-api` doesn't work in CI |
| 2 | `staleTime` matches API cache TTL per endpoint | Prevents redundant re-fetches that bypass the cache |
| 3 | `staleTime: Infinity` for finalised session detail + trace | Session is immutable once finalised |
| 4 | Cursor pagination on trace, never OFFSET | `sequence_index > $cursor` is O(1); OFFSET is O(N) |
| 5 | Filter state in Zustand, pagination in URL | Filters persist on back-navigation; page resets on filter change |
| 6 | Virtualise the event timeline (`@tanstack/react-virtual`) | Sessions can have 500+ events; rendering all causes jank |
| 7 | Non-linear error rate bar scale (100% at 15% error rate) | A 10% error rate should look alarming, not negligible |
| 8 | SSE updates React Query cache via `setQueryData` | Avoids a redundant HTTP re-fetch when SSE delivers fresh data |
| 9 | Fetch-based SSE polyfill (`@microsoft/fetch-event-source`) | Native `EventSource` doesn't support `Authorization` headers |
| 10 | shadcn/ui primitives copied in, not installed as a package | Allows full customisation without a dependency on shadcn releases |
| 11 | Access + refresh tokens with rotation | Short access (15m) limits leaked-token blast radius; refresh rotation detects theft |
| 12 | `api/auth.ts` uses a separate bare ky instance | Avoids circular dependency — `client.ts` imports `refresh` from `auth.ts`; `auth.ts` must not import `apiClient` |
| 13 | Only GET/HEAD requests are retried after token refresh | POST/PATCH body ReadableStream is consumed before `afterResponse` fires and cannot be replayed; token is still refreshed so the next action works |
| 14 | Role check in Settings uses `useMe()`, not Zustand store | Zustand `user.role` is set at login and stale mid-session; `useMe()` is server-fresh |
| 15 | Auth routes bypass AppShell; authenticated users redirected away | Login/invite/reset pages are full-screen — no sidebar/topbar chrome. Logged-in users hitting `/login` redirect to `/` |
| 16 | `useLogout` uses `onSettled`, not `onSuccess` | Local auth state must be cleared even if the server-side logout call fails |
