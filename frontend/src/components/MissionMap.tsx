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
  const [error, setError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [uploadErrors, setUploadErrors] = useState<string[] | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!missionId) {
      setMissionInfo(null)
      setGeojson(null)
      setFlightpath(null)
      setError(null)
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
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [missionResponse, photoResponse, pathResponse] = await Promise.all([
        axios.get<MissionInfo>(`${apiUrl}/api/v1/missions/${missionId}`),
        axios.get<FeatureCollection>(`${apiUrl}/api/v1/missions/${missionId}/geojson`),
        axios.get<FeatureCollection>(`${apiUrl}/api/v1/missions/${missionId}/flightpath`),
      ])

      setMissionInfo(missionResponse.data)
      setGeojson(photoResponse.data)
      setFlightpath(pathResponse.data)

      if (!photoResponse.data.features.length) {
        setError('Aucune photo trouvée pour cette mission')
      }
    } catch (err) {
      setMissionInfo(null)
      setGeojson(null)
      setFlightpath(null)
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

  return (
    <div className="mission-map-wrapper">
      <div className="mission-map-header">
        <h1>Carte Mission JACIGREEN</h1>
        <div className="mission-map-controls">
          <MissionSelector value={missionId} onChange={setMissionId} />
          <button onClick={loadMission} disabled={loading || !missionId.trim()}>
            {loading ? 'Chargement…' : 'Charger'}
          </button>
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
            {uploadStatus ? <p className="upload-status">{uploadStatus}</p> : null}
            {uploadErrors?.length ? (
              <ul className="upload-errors">
                {uploadErrors.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            ) : null}
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
        <MapAutoFit geojson={geojson} flightpath={flightpath} />
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
      </MapContainer>
    </div>
  )
}
