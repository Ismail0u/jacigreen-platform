import { useState } from 'react'
import './App.css'

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

  return (
    <div className="app-shell">
      <header className="top-nav">
        <button className="brand" onClick={() => setPage('missions')}><img src={jacilogo} alt="JACIGREEN" /><span>JACIGREEN</span></button>
        <nav aria-label="Navigation principale">
          <button className={page === 'missions' ? 'nav-link active' : 'nav-link'} onClick={() => setPage('missions')}>Gestion des missions</button>
          {currentUser.role === 'admin' ? <button className={page === 'collaborators' ? 'nav-link active' : 'nav-link'} onClick={() => setPage('collaborators')}>Gestion des collaborateurs</button> : null}
          <button className={page === 'about' ? 'nav-link active' : 'nav-link'} onClick={() => setPage('about')}>À propos</button>
        </nav>
        <div className="account-menu"><span><strong>{currentUser.email}</strong><small>{currentUser.role === 'admin' ? 'Administrateur' : 'Collaborateur'}</small></span><button className="logout-button" onClick={handleLogout}>Déconnexion</button></div>
      </header>
      {page === 'missions' ? <MissionMap isAdmin={currentUser.role === 'admin'} /> : null}
      {page === 'collaborators' && currentUser.role === 'admin' ? <CollaboratorsPage /> : null}
      {page === 'about' ? <AboutPage /> : null}
    </div>
  )
}

export default App
