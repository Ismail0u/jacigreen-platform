import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * Garde d'authentification. Toute route qui doit exiger une session valide
 * se declare comme enfant de <ProtectedRoute /> dans App.tsx.
 *
 * On memorise `location` dans le state de navigation pour pouvoir renvoyer
 * l'utilisateur exactement ou il voulait aller apres un login reussi
 * (pattern "redirect back").
 */
export function ProtectedRoute() {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
