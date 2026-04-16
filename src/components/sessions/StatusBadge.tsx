import type { SessionStatus } from '@dapplepot/types/session'
import { Badge } from '../ui/badge'
import type { BadgeProps } from '../ui/badge'

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  stub:        { label: 'Stub',        variant: 'secondary' },
  open:        { label: 'Open',        variant: 'success' },
  finalised:   { label: 'Finalised',   variant: 'default' },
  terminated:  { label: 'Terminated',  variant: 'destructive' },
}

interface StatusBadgeProps {
  status: SessionStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'outline' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
