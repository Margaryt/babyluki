/**
 * API client — thin wrapper around fetch for talking to the Baby Luki backend.
 *
 * All response types mirror the backend's TypeScript types so we get
 * end-to-end type safety without a shared package.
 */
import { API_BASE_URL } from '@/constants/Api';

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }

  // 204 No Content — nothing to parse
  if (res.status === 204) return undefined as T;

  return res.json();
}

function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
}

function del(path: string): Promise<void> {
  return request<void>(path, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Feeding sessions
// ---------------------------------------------------------------------------

export const feedingApi = {
  /** Start a new feeding session. */
  startSession: (babyId: string, notes?: string) =>
    post<FeedingSessionResponse>(`/feeding/sessions/${babyId}`, { notes }),

  /** End an active feeding session. */
  endSession: (sessionId: string, notes?: string) =>
    patch<FeedingSessionResponse>(`/feeding/sessions/${sessionId}/end`, { notes }),

  /** Get session detail with events. */
  getSession: (sessionId: string) =>
    get<FeedingSessionDetailResponse>(`/feeding/sessions/${sessionId}`),

  /** Get day view — all sessions + summary for a date. */
  getDayView: (babyId: string, date?: string) => {
    const query = date ? `?date=${date}` : '';
    return get<DayViewResponse>(`/feeding/sessions/day/${babyId}${query}`);
  },

  /** Get statistics over N days. */
  getStats: (babyId: string, days?: number) => {
    const query = days ? `?days=${days}` : '';
    return get<StatsResponse>(`/feeding/sessions/stats/${babyId}${query}`);
  },

  /** Delete a session. */
  deleteSession: (sessionId: string) =>
    del(`/feeding/sessions/${sessionId}`),

  /** Add a segment to a session. */
  addSegment: (sessionId: string, side: SegmentSide, volumeMl?: number) =>
    post<FeedingSegmentResponse>(`/feeding/segments/${sessionId}`, { side, volumeMl }),

  /** Stop an active segment. */
  stopSegment: (segmentId: string, notes?: string) =>
    patch<FeedingSegmentResponse>(`/feeding/segments/${segmentId}/stop`, { notes }),

  /** Delete a segment. */
  deleteSegment: (segmentId: string) =>
    del(`/feeding/segments/${segmentId}`),
};

// ---------------------------------------------------------------------------
// Feeding events (burps, spills, coughs)
// ---------------------------------------------------------------------------

export const eventApi = {
  /** Log a feeding event. Auto-links to active session. */
  log: (babyId: string, type: FeedingEventType, timestamp?: string) =>
    post<FeedingEventResponse>(`/events/${babyId}`, { type, timestamp }),

  /** Get events for a date. */
  getByDate: (babyId: string, date?: string) => {
    const query = date ? `?date=${date}` : '';
    return get<FeedingEventResponse[]>(`/events/${babyId}${query}`);
  },

  /** Delete an event. */
  delete: (eventId: string) => del(`/events/${eventId}`),
};

// ---------------------------------------------------------------------------
// Hiccups
// ---------------------------------------------------------------------------

export const hiccupApi = {
  /** Start a hiccup episode. Auto-links to active session. */
  start: (babyId: string, startedAt?: string) =>
    post<HiccupResponse>(`/hiccups/${babyId}`, { startedAt }),

  /** Stop an active hiccup. */
  stop: (hiccupId: string, endedAt?: string) =>
    patch<HiccupResponse>(`/hiccups/${hiccupId}/stop`, { endedAt }),

  /** Get hiccups for a date. */
  getByDate: (babyId: string, date?: string) => {
    const query = date ? `?date=${date}` : '';
    return get<HiccupResponse[]>(`/hiccups/${babyId}${query}`);
  },

  /** Delete a hiccup. */
  delete: (hiccupId: string) => del(`/hiccups/${hiccupId}`),
};

// ---------------------------------------------------------------------------
// Types (mirrored from backend)
// ---------------------------------------------------------------------------

export type SegmentSide = 'LEFT' | 'RIGHT' | 'BOTTLE';
export type FeedingEventType = 'BURP' | 'SPILL' | 'COUGH';

export interface FeedingSegmentResponse {
  id: string;
  sessionId: string;
  order: number;
  side: SegmentSide;
  startedAt: string;
  endedAt: string | null;
  volumeMl: number | null;
  notes?: string;
  createdAt: string;
}

export interface FeedingSessionResponse {
  id: string;
  babyId: string;
  startedAt: string;
  endedAt: string | null;
  notes?: string;
  createdAt: string;
  segments: FeedingSegmentResponse[];
}

export interface FeedingSessionDetailResponse extends FeedingSessionResponse {
  totalDurationMinutes: number | null;
  activeFeedingMinutes: number;
  totalBottleMl: number;
  burpCount: number;
  spillCount: number;
  coughCount: number;
  events: Array<{ type: FeedingEventType; timestamp: string }>;
}

export interface DayViewResponse {
  date: string;
  totalSessions: number;
  totalFeedingMinutes: number;
  totalBottleMl: number;
  totalBurps: number;
  totalSpills: number;
  totalCoughs: number;
  sessions: FeedingSessionResponse[];
}

export interface StatsResponse {
  feedingWindows: Array<{
    date: string;
    sessions: Array<{ startedAt: string; endedAt: string | null }>;
  }>;
  averages: {
    feedsPerDay: number;
    avgSessionMinutes: number;
    avgGapMinutes: number;
    dailyBottleMl: number;
    burpsPerSession: number;
    spillsPerDay: number;
    coughsPerDay: number;
  };
}

export interface FeedingEventResponse {
  id: string;
  babyId: string;
  sessionId: string | null;
  type: FeedingEventType;
  timestamp: string;
  createdAt: string;
}

export interface HiccupResponse {
  id: string;
  babyId: string;
  sessionId: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
}
