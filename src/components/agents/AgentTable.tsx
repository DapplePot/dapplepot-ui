import { useState } from 'react'
import { Plus, Copy, Check, Pencil, Trash2, X } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useAgents, useUpdateAgent, useDeleteAgent } from '../../hooks/useAgents'
import { useMe } from '../../hooks/useUsers'
import { CreateAgentModal } from './CreateAgentModal'
import type { AgentSummary } from '../../types/agent'

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

function EditAgentModal({ agent, onClose }: { agent: AgentSummary; onClose: () => void }) {
  const update = useUpdateAgent(agent.agentId)
  const [description,   setDescription]   = useState(agent.description ?? '')
  const [latestVersion, setLatestVersion] = useState(agent.latestVersion ?? '')

  function handleSave() {
    update.mutate(
      {
        description:   description.trim() || null,
        latestVersion: latestVersion.trim() || null,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            Edit — <span className="font-mono text-violet-600 dark:text-violet-400">{agent.name}</span>
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this agent do?"
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Latest version</label>
            <input
              type="text"
              value={latestVersion}
              onChange={(e) => setLatestVersion(e.target.value)}
              placeholder="e.g. 1.0.0"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>
        </div>

        {update.isError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {(update.error as Error)?.message ?? 'Failed to save.'}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {update.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AgentTable() {
  const { data: agents, isLoading, isError } = useAgents()
  const deleteAgent = useDeleteAgent()
  const { data: me } = useMe()
  const [showCreate,   setShowCreate]   = useState(false)
  const [editTarget,   setEditTarget]   = useState<AgentSummary | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AgentSummary | null>(null)
  const [search,       setSearch]       = useState('')

  const isAdmin = me?.role === 'admin'

  const filtered = (agents ?? []).filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.description ?? '').toLowerCase().includes(search.toLowerCase())
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
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" />
            New agent
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-500 dark:text-zinc-400">Loading agents…</p>}
      {isError   && <p className="text-sm text-red-600 dark:text-red-400">Failed to load agents.</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Agent ID</th>
                <th className="px-4 py-3">Latest version</th>
                <th className="px-4 py-3">Created</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((agent) => (
                <tr key={agent.agentId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                  <td className="p-0">
                    <Link
                      to="/inventory/agents/$agentId"
                      params={{ agentId: agent.agentId }}
                      className="flex items-center px-4 py-3 text-sm font-medium text-slate-900 dark:text-zinc-100"
                    >
                      {agent.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-zinc-400">
                    {agent.description ?? <span className="text-slate-300 dark:text-zinc-600">—</span>}
                  </td>
                  <td className="p-0">
                    <Link
                      to="/inventory/agents/$agentId"
                      params={{ agentId: agent.agentId }}
                      className="flex items-center px-4 py-3"
                    >
                      <span onClick={(e) => e.stopPropagation()}>
                        <CopyId id={agent.agentId} />
                      </span>
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link
                      to="/inventory/agents/$agentId"
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
                      to="/inventory/agents/$agentId"
                      params={{ agentId: agent.agentId }}
                      className="flex items-center px-4 py-3 text-sm text-slate-500 dark:text-zinc-400"
                    >
                      {formatDate(agent.createdAt)}
                    </Link>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditTarget(agent)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          title="Edit agent"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(agent)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Delete agent"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-sm text-slate-400 dark:text-zinc-500">
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

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">Delete agent?</h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-zinc-400">
              <span className="font-mono font-medium text-slate-700 dark:text-zinc-200">{deleteTarget.name}</span> will be permanently removed from the inventory.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                disabled={deleteAgent.isPending}
                onClick={() => deleteAgent.mutate(deleteTarget.agentId, { onSuccess: () => setDeleteTarget(null) })}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleteAgent.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate  && <CreateAgentModal onClose={() => setShowCreate(false)} />}
      {editTarget  && <EditAgentModal agent={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  )
}
