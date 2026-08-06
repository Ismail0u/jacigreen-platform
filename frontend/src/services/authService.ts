import axios from 'axios'
import { apiUrl } from '../lib/apiClient'
import { getApiErrorMessage } from './apiError'

export interface AuthToken {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  requires_password_change?: boolean
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'collaborator'
  is_active: boolean
  created_at: string
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
  confirm_password: string
}

/**
 * Couche API pure : ne touche jamais au localStorage ni a un quelconque state
 * global. La persistance et le state reactif sont geres par `useAuthStore`
 * (src/store/authStore.ts). Ce decouplage permet de tester authApi avec de
 * simples mocks axios, sans mocker un store.
 */
export const authApi = {
  async login(email: string, password: string): Promise<AuthToken> {
    try {
      const { data } = await axios.post<AuthToken>(`${apiUrl}/api/v1/auth/login`, { email, password })
      return data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Connexion impossible. Vérifiez le serveur et vos identifiants.'), { cause: error })
    }
  },

  async changePassword(token: string, payload: ChangePasswordPayload): Promise<{ message: string }> {
    try {
      const { data } = await axios.post<{ message: string }>(`${apiUrl}/api/v1/auth/change-password`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Le changement de mot de passe a échoué.'), { cause: error })
    }
  },

  async fetchCurrentUser(token: string): Promise<User> {
    const { data } = await axios.get<User>(`${apiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  },
}
