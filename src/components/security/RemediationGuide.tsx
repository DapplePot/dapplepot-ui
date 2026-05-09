import type { RemediationCard } from '../../types/security'

interface RemediationGuideProps {
  cards: RemediationCard[]
}

export function RemediationGuide({ cards }: RemediationGuideProps) {
  if (cards.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">
        No remediation guidance available
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {cards.map((card, i) => (
        <div
          key={card.owaspSignalId}
          className={`rounded-lg border bg-white p-5 dark:bg-slate-900 ${
            i === 0 ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{card.title}</p>
              <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                {card.owaspSignalId}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {card.frequency}× detected
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{card.description}</p>

          <div className="mt-3 rounded-md bg-emerald-50 border border-emerald-100 p-3 dark:bg-emerald-900/10 dark:border-emerald-900/40">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-2">Fix steps</p>
            <ol className="list-decimal list-inside space-y-1">
              {card.fixSteps.map((step, idx) => (
                <li key={idx} className="text-xs text-emerald-800 dark:text-emerald-300">{step}</li>
              ))}
            </ol>
          </div>

          {card.sdkSnippet && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">SDK config</p>
              <pre className="rounded-md bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100 overflow-x-auto dark:bg-slate-950">
                {card.sdkSnippet}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
