# agent.md — dapplepot_ui: Full Context for IDE Agent

> Read this file completely before writing any code.
> It contains the full product design, every component, every data binding,
> the exact repo structure, and the build order. Nothing here is aspirational —
> it is the agreed spec. Do not invent alternatives unless explicitly asked.

---

## 1. Company + product context

**Company:** Dapplepot
**Product:** A production-grade observability and security platform for
LangGraph-based AI agents.

This repository (`dapplepot_ui`) is **Zone 5 — Dashboard UI**. It is the
React frontend that serves the platform dashboard. It talks exclusively to
`dapplepot_api` — it never calls `dapplepot_pipeline` or any database directly.

### All Dapplepot repositories

| Zone | Repo | Language | What it is |
|------|------|----------|-----------|
| 1 | `dapplepot_sim` | Python | LangGraph simulation agent |
| 2 | `dapplepot_langgraph` | Python | SDK |
| 3 | `dapplepot_pipeline` | Python | Event ingestion + data pipeline |
| 4 | `dapplepot_api` | TypeScript / Hono | Platform API |
| **5** | **`dapplepot_ui`** | **TypeScript / React** | **This repo — dashboard UI** |
| 6 | `dapplepot_security` | Python | OWASP detection + risk scoring |

### Tech stack

| Layer | Library | Version | Why |
|-------|---------|---------|-----|
| Framework | `react` | 19 | Latest stable, concurrent features |
| Build tool | `vite` | ≥ 6 | Instant HMR, fast build |
| Language | TypeScript | 5.x strict | Full type safety |
| Routing | `@tanstack/react-router` | ≥ 1.x | Type-safe routes, search params typed, `beforeLoad` auth guard |
| Server state | `@tanstack/react-query` | v5 | Caching, background refetch, SSE streaming |
| UI state | `zustand` | ≥ 5 | Auth tokens, filter state, sidebar, active tabs |
| Styling | `tailwindcss` | v4 | Utility-first, no config file, co-located styles |
| Components | Custom (Tailwind + CVA) | — | Hand-crafted with `class-variance-authority` — no external component library |
| Charts | `recharts` | ≥ 2.12 | LineChart, BarChart, ResponsiveContainer |
| HTTP client | `ky` | ≥ 1.5 | Fetch wrapper, typed, interceptors for JWT + auto-refresh |
| Package manager | `pnpm` | ≥ 9 | Matches dapplepot_api |

### Shared types

Types are **copied** into `src/types/` from `dapplepot_api/src/types/`. Repos
deploy separately so a path alias to `../dapplepot_api` does not work in CI.
Run `pnpm sync-types` after API type changes; TypeScript immediately flags mismatches.

---

## 2. Repo structure

