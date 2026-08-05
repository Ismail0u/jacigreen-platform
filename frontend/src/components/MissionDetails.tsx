interface MissionDetailsProps {
  mission: {
    id: string
    name: string
    description?: string
    status: string
    mission_date?: string
    zone_id?: string
    operator_id?: string
    notes?: string
    created_at: string
    completed_at?: string
  } | null
}

export function MissionDetails({ mission }: MissionDetailsProps) {
  if (!mission) {
    return null
  }

  const rows: Array<[string, string]> = [
    ['Nom', mission.name],
    ['Statut', mission.status],
    ['Date', mission.mission_date ? new Date(mission.mission_date).toLocaleString() : 'Non définie'],
    ['Créée', new Date(mission.created_at).toLocaleString()],
  ]
  if (mission.completed_at) rows.push(['Terminée', new Date(mission.completed_at).toLocaleString()])
  if (mission.description) rows.push(['Description', mission.description])
  if (mission.notes) rows.push(['Notes', mission.notes])
  if (mission.zone_id) rows.push(['Zone', mission.zone_id])
  if (mission.operator_id) rows.push(['Opérateur', mission.operator_id])

  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-900">Détails de la mission</h2>
      <dl className="mt-3 grid gap-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[100px_1fr] gap-2 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
            <dt className="text-xs font-semibold text-slate-500">{label}</dt>
            <dd className="break-words text-sm text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
