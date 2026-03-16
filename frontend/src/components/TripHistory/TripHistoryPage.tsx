import { useNavigate } from 'react-router-dom'
import { useTripsStore } from '../../store'
import { formatDistance, formatDuration } from '../../utils/geo'
import type { Trip } from '../../types'

function TripCard({ trip, onOpen }: { trip: Trip; onOpen: () => void }) {
  const date = new Date(trip.startedAt)
  const dateStr = date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-gray-100
                 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{trip.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {dateStr} · {timeStr}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            trip.status === 'completed'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {trip.status === 'completed' ? 'Завершено' : 'Активний'}
        </span>
      </div>

      <div className="flex gap-3 mt-3">
        <Stat label="Відстань" value={formatDistance(trip.distance)} />
        <Stat label="Час" value={formatDuration(trip.duration)} />
        <Stat label="Макс." value={`${Math.round(trip.maxSpeed)} км/г`} />
        <Stat label="Сер." value={`${Math.round(trip.avgSpeed)} км/г`} />
      </div>
    </button>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-sm font-semibold text-gray-800">{value}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  )
}

export function TripHistoryPage() {
  const navigate = useNavigate()
  const { trips } = useTripsStore()

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-12 pb-4 bg-white border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="text-blue-500 text-sm">
          ← Назад
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-gray-900">
          Мої трипи
        </h1>
        <span className="text-xs text-gray-400 w-12 text-right">
          {trips.length} трипів
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <span className="text-5xl mb-3">🗺</span>
            <p className="text-gray-600 font-medium">Ще немає трипів</p>
            <p className="text-sm text-gray-400 mt-1">
              Почніть трекінг, щоб зберегти ваш перший маршрут
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium"
            >
              Розпочати трип
            </button>
          </div>
        ) : (
          trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onOpen={() => navigate(`/trip/${trip.id}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}
