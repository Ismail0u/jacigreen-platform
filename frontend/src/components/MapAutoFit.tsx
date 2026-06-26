import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { FeatureCollection } from 'geojson'
import L from 'leaflet'

interface MapAutoFitProps {
  geojson: FeatureCollection | null
  flightpath: FeatureCollection | null
  detections?: FeatureCollection | null
}

/**
 * mapAutoFit is a React component that automatically adjusts the map view to fit the provided GeoJSON features, flightpath, and detections. It uses the Leaflet library to calculate the bounds of the features and sets the map view accordingly. If no features are provided, it defaults to a predefined view.
 * selectedGeojson, selectedFlightpath, and selectedDetections are determined based on the presence of features in the provided GeoJSON objects. The component uses the useEffect hook to perform the fitting operation whenever the input props change.
 * The component handles potential errors during the fitting process and logs warnings if it is unable to recenter the map on the provided features. The map view is set with a padding of 50 pixels to ensure that the features are comfortably visible within the viewport.
 * automatic map fitting is particularly useful in applications where the user needs to visualize spatial data, such as drone surveillance missions, and ensures that the relevant features are always in view.
 * @param param0 
 * @returns 
 */
export function MapAutoFit({ geojson, flightpath, detections }: MapAutoFitProps) {
  const map = useMap()

  useEffect(() => {
    const selectedGeojson = geojson?.features?.length ? geojson : null
    const selectedFlightpath = flightpath?.features?.length ? flightpath : null
    const selectedDetections = detections?.features?.length ? detections : null

    if (selectedGeojson || selectedDetections) {
      try {
        const featureCollections = [selectedGeojson, selectedDetections].filter(Boolean)
        const group = L.featureGroup(
          featureCollections.map((featureCollection) => L.geoJSON(featureCollection!)),
        )
        map.fitBounds(group.getBounds(), { padding: [50, 50] })
        return
      } catch (err) {
        console.warn('Unable to recenter map on mission points', err)
      }
    }

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
  }, [geojson, flightpath, detections, map])

  return null
}
