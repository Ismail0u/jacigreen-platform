import { API_URL } from '../config'
import type { AuthSession, Mission, StoredPhoto } from '../types'

async function authenticatedFetch(path: string, session: AuthSession, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${session.accessToken}`, ...options.headers },
  })
}

export async function fetchMissions(session: AuthSession): Promise<Mission[]> {
  const response = await authenticatedFetch('/api/v1/missions/', session)
  if (!response.ok) throw new Error(`Impossible de récupérer les missions (${response.status}).`)
  return response.json()
}

export async function uploadPhoto(photo: StoredPhoto, session: AuthSession): Promise<void> {
  const body = new FormData()
  body.append('files', {
    uri: photo.uri,
    name: photo.filename,
    type: 'image/jpeg',
  } as unknown as Blob)
  body.append('latitude', String(photo.latitude))
  body.append('longitude', String(photo.longitude))
  if (photo.altitude_m !== null && photo.altitude_m !== undefined) body.append('altitude_m', String(photo.altitude_m))

  const response = await authenticatedFetch(`/api/v1/missions/${photo.mission_id}/photos`, session, {
    method: 'POST',
    body,
  })
  if (!response.ok) throw new Error(`Échec de l'envoi (${response.status}).`)
  const result = await response.json()
  if (result.errors?.length) throw new Error(result.errors[0].error || 'Échec de l’envoi.')
}
