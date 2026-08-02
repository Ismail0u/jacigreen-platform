import axios from 'axios'
import { getApiErrorMessage } from './apiError'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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

export class AuthService {
  private tokenKey = 'jacigreen_token'
  private userKey = 'jacigreen_user'

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey)
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token)
  }

  getUser(): User | null {
    const userJson = localStorage.getItem(this.userKey)
    return userJson ? JSON.parse(userJson) : null
  }

  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user))
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  async login(email: string, password: string): Promise<AuthToken> {
    let response
    try {
      response = await axios.post<AuthToken>(`${apiUrl}/api/v1/auth/login`, { email, password })
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Connexion impossible. Vérifiez le serveur et vos identifiants.'), { cause: error })
    }

    this.setToken(response.data.access_token)
    if (response.data.requires_password_change) {
      return response.data
    }

    try {
      await this.fetchCurrentUser()
    } catch (error) {
      this.logout()
      throw new Error(getApiErrorMessage(error, 'Votre session n’a pas pu être initialisée.'), { cause: error })
    }
    return response.data
  }

  async changePassword(payload: { old_password: string; new_password: string; confirm_password: string }): Promise<{ message: string }> {
    const response = await axios.post<{ message: string }>(`${apiUrl}/api/v1/auth/change-password`, payload, {
      headers: this.getAuthHeader(),
    })

    try {
      await this.fetchCurrentUser()
    } catch (error) {
      this.logout()
      throw new Error(getApiErrorMessage(error, 'La réinitialisation du mot de passe a bien été reçue mais votre session est inaccessible.'), { cause: error })
    }

    return response.data
  }

  async fetchCurrentUser(): Promise<User> {
    const token = this.getToken()
    if (!token) throw new Error('No token available')

    const response = await axios.get(`${apiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    this.setUser(response.data)
    return response.data
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.userKey)
  }

  getAuthHeader(): Record<string, string> {
    const token = this.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
}

export const authService = new AuthService()
