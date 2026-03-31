import type { PolicyRule, RulePreview } from '@dapplepot/types/rule'
import { apiClient } from './client'

export async function getRules(): Promise<PolicyRule[]> {
  return apiClient.get('v1/rules').json()
}

export async function createRule(
  data: Omit<PolicyRule, 'ruleId' | 'tenantId' | 'createdAt' | 'updatedAt'>
): Promise<RulePreview> {
  return apiClient.post('v1/rules', { json: data }).json()
}

export async function updateRule(
  ruleId: string,
  data: Partial<Omit<PolicyRule, 'ruleId' | 'tenantId' | 'createdAt' | 'updatedAt'>>
): Promise<PolicyRule> {
  return apiClient.put(`v1/rules/${ruleId}`, { json: data }).json()
}
