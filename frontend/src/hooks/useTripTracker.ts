import { useCallback, useEffect, useRef } from 'react'
import { useTrackingStore, useTripsStore, useTimerStore } from '../store'
import { useGeolocation } from './useGeolocation'
import type { TelegramUser } from '../types'

export function useTripTracker(user: TelegramUser | null) {
  const tracking = useTrackingStore()
  const { addTrip } = useTripsStore()
  const { tick, reset: resetTimer } = useTimerStore()
  const geo = useGeolocation()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Feed GPS coordinates into the store
  useEffect(() => {
    if (geo.position && tracking.isTracking && !tracking.isPaused) {
      tracking.addCoordinate(geo.position)
    }
  }, [geo.position]) // eslint-disable-line react-hooks/exhaustive-deps

  // Start / stop the 1-second timer
  useEffect(() => {
    if (tracking.isTracking && !tracking.isPaused) {
      timerRef.current = setInterval(() => {
        tick()
        useTrackingStore.setState((s) => ({ elapsedTime: s.elapsedTime + 1 }))
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [tracking.isTracking, tracking.isPaused, tick])

  const start = useCallback(() => {
    if (!user) return
    resetTimer()
    tracking.startTracking(user)
    geo.startWatching()
  }, [user, tracking, geo, resetTimer])

  const pause = useCallback(() => {
    tracking.pauseTracking()
  }, [tracking])

  const resume = useCallback(() => {
    tracking.resumeTracking()
  }, [tracking])

  const stop = useCallback(() => {
    geo.stopWatching()
    const completedTrip = tracking.stopTracking()
    if (completedTrip) {
      addTrip(completedTrip)
    }
    resetTimer()
    return completedTrip
  }, [tracking, geo, addTrip, resetTimer])

  return {
    isTracking: tracking.isTracking,
    isPaused: tracking.isPaused,
    currentPosition: tracking.currentPosition,
    currentSpeed: tracking.currentSpeed,
    totalDistance: tracking.totalDistance,
    elapsedTime: tracking.elapsedTime,
    currentTrip: tracking.currentTrip,
    geoStatus: geo.status,
    geoError: geo.error,
    start,
    pause,
    resume,
    stop,
  }
}
