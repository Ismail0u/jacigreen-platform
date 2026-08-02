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

      <div className="app-shell">
        <header className="top-nav">
          <div className="top-nav__left">
            <button className="brand" type="button" onClick={() => setPage('missions')}>
              <img src={jacilogo} alt="JACIGREEN" />
              <span>JACIGREEN</span>
            </button>
          </div>

          <nav className="top-nav__nav" aria-label="Navigation principale">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={page === item.id ? 'nav-link active' : 'nav-link'}
                onClick={() => setPage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="account-menu">
            <div className="account-chip" aria-label="Compte utilisateur">
              <span>{currentUser.role === 'admin' ? 'Administrateur' : 'Collaborateur'}</span>
              <strong>{currentUser.email}</strong>
            </div>
            <button type="button" className="logout-button" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        </header>

        {page === 'missions' ? <MissionMap isAdmin={currentUser.role === 'admin'} /> : null}
        {page === 'collaborators' && currentUser.role === 'admin' ? <CollaboratorsPage /> : null}
        {page === 'about' ? <AboutPage /> : null}
      </div>
    </>
  )
}

export default App
