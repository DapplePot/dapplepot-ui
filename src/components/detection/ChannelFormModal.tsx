import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { useCreateChannel, useUpdateChannel, useDeleteChannel } from '../../hooks/useChannels'
import type { ChannelType, DeliveryChannel } from '@dapplepot/types/channel'

interface ChannelFormModalProps {
  onClose: () => void
  initialData?: DeliveryChannel
  initialChannelType?: ChannelType
}

export function ChannelFormModal({ onClose, initialData, initialChannelType }: ChannelFormModalProps) {
  const createChannel = useCreateChannel()
  const updateChannel = useUpdateChannel()
  const deleteChannel = useDeleteChannel()
  
  const isEditing = !!initialData
  // Type is locked when editing an existing channel OR when opened from a specific connector card
  const isTypeLocked = isEditing || !!initialChannelType
  const [name, setName] = useState(initialData?.name || '')
  const [channelType, setChannelType] = useState<ChannelType>(initialData?.channelType || initialChannelType || 'slack')
  const [config, setConfig] = useState<Record<string, string>>((initialData?.config as unknown as Record<string, string>) || {})

  const handleConfigChange = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Build final config depending on channelType
    let finalConfig: Record<string, unknown> = {}
    if (channelType === 'webhook') {
      finalConfig = { url: config.url, secret: config.secret }
    } else if (channelType === 'slack') {
      finalConfig = { webhookUrl: config.webhookUrl, channel: config.channel }
    } else if (channelType === 'msteams') {
      finalConfig = { webhookUrl: config.webhookUrl }
    }

    if (isEditing && initialData) {
      updateChannel.mutate({
        channelId: initialData.channelId,
        data: {
          name,
          config: finalConfig as any,
        }
      }, {
        onSuccess: () => onClose()
      })
    } else {
      createChannel.mutate({
        name,
        channelType,
        enabled: true,
        config: finalConfig as any,
      }, {
        onSuccess: () => onClose()
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded border border-slate-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
            {isEditing
              ? `Edit ${channelType === 'msteams' ? 'Microsoft Teams' : channelType === 'slack' ? 'Slack' : 'Webhook'} Channel`
              : isTypeLocked
                ? `Configure ${channelType === 'msteams' ? 'Microsoft Teams' : channelType === 'slack' ? 'Slack' : 'Webhook'}`
                : 'Add Channel'
            }
          </h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Name</label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                channelType === 'msteams' ? 'e.g. Engineering Teams' :
                channelType === 'webhook' ? 'e.g. Prod Alert Webhook' :
                'e.g. Engineering Slack'
              }
            />
          </div>

          {!isTypeLocked && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Channel Type</label>
              <Select
                value={channelType}
                onChange={(e) => {
                  setChannelType(e.target.value as ChannelType)
                  setConfig({})
                }}
              >
                <option value="slack">Slack</option>
                <option value="msteams">Microsoft Teams</option>
                <option value="webhook">Custom Webhook</option>
              </Select>
            </div>
          )}

          <div className="rounded border border-slate-100 bg-slate-50 p-4 space-y-4 dark:border-zinc-800 dark:bg-zinc-800/50">
            {channelType === 'slack' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Webhook URL</label>
                  <Input required value={config.webhookUrl || ''} onChange={(e) => handleConfigChange('webhookUrl', e.target.value)} placeholder="https://hooks.slack.com/..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Channel (optional)</label>
                  <Input value={config.channel || ''} onChange={(e) => handleConfigChange('channel', e.target.value)} placeholder="#security-alerts" />
                </div>
              </>
            )}

            {channelType === 'msteams' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Teams Webhook URL</label>
                <Input required value={config.webhookUrl || ''} onChange={(e) => handleConfigChange('webhookUrl', e.target.value)} placeholder="https://xyz.webhook.office.com/..." />
              </div>
            )}

            {channelType === 'webhook' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Endpoint URL</label>
                  <Input required type="url" value={config.url || ''} onChange={(e) => handleConfigChange('url', e.target.value)} placeholder="https://api.mycompany.com/alerts" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Secret (optional)</label>
                  <Input type="password" value={config.secret || ''} onChange={(e) => handleConfigChange('secret', e.target.value)} placeholder="Signature secret" />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
            {isEditing ? (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => {
                  deleteChannel.mutate(initialData.channelId, {
                    onSuccess: () => onClose()
                  })
                }}
                disabled={deleteChannel.isPending}
              >
                {deleteChannel.isPending ? 'Deleting...' : 'Delete Channel'}
              </Button>
            ) : (
              <div></div>
            )}
            
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createChannel.isPending || updateChannel.isPending}>
                {createChannel.isPending || updateChannel.isPending 
                  ? 'Saving...' 
                  : isEditing ? 'Save Changes' : 'Create Channel'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
