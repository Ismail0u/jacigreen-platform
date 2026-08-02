import { useEffect, useState } from 'react'
import axios from 'axios'

import { authService } from '../services/authService'
import { getApiErrorMessage } from '../services/apiError'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Collaborator {
  id: string
  email: string
  role: string
  first_name?: string | null
  last_name?: string | null
  is_active: boolean
  force_password_change: boolean
  subscription_tier: string
  subscription_status: string
  subscription_valid_until?: string | null
}

interface MissionOption { id: string; name: string }

const TIERS = ['starter', 'pro', 'enterprise']
const SUBSCRIPTION_STATUSES = ['active', 'pending', 'expired', 'cancelled']

export function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [missions, setMissions] = useState<MissionOption[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({ email: '', first_name: '', last_name: '', subscription_tier: 'starter' })
  const [assignment, setAssignment] = useState({ missionId: '', collaboratorId: '' })

  async function loadData() {
    setLoading(true)
    try {
      const headers = authService.getAuthHeader()
      const [usersResponse, missionsResponse] = await Promise.all([
        axios.get<Collaborator[]>(`${apiUrl}/api/v1/admin/users`, { headers }),
        axios.get<MissionOption[]>(`${apiUrl}/api/v1/missions/`, { headers }),
      ])
      setCollaborators(usersResponse.data.filter((user) => user.role === 'collaborator'))
      setMissions(missionsResponse.data)
    } catch (error) {
      setNotice(getApiErrorMessage(error, 'Impossible de charger les collaborateurs.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])

  async function createCollaborator(event: React.FormEvent) {
    event.preventDefault()
    setNotice(null)
    try {
      const { data } = await axios.post(`${apiUrl}/api/v1/auth/admin/users`, {
        ...newUser,
        role: 'collaborator',
      }, { headers: authService.getAuthHeader() })
      setTemporaryPassword(data.temporary_password)
      setNewUser({ email: '', first_name: '', last_name: '', subscription_tier: 'starter' })
      setNotice(`Le compte de ${data.email} a été créé.`)
      await loadData()
    } catch (error) {
      setNotice(getApiErrorMessage(error, 'Impossible de créer le collaborateur.'))
    }
  }

  async function updateCollaborator(user: Collaborator, changes: Partial<Collaborator>) {
    try {
      const { data } = await axios.put<Collaborator>(`${apiUrl}/api/v1/auth/admin/users/${user.id}`, changes, { headers: authService.getAuthHeader() })
      setCollaborators((current) => current.map((item) => item.id === user.id ? data : item))
      setNotice(`Les accès de ${data.email} ont été mis à jour.`)
    } catch (error) {
      setNotice(getApiErrorMessage(error, 'Impossible de mettre à jour ce collaborateur.'))
    }
  }

  async function resetPassword(user: Collaborator) {
    try {
      const { data } = await axios.post(`${apiUrl}/api/v1/auth/admin/users/${user.id}/reset-password`, undefined, { headers: authService.getAuthHeader() })
      setTemporaryPassword(data.temporary_password)
      setNotice(`Le mot de passe de ${user.email} a été réinitialisé.`)
      await loadData()
    } catch (error) {
      setNotice(getApiErrorMessage(error, 'Impossible de réinitialiser le mot de passe.'))
    }
  }

  async function assignMission(event: React.FormEvent) {
    event.preventDefault()
    if (!assignment.missionId || !assignment.collaboratorId) return
    try {
      await axios.put(`${apiUrl}/api/v1/missions/${assignment.missionId}/assignee`, { collaborator_id: assignment.collaboratorId }, { headers: authService.getAuthHeader() })
      setNotice('La mission a été affectée au collaborateur sélectionné.')
      setAssignment({ missionId: '', collaboratorId: '' })
    } catch (error) {
      setNotice(getApiErrorMessage(error, 'Impossible d’affecter cette mission.'))
    }
  }

  return (
    <main className="page-shell collaborator-page">
      <section className="page-heading">
        <p className="eyebrow">Administration</p>
        <h1>Gestion des collaborateurs</h1>
        <p>Créez les comptes terrain, définissez leurs accès et affectez les missions.</p>
      </section>

      {notice ? (
        <div className="notice" role="status">
          {notice}
        </div>
      ) : null}

      {temporaryPassword ? (
        <div className="temporary-password" role="alert">
          <strong>Mot de passe temporaire</strong>
          <code>{temporaryPassword}</code>
          <button type="button" onClick={() => setTemporaryPassword(null)}>
            J’ai noté le mot de passe
          </button>
        </div>
      ) : null}

      <section className="management-grid">
        <form className="panel form-panel" onSubmit={createCollaborator}>
          <div className="section-header section-header--tight">
            <div>
              <p className="eyebrow eyebrow--dark">Personnel</p>
              <h2>Créer un collaborateur</h2>
            </div>
          </div>

          <label>
            <span>Prénom</span>
            <input value={newUser.first_name} onChange={(event) => setNewUser({ ...newUser, first_name: event.target.value })} />
          </label>

          <label>
            <span>Nom</span>
            <input value={newUser.last_name} onChange={(event) => setNewUser({ ...newUser, last_name: event.target.value })} />
          </label>

          <label>
            <span>Email</span>
            <input required type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} />
          </label>

          <label>
            <span>Offre</span>
            <select value={newUser.subscription_tier} onChange={(event) => setNewUser({ ...newUser, subscription_tier: event.target.value })}>
              {TIERS.map((tier) => (
                <option key={tier}>{tier}</option>
              ))}
            </select>
          </label>

          <button type="submit" className="primary-button">
            Créer le compte
          </button>
        </form>

        <form className="panel form-panel" onSubmit={assignMission}>
          <div className="section-header section-header--tight">
            <div>
              <p className="eyebrow eyebrow--dark">Affectation</p>
              <h2>Assigner une mission</h2>
            </div>
          </div>

          <label>
            <span>Mission</span>
            <select required value={assignment.missionId} onChange={(event) => setAssignment({ ...assignment, missionId: event.target.value })}>
              <option value="">Sélectionner</option>
              {missions.map((mission) => (
                <option key={mission.id} value={mission.id}>
                  {mission.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Collaborateur</span>
            <select required value={assignment.collaboratorId} onChange={(event) => setAssignment({ ...assignment, collaboratorId: event.target.value })}>
              <option value="">Sélectionner</option>
              {collaborators
                .filter((user) => user.is_active)
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name || user.last_name ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : user.email}
                  </option>
                ))}
            </select>
          </label>

          <button type="submit" className="primary-button">
            Affecter la mission
          </button>
        </form>
      </section>

      <section className="panel collaborators-panel">
        <div className="section-title">
          <div>
            <p className="eyebrow eyebrow--dark">Équipe</p>
            <h2>Collaborateurs</h2>
          </div>
          <button type="button" className="secondary-button" onClick={() => void loadData()}>
            Actualiser
          </button>
        </div>

        {loading ? (
          <p className="empty-state">Chargement des collaborateurs…</p>
        ) : (
          <div className="collaborator-list">
            {collaborators.map((user) => (
              <article className="collaborator-card" key={user.id}>
                <div className="collaborator-card__identity">
                  <div className="avatar-badge" aria-hidden="true">
                    {(user.first_name?.[0] ?? user.email[0] ?? 'C').toUpperCase()}
                  </div>
                  <div>
                    <h3>{user.first_name || user.last_name ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : user.email}</h3>
                    <p>{user.email}</p>
                    <div className="status-row">
                      <span className={user.is_active ? 'badge badge-success' : 'badge badge-muted'}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                      {user.force_password_change ? <span className="badge badge-warning">Mot de passe à modifier</span> : null}
                    </div>
                  </div>
                </div>

                <div className="collaborator-actions">
                  <label>
                    <span>Offre</span>
                    <select value={user.subscription_tier} onChange={(event) => void updateCollaborator(user, { subscription_tier: event.target.value })}>
                      {TIERS.map((tier) => (
                        <option key={tier}>{tier}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Statut</span>
                    <select value={user.subscription_status} onChange={(event) => void updateCollaborator(user, { subscription_status: event.target.value })}>
                      {SUBSCRIPTION_STATUSES.map((state) => (
                        <option key={state}>{state}</option>
                      ))}
                    </select>
                  </label>

                  <button type="button" className="secondary-button" onClick={() => void updateCollaborator(user, { is_active: !user.is_active })}>
                    {user.is_active ? 'Désactiver' : 'Réactiver'}
                  </button>

                  <button type="button" className="secondary-button" onClick={() => void resetPassword(user)}>
                    Réinitialiser le mot de passe
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
