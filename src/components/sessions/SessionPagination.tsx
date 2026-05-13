import { Button } from '../ui/button'

interface SessionPaginationProps {
  page: number
  totalPages: number
  total: number
  onPage: (page: number) => void
}

export function SessionPagination({ page, totalPages, total, onPage }: SessionPaginationProps) {
  if (totalPages <= 1) return null

  const pages = buildPages(page, totalPages)

  return (
    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-zinc-400">
      <span>{total} sessions</span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          ← Prev
        </Button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1">…</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPage(p as number)}
            >
              {p}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next →
        </Button>
      </div>
    </div>
  )
}

function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p)
  }
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}