```
dapplepot_ui/
│
│   # Project root
├── agent.md                                ← this file
├── README.md                               ← human setup guide
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json                           ← strict mode; no custom path aliases (types copied locally)
├── vite.config.ts                          ← path aliases, proxy to dapplepot_api in dev
├── tailwind.css                            ← @import "tailwindcss" — v4 style
├── .env.example
│
└── src/
    ├── main.tsx                            ← React root, QueryClient setup, RouterProvider
    ├── router.tsx                          ← TanStack Router route tree; requireAuth guard on all
    │                                          protected routes; auth routes: /login, /forgot-password,
    │                                          /reset-password?token=, /accept-invite?token=
    │
    │   # Types — copied from dapplepot_api/src/types/ (run pnpm sync-types to update)
    ├── types/
    │   ├── auth.ts                         ← UserRole ('superadmin'|'admin'|'editor'|'viewer'),
    │   │                                      UserStatus, UserSummary (incl. tenantId: string|null),
    │   │                                      LoginRequest/Response, RefreshRequest/Response,
    │   │                                      LogoutRequest, ForgotPasswordRequest,
    │   │                                      ResetPasswordRequest, AcceptInviteRequest,
    │   │                                      InviteSummary, InviteUserRequest,
    │   │                                      UpdateMeRequest, ChangeRoleRequest, ChangeStatusRequest
    │   ├── tenant.ts                       ← TenantSummary, TenantWithStats (+ adminUser + userCount),
    │   │                                      OnboardClientRequest, OnboardClientResponse
    │   ├── agent.ts                        ← AgentSummary, CreateAgentRequest
    │   ├── sdkKey.ts                       ← SdkKeySummary (maskedKey), SdkKeyRevealResponse
    │   ├── session.ts
    │   ├── analytics.ts
    │   ├── alert.ts
    │   ├── rule.ts
    │   ├── channel.ts
    │   ├── common.ts                       ← Paginated<T>, ApiError, ListParams, error classes
    │   └── security.ts
    │
    │   # API client — single source of truth for all HTTP calls
    ├── api/
    │   ├── client.ts                       ← ky instance with JWT interceptor; on 401: auto-refresh
    │   │                                      → retry (GET only); on refresh failure: clearAuth + /login
    │   │                                      Concurrent 401s share one refresh call (deduplicated)
    │   ├── auth.ts                         ← bare ky (no auth header): login, refresh, logout,
    │   │                                      forgotPassword, resetPassword, acceptInvite
    │   ├── tenants.ts                      ← onboardClient (POST /v1/tenants/onboard),
    │   │                                      getTenants (GET /v1/tenants)
    │   ├── agents.ts                       ← getAgents (GET /v1/agents),
    │   │                                      createAgent (POST /v1/agents)
    │   ├── sdkKeys.ts                      ← getSdkKeys (GET /v1/sdk-keys),
    │   │                                      revealSdkKey (GET /v1/sdk-keys/:id/reveal)
    │   ├── sessions.ts                     ← getSessionList, getSessionDetail, getTrace, getStateHistory
    │   ├── analytics.ts                    ← getOverview, getLlmUsage, getErrorRates, getLatency, getCost
    │   ├── alerts.ts                       ← getAlerts, getAlertDetail, updateAlertStatus, getAlertStats
    │   ├── rules.ts                        ← getRules, createRule, updateRule
    │   ├── channels.ts                     ← getChannels, createChannel, updateChannel
    │   ├── control.ts                      ← killSwitch, interrupt
    │   ├── security.ts                     ← security overview, session risk, remediation
    │   └── sse.ts                          ← useLiveSessions hook, useControlChannel hook
    │
    │   # TanStack Query hooks — one file per resource
    ├── hooks/
    │   ├── useAuth.ts                      ← useLogin, useLogout, useForgotPassword,
    │   │                                      useResetPassword, useAcceptInvite
    │   ├── useUsers.ts                     ← useMe, useUpdateMe, useUsers (unwraps Paginated<UserSummary>),
    │   │                                      useInviteUser, useInvites, useChangeRole, useChangeStatus
    │   ├── useTenants.ts                   ← useOnboardClient (mutation), useTenants (query)
    │   ├── useAgents.ts                    ← useAgents (query), useCreateAgent (mutation, invalidates ['agents'])
    │   ├── useSdkKeys.ts                   ← useSdkKeys (query), useRevealSdkKey (mutation)
    │   ├── useSessions.ts                  ← useSessionList, useSessionDetail, useSessionTrace
    │   ├── useAnalytics.ts                 ← useOverview, useLlmUsage, useErrorRates, useLatency, useCost
    │   ├── useAlerts.ts                    ← useAlerts, useAlertDetail, useAlertStats
    │   ├── useRules.ts                     ← useRules, useCreateRule, useUpdateRule
    │   ├── useChannels.ts                  ← useChannels, useCreateChannel, useUpdateChannel
    │   ├── useControl.ts                   ← useKillSwitch, useInterrupt
    │   └── useSecurity.ts                  ← useSecurityOverview, useSessionSecurity, useRemediation
    │
    │   # Zustand stores — UI state only (not server state)
    ├── stores/
    │   ├── auth.ts                         ← accessToken + refreshToken (localStorage: dp_access_token,
    │   │                                      dp_refresh_token) + user profile (dp_user JSON)
    │   │                                      setTokens(access, refresh, user) — login / accept-invite
    │   │                                      setAccessToken(access, refresh)  — token refresh
    │   │                                      clearAuth()                      — logout / 401 failure
    │   ├── sessionFilters.ts               ← status, agentId, environment, dateRange, searchQuery
    │   ├── alertFilters.ts                 ← severity, status, ruleId filters
    │   ├── traceFilters.ts                 ← active category filter on event timeline
    │   └── ui.ts                           ← sidebarCollapsed, activeTab, selectedSessionId
    │
    │   # Pages — one file per route
    ├── pages/
    │   ├── Login.tsx                       ← /login — delegates to LoginForm; no AppShell chrome
    │   ├── ForgotPassword.tsx              ← /forgot-password — delegates to ForgotPasswordForm
    │   ├── ResetPassword.tsx               ← /reset-password?token= — delegates to ResetPasswordForm
    │   ├── AcceptInvite.tsx                ← /accept-invite?token= — delegates to InviteAcceptForm
    │   ├── Overview.tsx                    ← / — SuperAdminHome for superadmin; tenant dashboard otherwise
    │   ├── Sessions.tsx                    ← /sessions — session list with filters
    │   ├── SessionDetail.tsx               ← /sessions/:id — trace view for one session
    │   ├── Analytics.tsx                   ← /analytics — charts + cost table
    │   ├── Detection.tsx                   ← /detection — alert inbox + rules + channels
    │   ├── Security.tsx                    ← /security — security posture overview
    │   ├── Agents.tsx                      ← /agents — agent registry (AgentTable); create gated to admin
    │   ├── Settings.tsx                    ← /settings — profile + SDK keys + user mgmt (admin only)
    │   ├── Tenants.tsx                     ← /tenants — all tenants with admin user + user count (superadmin only)
    │   └── OnboardClient.tsx               ← /onboard-client — OnboardingWizard; role-gated to superadmin
    │
    │   # Layout
    ├── layout/
    │   ├── AppShell.tsx                    ← bypasses sidebar/topbar for auth routes; redirects
    │   │                                      authenticated users away from auth routes to /
    │   ├── Sidebar.tsx                     ← exclude-based role filtering; superadmin sees only
    │   │                                      Tenants + Onboard Client; tenants see all other items
    │   └── Topbar.tsx                      ← breadcrumbs + tenant ID badge (tenant users only, copyable)
    │
    │   # Feature components — grouped by surface
    ├── components/
    │   │
    │   ├── auth/                           ← full-screen form components for auth pages
    │   │   ├── LoginForm.tsx               ← email + password + "Forgot password?" link
    │   │   ├── ForgotPasswordForm.tsx      ← email input; success state on submit
    │   │   ├── ResetPasswordForm.tsx       ← password + confirm; reads token from search params
    │   │   └── InviteAcceptForm.tsx        ← name + password + confirm; reads token from search params
    │   │
    │   ├── onboarding/                     ← client onboarding wizard (superadmin only)
    │   │   ├── TenantInfoStep.tsx          ← Step 1: name, token budget, rate limit
    │   │   ├── AdminAccountStep.tsx        ← Step 2: admin name, email, password + confirm
    │   │   └── OnboardingWizard.tsx        ← step indicator, state, success screen; calls useOnboardClient
    │   │
    │   ├── settings/
    │   │   ├── ProfileForm.tsx             ← name + optional password change; calls useUpdateMe
    │   │   ├── SdkKeySection.tsx           ← masked key list; admin can reveal full key + copy
    │   │   ├── UserTable.tsx               ← searchable user list; role select + suspend/reactivate per row
    │   │   ├── InviteModal.tsx             ← email + role select modal; calls useInviteUser
    │   │   └── RoleBadge.tsx               ← coloured pill: superadmin (rose) / admin (violet) / editor (blue) / viewer (slate)
    │   │
    │   ├── agents/
    │   │   ├── AgentTable.tsx              ← searchable agent list; copyable agent ID; New agent button (admin only)
    │   │   └── CreateAgentModal.tsx        ← name (required) + latestVersion (optional); calls useCreateAgent
    │   │
    │   ├── overview/
    │   │   ├── MetricCards.tsx
    │   │   ├── SessionFeed.tsx
    │   │   ├── AlertPanel.tsx
    │   │   ├── AgentHealth.tsx
    │   │   └── SuperAdminHome.tsx          ← welcome screen for superadmin with link to /onboard-client
    │   │
    │   ├── sessions/
    │   │   ├── SessionTable.tsx
    │   │   ├── SessionRow.tsx
    │   │   ├── SessionFilters.tsx
    │   │   ├── SessionPagination.tsx
    │   │   └── StatusBadge.tsx
    │   │
    │   ├── trace/
    │   │   ├── TraceLayout.tsx
    │   │   ├── TraceHeader.tsx
    │   │   ├── MetricStrip.tsx
    │   │   ├── EventTimeline.tsx
    │   │   ├── EventRow.tsx
    │   │   ├── EventPayload.tsx
    │   │   ├── RightPanel.tsx
    │   │   ├── GraphStateTab.tsx
    │   │   ├── SessionInfoTab.tsx
    │   │   ├── AlertsTab.tsx
    │   │   └── SecurityTab.tsx
    │   │
    │   ├── analytics/
    │   │   ├── DateRangePicker.tsx
    │   │   ├── TokenChart.tsx
    │   │   ├── ErrorRateChart.tsx
    │   │   ├── LatencyChart.tsx
    │   │   └── CostTable.tsx
    │   │
    │   ├── detection/
    │   │   ├── AlertFeed.tsx
    │   │   ├── AlertDrawer.tsx
    │   │   ├── RuleList.tsx
    │   │   ├── RuleForm.tsx
    │   │   ├── DryRunPreview.tsx
    │   │   └── ChannelList.tsx
    │   │
    │   ├── security/
    │   │   ├── RiskDistribution.tsx
    │   │   ├── OwaspFrequency.tsx
    │   │   ├── HighRiskTable.tsx
    │   │   ├── SessionRiskPanel.tsx
    │   │   ├── FindingsList.tsx
    │   │   └── RemediationGuide.tsx
    │   │
    │   └── ui/                             ← shared primitives (Tailwind + CVA, no external library)
    │       ├── button.tsx
    │       ├── badge.tsx
    │       ├── input.tsx
    │       ├── select.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       ├── toggle.tsx
    │       └── skeleton.tsx
    │
    │   # Utilities
    └── utils/
        ├── format.ts                       ← formatTokens (1.2M), formatDuration (47.8s), formatAgo (3m ago)
        ├── eventColors.ts                  ← category → hex color map for timeline dots
        └── cn.ts                           ← clsx + tailwind-merge helper
```

