import type { UserRole } from '../../types/auth'
import { cn } from '../../utils/cn'

const ROLE_STYLES: Record<UserRole, string> = {
  superadmin: 'bg-rose-100 text-rose-700',
  admin:      'bg-violet-100 text-violet-700',
  editor:     'bg-blue-100 text-blue-700',
  viewer:     'bg-slate-100 text-slate-600',
}

interface RoleBadgeProps {
  role: UserRole
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize', ROLE_STYLES[role])}>
      {role}
    </span>
  )
}
