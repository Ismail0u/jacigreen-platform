import { useState } from 'react'
import './App.css'

import { AlertModal } from './components/AlertModal'
import { StatusToast } from './components/StatusToast'
import { MissionMap } from './components/MissionMap'
import { CollaboratorsPage } from './pages/CollaboratorsPage'
import { AboutPage } from './pages/AboutPage'
import { LoginPage } from './pages/LoginPage'
import { authService } from './services/authService'
import type { User } from './services/authService'
import jacilogo from '../public/jacigreen.jpg'

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getUser())
  const [page, setPage] = useState<'missions' | 'collaborators' | 'about'>('missions')
  const [alert, setAlert] = useState<{ title: string; message: string; variant: 'error' | 'warning' | 'success' | 'info' } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({ message: '', type: 'info', visible: false })

  function handleLoginSuccess() {
    const user = authService.getUser()
    if (user) {
      setCurrentUser(user)
    }
  }

  function handleLogout() {
    authService.logout()
    setCurrentUser(null)
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  const navItems = [
    { id: 'missions' as const, label: 'Gestion des missions' },
    ...(currentUser.role === 'admin' ? [{ id: 'collaborators' as const, label: 'Collaborateurs' }] : []),
    { id: 'about' as const, label: 'À propos' },
  ]

  return (
    <>
      <AlertModal
        isOpen={Boolean(alert)}
        title={alert?.title ?? 'Information'}
        message={alert?.message ?? ''}
        variant={alert?.variant ?? 'info'}
        onClose={() => setAlert(null)}
      />
      <StatusToast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast((current) => ({ ...current, visible: false }))}
      />

      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setPage('missions')}
              className="flex items-center gap-2.5 rounded-full pr-2 text-brand-700 hover:opacity-90"
            >
              <img src={jacilogo} alt="" className="h-9 w-9 rounded-full object-cover shadow-sm" />
              <span className="text-sm font-bold uppercase tracking-wide">JACIGREEN</span>
            </button>

            <nav aria-label="Navigation principale" className="flex flex-1 items-center gap-1 overflow-x-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPage(item.id)}
                  className={
                    page === item.id
                      ? 'whitespace-nowrap rounded-full bg-brand-50 px-3.5 py-2 text-sm font-semibold text-brand-700'
                      : 'whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden text-right leading-tight sm:block" aria-label="Compte utilisateur">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {currentUser.role === 'admin' ? 'Administrateur' : 'Collaborateur'}
                </p>
                <p className="text-sm font-semibold text-slate-800">{currentUser.email}</p>
              </div>
              <button type="button" onClick={handleLogout} className="btn-danger-ghost">
                Déconnexion
              </button>
            </div>
          </div>
        </header>

        <main>
          {page === 'missions' ? <MissionMap isAdmin={currentUser.role === 'admin'} /> : null}
          {page === 'collaborators' && currentUser.role === 'admin' ? <CollaboratorsPage /> : null}
          {page === 'about' ? <AboutPage /> : null}
        </main>
      </div>
    </>
  )
}

export default App
