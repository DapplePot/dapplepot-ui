import { useState } from 'react'
import { Plus, Copy, Check } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useAgents } from '../../hooks/useAgents'
import { useMe } from '../../hooks/useUsers'
import { CreateAgentModal } from './CreateAgentModal'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs text-slate-400 dark:text-zinc-500">{id}</span>
      <button
        onClick={handleCopy}
        className="shrink-0 text-slate-300 hover:text-slate-500 dark:text-zinc-600 dark:hover:text-zinc-400"
        title="Copy agent ID"
      >
        {copied
          ? <Check className="h-3 w-3 text-emerald-500" />
          : <Copy className="h-3 w-3" />
        }
      </button>
    </div>
  )
}

export function AgentTable() {
  const { data: agents, isLoading, isError } = useAgents()
  const { data: me } = useMe()
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = (agents ?? []).filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          type="search"
          placeholder="Search agents…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-violet-400"
        />
        {me?.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" />
            New agent
          </button>
        )}
      </div>

      {isLoading && (
        <p className="text-sm text-slate-500 dark:text-zinc-400">Loading agents…</p>
      )}

      {isError && (
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load agents.</p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Agent ID</th>
                <th className="px-4 py-3">Latest Version</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((agent) => (
                <tr key={agent.agentId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
                  <td className="p-0">
                    <Link
                      to="/agents/$agentId"
                      params={{ agentId: agent.agentId }}
                      className="flex items-center px-4 py-3 text-sm font-medium text-slate-900 dark:text-zinc-100"
                    >
                      {agent.name}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link
                      to="/agents/$agentId"
                      params={{ agentId: agent.agentId }}
                      className="flex items-center px-4 py-3"
                    >
                      <span onClick={e => e.stopPropagation()}>
                        <CopyId id={agent.agentId} />
                      </span>
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link
                      to="/agents/$agentId"
                      params={{ agentId: agent.agentId }}
                      className="flex items-center px-4 py-3"
                    >
                      {agent.latestVersion
                        ? <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">{agent.latestVersion}</span>
                        : <span className="text-xs text-slate-400 dark:text-zinc-500">—</span>
                      }
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link
                      to="/agents/$agentId"
                      params={{ agentId: agent.agentId }}
                      className="flex items-center px-4 py-3 text-sm text-slate-500 dark:text-zinc-400"
                    >
                      {formatDate(agent.createdAt)}
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400 dark:text-zinc-500">
                    {agents?.length === 0
                      ? 'No agents yet. Create your first agent to get started.'
                      : 'No agents match your search.'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <CreateAgentModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
