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
| Routing | `@tanstack/react-router` | ≥ 1.x | Type-safe routes, file-based, search params typed |
| Server state | `@tanstack/react-query` | v5 | Caching, background refetch, SSE streaming |
| UI state | `zustand` | ≥ 4 | Filter state, selected rows, sidebar, active tabs |
| Styling | `tailwindcss` | v4 | Utility-first, no config file, co-located styles |
| Components | `shadcn/ui` | latest | Unstyled radix primitives + Tailwind — copy into `src/components/ui/` |
| Charts | `recharts` | ≥ 2.12 | LineChart, BarChart, ResponsiveContainer |
| HTTP client | `ky` | ≥ 1.5 | Fetch wrapper, typed, interceptors for JWT |
| Package manager | `pnpm` | ≥ 9 | Matches dapplepot_api |

### Shared types

API response types are imported directly from `dapplepot_api` using per-module imports:
```typescript
import type { SessionDetail, TracePage } from '@dapplepot/types/session'
import type { OverviewMetrics }          from '@dapplepot/types/analytics'
import type { AlertSummary }             from '@dapplepot/types/alert'
import type { PolicyRule }               from '@dapplepot/types/rule'
import type { DeliveryChannel }          from '@dapplepot/types/channel'
import type { Paginated }                from '@dapplepot/types/common'
```

