import { useEffect, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet'
import type { FeatureCollection, GeoJsonObject } from 'geojson'
import axios from 'axios'
import L from 'leaflet'

import { MapAutoFit } from './MapAutoFit'
import { MissionDetails } from './MissionDetails'
import { MissionSelector } from './MissionSelector'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER: [number, number] = [13.5137, 2.1168]
const DEFAULT_ZOOM = 8

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface MissionInfo {
  id: string
  name: string
  description?: string
  status: string
  mission_date?: string
  zone_id?: string
  operator_id?: string
  notes?: string
  created_at: string
  completed_at?: string
}

export function MissionMap() {
  const [missionId, setMissionId] = useState('')
  const [missionInfo, setMissionInfo] = useState<MissionInfo | null>(null)
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null)
  const [flightpath, setFlightpath] = useState<FeatureCollection | null>(null)
  const [detections, setDetections] = useState<FeatureCollection | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [uploadErrors, setUploadErrors] = useState<string[] | null>(null)
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null)
  const [createStatus, setCreateStatus] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [newMissionName, setNewMissionName] = useState('')
  const [newMissionDate, setNewMissionDate] = useState('')
  const [missionsRefreshKey, setMissionsRefreshKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [creatingMission, setCreatingMission] = useState(false)

  useEffect(() => {
    if (!missionId) {
      setMissionInfo(null)
      setGeojson(null)
      setFlightpath(null)
      setDetections(null)
      setError(null)
      setAnalysisStatus(null)
    }
  }, [missionId])

  async function loadMission() {
    setUploadStatus(null)
    setUploadErrors(null)

    if (!missionId.trim()) {
      setError('Entrez un id de mission valide')
      setMissionInfo(null)
      setGeojson(null)
      setFlightpath(null)
      setDetections(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [missionResponse, photoResponse, pathResponse, detectionsResponse] = await Promise.all([
        axios.get<MissionInfo>(`${apiUrl}/api/v1/missions/${missionId}`),
        axios.get<FeatureCollection>(`${apiUrl}/api/v1/missions/${missionId}/geojson`),
        axios.get<FeatureCollection>(`${apiUrl}/api/v1/missions/${missionId}/flightpath`),
        axios.get<FeatureCollection>(`${apiUrl}/api/v1/ai/missions/${missionId}/detections`),
      ])

      setMissionInfo(missionResponse.data)
      setGeojson(photoResponse.data)
      setFlightpath(pathResponse.data)
      setDetections(detectionsResponse.data)

      if (!photoResponse.data.features.length) {
        setError('Aucune photo trouvée pour cette mission')
      }
    } catch (err) {
      setMissionInfo(null)
      setGeojson(null)
      setFlightpath(null)
      setDetections(null)
      setError(
        axios.isAxiosError(err) && err.response
          ? `Erreur API ${err.response.status}`
          : 'Impossible de charger la mission',
      )
    } finally {
      setLoading(false)
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
      const { data } = await axios.post<MissionInfo>(`${apiUrl}/api/v1/missions/`, payload)
      setMissionId(data.id)
      setMissionInfo(data)
      setGeojson({ type: 'FeatureCollection', features: [] })
      setFlightpath({ type: 'FeatureCollection', features: [] })
      setDetections({ type: 'FeatureCollection', features: [] })
      setNewMissionName('')
      setNewMissionDate('')
      setMissionsRefreshKey((value) => value + 1)
      setCreateStatus('Mission créée')
    } catch (err) {
      setCreateStatus(
        axios.isAxiosError(err) && err.response
          ? `Erreur API ${err.response.status}`
          : 'Impossible de créer la mission',
      )
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
      const response = await axios.post(`${apiUrl}/api/v1/missions/${missionId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setUploadStatus(`Upload réussi (${response.data.uploaded.length} fichiers)`)
      if (response.data.errors?.length) {
        setUploadErrors(response.data.errors.map((item: any) => `${item.file}: ${item.error}`))
      }
      await loadMission()
    } catch (err) {
      setUploadStatus(null)
      setUploadErrors([
        axios.isAxiosError(err) && err.response
          ? `Erreur API ${err.response.status}`
          : 'Impossible d’uploader les photos',
      ])
    } finally {
      setUploading(false)
    }
  }

  async function triggerAnalysis() {
    if (!missionId.trim()) {
      setAnalysisStatus(null)
      setError('Entrez un id de mission valide')
      return
    }

    setAnalyzing(true)
    setAnalysisStatus('Analyse IA en cours...')
    setError(null)

    try {
      const { data } = await axios.post(`${apiUrl}/api/v1/ai/analyze/${missionId}`)
      const taskId = data.task_id

      for (let attempt = 0; attempt < 120; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        const { data: taskData } = await axios.get(`${apiUrl}/api/v1/ai/tasks/${taskId}`)

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
      setError(
        axios.isAxiosError(err) && err.response
          ? `Erreur API ${err.response.status}`
          : 'Impossible de lancer l’analyse IA',
      )
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="mission-map-wrapper">
      <div className="mission-map-header">
        <h1>Carte Mission JACIGREEN</h1>
        <div className="mission-map-controls">
          <MissionSelector value={missionId} onChange={setMissionId} refreshKey={missionsRefreshKey} />
          <button onClick={loadMission} disabled={loading || !missionId.trim()}>
            {loading ? 'Chargement…' : 'Charger'}
          </button>
        </div>
        <div className="mission-create-form">
          <input
            type="text"
            placeholder="Nom de la nouvelle mission"
            value={newMissionName}
            onChange={(event) => setNewMissionName(event.target.value)}
          />
          <input
            type="datetime-local"
            value={newMissionDate}
            onChange={(event) => setNewMissionDate(event.target.value)}
          />
          <button onClick={createMission} disabled={creatingMission || !newMissionName.trim()}>
            {creatingMission ? 'Création...' : 'Créer mission'}
          </button>
          {createStatus ? <span className="create-status">{createStatus}</span> : null}
        </div>
        {error ? <div className="mission-map-error">{error}</div> : null}
      </div>

      {missionInfo && (
        <div className="mission-upload-panel">
          <MissionDetails mission={missionInfo} />
          <div className="upload-form">
            <label htmlFor="photo-upload">Ajouter des photos à cette mission</label>
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/tiff"
              onChange={handleFileChange}
            />
            <button onClick={uploadPhotos} disabled={uploading || !selectedFiles?.length}>
              {uploading ? 'Envoi en cours…' : 'Uploader les photos'}
            </button>
            <p className="upload-hint">
              Les images doivent contenir des coordonnées GPS EXIF pour être placées sur la carte.
            </p>
            {uploadStatus ? <p className="upload-status">{uploadStatus}</p> : null}
            {uploadErrors?.length ? (
              <ul className="upload-errors">
                {uploadErrors.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="analysis-form">
            <button onClick={triggerAnalysis} disabled={analyzing || !missionId.trim()}>
              {analyzing ? 'Analyse en cours...' : 'Analyser avec IA'}
            </button>
            {analysisStatus ? <p className="analysis-status">{analysisStatus}</p> : null}
          </div>
        </div>
      )}

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="mission-map-container"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapAutoFit geojson={geojson} flightpath={flightpath} detections={detections} />
        {flightpath && (
          <GeoJSON
            data={flightpath as GeoJsonObject}
            style={{ color: '#ff7f00', weight: 4, opacity: 0.8 }}
          />
        )}
        {geojson && (
          <GeoJSON
            data={geojson as GeoJsonObject}
            pointToLayer={(_, latlng) => L.marker(latlng)}
            onEachFeature={(feature, layer) => {
              const properties = feature.properties as Record<string, unknown>
              const title = properties?.filename || 'Photo'
              const url = properties?.storage_url as string | undefined
              const altitude = properties?.altitude_m ?? 'N/A'
              const popupContent = `<strong>${title}</strong><br/>Alt: ${altitude}m${
                url ? `<br/><img src="${url}" alt="photo" style="max-width:220px; margin-top:8px;"/>` : ''
              }`
              layer.bindPopup(popupContent)
            }}
          />
        )}
        {detections && detections.features.length > 0 && (
          <GeoJSON
            data={detections as GeoJsonObject}
            pointToLayer={(feature, latlng) => {
              const color = feature.properties?.color || '#6b7280'
              return L.circleMarker(latlng, {
                radius: 12,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.85,
              })
            }}
            onEachFeature={(feature, layer) => {
              const properties = feature.properties as Record<string, unknown>
              const species = properties?.species || 'Inconnu'
              const confidence =
                typeof properties?.confidence === 'number'
                  ? `${(properties.confidence * 100).toFixed(1)}%`
                  : 'N/A'
              const label = properties?.confidence_label || 'N/A'
              const popupContent = `<strong>${species}</strong><br/>Confiance: ${confidence} (${label})`
              layer.bindPopup(popupContent)
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}
