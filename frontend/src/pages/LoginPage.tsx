import { useState } from 'react'
import { authService } from '../services/authService'
import type { AuthToken } from '../services/authService'

interface LoginProps {
  onLoginSuccess: (token: AuthToken) => void
}

export function LoginPage({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [registerRole, setRegisterRole] = useState<'admin' | 'collaborator'>('collaborator')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isRegister) {
        await authService.register(email, password, registerRole)
        const token = await authService.login(email, password)
        onLoginSuccess(token)
      } else {
        const token = await authService.login(email, password)
        onLoginSuccess(token)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'authentification')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #eef4ff 100%)' }}>
      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '2rem',
          boxShadow: '0 16px 50px rgba(15, 23, 42, 0.08)',
          width: '100%',
          maxWidth: '400px',
          border: '1px solid rgba(148, 163, 184, 0.24)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: '#0f172a' }}>JACIGREEN</h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{isRegister ? 'Créer un compte' : 'Connexion'}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#0f172a' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '0.7rem 0.85rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#0f172a' }}>
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '0.7rem 0.85rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {isRegister && (
            <div>
              <label htmlFor="role" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#0f172a' }}>
                Rôle
              </label>
              <select
                id="role"
                value={registerRole}
                onChange={(e) => setRegisterRole(e.target.value as 'admin' | 'collaborator')}
                style={{
                  width: '100%',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0.7rem 0.85rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              >
                <option value="collaborator">Collaborateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: '#fef2f2',
                color: '#dc2626',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
              color: 'white',
              padding: '0.8rem 1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.65 : 1,
              fontSize: '1rem',
            }}
          >
            {loading ? (isRegister ? 'Création en cours...' : 'Connexion en cours...') : isRegister ? 'S\'inscrire' : 'Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister)
              setError(null)
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              fontSize: '0.95rem',
              textDecoration: 'underline',
            }}
          >
            {isRegister ? 'Vous avez déjà un compte ? Se connecter' : 'Pas encore inscrit ? Créer un compte'}
          </button>
        </div>
      </div>
    </div>
  )
}
