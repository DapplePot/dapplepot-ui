import { useEffect } from 'react'
import { X } from 'lucide-react'
import { OnboardingWizard } from './OnboardingWizard'

interface OnboardClientModalProps {
  onClose: () => void
}

export function OnboardClientModal({ onClose }: OnboardClientModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Onboard New Client</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Create a new tenant and their first admin account.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <OnboardingWizard onClose={onClose} />
      </div>
    </div>
  )
}
