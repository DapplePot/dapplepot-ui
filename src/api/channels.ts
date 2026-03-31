import type { DeliveryChannel } from '@dapplepot/types/channel'
import { apiClient } from './client'

export async function getChannels(): Promise<DeliveryChannel[]> {
  return apiClient.get('v1/channels').json()
}

export async function createChannel(
  data: Omit<DeliveryChannel, 'channelId' | 'createdAt' | 'updatedAt'>
): Promise<DeliveryChannel> {
  return apiClient.post('v1/channels', { json: data }).json()
}

export async function updateChannel(
  channelId: string,
  data: Partial<Omit<DeliveryChannel, 'channelId' | 'createdAt' | 'updatedAt'>>
): Promise<DeliveryChannel> {
  return apiClient.put(`v1/channels/${channelId}`, { json: data }).json()
}
