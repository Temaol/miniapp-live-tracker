import { useNavigate, useParams } from 'react-router-dom'
import { useTripsStore } from '../../store'
import { TripMap } from '../Map/TripMap'
import { formatDistance, formatDuration } from '../../utils/geo'
import { api } from '../../services/api'
import { useTelegram } from '../../hooks/useTelegram'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center min-w-0">
      <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

export function TripDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { trips, removeTrip } = useTripsStore()
  const { user, hapticNotification } = useTelegram()

  const trip = trips.find((t) => t.id === id)

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <span className="text-5xl mb-3">🔍</span>
        <p className="text-gray-600 font-medium">Трип не знайдено</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-500 text-sm">
          На головну
        </button>
      </div>
    )
  }

  async function handleShare() {
    hapticNotification('success')
    try {
      await api.saveTrip(trip!, user!)
      alert('Трип збережено та поширено!')
    } catch {
      alert('Помилка збереження. Перевірте з\'єднання.')
    }
  }

  function handleDelete() {
    if (confirm('Видалити цей трип?')) {
      removeTrip(trip!.id)
      navigate('/history')
    }
  }

  const startDate = new Date(trip.startedAt).toLocaleString('uk-UA', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-12 pb-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="text-blue-500 text-sm">
          ← Назад
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-gray-900 truncate">
          {trip.name}
        </h1>
        <button onClick={handleDelete} className="text-red-400 text-sm">
          🗑
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Map */}
        <div className="px-4 pt-4">
          <TripMap path={trip.path} height="260px" />
        </div>

        {/* Stats */}
        <div className="px-4 mt-4">
          <p className="text-xs text-gray-400 mb-2">{startDate}</p>

          <div className="flex gap-2 mb-2">
            <StatCard label="Відстань" value={formatDistance(trip.distance)} />
            <StatCard label="Час" value={formatDuration(trip.duration)} />
          </div>
          <div className="flex gap-2 mb-2">
            <StatCard
              label="Макс. швидкість"
              value={`${Math.round(trip.maxSpeed)}`}
              sub="км/год"
            />
            <StatCard
              label="Сер. швидкість"
              value={`${Math.round(trip.avgSpeed)}`}
              sub="км/год"
            />
          </div>
          <div className="flex gap-2">
            <StatCard label="Точок GPS" value={String(trip.path.length)} />
            <StatCard
              label="Статус"
              value={trip.status === 'completed' ? '✅ Завершено' : '🔄 В процесі'}
            />
          </div>
        </div>

        {/* Speed chart — simple bar representation */}
        {trip.path.length > 2 && (
          <div className="px-4 mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Профіль швидкості
            </p>
            <SpeedChart path={trip.path} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-8 pt-4 border-t border-gray-100 flex gap-3">
        <button
          onClick={handleShare}
          className="flex-1 py-3 rounded-2xl bg-blue-500 text-white font-medium text-sm
                     active:scale-95 transition-transform shadow-lg shadow-blue-500/30"
        >
          📤 Поширити трип
        </button>
      </div>
    </div>
  )
}

// ── Inline speed bar chart ───────────────────────────────────────────────────
import type { Coordinate } from '../../types'

function SpeedChart({ path }: { path: Coordinate[] }) {
  // Downsample to at most 60 bars
  const step = Math.max(1, Math.floor(path.length / 60))
  const samples = path.filter((_, i) => i % step === 0)
  const maxKmh = Math.max(...samples.map((c) => (c.speed ?? 0) * 3.6), 1)

  return (
    <div className="flex items-end gap-0.5 h-16 bg-gray-50 rounded-xl px-2 py-2">
      {samples.map((c, i) => {
        const kmh = (c.speed ?? 0) * 3.6
        const pct = Math.round((kmh / maxKmh) * 100)
        const color =
          kmh < 30 ? '#22c55e' :
          kmh < 60 ? '#eab308' :
          kmh < 90 ? '#f97316' : '#ef4444'
        return (
          <div
            key={i}
            className="flex-1 rounded-sm min-w-0"
            style={{ height: `${pct}%`, backgroundColor: color, minHeight: 2 }}
          />
        )
      })}
    </div>
  )
}
