import { lazy, Suspense } from 'react'
import { PageFallback } from './PageFallback'

/**
 * MissionMap embarque Leaflet + toute la logique de mission (~15 kB gzip a
 * elle seule). On la sort du bundle principal : elle ne doit se charger que
 * lorsqu'un utilisateur authentifie visite /missions, pas au premier
 * chargement de /login.
 */
const MissionMap = lazy(() => import('./MissionMap').then((module) => ({ default: module.MissionMap })))

export function LazyMissionMap({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Suspense fallback={<PageFallback />}>
      <MissionMap isAdmin={isAdmin} />
    </Suspense>
  )
}
