# DapplePot UI — Agent Index

**Role:** React dashboard for monitoring AI agents. Serves two personas: tenant operators (sessions, security, analytics, alerts) and superadmin operators (tenant management, onboarding). All data comes from `dapplepot-api` via REST + SSE.

**Stack:** React 19, TypeScript (strict), Vite 6, TanStack Router + Query, Zustand, Tailwind CSS v4, Recharts, ky (HTTP), @microsoft/fetch-event-source (SSE)
**No external component library** — custom primitives via CVA + Tailwind.

---

## Directory Map

```
src/
  main.tsx              QueryClient + RouterProvider
  router.tsx            16 routes, requireAuth guard (beforeLoad)
  index.css

  types/                Copied from dapplepot-api/src/types/ (run: pnpm sync-types)
    auth.ts             UserRole, UserSummary, LoginResponse, RefreshResponse
    session.ts          SessionSummary, SessionDetail, TracePage, TraceEvent
    analytics.ts        AnalyticsOverview, LlmUsageData, ErrorRateData, LatencyData, CostEntry
    alert.ts            AlertSummary, AlertDetail, AlertStats
    security.ts         SessionRiskScore, SecurityFinding, AgentProfile, RemediationCard, SignalRegistryEntry
    channel.ts          ChannelSummary
    rule.ts             PolicyRule, RuleType, RuleCondition
    common.ts           Paginated<T>, ApiError, ListParams
    tenant.ts           TenantSummary, TenantWithStats, OnboardClientRequest
    agent.ts            AgentSummary, CreateAgentRequest

  api/                  All HTTP calls — one file per resource
    client.ts           apiClient (ky): JWT beforeRequest hook, 401 auto-refresh, deduplication
    auth.ts             bare ky (no auth header): login, logout, refresh, forgotPassword, resetPassword, acceptInvite
    sessions.ts         getSessionList, getSessionDetail, getTrace (cursor pagination)
    analytics.ts        getOverview, getLlmUsage, getErrorRates, getLatency, getCost
    alerts.ts           getAlerts, getAlertDetail, updateAlertStatus, getAlertStats
    rules.ts            getRules, createRule, updateRule
    channels.ts         getChannels, createChannel, updateChannel
    agents.ts           getAgents, createAgent
    tenants.ts          onboardClient, getTenants
    sdkKeys.ts          getSdkKeys, revealSdkKey
    control.ts          killSwitch, interrupt
    security.ts         getSecurityOverview, getSessionScore, getSessionFindings, getRemediation,
                        getTopAgents, getAgentProfile, getSignalRegistry,
                        getSubcheckConfig, getAlertConfig,
                        updateCompositeThreshold, updateLlmCompositeThreshold,
                        updateAsiCompositeThreshold, updateSignalThreshold, setSubcheckOnline
    sse.ts              useLiveSessions (hook), useControlChannel (hook)
                        fetchEventSource with custom Authorization headers

  hooks/                TanStack Query hooks — one file per resource
    useAuth.ts          useLogin, useLogout, useForgotPassword, useResetPassword, useAcceptInvite
    useUsers.ts         useMe (server-fresh), useUpdateMe, useUsers, useInviteUser, useInvites, useChangeRole, useChangeStatus
    useTenants.ts       useOnboardClient (mutation), useTenants, useTenant
    useAgents.ts        useAgents, useCreateAgent (invalidates ['agents'])
    useSdkKeys.ts       useSdkKeys, useRevealSdkKey
    useSessions.ts      useSessionList, useSessionDetail, useSessionTrace (infinite query, cursor)
    useAnalytics.ts     useOverview, useLlmUsage, useErrorRates, useLatency, useCost
    useAlerts.ts        useAlerts, useAlertDetail, useAlertStats, useUpdateAlertStatus
    useRules.ts         useRules, useCreateRule, useUpdateRule
    useChannels.ts      useChannels, useCreateChannel, useUpdateChannel
    useControl.ts       useKillSwitch (mutation), useInterrupt, useLiveSessions (SSE)
    useSecurity.ts      useSecurityOverview, useSessionSecurity, useRemediation, useTopAgents,
                        useAgentProfile, useSignalRegistry, useSubcheckConfig, useAlertConfig,
                        update threshold mutations (4), useToggleSubcheckOnline

  stores/               Zustand — UI + auth only (not server state)
    auth.ts             accessToken, refreshToken, user → localStorage (dp_access_token, dp_refresh_token, dp_user)
                        setTokens, setAccessToken, clearAuth
    ui.ts               sidebarCollapsed, activeTab, selectedSessionId
    sessionFilters.ts   status, agentId, environment, dateRange, searchQuery (persist on back-nav)
    alertFilters.ts     severity, status, ruleId
    traceFilters.ts     activeCategory for event timeline

  data/
    signalRegistry.ts   Static copy of 20 OW signals + 121 sub-checks (detection phase, severity,
                        confidence tier, onlineCapable). Exports: SIGNAL_REGISTRY, LLM_SIGNALS,
                        ASI_SIGNALS. Used by AgentConfig without API call.

  pages/                One file per route
    Login.tsx           /login — no AppShell chrome
    ForgotPassword.tsx  /forgot-password
    ResetPassword.tsx   /reset-password?token=
    AcceptInvite.tsx    /accept-invite?token=
    Overview.tsx        / — SuperAdminHome (superadmin) | MetricCards+SessionFeed+AlertPanel+AgentHealth (tenant)
    Sessions.tsx        /sessions — SessionTable + filters + URL pagination
    SessionDetail.tsx   /sessions/:id — EventTimeline (left) + RightPanel with 4 tabs (right)
    Analytics.tsx       /analytics — date picker, 4 charts + cost table
    Detection.tsx       /detection — AlertFeed | RuleList | ChannelList (3 tabs)
    Security.tsx        /security — risk overview; Sessions tab + Agents tab
    Agents.tsx          /agents — agent registry table + create modal
    AgentSecurityProfile.tsx  /agents/$agentId — LLM/ASI scores, trust, signal breakdown, recent sessions
    AgentConfig.tsx     /agents/$agentId/config — subcheck online toggles + thresholds
    Settings.tsx        /settings — profile, SDK keys, user mgmt (admin only)
    Tenants.tsx         /tenants — superadmin only
    OnboardClient.tsx   /onboard-client — two-step wizard (superadmin only)

  layout/
    AppShell.tsx        Root: sidebar + topbar + <Outlet> (not on auth routes)
    Sidebar.tsx         9 nav items, exclude-based role filtering, user menu, sign-out
    Topbar.tsx          Breadcrumbs + tenant ID badge (copyable)

  components/
    auth/               LoginForm, ForgotPasswordForm, ResetPasswordForm, InviteAcceptForm
    onboarding/         TenantInfoStep, AdminAccountStep, OnboardingWizard
    settings/           ProfileForm, SdkKeySection, UserTable, InviteModal, RoleBadge
    agents/             AgentTable (searchable, copyable ID), CreateAgentModal
    overview/           MetricCards, SessionFeed, AlertPanel, AgentHealth, SuperAdminHome
    sessions/           SessionTable, SessionRow, SessionFilters, SessionPagination, StatusBadge
    trace/              TraceLayout, TraceHeader, MetricStrip, EventTimeline (virtualised),
                        EventRow, EventPayload, RightPanel, GraphStateTab, SessionInfoTab,
                        AlertsTab, SecurityTab
    analytics/          DateRangePicker, TokenChart, ErrorRateChart, LatencyChart, CostTable,
                        AlertVolumeChart, OWASPFrequencyChart, SecurityBandChart, SessionFunnelChart
    detection/          AlertFeed, AlertDrawer, RuleList, RuleForm, DryRunPreview, ChannelList
    security/           RiskDistribution, OwaspFrequency, HighRiskTable, SessionRiskPanel,
                        FindingsList, RemediationGuide, OnlineFindingsList
    ui/                 button, badge, input, select, table, tabs, toggle, skeleton (CVA primitives)

  utils/
    cn.ts               clsx + tailwind-merge helper
    format.ts           formatTokens (1.2M), formatDuration (47.8s), formatAgo (3m ago)
    eventColors.ts      event category → hex color (for timeline dots)

vite.config.ts          Dev proxy: /v1/* → localhost:3000; path aliases: @ → src
tailwind.css            @import "tailwindcss"
.env.example            VITE_API_BASE_URL, VITE_APP_ENV
```

