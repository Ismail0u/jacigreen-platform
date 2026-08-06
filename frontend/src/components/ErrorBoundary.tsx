import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Filet de securite global : sans cela, une exception non geree dans
 * n'importe quel composant (ex: reponse API inattendue dans MissionMap)
 * fait tomber tout React sur un ecran blanc, sans aucun message.
 *
 * Les boundaries d'erreur ne peuvent etre ecrites qu'en composant classe
 * (pas d'equivalent hook a ce jour) : c'est la seule classe du projet.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Point d'integration futur : envoyer vers Sentry/LogRocket en prod.
    console.error('Erreur non interceptee dans l\u2019interface :', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center">
          <div className="max-w-md">
            <p className="text-sm font-bold uppercase tracking-widest text-red-600">Erreur inattendue</p>
            <h1 className="mt-2 text-xl font-bold text-slate-900">Quelque chose s'est mal passé</h1>
            <p className="mt-2 text-sm text-slate-500">
              L'équipe technique a été notifiée. Vous pouvez réessayer ou revenir à l'accueil.
            </p>
            <button
              type="button"
              className="btn-primary mt-5"
              onClick={() => {
                this.setState({ error: null })
                window.location.assign('/missions')
              }}
            >
              Retour aux missions
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
