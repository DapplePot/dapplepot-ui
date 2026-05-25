export type ChannelType = 'webhook' | 'slack' | 'msteams'

export interface WebhookConfig {
  url: string
  secret?: string
  headers?: Record<string, string>
}

export interface SlackConfig {
  webhookUrl: string
  channel?: string
}

export interface MsteamsConfig {
  webhookUrl: string
}

export type ChannelConfig = WebhookConfig | SlackConfig | MsteamsConfig

export interface DeliveryChannel {
  channelId: string
  name: string
  channelType: ChannelType
  enabled: boolean
  config: ChannelConfig
  createdAt: string
  updatedAt: string
}
