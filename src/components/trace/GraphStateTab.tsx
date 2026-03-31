interface GraphStateTabProps {
  graphState: Record<string, unknown> | null
}

export function GraphStateTab({ graphState }: GraphStateTabProps) {
  if (!graphState) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-slate-400">
        No graph state available
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded-md bg-slate-900 p-4">
      <pre className="font-mono text-xs text-slate-100 whitespace-pre-wrap break-all">
        {JSON.stringify(graphState, null, 2)}
      </pre>
    </div>
  )
}
