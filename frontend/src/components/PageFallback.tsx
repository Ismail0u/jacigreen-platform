/** Squelette de chargement affiche pendant le telechargement d'un chunk lazy. */
export function PageFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" role="status" aria-live="polite">
      <span className="sr-only">Chargement de la page…</span>
      <div className="h-40 animate-pulse rounded-xl bg-slate-200/70" />
      <div className="mt-4 h-72 animate-pulse rounded-xl bg-slate-200/70" />
    </div>
  )
}
