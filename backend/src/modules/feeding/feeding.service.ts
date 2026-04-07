/** Feeding service — domain logic sitting between controllers and the database layer. */
import {
  CreateSessionInput,
  CreateSegmentInput,
  FeedingSessionResponse,
  FeedingSegmentResponse,
  FeedingSessionDetailResponse,
  DayViewResponse,
  StatsResponse,
} from './feeding.types';
import {
  createSession,
  endSession,
  deleteSession,
  deleteSegment,
  createSegment,
  stopSegment,
  getActiveSession,
  getSessionsByBabyAndDate,
  getSessionWithEvents,
  getSessionsByDateRange,
  SessionWithSegments,
  SessionWithSegmentsAndEvents,
} from './feeding.db';
import { getEventsByBabyAndDate, getEventsByBabyAndDateRange } from '../feeding-event/feeding-event.db';
import { FeedingSegment as PrismaSegment } from '@prisma/client';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Creates a new feeding session for a baby. Throws if one is already active. */
export async function startSession(
  input: CreateSessionInput
): Promise<FeedingSessionResponse> {
  const active = await getActiveSession(input.babyId);
  if (active) {
    throw new Error('A feeding session is already active. End it before starting a new one.');
  }
  const session = await createSession(input);
  return serializeSession({ ...session, segments: [] });
}

/** Ends an active feeding session. */
export async function endFeedingSession(
  sessionId: string,
  endedAt: string,
  notes?: string
): Promise<FeedingSessionResponse> {
  const updated = await endSession(sessionId, endedAt, notes);
  return serializeSession(updated);
}

/** Adds a new segment to an active session. */
export async function addSegment(
  input: CreateSegmentInput
): Promise<FeedingSegmentResponse> {
  const segment = await createSegment(input);
  return serializeSegment(segment);
}

/** Stops an active segment. */
export async function stopFeedingSegment(
  segmentId: string,
  endedAt: string,
  notes?: string
): Promise<FeedingSegmentResponse> {
  const segment = await stopSegment(segmentId, endedAt, notes);
  return serializeSegment(segment);
}

/** Deletes a feeding session and all its segments. */
export async function removeFeedingSession(
  sessionId: string
): Promise<void> {
  await deleteSession(sessionId);
}

/** Deletes a single segment. */
export async function removeFeedingSegment(
  segmentId: string
): Promise<void> {
  await deleteSegment(segmentId);
}

