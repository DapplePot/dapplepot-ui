import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useSdkKeys, useRevealSdkKey } from '../../hooks/useSdkKeys'
import type { SdkKeySummary } from '../../types/sdkKey'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

interface SdkKeyRowProps {
  sdkKey:  SdkKeySummary
  isAdmin: boolean
}

function SdkKeyRow({ sdkKey, isAdmin }: SdkKeyRowProps) {
  const reveal = useRevealSdkKey()
  const [fullKey,  setFullKey]  = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [copied,   setCopied]   = useState(false)

  function handleToggle() {
    if (revealed) {
      setRevealed(false)
      return
    }
    if (fullKey) {
      setRevealed(true)
      return
    }
    reveal.mutate(sdkKey.keyId, {
      onSuccess: (data) => {
        setFullKey(data.key)
        setRevealed(true)
      },
    })
  }

  async function handleCopy() {
    const text = fullKey ?? sdkKey.maskedKey
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayKey = revealed && fullKey ? fullKey : sdkKey.maskedKey

  return (
    <tr className="border-b border-slate-100 last:border-0 dark:border-slate-800">
      <td className="px-4 py-3">
        {sdkKey.name
          ? <span className="text-sm text-slate-900 dark:text-slate-100">{sdkKey.name}</span>
          : <span className="text-sm italic text-slate-400 dark:text-slate-500">Unnamed</span>
        }
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 select-all dark:bg-slate-800 dark:text-slate-300">
            {displayKey}
          </code>
          {isAdmin && (
            <>
              <button
                onClick={handleToggle}
                disabled={reveal.isPending}
                className="text-xs text-violet-600 hover:text-violet-800 underline underline-offset-2 disabled:opacity-50 dark:text-violet-400 dark:hover:text-violet-300"
              >
                {reveal.isPending ? 'Loading…' : revealed ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={handleCopy}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                title="Copy"
              >
                {copied
                  ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                  : <Copy className="h-3.5 w-3.5" />
                }
              </button>
            </>
          )}
        </div>
        {reveal.isError && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">Failed to load key. Try again.</p>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          sdkKey.enabled
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }`}>
          {sdkKey.enabled ? 'Active' : 'Disabled'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
        {formatDate(sdkKey.createdAt)}
      </td>
      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
        {sdkKey.lastUsedAt
          ? formatDate(sdkKey.lastUsedAt)
          : <span className="text-slate-400 dark:text-slate-500">Never</span>
        }
      </td>
    </tr>
  )
}

interface SdkKeySectionProps {
  isAdmin: boolean
}

export function SdkKeySection({ isAdmin }: SdkKeySectionProps) {
  const { data: keys, isLoading, isError } = useSdkKeys()

  if (isLoading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading SDK keys…</p>
  }

  if (isError) {
    return <p className="text-sm text-red-600 dark:text-red-400">Failed to load SDK keys.</p>
  }

  if (!keys?.length) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
        No SDK keys found for this tenant.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Key</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Last Used</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <SdkKeyRow key={k.keyId} sdkKey={k} isAdmin={isAdmin} />
          ))}
        </tbody>
      </table>
      {!isAdmin && (
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          Contact your tenant admin to view SDK keys.
        </p>
      )}
    </div>
  )
}
