import { useOverview, useTrends } from '../hooks/useAnalytics'
import { useAlerts } from '../hooks/useAlerts'
import { useLiveSessions } from '../hooks/useControl'
import { MetricCards, MetricCardsSkeleton } from '../components/overview/MetricCards'
import { SessionFeed, SessionFeedSkeleton } from '../components/overview/SessionFeed'
import { AlertPanel, AlertPanelSkeleton } from '../components/overview/AlertPanel'
import { AgentHealth } from '../components/overview/AgentHealth'
import { SuperAdminHome } from '../components/overview/SuperAdminHome'
import { useAuthStore } from '../stores/auth'

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
      {message}
    </div>
  )
}

export function Overview() {
  const role = useAuthStore((s) => s.user?.role)
  const overview = useOverview('24h')
  const trends = useTrends('24h')
  const liveSessions = useLiveSessions()
  const alerts = useAlerts({ limit: 4, sort: 'triggered_at:desc' })

  if (role === 'superadmin') return <SuperAdminHome />

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Overview</h1>

      {overview.isLoading || liveSessions.isLoading || !overview.data ? (
        <MetricCardsSkeleton />
      ) : overview.isError ? (
        <ErrorCard message={overview.error.message} />
      ) : (
        <MetricCards
          overview={overview.data}
          liveSessions={liveSessions.data ?? []}
          trends={trends.data ?? []}
        />
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-medium text-slate-700 dark:text-zinc-300">Live session feed</h2>
          </div>
          {liveSessions.isLoading ? (
            <SessionFeedSkeleton />
          ) : (
            <SessionFeed sessions={liveSessions.data ?? []} />
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-sm font-medium text-slate-700 dark:text-zinc-300">Recent alerts</h2>
            </div>
            {alerts.isLoading ? (
              <AlertPanelSkeleton />
            ) : alerts.isError ? (
              <ErrorCard message={alerts.error.message} />
            ) : (
              <AlertPanel alerts={alerts.data?.data ?? []} />
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-sm font-medium text-slate-700 dark:text-zinc-300">Recent agents</h2>
            </div>
            <AgentHealth liveSessions={liveSessions.data ?? []} />
          </div>
        </div>
      </div>
    </div>
  )
}
