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
      <span className="font-mono text-xs text-slate-400">{id}</span>
      <button
        onClick={handleCopy}
        className="shrink-0 text-slate-300 hover:text-slate-500"
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
          className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
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
        <p className="text-sm text-slate-500">Loading agents…</p>
      )}

      {isError && (
        <p className="text-sm text-red-600">Failed to load agents.</p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Agent ID</th>
                <th className="px-4 py-3">Latest Version</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((agent) => (
                <tr key={agent.agentId} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-slate-900">{agent.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <CopyId id={agent.agentId} />
                  </td>
                  <td className="px-4 py-3">
                    {agent.latestVersion
                      ? <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{agent.latestVersion}</span>
                      : <span className="text-xs text-slate-400">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {formatDate(agent.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/agents/$agentId"
                      params={{ agentId: agent.agentId }}
                      className="text-xs text-violet-600 hover:underline"
                    >
                      Security profile
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
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