---

## 3. The surfaces — what each page renders

### Surface 1: Overview (`pages/Overview.tsx`)

Route: `/`

For **superadmin**: renders `SuperAdminHome` — welcome screen with a link to `/onboard-client`. All tenant data hooks are still called (React hooks rules) but the page returns early before rendering them.

For **tenant users**: the live overview home screen. An engineer leaves this open.

**Layout (tenant):** header row → 4 metric cards → two-column (session feed left, right column stacked: alerts + agent health)

**Data sources and refresh rates:**
```typescript
// useOverview: GET /v1/analytics/overview — staleTime: 30_000
const { data: overview } = useQuery({
  queryKey: ['analytics', 'overview', tenantId, window],
  queryFn: () => api.analytics.getOverview({ window: '24h' }),
  staleTime: 30_000,
  refetchInterval: 30_000,
})

// useLiveSessions: GET /v1/sessions/live — SSE, pushed every 2s
const sessions = useLiveSessions()

// useAlerts: GET /v1/alerts?limit=4&sort=triggered_at:desc — staleTime: 30_000
const { data: alerts } = useQuery({ ... staleTime: 30_000 })

// useErrorRates: GET /v1/analytics/error-rates?groupBy=agent&window=1h — staleTime: 60_000
const { data: health } = useQuery({ ... staleTime: 60_000 })
```

**Key component behaviours:**
- `SessionFeed`: rows flash blue briefly when a new session arrives or an
  existing session's status/token count changes.
- `MetricCards`: `live sessions` count derived from SSE feed, not analytics query.
- `AgentHealth`: error rate bars use a non-linear scale — 15% fills the bar 100%.
- `AlertPanel`: severity dot colors — red = critical, amber = warning, orange = medium, blue = info.

---

### Surface 2: Sessions (`pages/Sessions.tsx`)

Filterable, sortable session table.

**Filter state lives in Zustand `sessionFilters` store**, not in URL search params.
TanStack Router search params are used for pagination only (`?page=2`).

**Table columns:**
```
Session ID  | Agent        | Status | Env     | Started | Duration | Tokens    | Nodes | →
(8-char)    | agent_xxx    | badge  | badge   | "3m ago" | "47.8s" | bar+num  | count | view
```

**Data:**
```typescript
const { data } = useQuery({
  queryKey: ['sessions', filters, sort, page],
  queryFn: () => api.sessions.getList({ ...filters, sort, page, limit: 20 }),
  staleTime: 10_000,
  keepPreviousData: true,
})
```

