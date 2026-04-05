import { apiClient } from './client'
import type { SdkKeySummary, SdkKeyRevealResponse } from '../types/sdkKey'

export function getSdkKeys(): Promise<SdkKeySummary[]> {
  return apiClient.get('v1/sdk-keys').json()
}

export function revealSdkKey(keyId: string): Promise<SdkKeyRevealResponse> {
  return apiClient.get(`v1/sdk-keys/${keyId}/reveal`).json()
}
