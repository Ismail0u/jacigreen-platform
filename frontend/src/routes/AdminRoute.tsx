import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * Garde de role, a placer sous <ProtectedRoute /> (l'authentification est
 * deja garantie a ce niveau). Un collaborateur qui force l'URL /collaborators
 * est renvoye vers /missions plutot que de voir un ecran casse : le
 * routeur est la premiere ligne de defense UX, mais l'autorisation reelle
 * reste imposee par le backend sur chaque endpoint.
 */
export function AdminRoute() {
  const role = useAuthStore((state) => state.user?.role)

  if (role !== 'admin') {
    return <Navigate to="/missions" replace />
  }

  return <Outlet />
}