---

### Surface 3: Session detail / trace view (`pages/SessionDetail.tsx`)

**Layout:** two-column fixed — timeline (left, ~60%) + right panel (~40%)

**EventTimeline:**
- Virtualised with `@tanstack/react-virtual` (sessions can have 500+ events)
- Cursor pagination: "Load more" fetches next 100 events
- Dot colors per category: graph `#7F77DD`, node `#1D9E75`, llm `#BA7517`, tool `#D85A30`, state `#378ADD`

**Data:**
```typescript
// staleTime: Infinity for finalised sessions; 5_000 + refetchInterval for open
const { data: session } = useQuery({ queryKey: ['session', sessionId], ... })
const { data, fetchNextPage } = useInfiniteQuery({ queryKey: ['trace', sessionId], ... })
```

---

### Surface 4: Analytics (`pages/Analytics.tsx`)

Time-series charts and cost table. All `staleTime` values match API cache TTLs:
- `60_000` — llm-usage, error-rates, latency
- `300_000` — cost
- `30_000` — overview

---

### Surface 5: Detection (`pages/Detection.tsx`)

Three tabs: Alert inbox / Rules / Channels. Rules toggle calls `PUT /v1/rules/:id`.
DryRunPreview shows after save using the preview returned by `POST /v1/rules`.

---

### Surface 6: Security (`pages/Security.tsx`)

Three tabs: Overview / Session detail / Remediation. Proxies to `dapplepot_security`
via `dapplepot_api`. All security endpoints under `/v1/security/`.

---

### Surface 7: Settings (`pages/Settings.tsx`)

Route: `/settings`

Three sections:
1. **Profile** — `ProfileForm` (name + optional password change) for all roles
2. **SDK Keys** — `SdkKeySection` — `maskedKey` shown for all roles; admin can click **Show** to reveal full key via `GET /v1/sdk-keys/:id/reveal`. Full key cached in component state after first reveal; subsequent Show/Hide toggles don't re-fetch.
3. **Users** — `UserTable` + "Invite user" button (admin only, gated on `me.role === 'admin'`)

Role check uses `useMe()` (server-fresh), not the Zustand store (set at login, potentially stale).

---

### Surface 8: Agents (`pages/Agents.tsx`)

Route: `/agents`

Agent registry — searchable table of all tenant agents. Columns: Name, Agent ID (copyable), Latest Version, Created.

"New agent" button only shown when `me?.role === 'admin'` — opens `CreateAgentModal`.

Agent IDs are copyable: each row has a Copy icon that copies the full ID to clipboard with a momentary checkmark.

---

### Surface SA-1: SuperAdmin Home (`components/overview/SuperAdminHome.tsx`)

Rendered by `Overview.tsx` when `user.role === 'superadmin'`. Welcome screen with a prominent "Onboard a client" link button to `/onboard-client`.

---

### Surface SA-2: Tenants (`pages/Tenants.tsx`)

Route: `/tenants` — superadmin only (sidebar item excluded for tenant roles).

Searchable table of all tenants. Columns: Tenant Name + ID, Admin (name/email or "No admin assigned"), Users, Status badge, Created.
Search filters across tenant name, admin name, and admin email.

---

### Surface SA-3: Onboard Client (`pages/OnboardClient.tsx`)

Route: `/onboard-client` — visible in sidebar only for `superadmin` role.

Two-step wizard. All data is collected locally before a single API call fires:

**Step 1 — Tenant Info** (`TenantInfoStep`):
- `name` (required, unique) → `tenants.name`
- `tokenBudget` (optional number) → `tenants.token_budget`
- `rateLimit` (optional number) → `tenants.rate_limit`

**Step 2 — Admin Account** (`AdminAccountStep`):
- `name`, `email`, `password`, `confirmPassword` → `users` row with `role='admin'`

**Submit**: `useOnboardClient().mutate({ tenant, admin })` → `POST /v1/tenants/onboard`

**Success screen**: displays `tenantId`, `tenant.name`, `admin.email`.

Backend contract: see `docs/api-onboarding-contract.md`.

---

## 4. API client pattern

Two ky instances:

```typescript
// src/api/auth.ts — bare client, no auth header, used for token-lifecycle endpoints
const bare = ky.create({ prefixUrl: API_BASE, timeout: 30_000 })

export function login(body: LoginRequest): Promise<LoginResponse> {
  return bare.post('v1/auth/login', { json: body }).json()
}
export function refresh(body: RefreshRequest): Promise<RefreshResponse> {
  return bare.post('v1/auth/refresh', { json: body }).json()
}
export async function logout(body: LogoutRequest): Promise<void> {
  await bare.post('v1/auth/logout', { json: body })
}
// forgotPassword, resetPassword, acceptInvite follow same pattern
```

```typescript
// src/api/client.ts — authenticated client used by all non-auth API calls
import { refresh } from './auth'   // no circular dep: auth.ts does NOT import client.ts

let refreshPromise: Promise<string | null> | null = null

async function tryRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise   // deduplicate concurrent 401s
  const { refreshToken, setAccessToken, clearAuth } = useAuthStore.getState()
  if (!refreshToken) return null
  refreshPromise = refresh({ refreshToken })
    .then(r => { setAccessToken(r.accessToken, r.refreshToken); return r.accessToken })
    .catch(() => { clearAuth(); return null })
    .finally(() => { refreshPromise = null })
  return refreshPromise
}

export const apiClient = ky.create({
  prefixUrl: API_BASE,
  hooks: {
    beforeRequest: [(request) => {
      const token = useAuthStore.getState().accessToken
      if (token) request.headers.set('Authorization', `Bearer ${token}`)
    }],
    afterResponse: [async (request, _opts, response) => {
      if (response.status !== 401) return   // void → ky uses original response

      const newToken = await tryRefresh()
      if (!newToken) { window.location.href = '/login'; return }

      // Only retry bodyless requests — POST/PATCH body stream is consumed by this point
      if (request.body !== null) return

      const headers: Record<string, string> = {}
      request.headers.forEach((v, k) => { headers[k] = v })
      headers['Authorization'] = `Bearer ${newToken}`
      return fetch(request.url, { method: request.method, headers })
    }],
  },
})
```

