import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface AuthToken {
  access_token: string
  token_type: string
  expires_in: number
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
    const response = await axios.post(`${apiUrl}/api/v1/auth/login`, { email, password })
    this.setToken(response.data.access_token)
    await this.fetchCurrentUser()
    return response.data
  }

  async register(email: string, password: string, role: string = 'collaborator'): Promise<User> {
    const response = await axios.post(`${apiUrl}/api/v1/auth/register`, { email, password, role })
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

  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
}

export const authService = new AuthService()
