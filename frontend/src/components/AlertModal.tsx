import { useEffect } from 'react'

export type AlertVariant = 'error' | 'warning' | 'success' | 'info'

interface AlertModalProps {
  isOpen: boolean
  title: string
  message: string
  variant?: AlertVariant
  onClose: () => void
  actionLabel?: string
  onAction?: () => void
}

const variantStyles: Record<AlertVariant, { dot: string; ring: string }> = {
  error: { dot: 'bg-red-500', ring: 'ring-red-100' },
  warning: { dot: 'bg-amber-500', ring: 'ring-amber-100' },
  success: { dot: 'bg-brand-500', ring: 'ring-brand-100' },
  info: { dot: 'bg-water-500', ring: 'ring-water-100' },
}

export function AlertModal({
  isOpen,
  title,
  message,
  variant = 'info',
  onClose,
  actionLabel,
  onAction,
}: AlertModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const palette = variantStyles[variant]

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-[2000] grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        aria-describedby="alert-message"
        onClick={(event) => event.stopPropagation()}
        className={`w-full max-w-sm rounded-xl bg-white p-5 shadow-xl ring-4 ${palette.ring}`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${palette.dot}`} aria-hidden="true" />
          <h3 id="alert-title" className="flex-1 text-base font-semibold text-slate-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l'alerte"
            className="grid h-7 w-7 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ×
          </button>
        </div>

        <p id="alert-message" className="mt-2 text-sm leading-relaxed text-slate-600">
          {message}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          {actionLabel && onAction ? (
            <button type="button" className="btn-primary" onClick={onAction}>
              {actionLabel}
            </button>
          ) : null}
          <button type="button" className="btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
