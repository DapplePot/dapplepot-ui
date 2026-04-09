
# dapplepot_ui

**Dapplepot — Dashboard UI**

Zone 5 of the Dapplepot observability platform. The React dashboard for
monitoring LangGraph agents — session traces, analytics, alert management,
security posture, and multi-tenant administration.

**Language: TypeScript + React 19 + Vite**

---

## What this is

The frontend that makes the platform usable. Two distinct experiences share one codebase — a **tenant dashboard** for client users and a **superadmin panel** for Dapplepot operators.

### Tenant surfaces

| Surface | Route | What it shows |
|---------|-------|--------------|
| 1 | `/` | Live overview — session feed, metrics, alerts, agent health |
| 2 | `/sessions` | Filterable session list with inline expand |
| 3 | `/sessions/:id` | Full session trace view — event timeline, payload inspector, graph state |
| 4 | `/analytics` | Token usage, error rates, latency charts, cost attribution |
| 5 | `/detection` | Alert inbox, rule builder with dry-run, channel config |
| 6 | `/security` | Security posture, risk scores, OWASP findings, remediation |
| 7 | `/agents` | Agent registry — list all agents with copyable IDs; admin can create new agents |
| 8 | `/settings` | Profile, SDK keys (masked; admin can reveal), user management (admin only) |

### Superadmin surfaces (Dapplepot operators only)

| Surface | Route | What it shows |
|---------|-------|--------------|
| SA-1 | `/` | Welcome screen with link to onboard a client |
| SA-2 | `/tenants` | All tenants — admin name/email + user count per tenant |
| SA-3 | `/onboard-client` | Two-step wizard: create tenant + first admin account |

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
| Components | Custom (Tailwind + CVA) | — |
| Charts | Recharts | ≥ 2.12 |
| HTTP | ky | ≥ 1.5 |
| SSE | @microsoft/fetch-event-source | ≥ 2 |
| Virtualisation | @tanstack/react-virtual | ≥ 3 |
| Package manager | pnpm | ≥ 9 |

### Shared types with `dapplepot_api`

Types are **copied** into `src/types/` rather than imported via a path alias.
When the API types change, copy the updated files from `dapplepot_api/src/types/`
into `src/types/` — TypeScript will immediately surface any mismatches.

```bash
pnpm sync-types   # cp ../dapplepot-api/src/types/*.ts src/types/
```

---

## Repo layout

