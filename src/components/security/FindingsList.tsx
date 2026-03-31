import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import type { SecurityFinding } from '../../types/security'

interface FindingsListProps {
  findings: SecurityFinding[]
}

const SEVERITY_ICON: Record<string, string> = {
  critical: '🔴',
  warning:  '🟡',
  info:     '🔵',
}

export function FindingsList({ findings }: FindingsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (findings.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No findings</p>
  }

  return (
    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
      {findings.map((f) => (
        <div key={f.findingId}>
          <div
            className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50"
            onClick={() => setExpandedId(expandedId === f.findingId ? null : f.findingId)}
          >
            <span>{SEVERITY_ICON[f.severity] ?? '⚪'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">{f.signalId}</p>
              <p className="text-xs text-slate-400">
                {f.sigType} · {f.owaspId}
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-700">+{f.scoreContrib}pts</span>
            {expandedId === f.findingId ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </div>

          {expandedId === f.findingId && (
            <div className="border-t border-slate-50 px-4 py-3 bg-slate-50 space-y-3">
              {f.detail && (
                <p className="text-xs text-slate-600">{f.detail}</p>
              )}
              {f.matchedText && (
                <>
                  <p className="text-xs font-medium text-slate-500">Matched text</p>
                  <pre className="rounded bg-slate-900 p-3 font-mono text-xs text-slate-100 whitespace-pre-wrap break-all">
                    {f.matchedText}
                  </pre>
                </>
              )}
              <p className="text-xs text-slate-400">
                {f.detectionPhase} · {f.eventType} · {new Date(f.createdAt).toLocaleString()}
              </p>
              <div>
                <Link to="/sessions/$id" params={{ id: f.sessionId }}>
                  <Button size="sm" variant="outline">
                    View in trace ↗
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
