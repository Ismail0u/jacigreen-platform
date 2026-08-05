import { useMemo, useState } from 'react'

interface RoleDashboardProps {
  role: 'admin' | 'collaborator'
}

export function RoleDashboard({ role }: RoleDashboardProps) {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'collaborator'>(role)

  const summary = useMemo(() => {
    if (selectedRole === 'admin') {
      return [
        'Créer et superviser les missions',
        'Lancer l\u2019analyse IA et suivre les résultats',
        'Gérer les collaborateurs et leurs droits',
      ]
    }

    return [
      'Consulter les missions autorisées',
      'Visualiser le rapport de mission',
      'Explorer la carte Leaflet avec les photos et détections',
    ]
  }, [selectedRole])

  return (
    <section className="grid gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSelectedRole('admin')}
          className={selectedRole === 'admin' ? 'btn-primary' : 'btn-secondary'}
        >
          Vue administrateur
        </button>
        <button
          type="button"
          onClick={() => setSelectedRole('collaborator')}
          className={selectedRole === 'collaborator' ? 'btn-primary' : 'btn-secondary'}
        >
          Vue collaborateur
        </button>
      </div>
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-900">
          {selectedRole === 'admin' ? 'Administration' : 'Collaboration'}
        </h3>
        <ul className="mt-2 grid gap-1.5 text-sm text-slate-600">
          {summary.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
