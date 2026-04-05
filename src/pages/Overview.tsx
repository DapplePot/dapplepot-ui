import { useOverview, useErrorRates } from '../hooks/useAnalytics'
import { useAlerts } from '../hooks/useAlerts'
import { useLiveSessions } from '../hooks/useControl'
import { MetricCards, MetricCardsSkeleton } from '../components/overview/MetricCards'
import { SessionFeed, SessionFeedSkeleton } from '../components/overview/SessionFeed'
import { AlertPanel, AlertPanelSkeleton } from '../components/overview/AlertPanel'
import { AgentHealth, AgentHealthSkeleton } from '../components/overview/AgentHealth'
import { SuperAdminHome } from '../components/overview/SuperAdminHome'
import { useAuthStore } from '../stores/auth'

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
      {message}
    </div>
  )
}

export function Overview() {
  const role = useAuthStore((s) => s.user?.role)
  const overview = useOverview('24h')
  const liveSessions = useLiveSessions()
  const alerts = useAlerts({ limit: 4, sort: 'triggered_at:desc' })
  const errorRates = useErrorRates('1h')

  if (role === 'superadmin') return <SuperAdminHome />

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Overview</h1>

      {/* Metric cards */}
      {overview.isLoading || liveSessions.isLoading ? (
        <MetricCardsSkeleton />
      ) : overview.isError ? (
        <ErrorCard message={overview.error.message} />
      ) : (
        <MetricCards
          overview={overview.data!}
          liveSessions={liveSessions.data ?? []}
        />
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Session feed — takes 2/3 */}
        <div className="col-span-2 rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-medium text-slate-700">Live session feed</h2>
          </div>
          {liveSessions.isLoading ? (
            <SessionFeedSkeleton />
          ) : (
            <SessionFeed sessions={liveSessions.data ?? []} />
          )}
        </div>

        {/* Right column — alerts + agent health */}
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-medium text-slate-700">Recent alerts</h2>
            </div>
            {alerts.isLoading ? (
              <AlertPanelSkeleton />
            ) : alerts.isError ? (
              <ErrorCard message={alerts.error.message} />
            ) : (
              <AlertPanel alerts={alerts.data?.data ?? []} />
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-medium text-slate-700">Agent health</h2>
            </div>
            {errorRates.isLoading ? (
              <AgentHealthSkeleton />
            ) : errorRates.isError ? (
              <ErrorCard message={errorRates.error.message} />
            ) : (
              <AgentHealth data={errorRates.data ?? []} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
