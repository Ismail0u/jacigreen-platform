interface StatusToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  visible: boolean
  onClose: () => void
}

const palette: Record<'success' | 'error' | 'info', string> = {
  success: 'bg-brand-50 border-brand-200 text-brand-700',
  error: 'bg-red-50 border-red-200 text-red-700',
  info: 'bg-water-50 border-water-100 text-water-700',
}

export function StatusToast({ message, type = 'info', visible, onClose }: StatusToastProps) {
  if (!visible || !message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 right-5 z-[3000] max-w-sm rounded-xl border px-4 py-3 shadow-lg ${palette[type]}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{message}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le message"
          className="text-lg leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  )
}
