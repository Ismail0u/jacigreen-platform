import AsyncStorage from '@react-native-async-storage/async-storage'

import { API_URL } from '../config'
import type { AuthSession } from '../types'

const SESSION_KEY = 'jacigreen.auth.session'

export async function getSession(): Promise<AuthSession | null> {
  const value = await AsyncStorage.getItem(SESSION_KEY)
  return value ? JSON.parse(value) as AuthSession : null
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new Error('Identifiants invalides ou serveur inaccessible.')
  const payload = await response.json()
  const session = { accessToken: payload.access_token, refreshToken: payload.refresh_token }
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY)
}