Configure in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@dapplepot/types/*": ["../dapplepot_api/src/types/*"]
    }
  }
}
```

And in `vite.config.ts`:
```typescript
resolve: {
  alias: {
    '@dapplepot/types': path.resolve(__dirname, '../dapplepot_api/src/types'),
  }
}
```

This means UI components always use the exact same TypeScript types that
the API produces — zero contract drift, no manual sync required.

---

## 2. Repo structure

```
dapplepot_ui/
│
│   # Project root
├── agent.md                                ← this file
├── README.md                               ← human setup guide
├── DAPPLEPOT_MASTER_README.md              ← platform-wide alignment + cross-repo dependency map
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json                           ← strict, paths alias for @dapplepot/types → src/types/
├── vite.config.ts                          ← path aliases, proxy to dapplepot_api in dev
├── tailwind.css                            ← @import "tailwindcss" — v4 style
├── .env.example
│
├── public/
│   └── favicon.svg
│
└── src/
    ├── main.tsx                            ← React root, QueryClient setup, RouterProvider
    ├── router.tsx                          ← TanStack Router route tree (incl. /login)
    │
    │   # API client — single source of truth for all HTTP calls
    ├── api/
    │   ├── client.ts                       ← ky instance with JWT interceptor + base URL; 401 → /login
    │   ├── auth.ts                         ← login(): POST /v1/auth/login → { token, expiresAt }
    │   ├── sessions.ts                     ← getSessionList, getSessionDetail, getTrace, getStateHistory
    │   ├── analytics.ts                    ← getOverview, getLlmUsage, getErrorRates, getLatency, getCost
    │   ├── alerts.ts                       ← getAlerts, getAlertDetail, updateAlertStatus, getAlertStats
    │   ├── rules.ts                        ← getRules, createRule, updateRule
    │   ├── channels.ts                     ← getChannels, createChannel, updateChannel
    │   ├── control.ts                      ← killSwitch, interrupt
    │   └── sse.ts                          ← useLiveSessions hook, useControlChannel hook
    │
    │   # TanStack Query hooks — one file per resource
    ├── hooks/
    │   ├── useSessions.ts                  ← useSessionList, useSessionDetail, useSessionTrace
    │   ├── useAnalytics.ts                 ← useOverview, useLlmUsage, useErrorRates, useLatency, useCost
    │   ├── useAlerts.ts                    ← useAlerts, useAlertDetail, useAlertStats
    │   ├── useRules.ts                     ← useRules, useCreateRule, useUpdateRule
    │   ├── useChannels.ts                  ← useChannels, useCreateChannel, useUpdateChannel
    │   └── useControl.ts                   ← useKillSwitch, useInterrupt, useControlChannel (SSE)
    │
    │   # Zustand stores — UI state only (not server state)
    ├── stores/
    │   ├── auth.ts                         ← JWT token (localStorage key: dp_token)
    │   ├── sessionFilters.ts               ← status, agentId, environment, dateRange, searchQuery
    │   ├── alertFilters.ts                 ← severity, status, ruleId filters
    │   ├── traceFilters.ts                 ← active category filter on event timeline
    │   └── ui.ts                           ← sidebarCollapsed, activeTab, selectedSessionId
    │
    │   # Pages — one file per route
    ├── pages/
    │   ├── Login.tsx                       ← /login — email+password form, no AppShell chrome
    │   ├── Overview.tsx                    ← Surface 1: live overview home screen
    │   ├── Sessions.tsx                    ← Surface 2: session list with filters
    │   ├── SessionDetail.tsx               ← Surface 3: trace view for one session
    │   ├── Analytics.tsx                   ← Surface 4: charts + cost table
    │   ├── Detection.tsx                   ← Surface 5: alert inbox + rules + channels
    │   └── Security.tsx                    ← Surface 6: security posture overview
    │
    │   # Layout
    ├── layout/
    │   ├── AppShell.tsx                    ← sidebar + topbar wrapper; bypasses chrome on /login
    │   ├── Sidebar.tsx                     ← nav items, agent selector, collapse toggle
    │   └── Topbar.tsx                      ← breadcrumb, env selector, user menu
    │
    │   # Feature components — grouped by surface
    ├── components/
    │   │
    │   ├── overview/
    │   │   ├── MetricCards.tsx             ← 4-up grid: live sessions, completed, tokens, p95 latency
    │   │   ├── SessionFeed.tsx             ← SSE-driven session list, status badges, live pulse dots
    │   │   ├── AlertPanel.tsx              ← recent 4 alerts with severity dots
    │   │   └── AgentHealth.tsx             ← error rate bars per agent
    │   │
    │   ├── sessions/
    │   │   ├── SessionTable.tsx            ← filterable, sortable table, 20 rows/page
    │   │   ├── SessionRow.tsx              ← single row + inline expand drawer
    │   │   ├── SessionFilters.tsx          ← search + 4 filter selects + clear button
    │   │   ├── SessionPagination.tsx       ← page controls, smart ellipsis
    │   │   └── StatusBadge.tsx             ← stub/open/interrupted/killed/finalised/error with colours
    │   │
    │   ├── trace/
    │   │   ├── TraceLayout.tsx             ← two-column: timeline left, detail panel right
    │   │   ├── TraceHeader.tsx             ← session ID, agent, status pill, kill button
    │   │   ├── MetricStrip.tsx             ← 5-up: duration, tokens in, tokens out, tools, nodes
    │   │   ├── EventTimeline.tsx           ← virtualised event list, category filter pills
    │   │   ├── EventRow.tsx                ← single event row: timestamp, dot, type, desc, badge
    │   │   ├── EventPayload.tsx            ← expandable JSON payload panel
    │   │   ├── RightPanel.tsx              ← tab container: GraphState / Session / Alerts / Security
    │   │   ├── GraphStateTab.tsx           ← pretty-printed graph_state JSONB
    │   │   ├── SessionInfoTab.tsx          ← metadata key-value table
    │   │   ├── AlertsTab.tsx               ← session-scoped alerts list
    │   │   └── SecurityTab.tsx             ← risk score badge + findings list
    │   │
    │   ├── analytics/
    │   │   ├── DateRangePicker.tsx         ← 24h / 7d / 30d segmented control + agent filter
    │   │   ├── TokenChart.tsx              ← Recharts LineChart, tokens by model over time
    │   │   ├── ErrorRateChart.tsx          ← Recharts BarChart (horizontal), error % per agent
    │   │   ├── LatencyChart.tsx            ← Recharts LineChart, avg/p95 latency over time
    │   │   └── CostTable.tsx               ← agent cost attribution table with bar indicators
    │   │
    │   ├── detection/
    │   │   ├── AlertFeed.tsx               ← filtered alert list, severity pills, status badges
    │   │   ├── AlertDrawer.tsx             ← inline detail drawer: fields + ack/resolve buttons
    │   │   ├── RuleList.tsx                ← rule table with enable/disable toggles
    │   │   ├── RuleForm.tsx                ← create/edit rule form with dry-run preview
    │   │   ├── DryRunPreview.tsx           ← live preview: fires N times in last 7 days
    │   │   └── ChannelList.tsx             ← webhook / Slack / PD cards with toggle
    │   │
    │   ├── security/
    │   │   ├── RiskDistribution.tsx        ← band breakdown bars: clean/low/medium/high/critical
    │   │   ├── OwaspFrequency.tsx          ← OWASP hit frequency horizontal bars
    │   │   ├── HighRiskTable.tsx           ← top 5 highest-risk sessions with score + signals
    │   │   ├── SessionRiskPanel.tsx        ← per-session: score, breakdown, OWASP exposure
    │   │   ├── FindingsList.tsx            ← expandable security findings with matched text
    │   │   └── RemediationGuide.tsx        ← ranked remediation cards by signal frequency
    │   │
    │   └── ui/                             ← shadcn/ui primitives (copy from shadcn CLI)
    │       ├── button.tsx
    │       ├── badge.tsx
    │       ├── input.tsx
    │       ├── select.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       ├── toggle.tsx
    │       └── skeleton.tsx                ← loading skeletons for all data-heavy components
    │
    │   # Utilities
    └── utils/
        ├── format.ts                       ← formatTokens (1.2M), formatDuration (47.8s), formatAgo (3m ago)
        ├── eventColors.ts                  ← category → hex color map for timeline dots
        └── cn.ts                           ← clsx + tailwind-merge helper
```

---

## 3. The six surfaces — what each page renders

### Surface 1: Overview (`pages/Overview.tsx`)

The home screen. Auto-refreshes. An engineer leaves this open.

**Layout:** header row → 4 metric cards → two-column (session feed left, right column stacked: alerts + agent health)

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
  existing session's status/token count changes. Implemented with a
  `useRef` to track previous data and a brief CSS class toggle.
- `MetricCards`: `live sessions` count is derived from the SSE feed, not
  from the analytics query, so it stays real-time.
- `AgentHealth`: error rate bars use a non-linear scale — 15% error rate
  fills the bar 100%. Never use a 0–100% linear scale (a 10% error rate
  would look negligible).
- `AlertPanel`: severity dot colors — red = critical, amber = warning,
  orange = medium, blue = info. Always three dots max per alert row.

---

### Surface 2: Sessions (`pages/Sessions.tsx`)

Filterable, sortable session table.

**Layout:** header (title + count pill) → filter bar → table card → pagination

**Filter bar components (left to right):**
- Free-text search input (debounced 300ms, searches session_id prefix + user_context_id)
- Status select: all / stub / open / finalised / interrupted / killed / error
- Agent select: all agents + one option per agent in tenant
- Environment select: all / production / staging / dev
- Date range select: last 24h / 7d / 30d
- "Clear filters ×" link — only visible when any filter is active

**Filter state lives in Zustand `sessionFilters` store**, not in URL search
params. This preserves filter state when you navigate to a session detail
and come back. TanStack Router search params are used for pagination only
(`?page=2`).

**Table columns:**
```
Session ID  | Agent        | Status | Env     | Started | Duration | Tokens    | Nodes | →
(8-char)    | agent_xxx    | badge  | badge   | "3m ago" | "47.8s" | bar+num  | count | view
```

**Inline expand on row click:**
- Expands a sub-row with: full session_id, user_context_id, deployment_id,
  exit_reason, exact token count, "Open trace ↗" button
- Only one row expanded at a time
- Clicking the expanded row collapses it

**Sort:** clicking any column header sorts by that column. Active column
shows `↑` or `↓` suffix. Default: `started_at DESC`.

**Data:**
```typescript
const { data } = useQuery({
  queryKey: ['sessions', filters, sort, page],
  queryFn: () => api.sessions.getList({ ...filters, sort, page, limit: 20 }),
  staleTime: 10_000,
  keepPreviousData: true,   // don't flash blank on page change
})
```

---

### Surface 3: Session detail / trace view (`pages/SessionDetail.tsx`)

The core product screen. Deepest view in the platform.

**Layout:** two-column fixed — timeline (left, ~60% width) + right panel (~40%)

**TraceHeader:**
```
019063ab-cafe-7abc-8def-000000000001
agent_checkout_v3 · v1.4.2 · production
[finalised]              [Alerts (1) ↗]  [Kill session — disabled if not open]
```

**MetricStrip** (5 metric cards in a row below header):
- Duration (from pgRow.duration_ms)
- Tokens in (from chTokens.totalInputTokens)
- Tokens out (from chTokens.totalOutputTokens)
- Tool calls (from chStats.toolCallCount)
- Nodes (from chStats.nodeCount)

**EventTimeline:**
- Category filter pills: All / Graph / Nodes / LLM / Tools / State
- Events rendered in `sequence_index` ASC order
- Each row: `+0.1s` timestamp | colored dot | event_type (monospace) | description | optional badge
- Dot color per category:
  - graph lifecycle: `#7F77DD` (purple)
  - node lifecycle: `#1D9E75` (teal)
  - llm calls: `#BA7517` (amber)
  - tool calls: `#D85A30` (coral)
  - state/control: `#378ADD` (blue)
- Clicking a row expands the payload JSON inline (pretty-printed, monospace, ZSTD decompressed by API)
- **Cursor pagination**: "Load more" button at bottom fetches next 100 events
  (`after_seq = last seen sequence_index`). Never use page numbers on trace.
- Virtualise the list with `@tanstack/react-virtual` — sessions can have 500+ events

**Right panel tabs:**
1. **Graph state** — pretty-printed JSON of `pgRow.graphState` (last snapshot)
2. **Session** — key/value table of all session metadata
3. **Alerts (N)** — session-scoped alerts with ack/resolve buttons
4. **Security** — risk score badge + signal breakdown (only if session has findings)

**Data (parallel fetch):**
```typescript
// useSessionDetail: GET /v1/sessions/:id — staleTime: depends on status
const { data: session } = useQuery({
  queryKey: ['session', sessionId],
  queryFn: () => api.sessions.getDetail(sessionId),
  staleTime: session?.status === 'finalised' ? Infinity : 5_000,
  refetchInterval: session?.status === 'open' ? 5_000 : false,
})

// useSessionTrace: GET /v1/sessions/:id/trace — cursor-paginated
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['trace', sessionId],
  queryFn: ({ pageParam = 0 }) =>
    api.sessions.getTrace(sessionId, { afterSeq: pageParam, limit: 100 }),
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  staleTime: session?.status === 'finalised' ? Infinity : 5_000,
})

// useSessionAlerts: GET /v1/sessions/:id/alerts
const { data: alerts } = useQuery({ queryKey: ['session-alerts', sessionId], ... })
```

---

### Surface 4: Analytics (`pages/Analytics.tsx`)

Time-series charts and cost table.

**Layout:** header → filter bar → metric cards → token chart (full width)
          → two-column (error rate | latency) → cost table

**Date range picker:** segmented control (24h / 7d / 30d) + agent select.
Changing either re-fetches all charts simultaneously. State in Zustand.

**TokenChart (Recharts `LineChart`):**
```typescript
// Data: LlmUsagePoint[] from GET /v1/analytics/llm-usage
// Two lines: claude-sonnet-4-6 (purple), claude-haiku-4-5 (teal)
// Y-axis: format to "1.2k" or "1.4M"
// X-axis: formatted hour/day labels depending on window
// Tooltip: model, tokens, avg latency
```

**ErrorRateChart (Recharts `BarChart`, horizontal):**
```typescript
// Data: ErrorRatePoint[] from GET /v1/analytics/error-rates
// Horizontal bars, one per agent
// Bar color: green < 4%, amber 4–8%, red > 8%
// X-axis: 0% to 14% (non-linear scale, capped at 14% for readability)
// No legend — colour encodes meaning directly
```

**LatencyChart (Recharts `LineChart`):**
```typescript
// Data: LatencyStat[] from GET /v1/analytics/latency
// Two lines: avg (blue), p95 (amber)
// Note: p50 and p99 are NOT available from the API (not stored in the aggregate table)
// Y-axis: format to "1.2s"
// A rising p95 line diverging from avg = tail latency problem signal
```

**CostTable:**
```typescript
// Data: CostAttribution[] from GET /v1/analytics/cost
// Columns: Agent | Tokens | Est. cost | Share of spend (bar + %)
// Bar width = share * 1.8px, max ~56px at 31%
// Clicking a row navigates to sessions list filtered to that agent
```

**All analytics queries use staleTime that matches API cache TTL:**
```typescript
staleTime: 60_000   // analytics/llm-usage, error-rates, latency
staleTime: 300_000  // analytics/cost
staleTime: 30_000   // analytics/overview
```

---

### Surface 5: Detection (`pages/Detection.tsx`)

Alert inbox + rule management + channel config.

**Layout:** header (title + "New rule" button) → three tabs (Alert inbox / Rules / Channels)

#### Alert inbox tab

- Severity filter pills: All / Critical / Warning / Medium / Info
- Status filter select: All / Open / Acknowledged / Resolved
- Alert list: severity dot | title + agent + rule | time ago | status badge
- Clicking a row opens the inline `AlertDrawer` above the list

**AlertDrawer fields:**
- Agent, Session ID (links to trace view), Rule, Measured value, Threshold, Status
- Action buttons: "Acknowledge" (if open), "Resolve" (if not resolved), "View trace ↗"
- Ack/resolve call `PUT /v1/alerts/:id/status` then invalidates `['alerts']` query

#### Rules tab

- Table: Rule name | Agent | Type badge | Severity | Fires/7d | Enable toggle
- Disabled rules fade to 45% opacity
- Toggle calls `PUT /v1/rules/:id` with `{ enabled: true/false }` then invalidates rules cache
- "New rule" button shows the `RuleForm` above the table

**RuleForm:**
- Fields: name, agent select, rule type select, field select, threshold input, severity select
- No live preview while typing — the API has no preview-only endpoint
- Preview is returned automatically by `POST /v1/rules` after save (see DryRunPreview below)
- Save button calls `POST /v1/rules` — the API always runs a dry-run preview against the last 7 days before saving and returns `{ rule: PolicyRule, preview: { wouldHaveFired: number, sessions: [...] } }` (HTTP 201)
- On save: show the preview result to the user, invalidate `['rules']` query + show success toast

**DryRunPreview component:**
```typescript
// Rendered AFTER save, using the preview data returned by POST /v1/rules
// The API always returns { rule, preview: { wouldHaveFired, sessions } } on create
// Shows: "Would have fired 3 times in last 7 days"
// Shows up to 3 example sessions with their measured values
// Sessions that would have fired highlighted in red with ↑ arrow
// There is no live preview-while-typing endpoint — preview only available post-save
```

#### Channels tab

- Three channel cards: Webhook / Slack / PagerDuty
- Each shows: icon | name + URL | severity filter | enable toggle
- Toggle calls `PUT /v1/channels/:id`
- "Platform inbox" section at bottom — always-on, no config, explanatory text
- "+ Add channel" button (stub for future channel types)

---

### Surface 6: Security (`pages/Security.tsx`)

Security posture for the tenant.

**Layout:** header → three tabs (Overview / Session detail / Remediation)

#### Overview tab

- 4 metric cards: sessions scored, high/critical count, avg score, top signal
- Two side-by-side panels: risk distribution bars + OWASP signal frequency
- Highest-risk sessions table: session_id | agent | score | risk band | signals fired

#### Session detail tab

Shown when navigating from the highest-risk sessions table or from the
`SecurityTab` in the trace view right panel.

- Session ID + agent in header
- Two side-by-side cards:
  - Risk score card: large score number + band label + "3 signals · scored 0.8s after session_end"
    + score breakdown table (signal name, points contributed)
  - OWASP exposure card: one pill per OWASP category that was triggered (red = confirmed)
- Findings list: severity icon | finding title | signal ID + OWASP + timestamp | points | ↓ expand
  - Expanded: matched text excerpt + "View in trace ↗" button (links to trace view at that sequence_index)

#### Remediation tab

- Remediation guidance cards, ranked by signal frequency
- Each card: signal name + OWASP ID | description + actionable fix | SDK config snippet if applicable
- Top card always highlighted (most frequent signal = highest priority fix)

**Data sources:**
```typescript
// GET /v1/security/overview — from dapplepot_security service
// GET /v1/security/sessions/:id/score — risk score + findings
// GET /v1/security/remediation — ranked guidance
// Note: these endpoints live in dapplepot_api which proxies to dapplepot_security
```

---

## 4. API client pattern

All HTTP calls go through the typed `ky` client in `src/api/client.ts`.

```typescript
// src/api/client.ts
import ky from 'ky'
import { useAuthStore } from '../stores/auth'

export const apiClient = ky.create({
  prefixUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().token
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 401) {
          useAuthStore.getState().clearToken()
          window.location.href = '/login'
        }
      },
    ],
  },
})
```

All API functions are typed against the shared `@dapplepot/types`:
```typescript
// src/api/sessions.ts
import type { SessionDetail, SessionSummary, TracePage } from '@dapplepot/types/session'
import type { Paginated } from '@dapplepot/types/common'

export async function getSessionDetail(sessionId: string): Promise<SessionDetail> {
  return apiClient.get(`v1/sessions/${sessionId}`).json<SessionDetail>()
}

export async function getSessionList(
  params: SessionListParams
): Promise<Paginated<SessionSummary>> {
  return apiClient.get('v1/sessions', { searchParams: params }).json()
}

export async function getTrace(
  sessionId: string,
  params: { afterSeq: number; limit: number }
): Promise<TracePage> {
  return apiClient.get(`v1/sessions/${sessionId}/trace`, { searchParams: params }).json()
}
```

---

## 5. SSE hooks

Native `EventSource` does not support custom headers, so all SSE connections
use `@microsoft/fetch-event-source` which accepts an `Authorization` header.

### useLiveSessions — live session feed

```typescript
// src/api/sse.ts
export function useLiveSessions() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const controller = new AbortController()

    const connect = async () => {
      const token = useAuthStore.getState().token
      await fetchEventSource(`${API_BASE}/v1/sessions/live`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
        onmessage(event) {
          if (event.event === 'sessions') {
            const sessions = JSON.parse(event.data) as SessionSummary[]
            // Update the React Query cache directly — no re-fetch needed
            queryClient.setQueryData(['sessions', 'live'], sessions)
          }
        },
        onerror() {
          // fetchEventSource retries automatically on error
        },
      })
    }

    void connect()
    return () => controller.abort()
  }, [queryClient])

  return useQuery({
    queryKey: ['sessions', 'live'],
    queryFn: () => [] as SessionSummary[],   // initial empty state
    staleTime: Infinity,                      // SSE pushes updates directly into cache
  })
}
```

### useControlChannel — SDK kill-switch SSE

```typescript
// src/api/sse.ts
export function useControlChannel(sessionId: string) {
  useEffect(() => {
    const controller = new AbortController()

    const connect = async () => {
      const token = useAuthStore.getState().token
      await fetchEventSource(
        `${API_BASE}/v1/control/channel?session_id=${encodeURIComponent(sessionId)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
          onmessage() { /* command events handled by caller */ },
          onerror() { /* auto-retry */ },
        }
      )
    }

    void connect()
    return () => controller.abort()
  }, [sessionId])
}
```

---

## 6. TanStack Query key conventions

All query keys follow a consistent structure so `invalidateQueries` is predictable:

```typescript
// Sessions
['sessions', filters, sort, page]           // list
['session', sessionId]                       // detail
['trace', sessionId]                         // infinite trace pages
['session-alerts', sessionId]                // session-scoped alerts
['session-security', sessionId]              // session risk score + findings

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

