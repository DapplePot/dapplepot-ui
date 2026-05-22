import { useState, type FormEvent } from 'react'
import { Plus, X, Braces, Server, Pencil, Trash2 } from 'lucide-react'
import { useTools, useCreateTool, useUpdateTool, useDeleteTool, useUpdateToolSchema } from '../../hooks/useTools'
import { useMcpServers } from '../../hooks/useMcpServers'
import { useMe } from '../../hooks/useUsers'
import type { Tool } from '../../api/tools'

const CATEGORIES = ['Database', 'HTTP / API', 'Filesystem', 'Admin / System', 'Messaging', 'Search', 'Code Execution', 'Custom']

function CreateToolModal({ onClose }: { onClose: () => void }) {
  const create = useCreateTool()
  const [name,       setName]       = useState('')
  const [desc,       setDesc]       = useState('')
  const [version,    setVersion]    = useState('')
  const [category,   setCategory]   = useState('')
  const [schemaText, setSchemaText] = useState('')
  const [schemaErr,  setSchemaErr]  = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    let schema: Record<string, unknown> | null = null
    if (schemaText.trim()) {
      try {
        const parsed = JSON.parse(schemaText)
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          setSchemaErr('Schema must be a JSON object where each key is a parameter name.')
          return
        }
        schema = parsed
        setSchemaErr(null)
      } catch {
        setSchemaErr('Invalid JSON — check syntax.')
        return
      }
    }

    create.mutate(
      { name: name.trim(), description: desc.trim() || null, category: category || null, schema, version: version.trim() || null },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Add tool</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Tool name <span className="text-red-500">*</span>
            </label>
            <input required value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. read_file"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Use the exact name sent in tool_start events.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="What does this tool do?"
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Version</label>
            <input value={version} onChange={e => setVersion(e.target.value)}
              placeholder="e.g. 1.0, v2.1"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Used by ASCV-01c — a schema change with a matching version bump is treated as a declared update.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Parameter schema
              <span className="ml-1 font-normal text-slate-400 dark:text-zinc-500">(optional)</span>
            </label>
            <textarea
              value={schemaText}
              onChange={e => { setSchemaText(e.target.value); setSchemaErr(null) }}
              rows={5}
              spellCheck={false}
              placeholder={'{\n  "path": {},\n  "encoding": {}\n}'}
              className="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              JSON object — one key per declared parameter. TME-01a fires when tool_start carries undeclared keys.
            </p>
            {schemaErr && (
              <p className="mt-1 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">{schemaErr}</p>
            )}
          </div>

          {create.isError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {(create.error as Error)?.message ?? 'Failed to add tool.'}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">Cancel</button>
            <button type="submit" disabled={create.isPending} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">
              {create.isPending ? 'Adding…' : 'Add tool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditToolModal({ tool, onClose }: { tool: Tool; onClose: () => void }) {
  const updateTool = useUpdateTool(tool.toolId)
  const { data: mcpServers = [] } = useMcpServers()

  const toText = (s: Record<string, unknown> | null) => s ? JSON.stringify(s, null, 2) : ''

  const [desc,       setDesc]       = useState(tool.description ?? '')
  const [version,    setVersion]    = useState(tool.version ?? '')
  const [schemaText, setSchemaText] = useState(() => toText(tool.schema))
  const [parseError, setParseError] = useState<string | null>(null)
  const [mcpId,      setMcpId]      = useState<string>(tool.mcpServerId ?? '')

  function handleSave() {
    let schema: Record<string, unknown> | null | undefined = undefined
    if (schemaText.trim() === '') {
      schema = null
    } else {
      try {
        const parsed = JSON.parse(schemaText)
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          setParseError('Schema must be a JSON object where each key is a parameter name.')
          return
        }
        schema = parsed
        setParseError(null)
      } catch {
        setParseError('Invalid JSON — check syntax.')
        return
      }
    }

    updateTool.mutate(
      {
        description: desc.trim() || null,
        schema,
        version:     version.trim() || null,
        mcpServerId: mcpId || null,
      },
      { onSuccess: onClose }
    )
  }

  const paramCount = tool.schema ? Object.keys(tool.schema).length : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            Edit — <span className="font-mono text-violet-600 dark:text-violet-400">{tool.name}</span>
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="What does this tool do?"
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Registered as the trusted baseline for ASCV-02a descriptor comparison.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">Version</label>
            <input value={version} onChange={e => setVersion(e.target.value)}
              placeholder="e.g. 1.0, v2.1"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Bump this when you intentionally update the tool schema — prevents ASCV-01c from firing on declared changes.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-zinc-300">MCP server</label>
            <select value={mcpId} onChange={e => setMcpId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">None (locally defined)</option>
              {mcpServers.map(s => (
                <option key={s.mcpServerId} value={s.mcpServerId}>{s.name} — {s.url}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Linking to an MCP server activates ASCV-02a for this tool.
            </p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Parameter schema <span className="font-normal text-slate-400 dark:text-zinc-500">(JSON object)</span>
              </label>
              {paramCount > 0 && (
                <span className="text-xs text-slate-400 dark:text-zinc-500">{paramCount} param{paramCount !== 1 ? 's' : ''} declared</span>
              )}
            </div>
            <textarea
              value={schemaText}
              onChange={e => { setSchemaText(e.target.value); setParseError(null) }}
              rows={6}
              spellCheck={false}
              placeholder={'{\n  "path": {},\n  "encoding": {}\n}'}
              className="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">TME-01a fires when tool_start carries undeclared keys.</p>
            {parseError && (
              <p className="mt-1 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">{parseError}</p>
            )}
          </div>
        </div>

        {updateTool.isError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {(updateTool.error as Error)?.message ?? 'Failed to save.'}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">Cancel</button>
          <button onClick={handleSave} disabled={updateTool.isPending} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">
            {updateTool.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ToolTable() {
  const { data: tools, isLoading, isError } = useTools()
  const deleteTool = useDeleteTool()
  const { data: me } = useMe()
  const [showCreate,   setShowCreate]   = useState(false)
  const [editTarget,   setEditTarget]   = useState<Tool | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tool | null>(null)
  const [search,       setSearch]       = useState('')

  const filtered = (tools ?? []).filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.category ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const isAdmin = me?.role === 'admin'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input type="search" placeholder="Search tools…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-violet-400"
        />
        {isAdmin && (
          <button onClick={() => setShowCreate(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" />
            Add tool
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-500 dark:text-zinc-400">Loading…</p>}
      {isError   && <p className="text-sm text-red-600 dark:text-red-400">Failed to load tools.</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="px-4 py-3">Tool name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">MCP server</th>
                <th className="px-4 py-3">Schema</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const paramCount = t.schema ? Object.keys(t.schema).length : 0
                return (
                  <tr key={t.toolId} className="border-b border-slate-100 last:border-0 dark:border-zinc-800">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-slate-900 dark:text-zinc-100">{t.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-zinc-400">{t.category ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-zinc-400">{t.description ?? '—'}</td>
                    <td className="px-4 py-3">
                      {t.mcpServerName ? (
                        <span className="flex items-center gap-1.5 text-xs text-violet-700 dark:text-violet-400">
                          <Server className="h-3 w-3 shrink-0" />
                          {t.mcpServerName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500">
                        <Braces className="h-3 w-3" />
                        {paramCount > 0 ? `${paramCount} param${paramCount !== 1 ? 's' : ''}` : '—'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditTarget(t)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(t)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-sm text-slate-400 dark:text-zinc-500">
                    {tools?.length === 0
                      ? 'No tools added yet. Add tools to enable TME-01a schema validation.'
                      : 'No tools match your search.'
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
            <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">Remove tool?</h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-zinc-400">
              <span className="font-mono font-medium text-slate-700 dark:text-zinc-200">{deleteTarget.name}</span> will be removed from the inventory and any agent manifests that reference it.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">Cancel</button>
              <button
                disabled={deleteTool.isPending}
                onClick={() => deleteTool.mutate(deleteTarget.toolId, { onSuccess: () => setDeleteTarget(null) })}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleteTool.isPending ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && <CreateToolModal onClose={() => setShowCreate(false)} />}
      {editTarget && <EditToolModal tool={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  )
}
