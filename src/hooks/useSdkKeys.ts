import { useMutation, useQuery } from '@tanstack/react-query'
import { getSdkKeys, revealSdkKey } from '../api/sdkKeys'

export function useSdkKeys() {
  return useQuery({
    queryKey: ['sdk-keys'],
    queryFn:  getSdkKeys,
    staleTime: 60_000,
  })
}

export function useRevealSdkKey() {
  return useMutation({
    mutationFn: (keyId: string) => revealSdkKey(keyId),
  })
}
