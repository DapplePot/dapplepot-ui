import { useEffect, useState } from 'react'
import { useAlerts } from '../hooks/useAlerts'
import { useChannels } from '../hooks/useChannels'
import { usePlan } from '../hooks/usePlan'
import { useAlertFilters } from '../stores/alertFilters'
import { AlertFeed, AlertFeedSkeleton } from '../components/detection/AlertFeed'
import { ChannelList, ChannelListSkeleton } from '../components/detection/ChannelList'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'

type Tab = 'alerts' | 'channels'

export function Detection() {
  const [tab, setTab] = useState<Tab>('alerts')
  const { limits } = usePlan()

  // Channels are a Team+ feature. Individual tenants (Free Trial / Pro)
  // never see the Channels tab — their plan has no allowed channels anyway,
  // and the UI clutter isn't useful.
  const canConfigureChannels = (limits?.allowedChannels.length ?? 0) > 0

  // Defensive: if a tenant downgrades while parked on the Channels tab,
  // bounce them back to Alerts so they don't see a stale empty view.
  useEffect(() => {
    if (!canConfigureChannels && tab === 'channels') setTab('alerts')
  }, [canConfigureChannels, tab])

  const { severity, status } = useAlertFilters()

  const alerts = useAlerts({
    severity: severity || undefined,
    status: status || undefined,
    limit: 50,
    sort: 'triggered_at:desc',
  })

  const channels = useChannels()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Detection</h1>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="alerts">
            Alert inbox
            {(alerts.data?.total ?? 0) > 0 && (
              <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {alerts.data?.total}
              </span>
            )}
          </TabsTrigger>
          {canConfigureChannels && <TabsTrigger value="channels">Channels</TabsTrigger>}
        </TabsList>

        <TabsContent value="alerts">
          {alerts.isLoading ? (
            <AlertFeedSkeleton />
          ) : (
            <AlertFeed alerts={alerts.data?.data ?? []} />
          )}
        </TabsContent>

        {canConfigureChannels && (
          <TabsContent value="channels">
            {channels.isLoading ? (
              <ChannelListSkeleton />
            ) : (
              <ChannelList channels={channels.data ?? []} />
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
