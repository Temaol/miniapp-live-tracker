import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet'
import type { Coordinate } from '../../types'
import { speedColor, msToKmh } from '../../utils/geo'

// ── Coloured route with speed tooltips ──────────────────────────────────────
function SpeedRoute({ path }: { path: Coordinate[] }) {
  if (path.length < 2) return null
  return (
    <>
      {path.slice(1).map((coord, i) => {
        const kmh = msToKmh(coord.speed ?? 0)
        return (
          <Polyline
            key={i}
            positions={[
              [path[i].lat, path[i].lng],
              [coord.lat, coord.lng],
            ]}
            pathOptions={{ color: speedColor(kmh), weight: 5, opacity: 0.85 }}
          >
            <Tooltip sticky>{kmh} км/год</Tooltip>
          </Polyline>
        )
      })}
    </>
  )
}

interface TripMapProps {
  path: Coordinate[]
  height?: string
}

export function TripMap({ path, height = '100%' }: TripMapProps) {
  if (path.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-xl text-gray-400 text-sm"
        style={{ height }}
      >
        Немає даних маршруту
      </div>
    )
  }

  // Compute bounds
  const lats = path.map((c) => c.lat)
  const lngs = path.map((c) => c.lng)
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden">
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [30, 30] }}
        zoomControl={true}
        attributionControl={false}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <SpeedRoute path={path} />

        {/* Start */}
        <CircleMarker
          center={[path[0].lat, path[0].lng]}
          radius={8}
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }}
        >
          <Tooltip permanent>Старт</Tooltip>
        </CircleMarker>

        {/* End */}
        <CircleMarker
          center={[path[path.length - 1].lat, path[path.length - 1].lng]}
          radius={8}
          pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1 }}
        >
          <Tooltip permanent>Фініш</Tooltip>
        </CircleMarker>
      </MapContainer>
    </div>
  )
}
