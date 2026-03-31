import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PolicyRule } from '@dapplepot/types/rule'
import * as rulesApi from '../api/rules'

export function useRules() {
  return useQuery({
    queryKey: ['rules'],
    queryFn: () => rulesApi.getRules(),
    staleTime: 60_000,
  })
}

export function useCreateRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (
      data: Omit<PolicyRule, 'ruleId' | 'tenantId' | 'createdAt' | 'updatedAt'>
    ) => rulesApi.createRule(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rules'] })
    },
  })
}

export function useUpdateRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      ruleId,
      data,
    }: {
      ruleId: string
      data: Partial<Omit<PolicyRule, 'ruleId' | 'tenantId' | 'createdAt' | 'updatedAt'>>
    }) => rulesApi.updateRule(ruleId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rules'] })
    },
  })
}