```
dapplepot_ui/
├── agent.md                            ← full IDE agent context
├── README.md                           ← this file
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── tailwind.css
├── .env.example
│
└── src/
    ├── main.tsx
    ├── router.tsx                      ← all routes + requireAuth guard
    │
    ├── types/
    │   ├── auth.ts                     ← UserRole ('superadmin'|'admin'|'editor'|'viewer'),
    │   │                                  UserStatus, UserSummary (incl. tenantId),
    │   │                                  LoginRequest/Response, RefreshRequest/Response,
    │   │                                  LogoutRequest, ForgotPasswordRequest,
    │   │                                  ResetPasswordRequest, AcceptInviteRequest,
    │   │                                  InviteSummary, InviteUserRequest,
    │   │                                  UpdateMeRequest, ChangeRoleRequest, ChangeStatusRequest
    │   ├── tenant.ts                   ← TenantSummary, TenantWithStats (+ adminUser + userCount),
    │   │                                  OnboardClientRequest, OnboardClientResponse
    │   ├── agent.ts                    ← AgentSummary, CreateAgentRequest
    │   ├── sdkKey.ts                   ← SdkKeySummary, SdkKeyRevealResponse
    │   ├── session.ts
    │   ├── analytics.ts
    │   ├── alert.ts
    │   ├── rule.ts
    │   ├── channel.ts
    │   ├── common.ts                   ← Paginated<T>, ApiError, ListParams, error classes
    │   └── security.ts
    │
    ├── api/
    │   ├── client.ts                   ← ky instance, JWT interceptor, 401 → auto-refresh → retry
    │   ├── auth.ts                     ← bare ky: login, refresh, logout, forgotPassword,
    │   │                                  resetPassword, acceptInvite
    │   ├── tenants.ts                  ← onboardClient, getTenants
    │   ├── agents.ts                   ← getAgents, createAgent
    │   ├── sdkKeys.ts                  ← getSdkKeys, revealSdkKey
    │   ├── sessions.ts
    │   ├── analytics.ts
    │   ├── alerts.ts
    │   ├── rules.ts
    │   ├── channels.ts
    │   ├── control.ts
    │   ├── security.ts
    │   └── sse.ts
    │
    ├── hooks/
    │   ├── useAuth.ts                  ← useLogin, useLogout, useForgotPassword,
    │   │                                  useResetPassword, useAcceptInvite
    │   ├── useUsers.ts                 ← useMe, useUpdateMe, useUsers (unwraps Paginated),
    │   │                                  useInviteUser, useInvites, useChangeRole, useChangeStatus
    │   ├── useTenants.ts               ← useOnboardClient, useTenants
    │   ├── useAgents.ts                ← useAgents, useCreateAgent
    │   ├── useSdkKeys.ts               ← useSdkKeys, useRevealSdkKey
    │   ├── useSessions.ts
    │   ├── useAnalytics.ts
    │   ├── useAlerts.ts
    │   ├── useRules.ts
    │   ├── useChannels.ts
    │   ├── useControl.ts
    │   └── useSecurity.ts
    │
    ├── stores/
    │   ├── auth.ts                     ← accessToken, refreshToken, user (localStorage)
    │   ├── sessionFilters.ts
    │   ├── alertFilters.ts
    │   ├── traceFilters.ts
    │   └── ui.ts
    │
    ├── pages/
    │   ├── Login.tsx
    │   ├── ForgotPassword.tsx
    │   ├── ResetPassword.tsx
    │   ├── AcceptInvite.tsx
    │   ├── Overview.tsx                ← SuperAdminHome for superadmin, tenant dashboard otherwise
    │   ├── Sessions.tsx
    │   ├── SessionDetail.tsx
    │   ├── Analytics.tsx
    │   ├── Detection.tsx
    │   ├── Security.tsx
    │   ├── Agents.tsx                  ← /agents — agent table + create (admin only)
    │   ├── Settings.tsx                ← /settings — profile + SDK keys + users (admin only)
    │   ├── Tenants.tsx                 ← /tenants — tenant list (superadmin only)
    │   └── OnboardClient.tsx           ← /onboard-client — onboarding wizard (superadmin only)
    │
    ├── layout/
    │   ├── AppShell.tsx
    │   ├── Sidebar.tsx                 ← exclude-based role filtering; superadmin sees only
    │   │                                  Tenants + Onboard Client; tenants see everything else
    │   └── Topbar.tsx                  ← breadcrumbs + tenant ID badge (tenant users only, copyable)
    │
    ├── components/
    │   ├── auth/                       ← LoginForm, ForgotPasswordForm, ResetPasswordForm,
    │   │                                  InviteAcceptForm
    │   ├── onboarding/                 ← TenantInfoStep, AdminAccountStep, OnboardingWizard
    │   ├── agents/                     ← AgentTable (copyable agent ID), CreateAgentModal
    │   ├── overview/                   ← MetricCards, SessionFeed, AlertPanel, AgentHealth,
    │   │                                  SuperAdminHome
    │   ├── settings/                   ← ProfileForm, UserTable, InviteModal, RoleBadge,
    │   │                                  SdkKeySection
    │   ├── sessions/
    │   ├── trace/
    │   ├── analytics/
    │   ├── detection/
    │   ├── security/
    │   └── ui/
    │
    └── utils/
        ├── format.ts
        ├── eventColors.ts
        └── cn.ts
```

---

## Prerequisites

- Node.js 22 LTS
- pnpm 9+
- `dapplepot_api` running on port 3000

---

## Local setup

```bash
git clone https://github.com/dapplepot/dapplepot_ui
cd dapplepot_ui
pnpm install
cp .env.example .env
pnpm dev     # http://localhost:5173
```

Vite proxies all `/v1/` requests to `dapplepot_api` — no CORS issues in development.

---

## Auth flow