All non-auth API functions use `apiClient`:
```typescript
// src/api/sessions.ts
export async function getSessionDetail(sessionId: string): Promise<SessionDetail> {
  return apiClient.get(`v1/sessions/${sessionId}`).json<SessionDetail>()
}
```

---

## 5. SSE hooks

Native `EventSource` does not support custom headers. All SSE connections use
`@microsoft/fetch-event-source`.

```typescript
// src/api/sse.ts
export function useLiveSessions() {
  const queryClient = useQueryClient()
  useEffect(() => {
    const controller = new AbortController()
    const connect = async () => {
      const token = useAuthStore.getState().accessToken   // ← accessToken, not token
      await fetchEventSource(`${API_BASE}/v1/sessions/live`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
        onmessage(event) {
          if (event.event === 'sessions') {
            const sessions = JSON.parse(event.data) as SessionSummary[]
            queryClient.setQueryData(['sessions', 'live'], sessions)
          }
        },
        onerror() { /* fetchEventSource retries automatically */ },
      })
    }
    void connect()
    return () => controller.abort()
  }, [queryClient])

  return useQuery({
    queryKey: ['sessions', 'live'],
    queryFn: () => [] as SessionSummary[],
    staleTime: Infinity,
  })
}
```

---

## 6. Auth store

```typescript
// src/stores/auth.ts
interface AuthState {
  accessToken:    string | null   // localStorage key: dp_access_token
  refreshToken:   string | null   // localStorage key: dp_refresh_token
  user:           UserSummary | null  // localStorage key: dp_user (JSON)
  setTokens:      (access: string, refresh: string, user: UserSummary) => void
  setAccessToken: (access: string, refresh: string) => void
  clearAuth:      () => void
}
```

- `setTokens` — called by `useLogin.onSuccess` and `useAcceptInvite.onSuccess`
- `setAccessToken` — called by `tryRefresh` in `client.ts`
- `clearAuth` — called by `useLogout.onSettled` and `tryRefresh` on failure

---

## 7. Auth hooks

```typescript
// src/hooks/useAuth.ts
export function useLogin()           // mutate({ email, password }) → setTokens → navigate('/')
export function useLogout()          // mutate() → POST /v1/auth/logout → onSettled: clearAuth + navigate('/login')
export function useForgotPassword()  // mutate({ email })
export function useResetPassword()   // mutate({ token, password })
export function useAcceptInvite()    // mutate({ token, name, password }) → setTokens → navigate('/')

// src/hooks/useUsers.ts
export function useMe()              // GET /v1/users/me — staleTime: 5min
export function useUpdateMe()        // PATCH /v1/users/me
export function useUsers()           // GET /v1/users — unwraps Paginated<UserSummary> → data array
export function useInviteUser()      // POST /v1/users/invite → invalidates ['invites']
export function useInvites()         // GET /v1/users/invites
export function useChangeRole(id)    // PATCH /v1/users/:id/role → invalidates ['users']
export function useChangeStatus(id)  // PATCH /v1/users/:id/status → invalidates ['users']

// src/hooks/useTenants.ts
export function useOnboardClient()   // POST /v1/tenants/onboard (mutation)
export function useTenants()         // GET /v1/tenants — queryKey: ['tenants']

// src/hooks/useAgents.ts
export function useAgents()          // GET /v1/agents — queryKey: ['agents']
export function useCreateAgent()     // POST /v1/agents → invalidates ['agents']

// src/hooks/useSdkKeys.ts
export function useSdkKeys()         // GET /v1/sdk-keys — queryKey: ['sdk-keys']
export function useRevealSdkKey()    // GET /v1/sdk-keys/:id/reveal (mutation pattern)
```

---

## 8. TanStack Query key conventions

```typescript
// Tenants (superadmin)
['tenants']
// useOnboardClient is a mutation — no query key

// Agents
['agents']

// SDK keys
['sdk-keys']

// Auth / users
['me']
['users']
['invites']

// Sessions
['sessions', filters, sort, page]
['session', sessionId]
['trace', sessionId]
['session-alerts', sessionId]
['session-security', sessionId]

// Analytics
['analytics', 'overview', tenantId, window]
['analytics', 'llm-usage', tenantId, window, agentId]
['analytics', 'error-rates', tenantId, window, agentId]
['analytics', 'latency', tenantId, window]
['analytics', 'cost', tenantId, window]

// Alerts
['alerts', filters, sort, page]
['alert', alertId]
['alerts', 'stats']

// Rules + channels
['rules', tenantId]
['channels', tenantId]

// Security
['security', 'overview', tenantId, window]
['security', 'session', sessionId]
['security', 'remediation', tenantId]
```

---

## 9. Loading states and skeletons

Every data-heavy component renders a `Skeleton` while loading.
Never show a blank layout or a spinner that blocks the whole page.

```typescript
if (isLoading) return <MetricCardsSkeleton />
if (isError)   return <ErrorCard message={error.message} />
return <MetricCards data={data} />
```

---

## 10. Routing (TanStack Router)

