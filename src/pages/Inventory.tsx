import { useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import { AgentTable } from '../components/agents/AgentTable'
import { LlmTable } from '../components/inventory/LlmTable'
import { ToolTable } from '../components/inventory/ToolTable'

type Tab = 'agents' | 'llms' | 'tools'

const TABS: { id: Tab; label: string }[] = [
  { id: 'agents', label: 'Agents' },
  { id: 'llms',   label: 'LLMs'   },
  { id: 'tools',  label: 'Tools'  },
]

export function Inventory() {
  const search = useSearch({ from: '/inventory' })
  const [tab, setTab] = useState<Tab>(search.tab ?? 'agents')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Inventory</h1>
      </div>

      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit dark:border-zinc-700 dark:bg-zinc-800">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'agents' && <AgentTable />}
      {tab === 'llms'   && <LlmTable />}
      {tab === 'tools'  && <ToolTable />}
    </div>
  )
}
