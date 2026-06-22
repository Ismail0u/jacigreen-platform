import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { FeatureCollection } from 'geojson'
import L from 'leaflet'

interface MapAutoFitProps {
  geojson: FeatureCollection | null
  flightpath: FeatureCollection | null
}

export function MapAutoFit({ geojson, flightpath }: MapAutoFitProps) {
  const map = useMap()

  useEffect(() => {
    const selectedGeojson = geojson?.features?.length ? geojson : null
    const selectedFlightpath = flightpath?.features?.length ? flightpath : null

    if (selectedGeojson) {
      try {
        const layer = L.geoJSON(selectedGeojson)
        map.fitBounds(layer.getBounds(), { padding: [50, 50] })
        return
      } catch (err) {
        console.warn('Unable to recenter map on mission points', err)
      }
    }

    if (selectedFlightpath) {
      try {
        const layer = L.geoJSON(selectedFlightpath)
        map.fitBounds(layer.getBounds(), { padding: [50, 50] })
        return
      } catch (err) {
        console.warn('Unable to recenter map on mission flightpath', err)
      }
    }

    map.setView([13.5137, 2.1168], 8)
  }, [geojson, flightpath, map])

  return null
}
