import { useCallback, useEffect, useRef, useState } from 'react'
import type { Coordinate } from '../types'

export type GeolocationStatus = 'idle' | 'pending' | 'watching' | 'error'

export interface UseGeolocationReturn {
  position: Coordinate | null
  status: GeolocationStatus
  error: string | null
  startWatching: () => void
  stopWatching: () => void
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 2_000,
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<Coordinate | null>(null)
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setStatus('idle')
  }, [])

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Геолокація не підтримується браузером')
      setStatus('error')
      return
    }

    setStatus('pending')
    setError(null)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coord: Coordinate = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: pos.timestamp,
          speed: pos.coords.speed,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
        }
        setPosition(coord)
        setStatus('watching')
        setError(null)
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Доступ до геолокації заборонено. Будь ласка, дозвольте доступ у налаштуваннях.',
          2: 'Геолокація недоступна. Перевірте ваше GPS-з\'єднання.',
          3: 'Перевищено час очікування геолокації.',
        }
        setError(messages[err.code] ?? 'Помилка геолокації')
        setStatus('error')
      },
      GEO_OPTIONS,
    )
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { position, status, error, startWatching, stopWatching }
}
