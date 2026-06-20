import { cn } from '../../utils/cn'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded bg-slate-100 dark:bg-zinc-800', className)}
      {...props}
    />
  )
}

export { Skeleton }
