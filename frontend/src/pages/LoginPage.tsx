import { useState } from 'react'
import { AlertModal } from '../components/AlertModal'
import { authService } from '../services/authService'
import type { AuthToken } from '../services/authService'

interface LoginProps {
  onLoginSuccess: (token: AuthToken) => void
}

export function LoginPage({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false)
  const [pendingToken, setPendingToken] = useState<AuthToken | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const token = await authService.login(email, password)
      if (token.requires_password_change) {
        setPendingToken(token)
        setRequiresPasswordChange(true)
        setError(null)
        return
      }
      onLoginSuccess(token)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'authentification'
      setError(message)
      setShowAlert(true)
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordChangeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!pendingToken) {
        throw new Error('La session de renouvellement du mot de passe est introuvable.')
      }
      if (newPassword !== confirmPassword) {
        throw new Error('La confirmation du nouveau mot de passe ne correspond pas.')
      }

      await authService.changePassword({
        old_password: password,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })

      setRequiresPasswordChange(false)
      setNewPassword('')
      setConfirmPassword('')
      setPassword('')
      setPendingToken(null)
      onLoginSuccess(pendingToken)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Le changement de mot de passe a échoué.'
      setError(message)
      setShowAlert(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AlertModal
        isOpen={showAlert}
        title={requiresPasswordChange ? 'Changement de mot de passe requis' : 'Connexion impossible'}
        message={error ?? (requiresPasswordChange ? 'Choisissez un mot de passe fort pour sécuriser votre accès.' : 'Vérifiez votre email et votre mot de passe, puis réessayez.')}
        variant="error"
        onClose={() => setShowAlert(false)}
      />

      <main className="auth-page">
        <section className="auth-shell">
          <div className="auth-panel auth-panel--brand">
            <div className="brand-mark" aria-label="Logo JACIGREEN" />
            <p className="eyebrow">JACIGREEN Africa</p>
            <h1>Surveillez les zones sensibles avec précision.</h1>
            <p>
              Centralisez les missions, les photos terrain et les rapports d’analyse pour agir plus vite
              sur les zones prioritaires.
            </p>

            <ul className="feature-list" aria-label="Fonctionnalités clés">
              <li>Cartographie du terrain</li>
              <li>Analyse assistée par IA</li>
              <li>Suivi d’équipe en temps réel</li>
            </ul>
          </div>

          <div className="auth-panel auth-panel--form">
            <div className="auth-header">
              <p className="eyebrow eyebrow--dark">Accès sécurisé</p>
              <h2>{requiresPasswordChange ? 'Changer votre mot de passe' : 'Connexion'}</h2>
            </div>

            {requiresPasswordChange ? (
              <form onSubmit={handlePasswordChangeSubmit} className="auth-form">
                <p className="auth-note">
                  Pour votre première connexion, choisissez un mot de passe robuste avant d’accéder au tableau de bord.
                </p>

                <label htmlFor="new-password">
                  <span>Nouveau mot de passe</span>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Au moins 8 caractères, 1 majuscule, 1 chiffre, 1 symbole"
                    required
                    minLength={8}
                  />
                </label>

                <label htmlFor="confirm-password">
                  <span>Confirmez le nouveau mot de passe</span>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Répétez le mot de passe"
                    required
                    minLength={8}
                  />
                </label>

                {error ? <div className="input-error">{error}</div> : null}

                <button type="submit" className="primary-button auth-submit" disabled={loading}>
                  {loading ? 'Mise à jour...' : 'Valider le mot de passe'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">
                <label htmlFor="email">
                  <span>Email</span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nom@jacigreen.fr"
                    required
                  />
                </label>

                <label htmlFor="password">
                  <span>Mot de passe</span>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </label>

                {error ? <div className="input-error">{error}</div> : null}

                <button type="submit" className="primary-button auth-submit" disabled={loading}>
                  {loading ? 'Connexion en cours...' : 'Se connecter'}
                </button>
              </form>
            )}

            <p className="auth-note">
              Votre compte est créé et activé par un administrateur JACIGREEN.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
