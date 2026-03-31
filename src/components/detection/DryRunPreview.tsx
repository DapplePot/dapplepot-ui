import type { RulePreview } from '@dapplepot/types/rule'
import { Badge } from '../ui/badge'

interface DryRunPreviewProps {
  preview: RulePreview['preview']
}

export function DryRunPreview({ preview }: DryRunPreviewProps) {
  return (
    <div className="rounded-lg border border-violet-100 bg-violet-50 p-4">
      <p className="text-sm font-medium text-violet-800">
        Would have fired {preview.wouldHaveFired} time{preview.wouldHaveFired !== 1 ? 's' : ''} in the last 7 days
      </p>
      {preview.sessions.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {preview.sessions.slice(0, 3).map((s) => (
            <li key={s.sessionId} className="flex items-center gap-2 text-xs">
              <span className="font-mono text-slate-600">{s.sessionId.slice(0, 8)}</span>
              <span className="text-slate-500">value: {s.value}</span>
              {s.wouldFire && (
                <Badge variant="destructive" className="ml-auto">↑ would fire</Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
