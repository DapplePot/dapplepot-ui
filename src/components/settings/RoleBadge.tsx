import type { UserRole } from '../../types/auth'
import { cn } from '../../utils/cn'

const ROLE_STYLES: Record<UserRole, string> = {
  superadmin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  admin:      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  editor:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  viewer:     'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
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