On rule update: `queryClient.invalidateQueries({ queryKey: ['rules', tenantId] })`
On alert status update: `queryClient.invalidateQueries({ queryKey: ['alerts'] })`

---

## 7. Loading states and skeletons

Every data-heavy component renders a `Skeleton` while loading.
Never show a blank layout or a spinner that blocks the whole page.

```typescript
// Pattern for all data components:
if (isLoading) return <MetricCardsSkeleton />
if (isError)   return <ErrorCard message={error.message} />
return <MetricCards data={data} />
```

Skeleton components live alongside their data components:
- `MetricCards.tsx` → `MetricCardsSkeleton.tsx` (same file, exported separately)
- Skeletons use Tailwind `animate-pulse` on placeholder `div` blocks

---

## 8. Routing (TanStack Router)

```typescript
// src/router.tsx
// rootRoute uses AppShell as its component.
// AppShell checks the current pathname and bypasses sidebar/topbar on /login.
const rootRoute = createRootRoute({ component: AppShell })

const loginRoute       = createRoute({ path: '/login',          component: Login })
const overviewRoute    = createRoute({ path: '/',               component: Overview })
const sessionsRoute    = createRoute({ path: '/sessions',       component: Sessions,
                                       validateSearch: sessionListSearchSchema })
const sessionRoute     = createRoute({ path: '/sessions/$id',  component: SessionDetail })
const analyticsRoute   = createRoute({ path: '/analytics',      component: Analytics })
const detectionRoute   = createRoute({ path: '/detection',      component: Detection })
const securityRoute    = createRoute({ path: '/security',       component: Security })

// Session list search params are fully typed:
const sessionListSearchSchema = z.object({
  page: z.number().default(1),
  // Filters are in Zustand, not URL — only page lives in URL
})
```

