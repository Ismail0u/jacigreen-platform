import axios from 'axios'
import { env } from './env'

export const apiUrl = env.API_URL

/**
 * Instance axios partagee par toute l'application.
 * - injecte automatiquement le Bearer token courant (lu depuis le store d'auth)
 * - centralise la reaction au 401 : deconnexion + redirection, au lieu de
 *   dupliquer `headers: authService.getAuthHeader()` sur chaque appel.
 *
 * Le store est importe de maniere paresseuse (via getAuthState, injecte au
 * demarrage) pour eviter une dependance circulaire authStore <-> apiClient.
 */
type AuthStateAccessor = () => { token: string | null; logout: () => void }

let getAuthState: AuthStateAccessor = () => ({ token: null, logout: () => {} })

export function registerAuthStateAccessor(accessor: AuthStateAccessor) {
  getAuthState = accessor
}

export const apiClient = axios.create({ baseURL: apiUrl })

apiClient.interceptors.request.use((config) => {
  const { token } = getAuthState()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Le token est expire ou invalide : on nettoie la session.
      // Le composant <ProtectedRoute> se charge de rediriger vers /login
      // au prochain rendu, puisque `user` redevient null.
      getAuthState().logout()
    }
    return Promise.reject(error)
  },
)