| Step | Behaviour |
|------|-----------|
| Login | `POST /v1/auth/login` → `{ accessToken, refreshToken, expiresIn, user }` |
| Storage | Tokens + user in `localStorage` (`dp_access_token`, `dp_refresh_token`, `dp_user`) → Zustand |
| Request auth | Every `ky` request adds `Authorization: Bearer <accessToken>` |
| Auto-refresh | On 401 → `POST /v1/auth/refresh` → retry GET. POST bodies can't replay — token refreshed silently. On failure: `clearAuth()` + redirect `/login`. Concurrent 401s deduplicated. |
| Logout | `POST /v1/auth/logout` → `onSettled: clearAuth()` + redirect `/login` |

### Role-based UI

| Role | Sidebar | Key capabilities |
|------|---------|-----------------|
| `superadmin` | Tenants, Onboard Client | Create tenants + first admin; list all tenants |
| `admin` | All tenant surfaces | SDK key reveal, user management, agent creation, rule/channel CRUD |
| `editor` | All tenant surfaces | Alert ack/resolve, rule create/edit, kill-switch |
| `viewer` | All tenant surfaces | Read-only — no action buttons |

Sidebar uses an **exclude list** per item — `superadmin` is excluded from all tenant nav items; tenant roles are excluded from superadmin nav items.

### Tenant ID in topbar

Tenant users see their `tenantId` as a copyable badge in the top-right corner of every page. Hidden for `superadmin`.

---

## SDK keys

Listed in Settings for all tenant roles. `maskedKey` (`dp_sk_••••••••••`) is shown by default. Admin can click **Show** → calls `GET /v1/sdk-keys/:id/reveal` → displays full key. Key is cached in component state after first reveal; subsequent Show/Hide toggles don't re-fetch.

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
| 10 | Access + refresh tokens with rotation | Short access (15m) limits leaked-token blast radius; refresh rotation detects theft |
| 11 | `api/auth.ts` uses a separate bare ky instance | Avoids circular dependency — `client.ts` imports `refresh` from `auth.ts` |
| 12 | Only GET/HEAD requests are retried after token refresh | POST/PATCH body ReadableStream is consumed before `afterResponse` fires |
| 13 | Role check in Settings uses `useMe()`, not Zustand store | Zustand `user.role` is set at login and stale mid-session; `useMe()` is server-fresh |
| 14 | `useLogout` uses `onSettled`, not `onSuccess` | Local auth state must clear even if the server-side logout call fails |
| 15 | Sidebar uses exclude list, not allow list | Adding a new nav item doesn't require updating every role — only add exclusions where needed |
| 16 | Onboarding wizard collects all data before submitting | Single atomic `POST /v1/tenants/onboard` — no orphaned tenants if user abandons step 2 |
| 17 | `superadmin` gated at component level, not route level | Route requires valid JWT; role check inside the page component renders access-denied instead of redirecting |
| 18 | SDK key masking done by backend, reveal via separate endpoint | `key_hash` is one-way — backend must store `masked_key` + `raw_key` at creation; UI never derives the mask itself |
| 19 | `useUsers` unwraps `Paginated<UserSummary>` with `.then(r => r.data)` | Backend returns paginated envelope; UserTable expects a plain array |
| 20 | Tenant ID shown in Topbar from Zustand store, not `useMe()` | Already in memory from login — no extra network call on every page |

---

## Security findings surface (`/security`)

The Security page (`src/pages/Security.tsx`) consumes risk scores and OWASP findings
produced by `dapplepot_security` (Zone 6) and served by `dapplepot_api` security endpoints.

### Page structure — three tabs

```
/security
├── Overview tab
│     ├── Metric cards: sessions scored · high/critical count · avg risk score · top signal
│     ├── RiskDistribution    — donut/bar chart of band counts (clean/low/medium/high/critical)
│     ├── OwaspFrequency      — bar chart of LLM01–LLM10 hit frequency
│     └── HighRiskTable       — top 5 highest-risk sessions; click row → opens Session detail tab
│
├── Session detail tab
│     ├── SessionRiskPanel    — risk score (0–100), band badge, signal list, scorer version, scored_at
│     └── FindingsList        — per-finding rows: signalId · owaspId · severity · detectionPhase · detail
│
└── Remediation tab
      └── RemediationGuide    — one card per top firing signal: title · description · fix steps · SDK snippet
```

