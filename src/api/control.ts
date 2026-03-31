import { apiClient } from './client'

export async function killSwitch(sessionId: string): Promise<void> {
  await apiClient.post(`v1/control/kill`, { json: { sessionId } })
}

export async function interrupt(sessionId: string): Promise<void> {
  await apiClient.post(`v1/control/interrupt`, { json: { sessionId } })
}
