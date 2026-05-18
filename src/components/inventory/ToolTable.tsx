import { useState, type FormEvent } from 'react'
import { Plus, X, Braces } from 'lucide-react'
import { useTools, useCreateTool, useUpdateToolSchema } from '../../hooks/useTools'
import { useMe } from '../../hooks/useUsers'
import type { Tool } from '../../api/tools'

const CATEGORIES = ['Database', 'HTTP / API', 'Filesystem', 'Admin / System', 'Messaging', 'Search', 'Code Execution', 'Custom']

function CreateToolModal({ onClose }: { onClose: () => void }) {
  const create = useCreateTool()
  const [name,       setName]       = useState('')
  const [desc,       setDesc]       = useState('')
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
      { name: name.trim(), description: desc.trim() || null, category: category || null, schema },
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

function SchemaModal({ tool, onClose }: { tool: Tool; onClose: () => void }) {
  const updateSchema = useUpdateToolSchema(tool.toolId)

  const toText = (s: Record<string, unknown> | null) =>
    s ? JSON.stringify(s, null, 2) : ''

  const [text, setText] = useState(() => toText(tool.schema))
  const [parseError, setParseError] = useState<string | null>(null)

  function handleSave() {
    if (text.trim() === '') {
      updateSchema.mutate(null, { onSuccess: onClose })
      return
    }
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        setParseError('Schema must be a JSON object where each key is a parameter name.')
        return
      }
      setParseError(null)
      updateSchema.mutate(parsed, { onSuccess: onClose })
    } catch {
      setParseError('Invalid JSON — check syntax.')
    }
  }

  const paramCount = tool.schema ? Object.keys(tool.schema).length : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            Parameter schema — <span className="font-mono text-violet-600 dark:text-violet-400">{tool.name}</span>
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 text-xs text-slate-500 dark:text-zinc-400">
          Declare the parameters this tool accepts. TME-01a fires (deterministic, score 80) when
          a tool_start event carries any key not listed here. Leave empty to use pattern-matching fallback.
        </p>

        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
            Schema <span className="text-slate-400 dark:text-zinc-500">(JSON object — one key per parameter)</span>
          </span>
          {paramCount > 0 && (
            <span className="text-xs text-slate-400 dark:text-zinc-500">{paramCount} param{paramCount !== 1 ? 's' : ''} declared</span>
          )}
        </div>

        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setParseError(null) }}
          rows={10}
          spellCheck={false}
          placeholder={'{\n  "path": {},\n  "encoding": {}\n}'}
          className="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />

        {parseError && (
          <p className="mt-1 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">{parseError}</p>
        )}
        {updateSchema.isError && (
          <p className="mt-1 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {(updateSchema.error as Error)?.message ?? 'Failed to save schema.'}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">Cancel</button>
          <button onClick={handleSave} disabled={updateSchema.isPending} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">
            {updateSchema.isPending ? 'Saving…' : 'Save schema'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ToolTable() {
  const { data: tools, isLoading, isError } = useTools()
  const { data: me } = useMe()
  const [showCreate, setShowCreate] = useState(false)
  const [schemaTarget, setSchemaTarget] = useState<Tool | null>(null)
  const [search, setSearch] = useState('')

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
                <th className="px-4 py-3">Schema</th>
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
                      {isAdmin ? (
                        <button
                          onClick={() => setSchemaTarget(t)}
                          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                            paramCount > 0
                              ? 'border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400'
                              : 'border border-dashed border-slate-300 bg-white text-slate-400 hover:border-violet-400 hover:text-violet-600 dark:border-zinc-600 dark:bg-transparent dark:text-zinc-500 dark:hover:border-violet-600'
                          }`}
                        >
                          <Braces className="h-3 w-3" />
                          {paramCount > 0 ? `${paramCount} param${paramCount !== 1 ? 's' : ''}` : 'Define schema'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-zinc-500">
                          {paramCount > 0 ? `${paramCount} param${paramCount !== 1 ? 's' : ''}` : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400 dark:text-zinc-500">
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

      {showCreate   && <CreateToolModal onClose={() => setShowCreate(false)} />}
      {schemaTarget && <SchemaModal tool={schemaTarget} onClose={() => setSchemaTarget(null)} />}
    </div>
  )
}
