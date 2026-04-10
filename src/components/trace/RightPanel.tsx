import { useState } from 'react'
import type { SessionDetail } from '@dapplepot/types/session'
import type { AlertSummary } from '@dapplepot/types/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { SessionInfoTab } from './SessionInfoTab'
import { AlertsTab } from './AlertsTab'
import { SecurityTab } from './SecurityTab'

interface RightPanelProps {
  session: SessionDetail
  alerts: AlertSummary[]
}

export function RightPanel({ session, alerts }: RightPanelProps) {
  const [tab, setTab] = useState('security')

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex h-full flex-col">
      <TabsList className="mx-4 mt-3 shrink-0 justify-start">
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="alerts">
          Alerts {alerts.length > 0 && `(${alerts.length})`}
        </TabsTrigger>
        <TabsTrigger value="session">Session</TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <TabsContent value="security">
          <SecurityTab sessionId={session.sessionId} />
        </TabsContent>
        <TabsContent value="alerts">
          <AlertsTab alerts={alerts} />
        </TabsContent>
        <TabsContent value="session">
          <SessionInfoTab session={session} />
        </TabsContent>
      </div>
    </Tabs>
  )
}
