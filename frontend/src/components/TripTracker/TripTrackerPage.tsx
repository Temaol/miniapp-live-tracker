import { useNavigate } from 'react-router-dom'
import { useTripTracker } from '../../hooks/useTripTracker'
import { useTelegram } from '../../hooks/useTelegram'
import { LiveMap } from '../Map/LiveMap'
import { SpeedDisplay, TripStats } from './SpeedDisplay'
import { TrackingControls } from './TrackingControls'

export function TripTrackerPage() {
  const navigate = useNavigate()
  const { user, hapticImpact, hapticNotification } = useTelegram()
  const tracker = useTripTracker(user)

  const path = tracker.currentTrip?.path ?? []

  // Use reduce to avoid stack overflow on large path arrays
  const maxSpeed = path.reduce((max, c) => Math.max(max, (c.speed ?? 0) * 3.6), 0)

  // Average speed over moving points only (excludes stops at traffic lights etc.)
  const movingPoints = path.filter((c) => (c.speed ?? 0) > 0)
  const avgSpeed = movingPoints.length > 0
    ? movingPoints.reduce((sum, c) => sum + (c.speed! * 3.6), 0) / movingPoints.length
    : 0

  function handleStart() {
    hapticImpact('medium')
    tracker.start()
  }

  function handlePause() {
    hapticImpact('light')
    tracker.pause()
  }

  function handleResume() {
    hapticImpact('light')
    tracker.resume()
  }

  function handleStop() {
    hapticNotification('success')
    const trip = tracker.stop()
    if (trip) {
      navigate(`/trip/${trip.id}`)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold text-gray-900">TripRoute</h1>

        {/* GPS status */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              tracker.geoStatus === 'watching' ? 'bg-green-500 live-dot' :
              tracker.geoStatus === 'pending' ? 'bg-yellow-500' :
              tracker.geoStatus === 'error'   ? 'bg-red-500' : 'bg-gray-400'
            }`}
          />
          <span className="text-xs text-gray-500">
            {tracker.geoStatus === 'watching' ? 'GPS активний' :
             tracker.geoStatus === 'pending'  ? 'Очікування GPS…' :
             tracker.geoStatus === 'error'    ? 'GPS помилка' : 'GPS вимкнено'}
          </span>
        </div>

        <button
          onClick={() => navigate('/history')}
          className="text-blue-500 text-sm font-medium"
        >
          Мої трипи →
        </button>
      </div>

      {/* GPS error */}
      {tracker.geoError && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
          {tracker.geoError}
        </div>
      )}

      {/* Map — takes all available space */}
      <div className="flex-1 mx-4 rounded-2xl overflow-hidden shadow-md min-h-0">
        <LiveMap
          path={path}
          currentPosition={tracker.currentPosition}
          isTracking={tracker.isTracking}
        />
      </div>

      {/* Bottom panel */}
      <div className="px-4 pt-3 pb-6 space-y-3">
        {tracker.isTracking && (
          <>
            <SpeedDisplay
              speed={tracker.currentSpeed}
              maxSpeed={maxSpeed}
              avgSpeed={avgSpeed}
            />
            <TripStats
              distance={tracker.totalDistance}
              duration={tracker.elapsedTime}
            />
          </>
        )}

        <TrackingControls
          isTracking={tracker.isTracking}
          isPaused={tracker.isPaused}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          disabled={tracker.geoStatus === 'pending'}
        />
      </div>
    </div>
  )
}
