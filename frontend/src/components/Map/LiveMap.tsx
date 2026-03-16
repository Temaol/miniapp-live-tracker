import { useEffect, useState } from 'react'
import { MapContainer, Polyline, CircleMarker, useMap } from 'react-leaflet'
import type { Coordinate } from '../../types'
import { speedColor } from '../../utils/geo'
import { ActiveTileLayer, MapLayerSwitcher } from './MapLayerSwitcher'

// ── Auto-follow current position ────────────────────────────────────────────
function MapFollower({ position }: { position: Coordinate | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], Math.max(map.getZoom(), 16), {
        animate: true,
      })
    }
  }, [position, map])
  return null
}

// ── Coloured route segments (speed-based) ───────────────────────────────────
function SpeedPolyline({ path }: { path: Coordinate[] }) {
  if (path.length < 2) return null

  const segments = path.slice(1).map((coord, i) => ({
    positions: [
      [path[i].lat, path[i].lng],
      [coord.lat, coord.lng],
    ] as [number, number][],
    color: speedColor((coord.speed ?? 0) * 3.6),
  }))

  return (
    <>
      {segments.map((seg, i) => (
        <Polyline
          key={i}
          positions={seg.positions}
          pathOptions={{ color: seg.color, weight: 5, opacity: 0.85 }}
        />
      ))}
    </>
  )
}

// ── Main live-tracking map ───────────────────────────────────────────────────
interface LiveMapProps {
  path: Coordinate[]
  currentPosition: Coordinate | null
  isTracking: boolean
}

export function LiveMap({ path, currentPosition, isTracking }: LiveMapProps) {
  const [layerId, setLayerId] = useState('osm')

  const center: [number, number] = currentPosition
    ? [currentPosition.lat, currentPosition.lng]
    : [50.4501, 30.5234] // default: Kyiv

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={15}
        zoomControl={false}
        attributionControl={true}
        className="w-full h-full"
      >
        <ActiveTileLayer layerId={layerId} />

      {/* Speed-colored route */}
      <SpeedPolyline path={path} />

      {/* Start marker */}
      {path.length > 0 && (
        <CircleMarker
          center={[path[0].lat, path[0].lng]}
          radius={8}
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }}
        />
      )}

      {/* Current position dot */}
      {currentPosition && isTracking && (
        <CircleMarker
          center={[currentPosition.lat, currentPosition.lng]}
          radius={10}
          pathOptions={{ color: '#3b82f6', fillColor: '#60a5fa', fillOpacity: 1, weight: 3 }}
        />
      )}

      {/* Auto-follow */}
      {isTracking && <MapFollower position={currentPosition} />}
    </MapContainer>

    <MapLayerSwitcher layerId={layerId} onChange={setLayerId} />
  </div>
  )
}
