import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '../services/authService'
import { useAuthStore } from './authStore'

vi.mock('../services/authService', () => ({
  authApi: {
    login: vi.fn(),
    fetchCurrentUser: vi.fn(),
    changePassword: vi.fn(),
  },
}))

const mockedAuthApi = vi.mocked(authApi)

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, hasHydrated: true })
  vi.clearAllMocks()
})

describe('useAuthStore', () => {
  it('stocke le token et le profil apres une connexion reussie', async () => {
    mockedAuthApi.login.mockResolvedValue({
      access_token: 'abc123',
      refresh_token: 'refresh',
      token_type: 'bearer',
      expires_in: 3600,
    })
    mockedAuthApi.fetchCurrentUser.mockResolvedValue({
      id: '1',
      email: 'admin@jacigreen.fr',
      role: 'admin',
      is_active: true,
      created_at: '2026-01-01',
    })

    const result = await useAuthStore.getState().login('admin@jacigreen.fr', 'secret')

    expect(result).toEqual({ requiresPasswordChange: false })
    expect(useAuthStore.getState().token).toBe('abc123')
    expect(useAuthStore.getState().user?.email).toBe('admin@jacigreen.fr')
  })

  it('ne recupere pas le profil si un changement de mot de passe est requis', async () => {
    mockedAuthApi.login.mockResolvedValue({
      access_token: 'temp-token',
      refresh_token: 'refresh',
      token_type: 'bearer',
      expires_in: 3600,
      requires_password_change: true,
    })

    const result = await useAuthStore.getState().login('collab@jacigreen.fr', 'temp')

    expect(result).toEqual({ requiresPasswordChange: true })
    expect(useAuthStore.getState().user).toBeNull()
    expect(mockedAuthApi.fetchCurrentUser).not.toHaveBeenCalled()
  })

  it('efface la session lors du logout', () => {
    useAuthStore.setState({
      token: 'abc',
      user: { id: '1', email: 'a@a.com', role: 'admin', is_active: true, created_at: '2026-01-01' },
    })
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('propage l\u2019erreur API en cas d\u2019echec de connexion', async () => {
    mockedAuthApi.login.mockRejectedValue(new Error('Connexion impossible'))
    await expect(useAuthStore.getState().login('x@x.com', 'bad')).rejects.toThrow('Connexion impossible')
    expect(useAuthStore.getState().token).toBeNull()
  })
})
