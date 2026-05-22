import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DeliveryChannel } from '@dapplepot/types/channel'
import * as channelsApi from '../api/channels'

export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: () => channelsApi.getChannels(),
    staleTime: 60_000,
  })
}

export function useCreateChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (
      data: Omit<DeliveryChannel, 'channelId' | 'createdAt' | 'updatedAt'>
    ) => channelsApi.createChannel(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useUpdateChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      channelId,
      data,
    }: {
      channelId: string
      data: Partial<Omit<DeliveryChannel, 'channelId' | 'createdAt' | 'updatedAt'>>
    }) => channelsApi.updateChannel(channelId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useDeleteChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) => channelsApi.deleteChannel(channelId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}