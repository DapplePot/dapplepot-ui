import { AgentTable } from '../components/agents/AgentTable'

export function Agents() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Agents</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage the agents registered under your tenant.
        </p>
      </div>
      <AgentTable />
    </div>
  )
}
