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
      setNotice(getApiErrorMessage(error, 'Impossible d\u2019affecter cette mission.'))
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Administration</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Gestion des collaborateurs</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Créez les comptes terrain, définissez leurs accès et affectez les missions.
        </p>
      </div>

      {notice ? (
        <div role="status" className="mt-5 rounded-lg border border-water-100 bg-water-50 px-4 py-2.5 text-sm font-medium text-water-700">
          {notice}
        </div>
      ) : null}

      {temporaryPassword ? (
        <div role="alert" className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <strong className="font-semibold">Mot de passe temporaire</strong>
          <code className="rounded bg-white px-2 py-1 font-mono font-semibold text-amber-700">{temporaryPassword}</code>
          <button
            type="button"
            onClick={() => setTemporaryPassword(null)}
            className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-200"
          >
            J'ai noté le mot de passe
          </button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <form className="card" onSubmit={createCollaborator}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Personnel</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">Créer un collaborateur</h2>

          <div className="mt-4 grid gap-3.5">
            <label className="field-label">
              <span>Prénom</span>
              <input className="field-input" value={newUser.first_name} onChange={(event) => setNewUser({ ...newUser, first_name: event.target.value })} />
            </label>

            <label className="field-label">
              <span>Nom</span>
              <input className="field-input" value={newUser.last_name} onChange={(event) => setNewUser({ ...newUser, last_name: event.target.value })} />
            </label>

            <label className="field-label">
              <span>Email</span>
              <input className="field-input" required type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} />
            </label>

            <label className="field-label">
              <span>Offre</span>
              <select className="field-input" value={newUser.subscription_tier} onChange={(event) => setNewUser({ ...newUser, subscription_tier: event.target.value })}>
                {TIERS.map((tier) => (
                  <option key={tier}>{tier}</option>
                ))}
              </select>
            </label>

            <button type="submit" className="btn-primary mt-1">
              Créer le compte
            </button>
          </div>
        </form>

        <form className="card" onSubmit={assignMission}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Affectation</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">Assigner une mission</h2>

          <div className="mt-4 grid gap-3.5">
            <label className="field-label">
              <span>Mission</span>
              <select className="field-input" required value={assignment.missionId} onChange={(event) => setAssignment({ ...assignment, missionId: event.target.value })}>
                <option value="">Sélectionner</option>
                {missions.map((mission) => (
                  <option key={mission.id} value={mission.id}>
                    {mission.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              <span>Collaborateur</span>
              <select className="field-input" required value={assignment.collaboratorId} onChange={(event) => setAssignment({ ...assignment, collaboratorId: event.target.value })}>
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

            <button type="submit" className="btn-primary mt-1">
              Affecter la mission
            </button>
          </div>
        </form>
      </div>

      <section className="card mt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Équipe</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">Collaborateurs</h2>
          </div>
          <button type="button" className="btn-secondary" onClick={() => void loadData()}>
            Actualiser
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-400">Chargement des collaborateurs…</p>
        ) : (
          <div className="mt-5 grid gap-3">
            {collaborators.map((user) => (
              <article
                key={user.id}
                className={
                  'flex flex-col gap-4 rounded-xl border-l-4 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between ' +
                  (user.is_active ? 'border-brand-500' : 'border-slate-300')
                }
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
                    {(user.first_name?.[0] ?? user.email[0] ?? 'C').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {user.first_name || user.last_name ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : user.email}
                    </h3>
                    <p className="truncate text-sm text-slate-500">{user.email}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className={user.is_active ? 'badge bg-brand-100 text-brand-700' : 'badge bg-slate-200 text-slate-500'}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                      {user.force_password_change ? (
                        <span className="badge bg-amber-100 text-amber-700">Mot de passe à modifier</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:min-w-[380px]">
                  <label className="field-label">
                    <span>Offre</span>
                    <select
                      className="field-input"
                      value={user.subscription_tier}
                      onChange={(event) => void updateCollaborator(user, { subscription_tier: event.target.value })}
                    >
                      {TIERS.map((tier) => (
                        <option key={tier}>{tier}</option>
                      ))}
                    </select>
                  </label>

                  <label className="field-label">
                    <span>Statut</span>
                    <select
                      className="field-input"
                      value={user.subscription_status}
                      onChange={(event) => void updateCollaborator(user, { subscription_status: event.target.value })}
                    >
                      {SUBSCRIPTION_STATUSES.map((state) => (
                        <option key={state}>{state}</option>
                      ))}
                    </select>
                  </label>

                  <button type="button" className="btn-secondary col-span-1" onClick={() => void updateCollaborator(user, { is_active: !user.is_active })}>
                    {user.is_active ? 'Désactiver' : 'Réactiver'}
                  </button>

                  <button type="button" className="btn-secondary col-span-1" onClick={() => void resetPassword(user)}>
                    Réinitialiser
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