### AppShell login bypass

```typescript
// src/layout/AppShell.tsx
export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  if (pathname === '/login') return <Outlet />   // no sidebar or topbar
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

This keeps the route tree flat (all routes are children of `rootRoute`) so path types remain simple — `/sessions/$id` not `/_app/sessions/$id`.

---

## 9. Environment variables

```bash
# Required
VITE_API_BASE_URL=http://localhost:3000    # dapplepot_api URL

# Optional
VITE_APP_ENV=development                   # 'development' | 'staging' | 'production'
```

---

## 10. Auth flow

```typescript
// Token lifecycle
// 1. User submits /login form → src/api/auth.ts login() → POST /v1/auth/login
// 2. { token, expiresAt } stored in localStorage (key: dp_token) via useAuthStore
// 3. Every ky request: beforeRequest hook reads token → Authorization: Bearer <token>
// 4. On 401: afterResponse hook clears token + window.location.href = '/login'

// src/api/auth.ts
export interface LoginRequest  { email: string; password: string }
export interface LoginResponse { token: string; expiresAt: string }
export async function login(body: LoginRequest): Promise<LoginResponse> {
  return ky.post(`${API_BASE}/v1/auth/login`, { json: body }).json()
}
```

**Open:** JWT issuer, expiry duration, and refresh strategy are pending `dapplepot_api` README.
Token refresh is not yet implemented — an expired token triggers a /login redirect.

---

## 11. Local dev setup (this repo is Step 7)

```bash
# dapplepot_api must be running first (this repo is Step 7 in the platform startup sequence)
# See DAPPLEPOT_MASTER_README.md § 5 for the full sequence.
# cd ../dapplepot_api && pnpm dev

