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

  return (
    <section className="mission-details">
      <h2>Détails de la mission</h2>
      <dl>
        <div>
          <dt>Nom</dt>
          <dd>{mission.name}</dd>
        </div>
        <div>
          <dt>Statut</dt>
          <dd>{mission.status}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{mission.mission_date ? new Date(mission.mission_date).toLocaleString() : 'Non définie'}</dd>
        </div>
        <div>
          <dt>Créée</dt>
          <dd>{new Date(mission.created_at).toLocaleString()}</dd>
        </div>
        {mission.completed_at ? (
          <div>
            <dt>Terminée</dt>
            <dd>{new Date(mission.completed_at).toLocaleString()}</dd>
          </div>
        ) : null}
        {mission.description ? (
          <div>
            <dt>Description</dt>
            <dd>{mission.description}</dd>
          </div>
        ) : null}
        {mission.notes ? (
          <div>
            <dt>Notes</dt>
            <dd>{mission.notes}</dd>
          </div>
        ) : null}
        {mission.zone_id ? (
          <div>
            <dt>Zone</dt>
            <dd>{mission.zone_id}</dd>
          </div>
        ) : null}
        {mission.operator_id ? (
          <div>
            <dt>Opérateur</dt>
            <dd>{mission.operator_id}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}
