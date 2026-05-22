import { Badge } from '../ui/badge';
import type { AlertDelivery } from '@dapplepot/types/alert';

interface DeliveryStatusListProps {
  deliveries: AlertDelivery[];
  loading?: boolean;
}

export default function DeliveryStatusList({ deliveries, loading }: DeliveryStatusListProps) {
  if (loading) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Loading delivery statuses...</div>
    );
  }

  if (!deliveries || deliveries.length === 0) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No delivery information available.</div>
    );
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className="border-t border-slate-100 px-4 py-3 dark:border-zinc-800">
      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-zinc-400">Delivery Statuses</p>
      <div className="flex flex-wrap gap-2">
        {deliveries.map((d) => (
          <Badge
            key={d.deliveryId}
            variant="secondary"
            className={statusColor[d.status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}
          >
            {d.channelName}: {d.status}
          </Badge>
        ))}
      </div>
    </div>
  );
}
