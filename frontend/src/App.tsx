import { useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import './App.css'
import { LazyCollaboratorsPage } from './pages/LazyCollaboratorsPage'
import { AboutPage } from './pages/AboutPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AdminRoute } from './routes/AdminRoute'
import { useAuthStore } from './store/authStore'
import { LazyMissionMap } from './components/LazyMissionMap'
import jacilogo from '../public/jacigreen.jpg'

/** Coquille commune a toutes les pages authentifiees : nav + zone de contenu. */
function AppLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!user) return null // filet de securite ; ProtectedRoute garantit deja cet etat.

  const navItems = [
    { to: '/missions', label: 'Gestion des missions' },
    ...(user.role === 'admin' ? [{ to: '/collaborators', label: 'Collaborateurs' }] : []),
    { to: '/about', label: 'À propos' },
  ]

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/missions')}
            className="flex items-center gap-2.5 rounded-full pr-2 text-brand-700 hover:opacity-90"
          >
            <img src={jacilogo} alt="" className="h-9 w-9 rounded-full object-cover shadow-sm" />
            <span className="text-sm font-bold uppercase tracking-wide">JACIGREEN</span>
          </button>

          {/* Nav desktop : cachee sous md, la place manque des cet endroit sur mobile. */}
          <nav aria-label="Navigation principale" className="hidden flex-1 items-center gap-1 overflow-x-auto md:flex">
            {navItems.map((item) => (
              <NavButton key={item.to} to={item.to} label={item.label} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 md:ml-0">
            <div className="hidden text-right leading-tight sm:block" aria-label="Compte utilisateur">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {user.role === 'admin' ? 'Administrateur' : 'Collaborateur'}
              </p>
              <p className="text-sm font-semibold text-slate-800">{user.email}</p>
            </div>
            <button type="button" onClick={handleLogout} className="btn-danger-ghost hidden md:inline-flex">
              Déconnexion
            </button>

            {/* Bouton hamburger : uniquement sous md. */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 md:hidden"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Panneau mobile : liens + compte + deconnexion, empiles verticalement. */}
        {menuOpen ? (
          <nav id="mobile-nav" aria-label="Navigation principale (mobile)" className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="grid gap-1">
              {navItems.map((item) => (
                <NavButton key={item.to} to={item.to} label={item.label} fullWidth onNavigate={() => setMenuOpen(false)} />
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="leading-tight" aria-label="Compte utilisateur">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {user.role === 'admin' ? 'Administrateur' : 'Collaborateur'}
                </p>
                <p className="text-sm font-semibold text-slate-800">{user.email}</p>
              </div>
              <button type="button" onClick={handleLogout} className="btn-danger-ghost">
                Déconnexion
              </button>
            </div>
          </nav>
        ) : null}
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}

function NavButton({
  to,
  label,
  fullWidth = false,
  onNavigate,
}: {
  to: string
  label: string
  fullWidth?: boolean
  onNavigate?: () => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = location.pathname === to

  const base = fullWidth
    ? 'w-full text-left rounded-lg px-3.5 py-2.5 text-sm font-semibold'
    : 'whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold'

  return (
    <button
      type="button"
      onClick={() => {
        navigate(to)
        onNavigate?.()
      }}
      aria-current={isActive ? 'page' : undefined}
      className={`${base} ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
    >
      {label}
    </button>
  )
}

/** Empeche un utilisateur deja connecte de revoir /login (redirection immediate). */
function GuestOnlyRoute() {
  const user = useAuthStore((state) => state.user)
  if (user) return <Navigate to="/missions" replace />
  return <Outlet />
}

function App() {
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin')

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/missions" replace />} />

      <Route element={<GuestOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/missions" element={<LazyMissionMap isAdmin={isAdmin} />} />
          <Route path="/about" element={<AboutPage />} />

          <Route element={<AdminRoute />}>
            <Route path="/collaborators" element={<LazyCollaboratorsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App