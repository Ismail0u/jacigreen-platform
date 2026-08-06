import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../services/authService'
import type { ChangePasswordPayload, User } from '../services/authService'
import { registerAuthStateAccessor } from '../lib/apiClient'

interface AuthState {
  user: User | null
  token: string | null
  /** true tant que la premiere lecture du localStorage n'a pas ete faite (evite un flash "non connecte"). */
  hasHydrated: boolean
  login: (email: string, password: string) => Promise<{ requiresPasswordChange: boolean }>
  changePassword: (payload: ChangePasswordPayload) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      hasHydrated: false,

      async login(email, password) {
        const tokenResponse = await authApi.login(email, password)
        set({ token: tokenResponse.access_token })

        if (tokenResponse.requires_password_change) {
          return { requiresPasswordChange: true }
        }

        const user = await authApi.fetchCurrentUser(tokenResponse.access_token)
        set({ user })
        return { requiresPasswordChange: false }
      },

      async changePassword(payload) {
        const token = get().token
        if (!token) throw new Error('Session de renouvellement introuvable, reconnectez-vous.')

        await authApi.changePassword(token, payload)
        const user = await authApi.fetchCurrentUser(token)
        set({ user })
      },

      logout() {
        set({ user: null, token: null })
      },
    }),
    {
      name: 'jacigreen-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true
      },
    },
  ),
)

// Branche l'apiClient sur ce store, sans import circulaire direct.
registerAuthStateAccessor(() => ({
  token: useAuthStore.getState().token,
  logout: useAuthStore.getState().logout,
}))