### Hooks (`src/hooks/useSecurity.ts`)

| Hook | API endpoint | `staleTime` | Refresh |
|------|-------------|-------------|---------|
| `useSecurityOverview(windowHours?)` | `GET /v1/security/overview` | 120 000 ms | every 120s |
| `useSessionSecurity(sessionId)` | `GET /v1/security/sessions/:id/score` + `.../findings` | 300 000 ms | on mount |
| `useRemediation(windowHours?)` | `GET /v1/security/remediation` | 300 000 ms | on mount |

`staleTime` values deliberately match the API-side Redis cache TTLs — polling sooner would hit stale data anyway.

### API client (`src/api/security.ts`)

```typescript
getSecurityOverview({ windowHours? })     → SecurityOverview
getSessionScore(sessionId)                → SessionRiskScore | null   // null = not yet scored
getSessionFindings(sessionId)             → SecurityFinding[]
getRemediation({ windowHours? })          → RemediationCard[]
```

### Findings data model

| Type | Key fields | Source |
|------|-----------|--------|
| `SecurityFinding` | `signalId` (INJ-001, OUT-001, PII-004, L-06…), `owaspId` (LLM01–LLM10), `severity`, `matchedText` (always redacted), `detectionPhase` (online \| post_session), `scoreContrib` | `security_findings` table |
| `SessionRiskScore` | `riskScore` (0–100), `riskBand` (clean/low/medium/high/critical), `signalIds[]`, `scorerVersion`, `scoredAt` | `session_risk_scores` table |
| `SecurityOverview` | `bandDistribution`, `owaspFrequency`, `highRiskSessions` (top 5) | aggregated from both tables |
| `RemediationCard` | `title`, `description`, `fixSteps[]`, `sdkSnippet` (optional), `frequency` | findings aggregate + static guide |

### OWASP LLM Top 10 coverage

| OWASP ID | Threat | Signal(s) | How detected |
|----------|--------|-----------|-------------|
| LLM01 | Prompt injection | INJ-001 – INJ-005 | Online — regex + tenant blocklist on `llm_start` messages |
| LLM02 | Insecure output handling | OUT-001 | Online — LCS ratio of LLM output vs tool input |
| LLM04 | Model DoS | L-10 | Post-session — token count > 4σ above agent baseline |
| LLM06 | Sensitive info disclosure | PII-001 – PII-006 | Online — PII scanner on `llm_end` + `tool_end` payloads |
| LLM07 | Insecure plugin design | L-06 | Post-session — tool invoked outside declared manifest |
| LLM08 | Excessive agency | L-05, L-06, L-07 | Post-session — excessive tool calls, out-of-scope tools, write on read-only intent |
| LLM09 | Overreliance | L-08 | Post-session — high-stakes action completed without HITL interrupt |
| LLM10 | Model theft | L-09 | Post-session — cross-session probe cohort pattern |

### Risk band colour mapping (in `Security.tsx`)

| Band | Colour |
|------|--------|
| `clean` | `#10b981` (green) |
| `low` | `#60a5fa` (blue) |
| `medium` | `#f59e0b` (amber) |
| `high` | `#f97316` (orange) |
| `critical` | `#ef4444` (red) |

### Components (`src/components/security/`)

| Component | Props | What it renders |
|-----------|-------|----------------|
| `RiskDistribution` | `bands[]`, `total` | Bar/donut of session counts per risk band |
| `OwaspFrequency` | `entries[]` | Horizontal bar chart — OWASP IDs by hit count |
| `HighRiskTable` | `sessions[]`, `onSelect` | Table of top-5 sessions; row click sets selected session ID |
| `SessionRiskPanel` | `riskScore`, `riskBand`, `signalCount`, `signalIds[]`, `scoredAt`, `scorerVersion` | Score badge + signal tag list |
| `FindingsList` | `findings[]` | Findings table — one row per `SecurityFinding` |
| `RemediationGuide` | `cards[]` | Expandable cards — one per top firing signal |
