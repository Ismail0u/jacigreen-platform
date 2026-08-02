import { useEffect, type CSSProperties } from 'react'

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

const variantStyles: Record<AlertVariant, { accent: string; background: string; border: string }> = {
  error: { accent: '#dc2626', background: '#fef2f2', border: '#fecaca' },
  warning: { accent: '#d97706', background: '#fffbeb', border: '#fcd34d' },
  success: { accent: '#15803d', background: '#f0fdf4', border: '#bbf7d0' },
  info: { accent: '#2563eb', background: '#eff6ff', border: '#bfdbfe' },
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
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="alert-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        aria-describedby="alert-message"
        onClick={(event) => event.stopPropagation()}
        style={{
          '--alert-accent': palette.accent,
          '--alert-bg': palette.background,
          '--alert-border': palette.border,
        } as CSSProperties}
      >
        <div className="alert-modal__header">
          <span className="alert-modal__dot" aria-hidden="true" />
          <h3 id="alert-title">{title}</h3>
          <button type="button" className="alert-modal__close" onClick={onClose} aria-label="Fermer l'alerte">
            ×
          </button>
        </div>

        <p id="alert-message">{message}</p>

        {(actionLabel && onAction) || onClose ? (
          <div className="alert-modal__actions">
            {actionLabel && onAction ? (
              <button type="button" className="primary-button" onClick={onAction}>
                {actionLabel}
              </button>
            ) : null}
            <button type="button" className="secondary-button" onClick={onClose}>
              Fermer
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
