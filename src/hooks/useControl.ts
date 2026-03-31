import { useMutation } from '@tanstack/react-query'
import * as controlApi from '../api/control'
import { useLiveSessions, useControlChannel } from '../api/sse'

export function useKillSwitch() {
  return useMutation({
    mutationFn: (sessionId: string) => controlApi.killSwitch(sessionId),
  })
}

export function useInterrupt() {
  return useMutation({
    mutationFn: (sessionId: string) => controlApi.interrupt(sessionId),
  })
}

export { useLiveSessions, useControlChannel }