---

## All Pages & Routes

### Auth (no AppShell chrome)
| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login.tsx | Email+password form |
| `/forgot-password` | ForgotPassword.tsx | Send reset email |
| `/reset-password?token=` | ResetPassword.tsx | Consume token, set new password |
| `/accept-invite?token=` | AcceptInvite.tsx | Accept invite, create user, auto-login |

### Tenant Routes
| Route | Page | Key Data |
|-------|------|----------|
| `/` | Overview.tsx | `useOverview` + `useLiveSessions` (SSE) + `useAlerts` |
| `/sessions` | Sessions.tsx | `useSessionList` with Zustand filters + URL pagination |
| `/sessions/:id` | SessionDetail.tsx | `useSessionDetail` + `useSessionTrace` (infinite, cursor) |
| `/analytics` | Analytics.tsx | `useLlmUsage`, `useErrorRates`, `useLatency`, `useCost` |
| `/detection` | Detection.tsx | `useAlerts`, `useRules`, `useChannels` |
| `/security` | Security.tsx | `useSecurityOverview`, `useTopAgents` |
| `/agents` | Agents.tsx | `useAgents` |
| `/agents/:agentId` | AgentSecurityProfile.tsx | `useAgentProfile` |
| `/agents/:agentId/config` | AgentConfig.tsx | `useSubcheckConfig`, `useAlertConfig` |
| `/settings` | Settings.tsx | `useMe`, `useSdkKeys`, `useUsers` (admin only) |