git clone https://github.com/dapplepot/dapplepot_ui
cd dapplepot_ui
pnpm install
cp .env.example .env
pnpm dev         # Vite dev server on http://localhost:5173
```

Vite is configured to proxy `/v1/` requests to `dapplepot_api` in dev:
```typescript
// vite.config.ts
server: {
  proxy: {
    '/v1': { target: 'http://localhost:3000', changeOrigin: true }
  }
}
```

---

## 12. Build order

Build in this exact sequence. Each phase is independently testable.

### Phase 1 — Foundation
```
src/utils/cn.ts                    clsx + tailwind-merge helper
src/utils/format.ts                formatTokens, formatDuration, formatAgo, formatBytes
src/utils/eventColors.ts           category → hex color map
src/stores/auth.ts                 JWT token store (localStorage key: dp_token) — must exist before client.ts
src/api/client.ts                  ky instance with JWT interceptor + 401 → /login redirect
src/stores/ui.ts                   sidebarCollapsed, activeTab, selectedSessionId
```

### Phase 2 — API client functions (no UI yet)
```
src/api/auth.ts          login(): POST /v1/auth/login → { token, expiresAt }
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
src/hooks/useSessions.ts
src/hooks/useAnalytics.ts
src/hooks/useAlerts.ts
src/hooks/useRules.ts
src/hooks/useChannels.ts
src/hooks/useControl.ts
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

