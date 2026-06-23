import { useState, type FormEvent } from 'react'
import { Plus, X, Pencil, Trash2, Server } from 'lucide-react'
import { useMcpServers, useCreateMcpServer, useUpdateMcpServer, useDeleteMcpServer } from '../../hooks/useMcpServers'
import { useMe } from '../../hooks/useUsers'
import type { McpServer } from '../../api/mcpServers'

function CreateModal({ onClose }: { onClose: () => void }) {
  const create = useCreateMcpServer()
  const [name, setName]   = useState('')
  const [url,  setUrl]    = useState('')
  const [desc, setDesc]   = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    create.mutate(
      { name: name.trim(), url: url.trim(), description: desc.trim() || null },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Register MCP server</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Name <span className="text-red-500">*</span>
            </label>
            <input required value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Internal DB Server"
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Endpoint URL <span className="text-red-500">*</span>
            </label>
            <input required type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://mcp.internal/tools"
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Used for ASCV-01a/01b endpoint and TLS anomaly detection.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="What does this MCP server provide?"
              className="w-full resize-none rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>
          {create.isError && (
            <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {(create.error as Error)?.message ?? 'Failed to register server.'}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">Cancel</button>
            <button type="submit" disabled={create.isPending} className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">
              {create.isPending ? 'Registering…' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditModal({ server, onClose }: { server: McpServer; onClose: () => void }) {
  const update = useUpdateMcpServer(server.mcpServerId)
  const [name, setName] = useState(server.name)
  const [url,  setUrl]  = useState(server.url)
  const [desc, setDesc] = useState(server.description ?? '')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    update.mutate(
      { name: name.trim(), url: url.trim(), description: desc.trim() || null },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Edit MCP server</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Name</label>
            <input required value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Endpoint URL</label>
            <input required type="url" value={url} onChange={e => setUrl(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              className="w-full resize-none rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          {update.isError && (
            <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {(update.error as Error)?.message ?? 'Failed to update server.'}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">Cancel</button>
            <button type="submit" disabled={update.isPending} className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">
              {update.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function McpServerTable() {
  const { data: servers, isLoading, isError } = useMcpServers()
  const deleteServer = useDeleteMcpServer()
  const { data: me } = useMe()
  const [showCreate,  setShowCreate]  = useState(false)
  const [editTarget,  setEditTarget]  = useState<McpServer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<McpServer | null>(null)

  const isAdmin = me?.role === 'admin' || me?.role === 'editor'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Register MCP servers to enable endpoint anomaly detection and tool description baseline comparison.
        </p>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)}
            className="flex shrink-0 items-center gap-1.5 rounded bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" />
            Register server
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-500 dark:text-zinc-400">Loading…</p>}
      {isError   && <p className="text-sm text-red-600 dark:text-red-400">Failed to load MCP servers.</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Endpoint URL</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Tools</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {(servers ?? []).map(s => (
                <tr key={s.mcpServerId} className="border-b border-slate-100 last:border-0 dark:border-zinc-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Server className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                      <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-zinc-400">{s.url}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-zinc-400">{s.description ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400">
                      {s.toolCount} tool{s.toolCount !== 1 ? 's' : ''}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditTarget(s)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(s)}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {(servers ?? []).length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-sm text-slate-400 dark:text-zinc-500">
                    No MCP servers registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">Remove MCP server?</h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-zinc-400">
              <span className="font-medium text-slate-700 dark:text-zinc-200">{deleteTarget.name}</span> will be removed.
              Tools linked to it will remain but lose their MCP server association.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">Cancel</button>
              <button
                disabled={deleteServer.isPending}
                onClick={() => deleteServer.mutate(deleteTarget.mcpServerId, { onSuccess: () => setDeleteTarget(null) })}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleteServer.isPending ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate  && <CreateModal onClose={() => setShowCreate(false)} />}
      {editTarget  && <EditModal server={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  )
}