### Superadmin Routes
| Route | Page | Key Data |
|-------|------|----------|
| `/` | Overview.tsx | Renders `<SuperAdminHome>` instead of tenant dashboard |
| `/tenants` | Tenants.tsx | `useTenants` |
| `/onboard-client` | OnboardClient.tsx | `useOnboardClient` (mutation) |

---

## Auth & Token Flow

```
POST /v1/auth/login
  → { accessToken, refreshToken, expiresIn, user }
  → Store in localStorage (dp_access_token, dp_refresh_token, dp_user)
  → Zustand: setTokens(...)

Every ky request:
  beforeRequest hook → Authorization: Bearer <accessToken>

On 401 response:
  1. Call tryRefresh() (deduplicated — one call for N concurrent 401s)
  2. POST /v1/auth/refresh
  3. If success → update Zustand accessToken → retry GET/HEAD only (POST body consumed)
  4. If fail → clearAuth() + window.location.href = '/login'

Logout:
  POST /v1/auth/logout → onSettled: clearAuth() (always clears even if server fails)
```

**Two ky instances** (avoids circular dep):
- `api/auth.ts` — bare ky, no JWT header (used for token lifecycle)
- `api/client.ts` — authenticated ky, imports refresh from auth.ts

---

## Role-Based Access

| Role | Access |
|------|--------|
| `superadmin` | Tenants, Onboard Client only. **Cannot access tenant surfaces.** |
| `admin` | All tenant surfaces + SDK key reveal + invite users + create agents + CRUD rules & channels |
| `editor` | All tenant surfaces + alert ack/resolve + kill-switch/interrupt. No user mgmt, no SDK reveal. |
| `viewer` | Read-only. No action buttons. |

**Gating:** Sidebar uses **exclude** lists (not allow lists). Role checks use `useMe().data?.role` (server-fresh, not Zustand stale value).

---

## State Architecture

### Server State (TanStack Query)
```typescript
// Key structure conventions
['sessions', { page, limit, status, agentId }]   // includes all params
['session', sessionId]
['trace', sessionId]                               // infinite query
['analytics', 'overview', tenantId, window]
['security', 'agent', agentId]
['security', 'overview', windowHours]

// staleTime matches API cache TTL:
// analytics: 30–300s | security: 120–300s | finalised sessions: Infinity
// live data: refetchInterval=30s (overview), 60s (health)
```

### UI State (Zustand)
```typescript
// auth.ts — token + user (localStorage)
useAuthStore.getState().accessToken          // used by ky beforeRequest hook
useAuthStore.getState().clearAuth()          // called on logout + refresh fail

// sessionFilters.ts — persists on back-nav (URL params reset pagination, Zustand holds filters)
useSessionFiltersStore.getState().status
useSessionFiltersStore.getState().setFilters({...})

// ui.ts — sidebar collapse + active tab
useUiStore.getState().sidebarCollapsed
```

---

## SSE Pattern