/** Returns a detailed session view with computed summary fields and events. */
export async function getSessionDetail(
  sessionId: string
): Promise<FeedingSessionDetailResponse> {
  const session = await getSessionWithEvents(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  return serializeSessionDetail(session);
}

/** Returns the day view: all sessions + aggregated summary for a date. */
export async function getDayView(
  babyId: string,
  date: Date
): Promise<DayViewResponse> {
  const sessions = await getSessionsByBabyAndDate(babyId, date);
  const events = await getEventsByBabyAndDate(babyId, date);

  const totalFeedingMinutes = sessions.reduce(
    (sum, s) => sum + computeActiveFeedingMinutes(s),
    0
  );
  const totalBottleMl = sessions.reduce(
    (sum, s) => sum + computeTotalBottleMl(s),
    0
  );

  const totalBurps = events.filter((e) => e.type === 'BURP').length;
  const totalSpills = events.filter((e) => e.type === 'SPILL').length;
  const totalCoughs = events.filter((e) => e.type === 'COUGH').length;

  return {
    date: formatDateString(date),
    totalSessions: sessions.length,
    totalFeedingMinutes: round(totalFeedingMinutes),
    totalBottleMl: round(totalBottleMl),
    totalBurps,
    totalSpills,
    totalCoughs,
    sessions: sessions.map(serializeSession),
    events: events.map((e) => ({
      id: e.id,
      sessionId: e.sessionId,
      type: e.type as 'BURP' | 'SPILL' | 'COUGH',
      timestamp: e.timestamp.toISOString(),
    })),
  };
}

/** Returns feeding statistics over a number of recent days. */
export async function getStats(
  babyId: string,
  days: number
): Promise<StatsResponse> {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);

  const sessions = await getSessionsByDateRange(babyId, from, to);
  const allEvents = await getEventsByBabyAndDateRange(babyId, from, to);

  /** Group sessions by YYYY-MM-DD. */
  const byDay = new Map<string, SessionWithSegments[]>();
  for (const s of sessions) {
    const key = formatDateString(s.startedAt);
    const arr = byDay.get(key) ?? [];
    arr.push(s);
    byDay.set(key, arr);
  }

  /** Build feedingWindows array for every day in the range. */
  const feedingWindows: StatsResponse['feedingWindows'] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const key = formatDateString(cursor);
    const daySessions = byDay.get(key) ?? [];
    feedingWindows.push({
      date: key,
      sessions: daySessions.map((s) => ({
        startedAt: s.startedAt.toISOString(),
        endedAt: s.endedAt?.toISOString() ?? null,
      })),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  /** Compute averages. */
  const daysWithFeeds = byDay.size || 1;
  const totalSessions = sessions.length || 1;

  const totalActiveMinutes = sessions.reduce(
    (sum, s) => sum + computeActiveFeedingMinutes(s),
    0
  );
  const totalBottleMl = sessions.reduce(
    (sum, s) => sum + computeTotalBottleMl(s),
    0
  );

  /** Average gap between consecutive sessions (across the whole range). */
  const sortedSessions = [...sessions].sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime()
  );
  let totalGapMinutes = 0;
  let gapCount = 0;
  for (let i = 1; i < sortedSessions.length; i++) {
    const prev = sortedSessions[i - 1];
    const curr = sortedSessions[i];
    const prevEnd = prev.endedAt ?? prev.startedAt;
    const gap = (curr.startedAt.getTime() - prevEnd.getTime()) / 60_000;
    if (gap > 0) {
      totalGapMinutes += gap;
      gapCount++;
    }
  }

  return {
    feedingWindows,
    averages: {
      feedsPerDay: round(sessions.length / daysWithFeeds),
      avgSessionMinutes: round(totalActiveMinutes / totalSessions),
      avgGapMinutes: round(gapCount > 0 ? totalGapMinutes / gapCount : 0),
      dailyBottleMl: round(totalBottleMl / daysWithFeeds),
      burpsPerSession: round(
        allEvents.filter((e) => e.type === 'BURP').length / totalSessions
      ),
      spillsPerDay: round(
        allEvents.filter((e) => e.type === 'SPILL').length / daysWithFeeds
      ),
      coughsPerDay: round(
        allEvents.filter((e) => e.type === 'COUGH').length / daysWithFeeds
      ),
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Converts a Prisma session (with segments) into a JSON-friendly response. */
function serializeSession(session: SessionWithSegments): FeedingSessionResponse {
  return {
    id: session.id,
    babyId: session.babyId,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
    notes: session.notes ?? undefined,
    createdAt: session.createdAt.toISOString(),
    segments: session.segments.map(serializeSegment),
  };
}

/** Converts a Prisma session (with segments + events) into a detail response. */
function serializeSessionDetail(
  session: SessionWithSegmentsAndEvents
): FeedingSessionDetailResponse {
  const totalDurationMinutes = session.endedAt
    ? (session.endedAt.getTime() - session.startedAt.getTime()) / 60_000
    : null;

  const burps = session.feedingEvents.filter((e) => e.type === 'BURP');
  const spills = session.feedingEvents.filter((e) => e.type === 'SPILL');
  const coughs = session.feedingEvents.filter((e) => e.type === 'COUGH');

  return {
    ...serializeSession(session),
    totalDurationMinutes: totalDurationMinutes !== null ? round(totalDurationMinutes) : null,
    activeFeedingMinutes: round(computeActiveFeedingMinutes(session)),
    totalBottleMl: round(computeTotalBottleMl(session)),
    burpCount: burps.length,
    spillCount: spills.length,
    coughCount: coughs.length,
    events: session.feedingEvents.map((e) => ({
      type: e.type as 'BURP' | 'SPILL' | 'COUGH',
      timestamp: e.timestamp.toISOString(),
    })),
  };
}

/** Converts a Prisma segment into a JSON-friendly response. */
function serializeSegment(segment: PrismaSegment): FeedingSegmentResponse {
  return {
    id: segment.id,
    sessionId: segment.sessionId,
    order: segment.order,
    side: segment.side,
    startedAt: segment.startedAt.toISOString(),
    endedAt: segment.endedAt?.toISOString() ?? null,
    volumeMl: segment.volumeMl,
    notes: segment.notes ?? undefined,
    createdAt: segment.createdAt.toISOString(),
  };
}

/** Sum of segment durations in minutes (only completed segments). */
function computeActiveFeedingMinutes(session: SessionWithSegments): number {
  return session.segments.reduce((sum, seg) => {
    if (!seg.endedAt) return sum;
    return sum + (seg.endedAt.getTime() - seg.startedAt.getTime()) / 60_000;
  }, 0);
}

/** Sum of volumeMl across all BOTTLE segments. */
function computeTotalBottleMl(session: SessionWithSegments): number {
  return session.segments.reduce((sum, seg) => {
    return sum + (seg.volumeMl ?? 0);
  }, 0);
}

/** Formats a Date as YYYY-MM-DD. */
function formatDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Rounds a number to one decimal place. */
function round(n: number): number {
  return Math.round(n * 10) / 10;
}
