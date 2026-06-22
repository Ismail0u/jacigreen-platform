import { useEffect, useState } from 'react'
import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
 /**
  * MissionSelector is a React component that provides a dropdown menu for selecting a mission from a list of available missions. It fetches the list of missions from the backend API and displays them in the dropdown. When a mission is selected, it calls the onChange callback with the selected mission's ID.
  * The component handles loading and error states, displaying appropriate messages when necessary. It uses the useEffect hook to fetch the missions when the component mounts and the useState hook to manage the state of missions, loading, and error messages.
  * This component is essential for allowing users to select a mission and view its details or associated data in other parts of the application, such as the MissionDetails or MissionMap components.
  * the MissionSelector component is designed to be reusable and can be easily integrated into different parts of the application where mission selection is required. It provides a user-friendly interface for selecting missions and ensures that the application remains responsive and informative during data fetching operations.  
  * options for improvement include adding search functionality to the dropdown for easier navigation through a large number of missions, implementing pagination if the number of missions is very large, and enhancing error handling to provide more specific feedback to users in case of API errors or network issues. Additionally, the component could be extended to allow for multi-select functionality if there is a need to select multiple missions at once in certain contexts.
  */
interface MissionOption {
  id: string
  name: string
}

interface Props {
  value: string
  onChange: (id: string) => void
}

export function MissionSelector({ value, onChange }: Props) {
  const [missions, setMissions] = useState<MissionOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadMissions() {
      setLoading(true)
      setError(null)
      try {
        const response = await axios.get<MissionOption[]>(`${apiUrl}/api/v1/missions`)
        setMissions(response.data.map((mission) => ({ id: mission.id, name: mission.name })))
      } catch (err) {
        setError('Impossible de charger les missions')
      } finally {
        setLoading(false)
      }
    }

    void loadMissions()
  }, [])

  return (
    <label className="mission-selector">
      <span>Choisir une mission</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={loading}>
        <option value="">Sélectionner une mission</option>
        {missions.map((mission) => (
          <option key={mission.id} value={mission.id}>
            {mission.name}
          </option>
        ))}
      </select>
      {error ? <span className="mission-selector-error">{error}</span> : null}
    </label>
  )
}
