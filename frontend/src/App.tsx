import { useEffect, useState } from 'react'
import './App.css'

import { MissionMap } from './components/MissionMap'
import { RoleDashboard } from './components/RoleDashboard'
import { LoginPage } from './pages/LoginPage'
import { authService } from './services/authService'
import type { AuthToken, User } from './services/authService'
import jacilogo from '../public/jacigreen.jpg'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authService.isAuthenticated()) {
      const user = authService.getUser()
      if (user) {
        setCurrentUser(user)
        setIsAuthenticated(true)
      }
    }
    setLoading(false)
  }, [])

  function handleLoginSuccess(_token: AuthToken) {
    const user = authService.getUser()
    if (user) {
      setCurrentUser(user)
      setIsAuthenticated(true)
    }
  }

  function handleLogout() {
    authService.logout()
    setCurrentUser(null)
    setIsAuthenticated(false)
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255, 255, 255, 0.94)', borderBottom: '1px solid rgba(148, 163, 184, 0.24)' }}>
        <div>
          <img src={jacilogo} alt="Jaci Green" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
          <strong>{currentUser?.email}</strong> <span style={{ color: '#64748b', fontSize: '0.9rem' }}>({currentUser?.role})</span>
        </div>
        <button onClick={handleLogout} style={{ border: 'none', borderRadius: '999px', background: '#dc2626', color: 'white', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600 }}>
          Déconnexion
        </button>
      </div>
        { /* <RoleDashboard role={currentUser?.role ?? 'collaborator'} /> */ }
      <MissionMap />
    </div>
  )
}

export default App