```typescript
// src/router.tsx
function requireAuth() {
  const token = useAuthStore.getState().accessToken
  if (!token) throw redirect({ to: '/login' })
}

// Auth routes — no requireAuth, token is optional on these params
const loginRoute          = createRoute({ path: '/login',            component: Login })
const forgotPasswordRoute = createRoute({ path: '/forgot-password',  component: ForgotPassword })
const resetPasswordRoute  = createRoute({ path: '/reset-password',   component: ResetPassword,
                                          validateSearch: z.object({ token: z.string().optional() }) })
const acceptInviteRoute   = createRoute({ path: '/accept-invite',    component: AcceptInvite,
                                          validateSearch: z.object({ token: z.string().optional() }) })

// Protected routes — all have beforeLoad: requireAuth
const overviewRoute  = createRoute({ path: '/',              beforeLoad: requireAuth, component: Overview })
const sessionsRoute  = createRoute({ path: '/sessions',      beforeLoad: requireAuth, component: Sessions,
                                     validateSearch: z.object({ page: z.number().default(1) }) })
const sessionRoute   = createRoute({ path: '/sessions/$id',  beforeLoad: requireAuth, component: SessionDetail })
const analyticsRoute = createRoute({ path: '/analytics',     beforeLoad: requireAuth, component: Analytics })
const detectionRoute = createRoute({ path: '/detection',     beforeLoad: requireAuth, component: Detection })
const securityRoute  = createRoute({ path: '/security',      beforeLoad: requireAuth, component: Security })
const settingsRoute       = createRoute({ path: '/settings',        beforeLoad: requireAuth, component: Settings })
const agentsRoute         = createRoute({ path: '/agents',          beforeLoad: requireAuth, component: Agents })
const tenantsRoute        = createRoute({ path: '/tenants',         beforeLoad: requireAuth, component: Tenants })
const onboardClientRoute  = createRoute({ path: '/onboard-client',  beforeLoad: requireAuth, component: OnboardClient })
```

Role gating for superadmin-only routes (`/tenants`, `/onboard-client`) and tenant-only routes is done at the **component level** — the route requires a valid JWT, but the page component renders an access-denied view if the role doesn't match. This avoids redirect loops and keeps route declarations clean.

### AppShell auth bypass + redirect

```typescript
// src/layout/AppShell.tsx
const AUTH_ROUTES = new Set(['/login', '/forgot-password', '/reset-password', '/accept-invite'])

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const isAuthed = useAuthStore((s) => !!s.accessToken)

  // Redirect logged-in users away from auth pages
  useEffect(() => {
    if (isAuthed && AUTH_ROUTES.has(pathname)) void navigate({ to: '/' })
  }, [isAuthed, pathname, navigate])

  if (AUTH_ROUTES.has(pathname)) return <Outlet />   // no sidebar or topbar

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  )
}
```

---

## 11. Role-based UI gating

```typescript
// Always use me.role from useMe() — NOT useAuthStore(s => s.user?.role)
// Zustand user is set at login and stale mid-session; useMe() is server-fresh
const { data: me } = useMe()

// Hide (not just disable) buttons for roles that can't use them
{me?.role === 'admin' && <InviteUserButton />}
{(me?.role === 'admin' || me?.role === 'editor') && <AcknowledgeButton />}
```

| Role | Sidebar | Key capabilities |
|------|---------|-----------------|
| `superadmin` | Tenants, Onboard Client | Create tenants + first admin; list all tenants. Sees SuperAdminHome at `/` instead of tenant dashboard |
| `admin` | All tenant surfaces | SDK key reveal, user management (invite/role/suspend), agent creation, rule/channel CRUD, alert ack/resolve, kill-switch |
| `editor` | All tenant surfaces | Alert ack/resolve, rule create/edit, kill-switch/interrupt — no channel config, no user mgmt, no SDK key reveal |
| `viewer` | All tenant surfaces | Read-only — all dashboards visible, no action buttons |

Sidebar uses an **exclude list** per item — `superadmin` is excluded from all tenant nav items; tenant roles (`admin`, `editor`, `viewer`) are excluded from superadmin nav items. Adding a new nav item only requires adding exclusions where needed.

---

## 12. Environment variables

```bash
VITE_API_BASE_URL=http://localhost:3000    # dapplepot_api URL (default: localhost:3000)
VITE_APP_ENV=development                   # 'development' | 'staging' | 'production'
```

---

## 13. Local dev setup (this repo is Step 7)

```bash
# dapplepot_api must be running first
git clone https://github.com/dapplepot/dapplepot_ui
cd dapplepot_ui
pnpm install
cp .env.example .env
pnpm dev         # Vite dev server on http://localhost:5173

# Default admin credentials (after pnpm seed-admin in dapplepot_api):
# Email: admin@dapplepot.dev   Password: changeme123
```

Vite proxies `/v1/` to `dapplepot_api`:
```typescript
// vite.config.ts
server: { proxy: { '/v1': { target: 'http://localhost:3000', changeOrigin: true } } }
```

---

## 14. Build order

### Phase 1 — Foundation
```
src/utils/cn.ts
src/utils/format.ts
src/utils/eventColors.ts
src/types/auth.ts              ← UserSummary, LoginResponse, RefreshResponse, etc.
src/stores/auth.ts             ← accessToken + refreshToken + user (dp_access_token / dp_refresh_token / dp_user)
src/api/auth.ts                ← bare ky: login, refresh, logout, forgotPassword, resetPassword, acceptInvite
src/api/client.ts              ← apiClient with JWT interceptor + 401 auto-refresh logic
src/stores/ui.ts
```

### Phase 2 — API client functions (no UI yet)
```
src/api/tenants.ts
src/api/agents.ts
src/api/sdkKeys.ts
src/api/sessions.ts
src/api/analytics.ts
src/api/alerts.ts
src/api/rules.ts
src/api/channels.ts
src/api/control.ts
src/api/sse.ts
```

