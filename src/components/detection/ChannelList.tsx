import type { DeliveryChannel } from '@dapplepot/types/channel'
import { Toggle } from '../ui/toggle'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import { useUpdateChannel } from '../../hooks/useChannels'
import { Webhook, MessageSquare, Bell } from 'lucide-react'

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  webhook:    Webhook,
  slack:      MessageSquare,
  pagerduty:  Bell,
}

interface ChannelListProps {
  channels: DeliveryChannel[]
}

export function ChannelList({ channels }: ChannelListProps) {
  const updateChannel = useUpdateChannel()

  return (
    <div className="space-y-3">
      {channels.map((channel) => {
        const Icon = CHANNEL_ICONS[channel.channelType] ?? Bell
        return (
          <div
            key={channel.channelId}
            className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <Icon className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">{channel.name}</p>
              <p className="text-xs text-slate-400 capitalize">{channel.channelType}</p>
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
          </div>
        )
      })}

      {/* Platform inbox */}
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-medium text-slate-700">Platform inbox</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Always on — all alerts appear in the Detection inbox regardless of channel config.
        </p>
      </div>

      <button className="text-sm text-violet-600 hover:underline">
        + Add channel
      </button>

      {channels.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-4">No channels configured</p>
      )}
    </div>
  )
}

export function ChannelListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      ))}
    </div>
  )
}
