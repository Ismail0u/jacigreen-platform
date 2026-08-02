interface StatusToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  visible: boolean
  onClose: () => void
}

export function StatusToast({ message, type = 'info', visible, onClose }: StatusToastProps) {
  if (!visible || !message) return null

  const palette = {
    success: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
    error: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
    info: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  }

  const style = palette[type]

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 3000,
        padding: '12px 16px',
        borderRadius: '12px',
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
        maxWidth: 420,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span>{message}</span>
        <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', color: style.color, cursor: 'pointer', fontSize: 18 }} aria-label="Fermer le message">
          ×
        </button>
      </div>
    </div>
  )
}
