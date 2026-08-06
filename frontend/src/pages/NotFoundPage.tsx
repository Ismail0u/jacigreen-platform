import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Erreur 404</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Cette page n'existe pas</h1>
        <p className="mt-2 text-sm text-slate-500">Vérifiez l'adresse ou revenez au tableau de bord.</p>
        <Link to="/missions" className="btn-primary mt-5 inline-flex">
          Retour aux missions
        </Link>
      </div>
    </div>
  )
}