### Phase 3 — TanStack Query hooks
```
src/hooks/useAuth.ts           ← useLogin, useLogout, useForgotPassword, useResetPassword, useAcceptInvite
src/hooks/useUsers.ts          ← useMe, useUpdateMe, useUsers (Paginated unwrap), useInviteUser, useInvites, useChangeRole, useChangeStatus
src/hooks/useTenants.ts        ← useOnboardClient, useTenants
src/hooks/useAgents.ts         ← useAgents, useCreateAgent
src/hooks/useSdkKeys.ts        ← useSdkKeys, useRevealSdkKey
src/hooks/useSessions.ts
src/hooks/useAnalytics.ts
src/hooks/useAlerts.ts
src/hooks/useRules.ts
src/hooks/useChannels.ts
src/hooks/useControl.ts
src/hooks/useSecurity.ts
```

### Phase 4 — Zustand stores
```
src/stores/sessionFilters.ts
src/stores/alertFilters.ts
src/stores/traceFilters.ts
```

### Phase 5 — Shared UI primitives (shadcn/ui, copy in via CLI)
```
src/components/ui/button.tsx
src/components/ui/badge.tsx
src/components/ui/input.tsx
src/components/ui/select.tsx
src/components/ui/table.tsx
src/components/ui/tabs.tsx
src/components/ui/toggle.tsx
src/components/ui/skeleton.tsx
```

### Phase 6 — Auth components + pages + layout
```
src/components/auth/LoginForm.tsx
src/components/auth/ForgotPasswordForm.tsx
src/components/auth/ResetPasswordForm.tsx
src/components/auth/InviteAcceptForm.tsx
src/pages/Login.tsx
src/pages/ForgotPassword.tsx
src/pages/ResetPassword.tsx
src/pages/AcceptInvite.tsx
src/layout/Sidebar.tsx         ← nav items, Settings link, user name/email, Sign out
src/layout/Topbar.tsx          ← breadcrumbs
src/layout/AppShell.tsx        ← auth bypass + authenticated redirect
src/router.tsx                 ← all routes, requireAuth guard
src/main.tsx
```

### Phase 7 — Settings surface
```
src/types/sdkKey.ts
src/components/settings/RoleBadge.tsx
src/components/settings/SdkKeySection.tsx
src/components/settings/ProfileForm.tsx
src/components/settings/InviteModal.tsx
src/components/settings/UserTable.tsx
src/pages/Settings.tsx
```

### Phase 7b — Agents surface
```
src/types/agent.ts
src/components/agents/CreateAgentModal.tsx
src/components/agents/AgentTable.tsx
src/pages/Agents.tsx
```

### Phase 7c — Superadmin surfaces (Tenants + Onboard Client)
```
src/types/tenant.ts
src/components/overview/SuperAdminHome.tsx
src/components/onboarding/TenantInfoStep.tsx
src/components/onboarding/AdminAccountStep.tsx
src/components/onboarding/OnboardingWizard.tsx
src/pages/Tenants.tsx
src/pages/OnboardClient.tsx
```

### Phase 8 — Surface 1: Overview (tenant dashboard)
```
src/components/overview/MetricCards.tsx
src/components/overview/SessionFeed.tsx
src/components/overview/AlertPanel.tsx
src/components/overview/AgentHealth.tsx
src/pages/Overview.tsx                 ← renders SuperAdminHome for superadmin, tenant dashboard otherwise
```

### Phase 9 — Surface 2: Sessions
```
src/components/sessions/StatusBadge.tsx
src/components/sessions/SessionFilters.tsx
src/components/sessions/SessionRow.tsx
src/components/sessions/SessionTable.tsx
src/components/sessions/SessionPagination.tsx
src/pages/Sessions.tsx
```

### Phase 10 — Surface 3: Trace view
```
src/components/trace/MetricStrip.tsx
src/components/trace/EventRow.tsx
src/components/trace/EventPayload.tsx
src/components/trace/EventTimeline.tsx
src/components/trace/GraphStateTab.tsx
src/components/trace/SessionInfoTab.tsx
src/components/trace/AlertsTab.tsx
src/components/trace/SecurityTab.tsx
src/components/trace/RightPanel.tsx
src/components/trace/TraceHeader.tsx
src/components/trace/TraceLayout.tsx
src/pages/SessionDetail.tsx
```

### Phase 11 — Surface 4: Analytics
```
src/components/analytics/DateRangePicker.tsx
src/components/analytics/TokenChart.tsx
src/components/analytics/ErrorRateChart.tsx
src/components/analytics/LatencyChart.tsx
src/components/analytics/CostTable.tsx
src/pages/Analytics.tsx
```

### Phase 12 — Surface 5: Detection
```
src/components/detection/AlertDrawer.tsx
src/components/detection/AlertFeed.tsx
src/components/detection/DryRunPreview.tsx
src/components/detection/RuleForm.tsx
src/components/detection/RuleList.tsx
src/components/detection/ChannelList.tsx
src/pages/Detection.tsx
```

### Phase 13 — Surface 6: Security
```
src/components/security/RiskDistribution.tsx
src/components/security/OwaspFrequency.tsx
src/components/security/HighRiskTable.tsx
src/components/security/SessionRiskPanel.tsx
src/components/security/FindingsList.tsx
src/components/security/RemediationGuide.tsx
src/pages/Security.tsx
```

---

## 15. Locked design decisions — do not change

