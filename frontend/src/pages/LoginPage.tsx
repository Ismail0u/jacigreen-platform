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

      <main className="grid min-h-screen place-items-center bg-brand-900 p-4 sm:p-8">
        <section className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">
          {/* Panneau de marque */}
          <div className="hidden flex-col justify-center gap-5 bg-gradient-to-br from-brand-700 to-brand-900 px-10 py-12 text-white md:flex">
            <div className="h-11 w-11 rounded-lg bg-white/15 ring-1 ring-white/25" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-widest text-brand-200">JACIGREEN Africa</p>
            <h1 className="text-2xl font-bold leading-tight tracking-tight">
              Surveillez les zones sensibles avec précision.
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-brand-100">
              Centralisez les missions, les photos terrain et les rapports d'analyse pour agir plus vite
              sur les zones prioritaires.
            </p>

            <ul className="mt-2 grid gap-3 text-sm font-medium" aria-label="Fonctionnalités clés">
              {['Cartographie du terrain', 'Analyse assistée par IA', 'Suivi d\u2019équipe en temps réel'].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-300" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Panneau formulaire */}
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Accès sécurisé</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {requiresPasswordChange ? 'Changer votre mot de passe' : 'Connexion'}
            </h2>

            {requiresPasswordChange ? (
              <form onSubmit={handlePasswordChangeSubmit} className="mt-6 grid gap-4">
                <p className="text-sm text-slate-500">
                  Pour votre première connexion, choisissez un mot de passe robuste avant d'accéder au tableau de bord.
                </p>

                <label htmlFor="new-password" className="field-label">
                  <span>Nouveau mot de passe</span>
                  <input
                    id="new-password"
                    type="password"
                    className="field-input"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Au moins 8 caractères, 1 majuscule, 1 chiffre, 1 symbole"
                    required
                    minLength={8}
                  />
                </label>

                <label htmlFor="confirm-password" className="field-label">
                  <span>Confirmez le nouveau mot de passe</span>
                  <input
                    id="confirm-password"
                    type="password"
                    className="field-input"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Répétez le mot de passe"
                    required
                    minLength={8}
                  />
                </label>

                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    {error}
                  </div>
                ) : null}

                <button type="submit" className="btn-primary mt-1 h-11" disabled={loading}>
                  {loading ? 'Mise à jour...' : 'Valider le mot de passe'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                <label htmlFor="email" className="field-label">
                  <span>Email</span>
                  <input
                    id="email"
                    type="email"
                    className="field-input"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nom@jacigreen.fr"
                    required
                  />
                </label>

                <label htmlFor="password" className="field-label">
                  <span>Mot de passe</span>
                  <input
                    id="password"
                    type="password"
                    className="field-input"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </label>

                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    {error}
                  </div>
                ) : null}

                <button type="submit" className="btn-primary mt-1 h-11" disabled={loading}>
                  {loading ? 'Connexion en cours...' : 'Se connecter'}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-xs text-slate-400">
              Votre compte est créé et activé par un administrateur JACIGREEN.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
