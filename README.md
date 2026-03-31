# dapplepot_ui

**Dapplepot — Dashboard UI**

Zone 5 of the Dapplepot observability platform. The React dashboard for
monitoring LangGraph agents — session traces, analytics, alert management,
and security posture.

**Language: TypeScript + React 19 + Vite**

---

## What this is

The frontend that makes the platform usable. Six surfaces built on top of
`dapplepot_api`:

| Surface | Route | What it shows |
|---------|-------|--------------|
| 1 | `/` | Live overview — session feed, metrics, alerts, agent health |
| 2 | `/sessions` | Filterable session list with inline expand |
| 3 | `/sessions/:id` | Full session trace view — event timeline, payload inspector, graph state |
| 4 | `/analytics` | Token usage, error rates, latency charts, cost attribution |
| 5 | `/detection` | Alert inbox, rule builder with dry-run, channel config |
| 6 | `/security` | Security posture, risk scores, OWASP findings, remediation |

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
    ├── router.tsx                      ← TanStack Router route tree
    ├── index.css                       ← imports tailwind.css
    ├── vite-env.d.ts                   ← Vite env type declarations
    │
    ├── types/                          ← copied from dapplepot_api/src/types/
    │   ├── session.ts
    │   ├── analytics.ts
    │   ├── alert.ts
    │   ├── rule.ts
    │   ├── channel.ts
    │   ├── common.ts
    │   └── security.ts                 ← Zone 6: RiskBand, SessionRiskScore, SecurityFinding, SecurityOverview, RemediationCard
    │
    ├── api/                            ← typed HTTP functions (ky)
    │   ├── client.ts                   ← ky instance, JWT interceptor, 401 redirect
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
    │   ├── useSessions.ts
    │   ├── useAnalytics.ts
    │   ├── useAlerts.ts
    │   ├── useRules.ts
    │   ├── useChannels.ts
    │   ├── useControl.ts
    │   └── useSecurity.ts
    │
    ├── stores/                         ← Zustand (UI state only, not server state)
    │   ├── auth.ts                     ← JWT token (localStorage)
    │   ├── sessionFilters.ts           ← status, agentId, environment, dateRange, q
    │   ├── alertFilters.ts             ← severity, status, ruleId
    │   ├── traceFilters.ts             ← active category on event timeline
    │   └── ui.ts                       ← sidebar, activeTab, selectedSessionId
    │
    ├── pages/                          ← one file per route
    │   ├── Overview.tsx
    │   ├── Sessions.tsx
    │   ├── SessionDetail.tsx
    │   ├── Analytics.tsx
    │   ├── Detection.tsx
    │   └── Security.tsx
    │
    ├── layout/
    │   ├── AppShell.tsx
    │   ├── Sidebar.tsx
    │   └── Topbar.tsx
    │
    ├── components/
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

Vite proxies all `/v1/` requests to `dapplepot_api` so there are no CORS
issues in development.

---

## Scripts

```bash
pnpm dev            # Vite dev server with HMR (port 5173)
pnpm build          # TypeScript check + Vite production build → dist/
pnpm preview        # Preview the production build locally
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint src/
pnpm lint:fix       # eslint --fix src/
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

When `dapplepot_api` updates its types, copy the changed files:

```bash
cp ../dapplepot-api/src/types/*.ts src/types/
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
