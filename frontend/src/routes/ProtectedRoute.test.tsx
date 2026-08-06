import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AdminRoute } from './AdminRoute'
import { useAuthStore } from '../store/authStore'

function renderProtected(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Page de connexion</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/missions" element={<div>Missions</div>} />
          <Route element={<AdminRoute />}>
            <Route path="/collaborators" element={<div>Collaborateurs</div>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, hasHydrated: true })
})

describe('ProtectedRoute', () => {
  it('redirige un visiteur anonyme vers /login', () => {
    renderProtected('/missions')
    expect(screen.getByText('Page de connexion')).toBeInTheDocument()
  })

  it('affiche le contenu protege pour un utilisateur authentifie', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'op@jacigreen.fr', role: 'collaborator', is_active: true, created_at: '2026-01-01' },
      token: 'abc',
    })
    renderProtected('/missions')
    expect(screen.getByText('Missions')).toBeInTheDocument()
  })
})

describe('AdminRoute', () => {
  it('renvoie un collaborateur hors d\u2019une route reservee aux admins', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'op@jacigreen.fr', role: 'collaborator', is_active: true, created_at: '2026-01-01' },
      token: 'abc',
    })
    renderProtected('/collaborators')
    expect(screen.getByText('Missions')).toBeInTheDocument()
  })

  it('laisse passer un administrateur', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'admin@jacigreen.fr', role: 'admin', is_active: true, created_at: '2026-01-01' },
      token: 'abc',
    })
    renderProtected('/collaborators')
    expect(screen.getByText('Collaborateurs')).toBeInTheDocument()
  })
})
