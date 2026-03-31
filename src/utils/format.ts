/** Format a token count: 1200 → "1.2k", 1_400_000 → "1.4M" */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

/** Format milliseconds as a human duration: 47800 → "47.8s", 90000 → "1m 30s" */
export function formatDuration(ms: number): string {
  if (ms < 1_000) return `${ms}ms`
  const s = ms / 1_000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const rem = Math.round(s % 60)
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`
}

/** Format a timestamp as a relative "time ago" string: "3m ago", "2h ago", "yesterday" */
export function formatAgo(dateOrIso: Date | string): string {
  const date = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso
  const diffMs = Date.now() - date.getTime()
  const diffS = Math.floor(diffMs / 1_000)
  if (diffS < 60) return `${diffS}s ago`
  const diffM = Math.floor(diffS / 60)
  if (diffM < 60) return `${diffM}m ago`
  const diffH = Math.floor(diffM / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'yesterday'
  return `${diffD}d ago`
}

/** Format bytes as human-readable: 1536 → "1.5 KB", 1_048_576 → "1.0 MB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`
  return `${(bytes / 1_073_741_824).toFixed(1)} GB`
}

/** Format a number as a currency string: 1.23456 → "$1.23" */
export function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`
}

/** Format a latency value in ms to "1.2s" or "340ms" */
export function formatLatency(ms: number): string {
  if (ms >= 1_000) return `${(ms / 1_000).toFixed(1)}s`
  return `${Math.round(ms)}ms`
}