| # | Decision | Reason |
|---|----------|--------|
| 1 | `staleTime` matches API cache TTL per endpoint | Prevents redundant re-fetches that bypass the API cache |
| 2 | `staleTime: Infinity` for finalised session detail + trace | Session is immutable once finalised; never re-fetch |
| 3 | Cursor pagination on trace, never OFFSET | `sequence_index > $cursor` is O(1); OFFSET is O(N) |
| 4 | Filter state in Zustand, pagination in URL | Filters persist on back-navigation; page resets on filter change |
| 5 | Virtualise the event timeline with `@tanstack/react-virtual` | Sessions can have 500+ events; rendering all at once causes jank |
| 6 | Types **copied** into `src/types/` — run `pnpm sync-types` after API changes | Repos deploy separately — path alias to `../dapplepot-api` does not work in CI |
| 7 | Non-linear scale on error rate bars (100% at 15%) | A 10% error rate should look alarming, not negligible |
| 8 | SSE updates React Query cache directly via `setQueryData` | Avoids a redundant HTTP re-fetch when SSE delivers fresh data |
| 9 | `@microsoft/fetch-event-source` for all SSE connections | Native `EventSource` does not support `Authorization` headers |
| 10 | Custom Tailwind + CVA components — no external component library | Full control over styling with no dependency on shadcn releases |
| 11 | `api/auth.ts` uses a separate bare ky instance, does not import `apiClient` | Avoids circular dependency — `client.ts` imports `refresh()` from `auth.ts` |
| 12 | Only GET/HEAD requests are retried after token refresh | POST/PATCH body ReadableStream is consumed before `afterResponse` fires; cannot replay |
| 13 | Concurrent 401s share one refresh call via `refreshPromise` deduplication | Prevents multiple simultaneous `POST /v1/auth/refresh` calls racing each other |
| 14 | Role check uses `useMe().data.role` in Settings, not `useAuthStore().user.role` | Zustand `user` is set at login and stale mid-session; `useMe()` is server-fresh |
| 15 | `useLogout` uses `onSettled`, not `onSuccess` | Local auth must be cleared even if the server-side logout call fails |
| 16 | Auth routes bypass AppShell; authenticated users are redirected away from them | Login/invite/reset are full-screen — no sidebar/topbar; also prevents logged-in users re-seeing login |
| 17 | Sidebar uses exclude list, not allow list | Adding a new nav item doesn't require updating every role — only add exclusions where needed |
| 18 | Onboarding wizard collects all data before submitting | Single atomic `POST /v1/tenants/onboard` — no orphaned tenants if user abandons step 2 |
| 19 | `superadmin` gated at component level, not route level | Route requires valid JWT; role check inside the page renders access-denied instead of redirecting |
| 20 | SDK key masking done by backend, reveal via separate endpoint | `key_hash` is one-way — backend stores `masked_key` + `raw_key` at creation; UI never derives the mask |
| 21 | `useUsers` unwraps `Paginated<UserSummary>` with `.then(r => r.data)` | Backend returns paginated envelope; UserTable expects a plain array — unwrap in the hook, not the component |
| 22 | Tenant ID shown in Topbar from Zustand store, not `useMe()` | Already in memory from login — no extra network call on every page |
| 23 | SDK key reveal uses per-row mutation with local state cache | Full key fetched once per row per session; Show/Hide toggles after first reveal don't re-fetch |

---

## 16. What done looks like

**Auth done:** `/login` renders full-screen without sidebar or topbar. Valid
credentials store `accessToken` + `refreshToken` + `user` in localStorage and
navigate to `/`. An expired access token triggers a 401 — the client silently
refreshes, retries GET requests, and only redirects to `/login` if the refresh
itself fails. Logout clears all auth state and redirects regardless of API
response. Admin users see UserTable + Invite button on `/settings`; non-admins
see only the profile form. Navigating to `/login` while already authenticated
redirects to `/`.

**Phase 7 done (Settings):** Profile form saves. SDK key section shows masked keys (`dp_sk_••••…`) for all roles. Admin sees Show/Hide button — clicking Show fetches and displays the full key; subsequent toggles don't re-fetch. Admin sees UserTable + Invite button; non-admins see only the profile and masked keys.

**Phase 7b done (Agents):** `/agents` renders agent table with Name, copyable Agent ID, Latest Version, Created columns. Admin sees "New agent" button; others don't. Copy icon writes agent ID to clipboard with checkmark feedback.

**Phase 7c done (Superadmin):** `superadmin` logging in sees SuperAdminHome at `/` with "Onboard a client" button. `/tenants` shows all tenants with admin name/email and user count. `/onboard-client` two-step wizard completes with a single `POST /v1/tenants/onboard`; success screen shows `tenantId`, tenant name, admin email. Tenant users navigating to `/tenants` or `/onboard-client` see an access-denied message, not a redirect.

**Phase 8 done:** Overview page loads, metric cards show real numbers,
session feed updates live via SSE, alert dots appear with correct severity
colours, agent health bars render with non-linear scale.

**Phase 10 done:** Navigate to a session, timeline renders all events in
order with correct dot colours, clicking an event expands its payload JSON,
right panel tabs switch correctly, "Load more" fetches next 100 events.

**Phase 12 done:** Alert feed filters by severity and status, clicking a row
opens the inline drawer with all fields, "Acknowledge" button updates status
immediately, rule toggle correctly invalidates rule cache, dry-run preview
shows after save using data returned by `POST /v1/rules`.

**Phase 13 done:** `/security` page loads, overview metrics show real numbers,
risk distribution bars render for all 5 bands, OWASP frequency chart shows
signal IDs, highest-risk table links to session detail, remediation tab ranks
cards by frequency.

**Full build done:** All seven pages + four auth routes navigate correctly,
`requireAuth` redirects unauthenticated users to `/login`, no TypeScript
errors, no console errors, all loading states show skeletons, all error states
show error cards.

---

*Single source of truth for `dapplepot_ui`.
Build in phase order. Do not skip phases.*
