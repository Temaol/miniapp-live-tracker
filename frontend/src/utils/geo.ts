/** Haversine formula — returns distance in metres */
export function calcDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000 // Earth radius in metres
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

/** Convert m/s → km/h, clamped to 0 */
export function msToKmh(ms: number): number {
  return Math.max(0, Math.round(ms * 3.6 * 10) / 10)
}

/** Format metres as "1.23 km" or "456 m" */
export function formatDistance(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(2)} км`
  return `${Math.round(metres)} м`
}

/** Format seconds as MM:SS or HH:MM:SS */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`
  }
  return `${pad(m)}:${pad(s)}`
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Speed colour: green → yellow → red */
export function speedColor(kmh: number): string {
  if (kmh < 30) return '#22c55e'
  if (kmh < 60) return '#eab308'
  if (kmh < 90) return '#f97316'
  return '#ef4444'
}
