import { useEffect, useMemo, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet'
import type { FeatureCollection, GeoJsonObject } from 'geojson'
import axios from 'axios'
import { authService } from '../services/authService'
import { getApiErrorMessage } from '../services/apiError'
import L from 'leaflet'

import { MapAutoFit } from './MapAutoFit'
import { MissionDetails } from './MissionDetails'
import { MissionSelector } from './MissionSelector'
import type { MissionInfo, MissionPhotoSelection, MissionReport } from './missionTypes'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER: [number, number] = [13.5137, 2.1168]
const DEFAULT_ZOOM = 18
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function resolvePhotoUrl(url?: string): string | undefined {
  if (!url) return undefined
  if (/^(https?:|blob:|data:)/i.test(url)) return url

  const base = apiUrl.replace(/\/$/, '')
  const normalized = url.replace(/^\/+/, '')
  try {
    return new URL(`/${normalized}`, base).toString()
  } catch {
    return `${base}/${normalized}`
  }
}

interface MissionMapProps {
  isAdmin: boolean
}

interface Collaborator {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  role: string
  is_active: boolean
}

export function MissionMap({ isAdmin }: MissionMapProps) {
  const [missionId, setMissionId] = useState('')
  const [missionInfo, setMissionInfo] = useState<MissionInfo | null>(null)
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null)
  const [flightpath, setFlightpath] = useState<FeatureCollection | null>(null)
  const [detections, setDetections] = useState<FeatureCollection | null>(null)
  const [report, setReport] = useState<MissionReport | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<MissionPhotoSelection | null>(null)
  const [photoLoadError, setPhotoLoadError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [uploadErrors, setUploadErrors] = useState<string[] | null>(null)
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null)
  const [createStatus, setCreateStatus] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [newMissionName, setNewMissionName] = useState('')
  const [newMissionDate, setNewMissionDate] = useState('')
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [assigneeId, setAssigneeId] = useState('')
  const [assignmentStatus, setAssignmentStatus] = useState<string | null>(null)
  const [missionsRefreshKey, setMissionsRefreshKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [creatingMission, setCreatingMission] = useState(false)

  const photoCount = useMemo(() => geojson?.features.length ?? 0, [geojson])

  useEffect(() => {
    setPhotoLoadError(false)
  }, [selectedPhoto?.id])

  async function loadCollaborators() {
    if (!isAdmin || collaborators.length) return
    try {
      const { data } = await axios.get<Collaborator[]>(`${apiUrl}/api/v1/admin/users`, { headers: authService.getAuthHeader() })
      setCollaborators(data.filter((user) => user.role === 'collaborator' && user.is_active))
    } catch (error) {
      setError(getApiErrorMessage(error, 'Impossible de charger les collaborateurs.'))
    }
  }

  async function loadMission() {
    setUploadStatus(null)
    setUploadErrors(null)

    if (!missionId.trim()) {
      setError('Sélectionnez une mission valide')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const headers = authService.getAuthHeader()
      const [missionResponse, photoResponse, pathResponse, detectionsResponse, reportResponse] = await Promise.all([
        axios.get<MissionInfo>(`${apiUrl}/api/v1/missions/${missionId}`, { headers }),
        axios.get<FeatureCollection>(`${apiUrl}/api/v1/missions/${missionId}/geojson`, { headers }),
        axios.get<FeatureCollection>(`${apiUrl}/api/v1/missions/${missionId}/flightpath`, { headers }),
        axios.get<FeatureCollection>(`${apiUrl}/api/v1/ai/missions/${missionId}/detections`, { headers }),
        axios.get<MissionReport>(`${apiUrl}/api/v1/missions/${missionId}/report`, { headers }),
      ])

      setMissionInfo(missionResponse.data)
      setGeojson(photoResponse.data)
      setFlightpath(pathResponse.data)
      setDetections(detectionsResponse.data)
      setReport(reportResponse.data)
      setSelectedPhoto(null)
      setAssigneeId(missionResponse.data.operator_id || '')
      void loadCollaborators()

      if (!photoResponse.data.features.length) {
        setError('Aucune photo trouvée pour cette mission')
      }
    } catch (err) {
      setMissionInfo(null)
      setGeojson(null)
      setFlightpath(null)
      setDetections(null)
      setReport(null)
      setSelectedPhoto(null)
      setError(getApiErrorMessage(err, 'Impossible de charger la mission. Vérifiez votre connexion puis réessayez.'))
    } finally {
      setLoading(false)
    }
  }

  async function assignCollaborator() {
    if (!missionId || !assigneeId) {
      setAssignmentStatus('Sélectionnez un collaborateur avant de l’affecter.')
      return
    }
    setAssignmentStatus(null)
    try {
      const { data } = await axios.put<MissionInfo>(
        `${apiUrl}/api/v1/missions/${missionId}/assignee`,
        { collaborator_id: assigneeId },
        { headers: authService.getAuthHeader() },
      )
      setMissionInfo(data)
      setAssignmentStatus('Collaborateur affecté à cette mission.')
    } catch (error) {
      setAssignmentStatus(getApiErrorMessage(error, 'Impossible d’affecter ce collaborateur.'))
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(event.target.files)
  }

  async function createMission() {
    const name = newMissionName.trim()
    if (!name) {
      setCreateStatus('Le nom de mission est obligatoire.')
      return
    }

    setCreatingMission(true)
    setCreateStatus(null)
    setError(null)

    try {
      const payload = {
        name,
        mission_date: newMissionDate ? new Date(newMissionDate).toISOString() : undefined,
      }
      const headers = authService.getAuthHeader()
      const { data } = await axios.post<MissionInfo>(`${apiUrl}/api/v1/missions/`, payload, { headers })
      setMissionId(data.id)
      setMissionInfo(data)
      setGeojson({ type: 'FeatureCollection', features: [] })
      setFlightpath({ type: 'FeatureCollection', features: [] })
      setDetections({ type: 'FeatureCollection', features: [] })
      setReport(null)
      setSelectedPhoto(null)
      setNewMissionName('')
      setNewMissionDate('')
      setMissionsRefreshKey((value) => value + 1)
      setCreateStatus('Mission créée avec succès')
    } catch (err) {
      setCreateStatus(getApiErrorMessage(err, 'Impossible de créer la mission. Vérifiez les informations saisies.'))
    } finally {
      setCreatingMission(false)
    }
  }

  async function uploadPhotos() {
    if (!missionId.trim() || !selectedFiles?.length) {
      setUploadStatus(null)
      setUploadErrors(['Sélectionnez au moins un fichier à envoyer.'])
      return
    }

    setUploading(true)
    setUploadStatus(null)
    setUploadErrors(null)

    const formData = new FormData()
    Array.from(selectedFiles).forEach((file) => formData.append('files', file))

    try {
      const headers = { ...authService.getAuthHeader(), 'Content-Type': 'multipart/form-data' }
      const response = await axios.post(`${apiUrl}/api/v1/missions/${missionId}/photos`, formData, {
        headers,
      })

      setUploadStatus(`Upload réussi (${response.data.uploaded.length} fichiers)`)
      if (response.data.errors?.length) {
        setUploadErrors(response.data.errors.map((item: { file: string; error: string }) => `${item.file}: ${item.error}`))
      }
      await loadMission()
    } catch (err) {
      setUploadStatus(null)
      setUploadErrors([getApiErrorMessage(err, 'Impossible d’envoyer les photos. Vérifiez le réseau et les fichiers sélectionnés.')])
    } finally {
      setUploading(false)
    }
  }

  async function triggerAnalysis() {
    if (!missionId.trim()) {
      setAnalysisStatus(null)
      setError('Sélectionnez une mission valide')
      return
    }

    setAnalyzing(true)
    setAnalysisStatus('Analyse IA en cours...')
    setError(null)

    try {
      const headers = authService.getAuthHeader()
      const { data } = await axios.post(`${apiUrl}/api/v1/ai/analyze/${missionId}`, undefined, { headers })
      const taskId = data.task_id

      for (let attempt = 0; attempt < 120; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        const { data: taskData } = await axios.get(`${apiUrl}/api/v1/ai/tasks/${taskId}`, { headers })

        if (taskData.status === 'SUCCESS') {
          setAnalysisStatus('Analyse IA terminée')
          await loadMission()
          return
        }

        if (taskData.status === 'FAILURE') {
          setAnalysisStatus('Erreur lors de l’analyse IA')
          return
        }

        setAnalysisStatus(`Analyse IA: ${taskData.status}`)
      }

      setAnalysisStatus('Analyse IA toujours en cours')
    } catch (err) {
      setAnalysisStatus(null)
      setError(getApiErrorMessage(err, 'Impossible de lancer l’analyse IA. Réessayez dans quelques instants.'))
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="mission-map-wrapper">
      <div className="mission-map-header">
        <div>
          <h1>JACIGREEN — Hub de missions</h1>
          <p className="upload-hint">Suivi terrain, cartes interactives et rapport automatisé.</p>
        </div>
        <div className="mission-map-controls">
          <MissionSelector value={missionId} onChange={setMissionId} refreshKey={missionsRefreshKey} />
          <button onClick={loadMission} disabled={loading || !missionId.trim()}>
            {loading ? 'Chargement…' : 'Charger'}
          </button>
        </div>
        {isAdmin ? (
          <div className="mission-create-form">
            <input type="text" placeholder="Nom de la nouvelle mission" value={newMissionName} onChange={(event) => setNewMissionName(event.target.value)} />
            <input type="datetime-local" value={newMissionDate} onChange={(event) => setNewMissionDate(event.target.value)} />
            <button onClick={createMission} disabled={creatingMission || !newMissionName.trim()}>
              {creatingMission ? 'Création...' : 'Créer mission'}
            </button>
            {createStatus ? <span className="create-status">{createStatus}</span> : null}
          </div>
        ) : null}
        {error ? <div className="mission-map-error">{error}</div> : null}
      </div>

      {missionInfo ? (
        <div className="mission-info-card">
          <div>
            <strong>{missionInfo.name}</strong>
            <div className="mission-info-pill">Statut : {missionInfo.status}</div>
          </div>
          <div className="mission-map-controls">
            <span className="mission-info-pill">Photos : {photoCount}</span>
            <span className="mission-info-pill">Détections : {detections?.features.length ?? 0}</span>
          </div>
        </div>
      ) : null}

      {missionInfo ? (
        <div className="mission-panel-grid">
          <div className="mission-upload-panel">
            <MissionDetails mission={missionInfo} />
            <div className="upload-form">
              <label htmlFor="photo-upload">Ajouter des photos</label>
              <input id="photo-upload" type="file" multiple accept="image/jpeg,image/png,image/tiff" onChange={handleFileChange} />
              <button onClick={uploadPhotos} disabled={uploading || !selectedFiles?.length}>
                {uploading ? 'Envoi en cours…' : 'Uploader les photos'}
              </button>
              <p className="upload-hint">Les images doivent contenir des coordonnées GPS EXIF pour être placées sur la carte.</p>
              {uploadStatus ? <p className="upload-status">{uploadStatus}</p> : null}
              {uploadErrors?.length ? (
                <ul className="upload-errors">{uploadErrors.map((message, index) => <li key={index}>{message}</li>)}</ul>
              ) : null}
            </div>
            {isAdmin ? (
              <>
                <div className="assignment-form">
                  <label htmlFor="mission-assignee">Collaborateur affecté</label>
                  <select id="mission-assignee" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
                    <option value="">Sélectionner un collaborateur</option>
                    {collaborators.map((collaborator) => <option key={collaborator.id} value={collaborator.id}>{collaborator.first_name || collaborator.last_name ? `${collaborator.first_name ?? ''} ${collaborator.last_name ?? ''}`.trim() : collaborator.email}</option>)}
                  </select>
                  <button onClick={assignCollaborator} disabled={!assigneeId}>Affecter la mission</button>
                  {assignmentStatus ? <p className="analysis-status">{assignmentStatus}</p> : null}
                </div>
                <div className="analysis-form">
                  <button onClick={triggerAnalysis} disabled={analyzing || !missionId.trim()}>
                    {analyzing ? 'Analyse en cours...' : 'Analyser avec IA'}
                  </button>
                  {analysisStatus ? <p className="analysis-status">{analysisStatus}</p> : null}
                </div>
              </>
            ) : null}
          </div>

          <div className="mission-photo-card">
            {report ? (
              <div className="mission-report-card">
                <h3>Rapport de mission</h3>
                <p><strong>Mission:</strong> {report.mission_name}</p>
                <p><strong>Statut:</strong> {report.status}</p>
                <p><strong>Photos:</strong> {report.photo_count}</p>
                <p><strong>Détections:</strong> {report.detection_count}</p>
                <p><strong>Haute confiance:</strong> {report.high_confidence_count}</p>
                <p><strong>Moyenne confiance:</strong> {report.medium_confidence_count}</p>
                <p><strong>Faible confiance:</strong> {report.low_confidence_count}</p>
                <p><strong>Résumé:</strong> {report.summary.confidence} · {report.summary.coverage}</p>
              </div>
            ) : null}

            {selectedPhoto ? (
              <>
                <h3>Détail de l’image</h3>
                {selectedPhoto.storage_url && !photoLoadError ? (
                  <img
                    src={resolvePhotoUrl(selectedPhoto.storage_url)}
                    alt={selectedPhoto.filename}
                    style={{ display: 'block' }}
                    onError={() => setPhotoLoadError(true)}
                  />
                ) : null}
                {photoLoadError || !selectedPhoto.storage_url ? (
                  <p className="upload-hint">L’image n’est pas accessible à cette URL. Vérifiez le backend et la configuration VITE_API_URL.</p>
                ) : null}
                <p><strong>Nom:</strong> {selectedPhoto.filename}</p>
                <p><strong>Alt:</strong> {selectedPhoto.altitude_m ?? 'N/A'} m</p>
                <p><strong>Coordonnées:</strong> {selectedPhoto.latitude?.toFixed(5) ?? 'N/A'}, {selectedPhoto.longitude?.toFixed(5) ?? 'N/A'}</p>
              </>
            ) : (
              <p className="upload-hint">Cliquez sur un marqueur photo sur la carte pour afficher l’image associée et son détail.</p>
            )}
          </div>
        </div>
      ) : null}

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="mission-map-container"
        style={{ height: '620px', width: '100%' }}
      >
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapAutoFit geojson={geojson} flightpath={flightpath} detections={detections} />
        {flightpath ? <GeoJSON data={flightpath as GeoJsonObject} style={{ color: '#ff7f00', weight: 4, opacity: 0.8 }} /> : null}
        {geojson ? (
          <GeoJSON
            data={geojson as GeoJsonObject}
            pointToLayer={(_, latlng) => L.marker(latlng)}
            onEachFeature={(feature, layer) => {
              const properties = feature.properties as Record<string, unknown>
              const title = escapeHtml((properties?.filename as string | undefined) || 'Photo')
              const url = properties?.storage_url as string | undefined
              const absoluteUrl = resolvePhotoUrl(url)
              const altitude = properties?.altitude_m ?? 'N/A'
              const latitude = feature.geometry.type === 'Point' ? (feature.geometry.coordinates[1] as number | undefined) : undefined
              const longitude = feature.geometry.type === 'Point' ? (feature.geometry.coordinates[0] as number | undefined) : undefined

              const popupContent = `<div><strong>${title}</strong><br/>Alt: ${altitude}m${absoluteUrl ? `<br/><img src="${absoluteUrl}" alt="${title}" style="max-width:220px; margin-top:8px;" onerror="this.onerror=null;this.style.display='none';this.parentNode.insertAdjacentHTML('beforeend','<div style=\'margin-top:8px;color:#64748b;font-size:12px;\'>Image non disponible</div>')"/>` : ''}</div>`
              layer.bindPopup(popupContent)
              layer.on('click', () => {
                setSelectedPhoto({
                  id: (properties?.id as string | undefined) ?? '',
                  filename: title,
                  storage_url: url,
                  altitude_m: typeof properties?.altitude_m === 'number' ? properties.altitude_m : null,
                  latitude,
                  longitude,
                })
              })
            }}
          />
        ) : null}
        {detections && detections.features.length > 0 ? (
          <GeoJSON
            data={detections as GeoJsonObject}
            pointToLayer={(feature, latlng) => {
              const color = (feature.properties as Record<string, unknown> | undefined)?.color || '#6b7280'
              return L.circleMarker(latlng, {
                radius: 12,
                fillColor: color as string,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.85,
              })
            }}
            onEachFeature={(feature, layer) => {
              const properties = feature.properties as Record<string, unknown>
              const species = properties?.species || 'Inconnu'
              const confidence = typeof properties?.confidence === 'number' ? `${(properties.confidence * 100).toFixed(1)}%` : 'N/A'
              const label = properties?.confidence_label || 'N/A'
              const popupContent = `<strong>${species}</strong><br/>Confiance: ${confidence} (${label})`
              layer.bindPopup(popupContent)
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  )
}
