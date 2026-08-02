import { getUnsyncedPhotos, markPhotoSynced } from './database'
import { uploadPhoto } from './api'
import type { AuthSession } from '../types'

export interface SyncResult {
  uploaded: number
  failed: number
}

export async function syncPhotos(session: AuthSession, missionId?: string): Promise<SyncResult> {
  const photos = await getUnsyncedPhotos(missionId)
  let uploaded = 0
  let failed = 0

  for (const photo of photos) {
    try {
      await uploadPhoto(photo, session)
      await markPhotoSynced(photo.id)
      uploaded += 1
    } catch {
      failed += 1
    }
  }
  return { uploaded, failed }
}
