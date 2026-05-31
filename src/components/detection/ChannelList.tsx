import React, { useState, useMemo } from 'react'
import type { DeliveryChannel, ChannelType } from '@dapplepot/types/channel'
import { Toggle } from '../ui/toggle'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import { useUpdateChannel } from '../../hooks/useChannels'
import { Webhook, MessageSquare, Bell, Users, Settings, Plus } from 'lucide-react'
import { ChannelFormModal } from './ChannelFormModal'

const CONNECTOR_TYPES: Array<{ type: ChannelType; name: string; icon: React.ElementType; description: string }> = [
  { type: 'slack', name: 'Slack', icon: MessageSquare, description: 'Send alerts to Slack channels' },
  { type: 'msteams', name: 'Microsoft Teams', icon: Users, description: 'Send alerts to Teams channels' },
  { type: 'webhook', name: 'Custom Webhook', icon: Webhook, description: 'Send POST requests to your endpoints' },
]

interface ChannelListProps {
  channels: DeliveryChannel[]
}

export function ChannelList({ channels }: ChannelListProps) {
  const updateChannel = useUpdateChannel()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<DeliveryChannel | null>(null)
  const [addingType, setAddingType] = useState<ChannelType | undefined>(undefined)

  const openModal = (channel?: DeliveryChannel, type?: ChannelType) => {
    setEditingChannel(channel || null)
    setAddingType(type)
    setIsModalOpen(true)
  }

  // Group channels by type
  const channelsByType = useMemo(() => {
    const grouped = {} as Record<ChannelType, DeliveryChannel[]>
    channels.forEach(ch => {
      if (!grouped[ch.channelType]) grouped[ch.channelType] = []
      grouped[ch.channelType].push(ch)
    })
    return grouped
  }, [channels])

  return (
    <div className="space-y-6">
      {/* Platform Inbox - Always on top */}
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Platform Inbox</p>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Always on — all alerts appear in the Detection inbox regardless of channel config.
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20">Always Active</Badge>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-900 dark:text-zinc-100">Available Connectors</h3>
        
        <div className="grid gap-4">
          {CONNECTOR_TYPES.map((connector) => {
            const Icon = connector.icon
            const configuredChannels = channelsByType[connector.type] || []
            const isConfigured = configuredChannels.length > 0

            return (
              <div key={connector.type} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
                {/* Header row */}
                <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-900 dark:text-zinc-100">{connector.name}</h4>
                      {isConfigured ? (
                        <Badge variant="success" className="h-5 text-[10px] uppercase tracking-wider">Configured</Badge>
                      ) : (
                        <Badge variant="secondary" className="h-5 text-[10px] uppercase tracking-wider">Not Configured</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 dark:text-zinc-400">{connector.description}</p>
                  </div>
                  {!isConfigured && (
                    <button
                      onClick={() => openModal(undefined, connector.type)}
                      className="text-sm font-medium text-violet-600 hover:text-violet-700 hover:underline dark:text-violet-400 dark:hover:text-violet-300"
                    >
                      + Configure
                    </button>
                  )}
                </div>

                {/* Configured Instances */}
                {isConfigured && (
                  <div className="bg-slate-50/50 p-4 space-y-2 dark:bg-zinc-900/50">
                    {configuredChannels.map((channel) => (
                      <div
                        key={channel.channelId}
                        className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">{channel.name}</p>
                        </div>
                        <Badge variant={channel.enabled ? 'success' : 'secondary'}>
                          {channel.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                        <Toggle
                          checked={channel.enabled}
                          onCheckedChange={() =>
                            updateChannel.mutate({
                              channelId: channel.channelId,
                              data: { enabled: !channel.enabled },
                            })
                          }
                          aria-label={`Toggle ${channel.name}`}
                        />
                        <button
                          onClick={() => openModal(channel, connector.type)}
                          className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300 transition-colors"
                          aria-label={`Edit ${channel.name}`}
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    <div className="pt-2 px-1">
                      <button
                        onClick={() => openModal(undefined, connector.type)}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-violet-600 transition-colors dark:text-zinc-400 dark:hover:text-violet-400"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add another {connector.name}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {isModalOpen && (
        <ChannelFormModal 
          onClose={() => setIsModalOpen(false)} 
          initialData={editingChannel || undefined}
          initialChannelType={addingType}
        />
      )}
    </div>
  )
}

export function ChannelListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full rounded-lg" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
