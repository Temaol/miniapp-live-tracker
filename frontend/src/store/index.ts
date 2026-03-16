import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Trip, TrackingState, Coordinate, TelegramUser } from '../types'
import { nanoid } from '../utils/nanoid'
import { calcDistance, msToKmh } from '../utils/geo'

// ── Tracking slice ──────────────────────────────────────────────────────────

interface TrackingActions {
  startTracking: (user: TelegramUser) => void
  pauseTracking: () => void
  resumeTracking: () => void
  stopTracking: () => Trip | null
  addCoordinate: (coord: Coordinate) => void
  setWatchId: (id: number) => void
  clearWatchId: () => void
}

type TrackingStore = TrackingState & TrackingActions

export const useTrackingStore = create<TrackingStore>()((set, get) => ({
  isTracking: false,
  isPaused: false,
  currentTrip: null,
  currentPosition: null,
  currentSpeed: 0,
  totalDistance: 0,
  elapsedTime: 0,
  watchId: null,

  startTracking: (user) => {
    const trip: Trip = {
      id: nanoid(),
      userId: String(user.id),
      username: user.username ?? user.first_name,
      name: `Трип ${new Date().toLocaleDateString('uk-UA')}`,
      status: 'active',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      path: [],
      distance: 0,
      duration: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      segments: [],
    }
    set({
      isTracking: true,
      isPaused: false,
      currentTrip: trip,
      totalDistance: 0,
      elapsedTime: 0,
      currentSpeed: 0,
      currentPosition: null,
    })
  },

  pauseTracking: () => set({ isPaused: true }),

  resumeTracking: () => set({ isPaused: false }),

  stopTracking: () => {
    const state = get()
    if (!state.currentTrip) return null

    const trip: Trip = {
      ...state.currentTrip,
      status: 'completed',
      finishedAt: new Date().toISOString(),
      distance: state.totalDistance,
      duration: state.elapsedTime,
    }

    // Average speed over moving points only (excludes stops at traffic lights etc.)
    const movingPoints = trip.path.filter((c) => (c.speed ?? 0) > 0)
    const avgSpeed = movingPoints.length > 0
      ? movingPoints.reduce((sum, c) => sum + msToKmh(c.speed!), 0) / movingPoints.length
      : 0
    trip.avgSpeed = Math.round(avgSpeed * 10) / 10

    // Max speed via reduce (safe for large arrays)
    trip.maxSpeed = Math.round(
      trip.path.reduce((max, c) => Math.max(max, msToKmh(c.speed ?? 0)), 0) * 10
    ) / 10

    set({
      isTracking: false,
      isPaused: false,
      currentTrip: null,
      currentPosition: null,
      currentSpeed: 0,
      totalDistance: 0,
      elapsedTime: 0,
    })

    return trip
  },

  addCoordinate: (coord) => {
    const state = get()
    if (!state.isTracking || state.isPaused || !state.currentTrip) return

    const path = [...state.currentTrip.path, coord]

    // incremental distance
    let addedDist = 0
    if (path.length >= 2) {
      const prev = path[path.length - 2]
      addedDist = calcDistance(prev.lat, prev.lng, coord.lat, coord.lng)
    }

    const totalDistance = state.totalDistance + addedDist
    const currentSpeed = msToKmh(coord.speed ?? 0)

    set({
      currentPosition: coord,
      currentSpeed,
      totalDistance,
      currentTrip: { ...state.currentTrip, path },
    })
  },

  setWatchId: (id) => set({ watchId: id }),
  clearWatchId: () => set({ watchId: null }),
}))

// ── Trips history slice ─────────────────────────────────────────────────────

interface TripsStore {
  trips: Trip[]
  addTrip: (trip: Trip) => void
  removeTrip: (id: string) => void
  clearAll: () => void
}

export const useTripsStore = create<TripsStore>()(
  persist(
    (set) => ({
      trips: [],
      addTrip: (trip) =>
        set((s) => ({ trips: [trip, ...s.trips] })),
      removeTrip: (id) =>
        set((s) => ({ trips: s.trips.filter((t) => t.id !== id) })),
      clearAll: () => set({ trips: [] }),
    }),
    { name: 'triproute-trips' },
  ),
)

// ── Timer slice (seconds ticker) ────────────────────────────────────────────

interface TimerStore {
  elapsed: number
  tick: () => void
  reset: () => void
}

export const useTimerStore = create<TimerStore>()((set) => ({
  elapsed: 0,
  tick: () => set((s) => ({ elapsed: s.elapsed + 1 })),
  reset: () => set({ elapsed: 0 }),
}))
