interface TrackingControlsProps {
  isTracking: boolean
  isPaused: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  disabled?: boolean
}

export function TrackingControls({
  isTracking,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled = false,
}: TrackingControlsProps) {
  if (!isTracking) {
    return (
      <button
        onClick={onStart}
        disabled={disabled}
        className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg
                   active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed
                   shadow-lg shadow-blue-500/30"
      >
        🚗 Почати трекінг
      </button>
    )
  }

  return (
    <div className="flex gap-3">
      {isPaused ? (
        <button
          onClick={onResume}
          className="flex-1 py-4 rounded-2xl bg-green-500 text-white font-semibold text-base
                     active:scale-95 transition-transform shadow-lg shadow-green-500/30"
        >
          ▶ Продовжити
        </button>
      ) : (
        <button
          onClick={onPause}
          className="flex-1 py-4 rounded-2xl bg-yellow-500 text-white font-semibold text-base
                     active:scale-95 transition-transform shadow-lg shadow-yellow-500/30"
        >
          ⏸ Пауза
        </button>
      )}
      <button
        onClick={onStop}
        className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-semibold text-base
                   active:scale-95 transition-transform shadow-lg shadow-red-500/30"
      >
        ⏹ Зупинити
      </button>
    </div>
  )
}
