import { useQuery } from '@tanstack/react-query';
import { getAlertDeliveries } from '../api/alerts';
import type { AlertDelivery } from '@dapplepot/types/alert';

export function useAlertDeliveries(alertId: string) {
  return useQuery<{ deliveries: AlertDelivery[] }>({
    queryKey: ['alertDeliveries', alertId],
    queryFn: () => getAlertDeliveries(alertId),
    staleTime: 60_000,
  });
}
