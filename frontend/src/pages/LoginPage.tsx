import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLocation, useNavigate } from 'react-router-dom'

import { AlertModal } from '../components/AlertModal'
import { useAuthStore } from '../store/authStore'

const loginSchema = z.object({
  email: z.email({ message: 'Adresse email invalide' }),
  password: z.string().min(1, { message: 'Le mot de passe est requis' }),
})

const passwordChangeSchema = z
  .object({
    newPassword: z.string().min(8, { message: 'Au moins 8 caractères' }),
    confirmPassword: z.string().min(8, { message: 'Au moins 8 caractères' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type LoginFormValues = z.infer<typeof loginSchema>
type PasswordChangeValues = z.infer<typeof passwordChangeSchema>

export function LoginPage() {
  const login = useAuthStore((state) => state.login)
  const changePassword = useAuthStore((state) => state.changePassword)
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/missions'

  const [serverError, setServerError] = useState<string | null>(null)
  const [showAlert, setShowAlert] = useState(false)
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loginForm = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })
  const passwordForm = useForm<PasswordChangeValues>({ resolver: zodResolver(passwordChangeSchema) })

  async function onLoginSubmit(values: LoginFormValues) {
    setServerError(null)
    setSubmitting(true)
    try {
      const { requiresPasswordChange: mustChange } = await login(values.email, values.password)
      if (mustChange) {
        setRequiresPasswordChange(true)
        return
      }
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\u2019authentification'
      setServerError(message)
      setShowAlert(true)
    } finally {
      setSubmitting(false)
    }
  }

  async function onPasswordChangeSubmit(values: PasswordChangeValues) {
    setServerError(null)
    setSubmitting(true)
    try {
      await changePassword({
        old_password: loginForm.getValues('password'),
        new_password: values.newPassword,
        confirm_password: values.confirmPassword,
      })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Le changement de mot de passe a échoué.'
      setServerError(message)
      setShowAlert(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <AlertModal
        isOpen={showAlert}
        title={requiresPasswordChange ? 'Changement de mot de passe requis' : 'Connexion impossible'}
        message={serverError ?? ''}
        variant="error"
        onClose={() => setShowAlert(false)}
      />

      <main className="grid min-h-screen place-items-center bg-brand-900 p-4 sm:p-8">
        <section className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">
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

          <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Accès sécurisé</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {requiresPasswordChange ? 'Changer votre mot de passe' : 'Connexion'}
            </h2>

            {requiresPasswordChange ? (
              <form onSubmit={passwordForm.handleSubmit(onPasswordChangeSubmit)} className="mt-6 grid gap-4" noValidate>
                <p className="text-sm text-slate-500">
                  Pour votre première connexion, choisissez un mot de passe robuste avant d'accéder au tableau de bord.
                </p>

                <label htmlFor="new-password" className="field-label">
                  <span>Nouveau mot de passe</span>
                  <input
                    id="new-password"
                    type="password"
                    className="field-input"
                    placeholder="Au moins 8 caractères"
                    aria-invalid={Boolean(passwordForm.formState.errors.newPassword)}
                    {...passwordForm.register('newPassword')}
                  />
                  {passwordForm.formState.errors.newPassword ? (
                    <span className="text-xs font-medium text-red-600">{passwordForm.formState.errors.newPassword.message}</span>
                  ) : null}
                </label>

                <label htmlFor="confirm-password" className="field-label">
                  <span>Confirmez le nouveau mot de passe</span>
                  <input
                    id="confirm-password"
                    type="password"
                    className="field-input"
                    placeholder="Répétez le mot de passe"
                    aria-invalid={Boolean(passwordForm.formState.errors.confirmPassword)}
                    {...passwordForm.register('confirmPassword')}
                  />
                  {passwordForm.formState.errors.confirmPassword ? (
                    <span className="text-xs font-medium text-red-600">{passwordForm.formState.errors.confirmPassword.message}</span>
                  ) : null}
                </label>

                <button type="submit" className="btn-primary mt-1 h-11" disabled={submitting}>
                  {submitting ? 'Mise à jour...' : 'Valider le mot de passe'}
                </button>
              </form>
            ) : (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="mt-6 grid gap-4" noValidate>
                <label htmlFor="email" className="field-label">
                  <span>Email</span>
                  <input
                    id="email"
                    type="email"
                    className="field-input"
                    placeholder="nom@jacigreen.fr"
                    aria-invalid={Boolean(loginForm.formState.errors.email)}
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email ? (
                    <span className="text-xs font-medium text-red-600">{loginForm.formState.errors.email.message}</span>
                  ) : null}
                </label>

                <label htmlFor="password" className="field-label">
                  <span>Mot de passe</span>
                  <input
                    id="password"
                    type="password"
                    className="field-input"
                    placeholder="••••••••"
                    aria-invalid={Boolean(loginForm.formState.errors.password)}
                    {...loginForm.register('password')}
                  />
                  {loginForm.formState.errors.password ? (
                    <span className="text-xs font-medium text-red-600">{loginForm.formState.errors.password.message}</span>
                  ) : null}
                </label>

                <button type="submit" className="btn-primary mt-1 h-11" disabled={submitting}>
                  {submitting ? 'Connexion en cours...' : 'Se connecter'}
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
