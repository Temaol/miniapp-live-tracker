// Core geo types
export interface Coordinate {
  lat: number
  lng: number
  timestamp: number
  speed: number | null      // m/s from Geolocation API
  accuracy: number
  altitude: number | null
}

// A segment is one "leg" of the route — can be shared/viewed by others
export interface Segment {
  id: string
  tripId: string
  name: string
  startCoord: Coordinate
  endCoord: Coordinate
  distance: number          // metres
  duration: number          // seconds
  avgSpeed: number          // km/h
  maxSpeed: number          // km/h
  path: Coordinate[]
  createdAt: string         // ISO date
  userId: string
  username: string
  isPublic: boolean
}

// A full trip — owned by a user
export interface Trip {
  id: string
  userId: string
  username: string
  name: string
  status: 'active' | 'paused' | 'completed'
  startedAt: string
  finishedAt: string | null
  path: Coordinate[]
  distance: number          // metres
  duration: number          // seconds
  avgSpeed: number          // km/h
  maxSpeed: number          // km/h
  segments: Segment[]
}

// Tracking state (in-progress trip)
export interface TrackingState {
  isTracking: boolean
  isPaused: boolean
  currentTrip: Trip | null
  currentPosition: Coordinate | null
  currentSpeed: number       // km/h
  totalDistance: number      // metres
  elapsedTime: number        // seconds
  watchId: number | null
}

// Telegram user from WebApp
export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

// Paginated list response from backend
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
