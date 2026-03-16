import { formatDistance, formatDuration } from '../../utils/geo'

interface SpeedDisplayProps {
  speed: number        // km/h
  maxSpeed: number     // km/h
  avgSpeed?: number    // km/h
}

export function SpeedDisplay({ speed, maxSpeed, avgSpeed }: SpeedDisplayProps) {
  const speedColor =
    speed < 30 ? 'text-green-500' :
    speed < 60 ? 'text-yellow-500' :
    speed < 90 ? 'text-orange-500' : 'text-red-500'

  return (
    <div className="flex items-end justify-between">
      {/* Current speed — big */}
      <div className="flex flex-col items-center">
        <span className={`text-6xl font-bold tabular-nums ${speedColor}`}>
          {Math.round(speed)}
        </span>
        <span className="text-xs text-gray-500 -mt-1">км/год</span>
      </div>

      {/* Max / avg — small */}
      <div className="flex flex-col gap-1 text-right">
        <div>
          <span className="text-xs text-gray-400">Макс.</span>
          <span className="ml-1 text-sm font-semibold text-gray-700">
            {Math.round(maxSpeed)} км/год
          </span>
        </div>
        {avgSpeed !== undefined && (
          <div>
            <span className="text-xs text-gray-400">Сер.</span>
            <span className="ml-1 text-sm font-semibold text-gray-700">
              {Math.round(avgSpeed)} км/год
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

interface TripStatsProps {
  distance: number    // metres
  duration: number    // seconds
}

export function TripStats({ distance, duration }: TripStatsProps) {
  return (
    <div className="flex gap-4 mt-2">
      <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-xl font-bold text-gray-800">{formatDistance(distance)}</p>
        <p className="text-xs text-gray-400 mt-0.5">Відстань</p>
      </div>
      <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-xl font-bold text-gray-800">{formatDuration(duration)}</p>
        <p className="text-xs text-gray-400 mt-0.5">Час</p>
      </div>
    </div>
  )
}