### Phase 6 — Layout + Auth
```
src/layout/Sidebar.tsx
src/layout/Topbar.tsx
src/layout/AppShell.tsx   (bypasses chrome when pathname === '/login')
src/pages/Login.tsx       (email+password form → calls auth.ts login() → stores token → navigates to /)
src/router.tsx            (add loginRoute; all routes are direct children of rootRoute)
src/main.tsx
```

### Phase 7 — Surface 1: Overview
```
src/components/overview/MetricCards.tsx
src/components/overview/SessionFeed.tsx
src/components/overview/AlertPanel.tsx
src/components/overview/AgentHealth.tsx
src/pages/Overview.tsx
```

### Phase 8 — Surface 2: Sessions
```
src/components/sessions/StatusBadge.tsx
src/components/sessions/SessionFilters.tsx
src/components/sessions/SessionRow.tsx
src/components/sessions/SessionTable.tsx
src/components/sessions/SessionPagination.tsx
src/pages/Sessions.tsx
```

### Phase 9 — Surface 3: Trace view
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

### Phase 10 — Surface 4: Analytics
```
src/components/analytics/DateRangePicker.tsx
src/components/analytics/TokenChart.tsx
src/components/analytics/ErrorRateChart.tsx
src/components/analytics/LatencyChart.tsx
src/components/analytics/CostTable.tsx
src/pages/Analytics.tsx
```

