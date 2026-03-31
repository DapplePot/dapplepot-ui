interface EventPayloadProps {
  payload: Record<string, unknown>
}

export function EventPayload({ payload }: EventPayloadProps) {
  return (
    <div className="rounded-md bg-slate-900 px-4 py-3 overflow-x-auto">
      <pre className="font-mono text-xs text-slate-100 whitespace-pre-wrap break-all">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  )
}
