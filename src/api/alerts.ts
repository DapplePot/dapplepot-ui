import type { AlertSummary, AlertDetail, AlertStats, AlertDelivery } from '@dapplepot/types/alert'
import type { Paginated, AlertListParams } from '@dapplepot/types/common'
import { apiClient } from './client'

export async function getAlerts(
  params: AlertListParams
): Promise<Paginated<AlertSummary>> {
  return apiClient
    .get('v1/alerts', { searchParams: params as Record<string, string | number> })
    .json()
}

export async function getAlertDeliveries(alertId: string): Promise<{ deliveries: AlertDelivery[] }> {
  return apiClient.get(`v1/alerts/${alertId}/deliveries`).json()
}

export async function getAlertDetail(alertId: string): Promise<AlertDetail> {
  return apiClient.get(`v1/alerts/${alertId}`).json()
}

export async function updateAlertStatus(
  alertId: string,
  status: 'acknowledged' | 'resolved'
): Promise<AlertSummary> {
  return apiClient.put(`v1/alerts/${alertId}/status`, { json: { status } }).json()
}

export async function getAlertStats(params: { window: string }): Promise<AlertStats> {
  return apiClient.get('v1/alerts/stats', { searchParams: params }).json()
}

export async function getSessionAlerts(sessionId: string): Promise<AlertSummary[]> {
  return apiClient.get(`v1/sessions/${sessionId}/alerts`).json()
}
