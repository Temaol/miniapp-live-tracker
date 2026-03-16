import type { Trip, TelegramUser, PaginatedResponse, Segment } from '../types'

// Base URL — replace with your deployed backend URL
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      // Telegram initData for server-side auth validation
      'X-Telegram-Init-Data': window.Telegram?.WebApp?.initData ?? '',
      ...options.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  /** Save a completed trip to the backend */
  saveTrip: (trip: Trip, user: TelegramUser) =>
    request<{ id: string }>('/trips', {
      method: 'POST',
      body: JSON.stringify({ trip, userId: user.id }),
    }),

  /** Fetch public trips feed (other users' trips) */
  getPublicTrips: (page = 1, pageSize = 20) =>
    request<PaginatedResponse<Trip>>(
      `/trips/public?page=${page}&pageSize=${pageSize}`,
    ),

  /** Fetch a single trip by ID */
  getTrip: (id: string) =>
    request<Trip>(`/trips/${id}`),

  /** Fetch trips belonging to a user */
  getUserTrips: (userId: string | number, page = 1) =>
    request<PaginatedResponse<Trip>>(
      `/users/${userId}/trips?page=${page}`,
    ),

  /** Save a named segment of a trip */
  saveSegment: (segment: Segment) =>
    request<Segment>('/segments', {
      method: 'POST',
      body: JSON.stringify(segment),
    }),

  /** Get public segments (leaderboard-style) */
  getPublicSegments: (page = 1) =>
    request<PaginatedResponse<Segment>>(
      `/segments/public?page=${page}`,
    ),
}