### Phase 11 — Surface 5: Detection
```
src/components/detection/AlertDrawer.tsx
src/components/detection/AlertFeed.tsx
src/components/detection/DryRunPreview.tsx
src/components/detection/RuleForm.tsx
src/components/detection/RuleList.tsx
src/components/detection/ChannelList.tsx
src/pages/Detection.tsx
```

### Phase 12 — Surface 6: Security
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

## 13. Locked design decisions — do not change

| # | Decision | Reason |
|---|----------|--------|
| 1 | TanStack Query `staleTime` matches API cache TTL | Prevents redundant re-fetches that would bypass the API cache |
| 2 | `staleTime: Infinity` for finalised session detail + trace | Session is immutable once finalised; never re-fetch |
| 3 | Cursor pagination on trace, never OFFSET | Matches the API — `sequence_index > $cursor` is O(1); OFFSET is O(N) |
| 4 | Filter state in Zustand, pagination in URL | Filters persist on back-navigation; page resets on filter change |
| 5 | Virtualise the event timeline with `@tanstack/react-virtual` | Sessions can have 500+ events; rendering all at once causes jank |
| 6 | Types **copied** into `src/types/`, not imported from `dapplepot_api` via path alias | Repos deploy separately — a path alias to `../dapplepot-api` does not work in CI. Run `pnpm sync-types` after API changes; TypeScript immediately surfaces mismatches. |
| 7 | Non-linear scale on error rate bars (100% at 15%) | A 10% error rate should look alarming, not negligible |
| 8 | SSE updates React Query cache directly via `setQueryData` | Avoids a redundant HTTP re-fetch when SSE delivers fresh data |
| 9 | Use `@microsoft/fetch-event-source` for all SSE connections | Native `EventSource` API does not support custom headers; this polyfill allows `Authorization: Bearer <jwt>` on every SSE request |
| 10 | shadcn/ui primitives copied in, not installed as package | Allows full customisation of each primitive without dependency on shadcn releases |

