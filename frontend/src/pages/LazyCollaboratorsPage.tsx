import { lazy, Suspense } from 'react'
import { PageFallback } from '../components/PageFallback'

const CollaboratorsPage = lazy(() => import('./CollaboratorsPage').then((module) => ({ default: module.CollaboratorsPage })))

export function LazyCollaboratorsPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <CollaboratorsPage />
    </Suspense>
  )
}
