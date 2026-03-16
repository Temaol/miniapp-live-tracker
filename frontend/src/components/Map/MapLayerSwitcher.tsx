import { useState } from 'react'
import { TileLayer } from 'react-leaflet'

export interface MapLayer {
  id: string
  label: string
  url: string
  attribution: string
  maxZoom: number
}

export const MAP_LAYERS: MapLayer[] = [
  {
    id: 'osm',
    label: 'Схема',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  {
    id: 'satellite',
    label: 'Супутник',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>',
    maxZoom: 19,
  },
  {
    id: 'topo',
    label: 'Рельєф',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  {
    id: 'dark',
    label: 'Темна',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com">CARTO</a>',
    maxZoom: 19,
  },
]

// ── Active tile layer (swaps when layerId changes) ──────────────────────────
export function ActiveTileLayer({ layerId }: { layerId: string }) {
  const layer = MAP_LAYERS.find((l) => l.id === layerId) ?? MAP_LAYERS[0]
  return (
    <TileLayer
      key={layerId}           // forces remount on change
      url={layer.url}
      attribution={layer.attribution}
      maxZoom={layer.maxZoom}
    />
  )
}

// ── Layer switcher button overlay ───────────────────────────────────────────
interface MapLayerSwitcherProps {
  layerId: string
  onChange: (id: string) => void
}

export function MapLayerSwitcher({ layerId, onChange }: MapLayerSwitcherProps) {
  const [open, setOpen] = useState(false)

  return (
    // Positioned absolute inside the map wrapper
    <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-1">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center
                   border border-gray-200 active:scale-95 transition-transform"
        title="Шари карти"
      >
        <LayersIcon />
      </button>

      {/* Layer list */}
      {open && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden slide-up">
          {MAP_LAYERS.map((layer) => (
            <button
              key={layer.id}
              onClick={() => { onChange(layer.id); setOpen(false) }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors
                          ${layerId === layer.id
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
            >
              <LayerDot id={layer.id} />
              {layer.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

function LayerDot({ id }: { id: string }) {
  const colors: Record<string, string> = {
    osm: '#3b82f6',
    satellite: '#10b981',
    topo: '#8b5cf6',
    dark: '#1f2937',
  }
  return (
    <span
      className="w-3 h-3 rounded-full flex-shrink-0"
      style={{ backgroundColor: colors[id] ?? '#9ca3af' }}
    />
  )
}