---

## 14. What done looks like

**Phase 7 done:** Overview page loads, metric cards show real numbers,
session feed updates live via SSE, alert dots appear with correct severity
colours, agent health bars render with non-linear scale.

**Phase 9 done:** Navigate to a session, timeline renders all events in
order with correct dot colours, clicking an event expands its payload JSON,
right panel tabs switch correctly, "Load more" fetches next 100 events.

**Phase 11 done:** Alert feed filters by severity and status, clicking a row
opens the inline drawer with all fields, "Acknowledge" button updates status
immediately (optimistic update), rule toggle correctly invalidates rule cache
on both API and pipeline, dry-run preview updates as threshold slider moves.

**Phase 12 done:** `/security` page loads, overview metrics show real numbers,
risk distribution bars render for all 5 bands, OWASP frequency chart shows
signal IDs, highest-risk table links to session detail, remediation tab ranks
cards by frequency.

**Auth done:** `/login` renders full-screen without sidebar or topbar. Submitting
valid credentials stores the JWT in localStorage and navigates to `/`. An
expired or invalid token triggers a 401, clears the token, and redirects back
to `/login`.

**Full build done:** All six pages + login navigate correctly, no TypeScript
errors, no console errors, all loading states show skeletons (not blanks), all
error states show error cards (not crashes).

---

*Single source of truth for `dapplepot_ui` MVP.
Build in phase order. Do not skip phases.*