```typescript
// api/sse.ts — uses @microsoft/fetch-event-source (native EventSource lacks auth headers)
await fetchEventSource(`${API_BASE}/v1/sessions/live`, {
  headers: { Authorization: `Bearer ${token}` },
  signal: controller.signal,
  onmessage(event) {
    if (event.event === 'sessions') {
      const sessions = JSON.parse(event.data) as SessionSummary[]
      queryClient.setQueryData(['sessions', 'live'], sessions)  // updates cache directly
    }
  },
})
```

---

## Risk Scoring Display

The Security + SessionDetail pages display scores from `dapplepot-security`:

| Band | Score | Color |
|------|-------|-------|
| clean | 0–14 | #10b981 (green) |
| low | 15–34 | #60a5fa (blue) |
| medium | 35–59 | #f59e0b (amber) |
| high | 60–84 | #f97316 (orange) |
| critical | 85–100 | #ef4444 (red) |

**Trust score** (agent-level): ≥75 trusted (green) / 50–74 caution (amber) / <50 at risk (red)

**Dual scoring:** every session has `llmScore` (LLM framework) + `asiScore` (ASI framework) displayed separately.

---

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| `staleTime` matches API cache TTL | Prevents redundant re-fetches |
| `staleTime: Infinity` for finalised sessions | Sessions are immutable once finalised |
| Cursor pagination for trace (`afterSeq > cursor`) | O(1) vs O(N) for OFFSET |
| Filter state in Zustand, pagination in URL | Filters persist on back-nav; page resets on filter change |
| `@tanstack/react-virtual` for event timeline | 500+ events, no jank |
| `setQueryData` on SSE message | Avoids redundant HTTP re-fetch |
| Two ky instances (bare + authenticated) | Avoids circular import: client needs auth, auth must not need client |
| Only retry GET/HEAD after token refresh | POST body already consumed — can't replay |
| Deduplicate concurrent 401s | One refresh call shared across N simultaneous failures |
| `useLogout` uses `onSettled` not `onSuccess` | Must clear local auth even if server fails |
| Sidebar uses exclude lists | Adding nav item doesn't require updating every role |
| Types copied into `src/types/` | Repos deploy separately — path alias fails in CI |
| Signal tree from static `data/signalRegistry.ts` | Registry changes only on releases; no extra API call |
| Subcheck toggles use optimistic updates | Instant toggle feel; rollback on failure |

---

## Configuration

```env
VITE_API_BASE_URL=http://localhost:3000   # dapplepot-api URL
VITE_APP_ENV=development                  # development | staging | production
```

**vite.config.ts:** dev proxy `/v1/*` → `http://localhost:3000`; aliases `@` → `src`, `@dapplepot/types` → `src/types`

---

## Build & Scripts

```bash
pnpm install
cp .env.example .env
pnpm dev              # Vite dev server: http://localhost:5173
pnpm build            # tsc -b && vite build → dist/
pnpm preview          # Preview production build
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint src/
pnpm lint:fix         # eslint --fix src/
pnpm sync-types       # cp ../dapplepot-api/src/types/*.ts src/types/
```

---

## Finding Specific Code

| Need to... | File |
|-----------|------|
| Add a new page | `src/pages/<Page>.tsx` + add route in `src/router.tsx` |
| Add a new API call | `src/api/<resource>.ts` + hook in `src/hooks/use<Resource>.ts` |
| Add a new Zustand store | `src/stores/<name>.ts` |
| Change sidebar nav | `src/layout/Sidebar.tsx` → nav items array + exclude logic |
| Change auth flow | `src/api/auth.ts` + `src/api/client.ts` (beforeRequest/afterResponse hooks) |
| Change token storage keys | `src/stores/auth.ts` |
| Add a UI primitive | `src/components/ui/<component>.tsx` with CVA |
| Change risk band colors | Search `#10b981\|#60a5fa\|#f59e0b\|#f97316\|#ef4444` in `src/components/` |
| Add a security signal to the config tree | `src/data/signalRegistry.ts` |
| Change trace event dot colors | `src/utils/eventColors.ts` |
| Change analytics window options | `src/components/analytics/DateRangePicker.tsx` |
| Debug SSE connection | `src/api/sse.ts` + `src/hooks/useControl.ts` |
| Debug 401 / token refresh | `src/api/client.ts` → afterResponse hook |
