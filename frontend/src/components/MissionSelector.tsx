import { useEffect, useState } from 'react'
import axios from 'axios'
import { authService } from '../services/authService'
import { getApiErrorMessage } from '../services/apiError'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface MissionOption {
  id: string
  name: string
}

interface Props {
  value: string
  onChange: (id: string) => void
  refreshKey?: number
}

export function MissionSelector({ value, onChange, refreshKey = 0 }: Props) {
  const [missions, setMissions] = useState<MissionOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadMissions() {
      setLoading(true)
      setError(null)
      try {
        const response = await axios.get<MissionOption[]>(`${apiUrl}/api/v1/missions/`, {
          headers: authService.getAuthHeader(),
        })
        setMissions(response.data.map((mission) => ({ id: mission.id, name: mission.name })))
      } catch (error) {
        setError(getApiErrorMessage(error, 'Impossible de charger les missions. Réessayez dans quelques instants.'))
      } finally {
        setLoading(false)
      }
    }

    void loadMissions()
  }, [refreshKey])

  return (
    <label className="field-label min-w-[220px]">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Choisir une mission</span>
      <select className="field-input" value={value} onChange={(event) => onChange(event.target.value)} disabled={loading}>
        <option value="">Sélectionner une mission</option>
        {missions.map((mission) => (
          <option key={mission.id} value={mission.id}>
            {mission.name}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  )
}
