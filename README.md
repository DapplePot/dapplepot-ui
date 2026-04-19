# dapplepot-ui

**DapplePot — Dashboard UI**

React dashboard for monitoring AI agents. Serves two personas: tenant operators (sessions, security, analytics, alerts, agent config) and superadmin operators (tenant management, onboarding). All data comes from `dapplepot-api` via REST + SSE.

**Stack:** React 19, TypeScript (strict), Vite 6, TanStack Router + Query, Zustand, Tailwind CSS v4, Recharts, ky

## Quick Start

```bash
pnpm install
cp .env.example .env   # set VITE_API_BASE_URL=http://localhost:3000
pnpm dev               # http://localhost:5173
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:3000` | `dapplepot-api` base URL |
| `VITE_APP_ENV` | `development` | `development` \| `staging` \| `production` |

The Vite dev server proxies `/v1/*` → `http://localhost:3000` automatically.

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Email + password auth |
| `/` | Overview | Metric cards + live session feed (SSE) + alerts + agent health |
| `/sessions` | Sessions | Paginated session table with filters |
| `/sessions/:id` | SessionDetail | Event timeline + detail panel (4 tabs) |
| `/analytics` | Analytics | Token usage, error rates, latency, cost over time |
| `/detection` | Detection | Alert feed + rules + notification channels |
| `/security` | Security | Risk distribution, OWASP signal frequency, high-risk sessions |
| `/agents` | Agents | Agent registry + create modal |
| `/agents/:id` | AgentSecurityProfile | LLM/ASI scores, trust score, signal breakdown |
| `/agents/:id/config` | AgentConfig | Sub-check online toggles + alert thresholds |
| `/settings` | Settings | Profile, SDK keys, user management (admin only) |
| `/tenants` | Tenants | Superadmin only |
| `/onboard-client` | OnboardClient | Two-step onboarding wizard (superadmin only) |

## Architecture

### Server State (TanStack Query)
All API data lives in TanStack Query with `staleTime` tuned to match API cache TTLs. Finalised sessions use `staleTime: Infinity` (immutable). The SSE live-session feed updates the query cache directly via `queryClient.setQueryData` — no polling.

### UI State (Zustand)
Three stores: `auth.ts` (tokens + user, localStorage), `sessionFilters.ts` (filter state persists on back-nav), `ui.ts` (sidebar collapse, active tabs).

### Auth Flow
Short-lived JWT access tokens (15m) + rotatable refresh tokens (7d). The `ky` client auto-refreshes on 401 with deduplication — N concurrent failures share one refresh call, GET/HEAD requests are retried, POST requests are not (body consumed).

### SSE
`@microsoft/fetch-event-source` (native `EventSource` lacks `Authorization` header support). Live session feed at `/v1/sessions/live`.

## Scripts

```bash
pnpm dev              # Vite dev server: http://localhost:5173
pnpm build            # tsc -b && vite build → dist/
pnpm preview          # Preview production build
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint src/
pnpm lint:fix         # eslint --fix src/
pnpm sync-types       # cp ../dapplepot-api/src/types/*.ts src/types/
```

## Related Repos

| Repo | Role |
|------|------|
| [dapplepot-api](../dapplepot-api) | REST API + SSE source (port 3000) |
| [dapplepot-sdk](../dapplepot-sdk) | Python SDK — instruments agents |
| [dapplepot-security](../dapplepot-security) | Security engine — produces findings displayed here |
