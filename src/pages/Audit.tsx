import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Download, FileCheck2, Clock, ChevronDown, Copy, Check } from 'lucide-react'
import { useAuditArchives, useDownloadArchive, useDownloadLiveReport } from '../hooks/useAudit'
import { useAgents } from '../hooks/useAgents'
import type { AuditArchiveMeta } from '../api/audit'

function formatPeriod(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  return `${s.toLocaleString('default', { month: 'long', year: 'numeric' })} – ${e.toLocaleString('default', { month: 'long', year: 'numeric' })}`
}

function CopyHash({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy SHA-256"
      className="group flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 hover:border-violet-300 dark:border-zinc-700 dark:hover:border-violet-600"
    >
      <span className="hidden font-mono text-xs text-slate-400 group-hover:text-violet-600 dark:text-zinc-500 dark:group-hover:text-violet-400 lg:block">
        SHA-256: {hash}
      </span>
      {copied
        ? <Check className="h-3.5 w-3.5 text-emerald-500" />
        : <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-violet-600 dark:text-zinc-500 dark:group-hover:text-violet-400" />
      }
    </button>
  )
}

function ArchiveRow({ archive }: { archive: AuditArchiveMeta }) {
  const download = useDownloadArchive()
  const filename = `audit-${archive.periodStart.slice(0, 7)}-${archive.archiveId.slice(0, 8)}.json`

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
      <div className="flex items-center gap-3">
        <FileCheck2 className="h-4 w-4 shrink-0 text-violet-500" />
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">
            {formatPeriod(archive.periodStart, archive.periodEnd)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500">
            {archive.sessionCount} sessions · {archive.eventCount} events · {archive.findingCount} findings
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {archive.sha256 && <CopyHash hash={archive.sha256} />}
        <button
          disabled={archive.status !== 'sealed' || download.isPending}
          onClick={() => download.mutate({ archiveId: archive.archiveId, filename })}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-violet-300 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-violet-600 dark:hover:text-violet-400"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
      </div>
    </div>
  )
}

export function Audit() {
  const { data: agentsData } = useAgents()
  const agents = agentsData ?? []

  const [liveAgent, setLiveAgent] = useState<string | null>(null)

  const { data: archives, isLoading } = useAuditArchives(null)
  const downloadLive = useDownloadLiveReport()

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Audit</h1>

      {/* Live / current period */}
      <div className="rounded-lg border border-violet-100 bg-violet-50/50 px-5 py-4 dark:border-violet-900/30 dark:bg-violet-950/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 shrink-0 text-violet-500" />
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">Current period (live)</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                From last sealed archive to now · auto-sealed on the 1st of each month
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {agents.length > 0 && (
              <div className="relative">
                <select
                  value={liveAgent ?? ''}
                  onChange={e => setLiveAgent(e.target.value || null)}
                  className="appearance-none rounded-md border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-xs text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  <option value="">All agents</option>
                  {agents.map(a => (
                    <option key={a.agentId} value={a.agentId}>{a.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
              </div>
            )}
            <button
              onClick={() => downloadLive.mutate({ agentId: liveAgent })}
              disabled={downloadLive.isPending}
              className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {downloadLive.isPending ? 'Generating…' : 'Download'}
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-zinc-600">
        For session-level audit exports, open the session trace and use the Export button.{' '}
        <Link to="/sessions" className="text-violet-500 hover:underline dark:text-violet-400">
          Go to Sessions →
        </Link>
      </p>

      {/* Monthly sealed archives */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-600 dark:text-zinc-400">Monthly sealed archives</h2>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-zinc-800" />
            ))}
          </div>
        )}

        {!isLoading && (!archives || archives.length === 0) && (
          <div className="rounded-lg border border-dashed border-slate-200 px-5 py-8 text-center dark:border-zinc-700">
            <p className="text-sm text-slate-400 dark:text-zinc-500">No sealed archives yet.</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-600">
              The first archive will be generated automatically on the 1st of next month.
            </p>
            <p className="mt-2 text-xs text-slate-300 dark:text-zinc-700">
              Sealing takes a snapshot of all sessions, events, and security findings for the month and locks it with a SHA-256 hash — making the record tamper-evident.
            </p>
          </div>
        )}

        {archives && archives.length > 0 && (
          <div className="space-y-2">
            {archives.map(a => <ArchiveRow key={a.archiveId} archive={a} />)}
          </div>
        )}
      </div>
    </div>
  )
}
