/**
 * Feeding module type definitions.
 * Covers sessions (parent) and segments (child).
 */

/** Values match the Prisma SegmentSide enum. */
export type SegmentSide = 'LEFT' | 'RIGHT' | 'BOTTLE';

// ---------------------------------------------------------------------------
// Response types (returned to the client)
// ---------------------------------------------------------------------------

/** A single breast or bottle feed within a session. */
export interface FeedingSegmentResponse {
  id: string;
  sessionId: string;
  order: number;
  side: SegmentSide;
  startedAt: string;
  endedAt: string | null;
  /** Only present for BOTTLE segments. */
  volumeMl: number | null;
  notes?: string;
  createdAt: string;
}

/** A feeding session with its nested segments. */
export interface FeedingSessionResponse {
  id: string;
  babyId: string;
  startedAt: string;
  endedAt: string | null;
  notes?: string;
  createdAt: string;
  segments: FeedingSegmentResponse[];
}

/** A feeding session with computed summary fields and event data. */
export interface FeedingSessionDetailResponse extends FeedingSessionResponse {
  /** Total wall-clock minutes from session start to end. */
  totalDurationMinutes: number | null;
  /** Sum of segment durations (actual feeding time). */
  activeFeedingMinutes: number;
  /** Sum of volumeMl across BOTTLE segments. */
  totalBottleMl: number;
  /** Number of burps during this session. */
  burpCount: number;
  /** Number of spills during this session. */
  spillCount: number;
  /** Number of coughs during this session. */
  coughCount: number;
  /** All feeding events in chronological order. */
  events: Array<{ type: 'BURP' | 'SPILL' | 'COUGH'; timestamp: string }>;
}

/** A feeding event (burp, spill, cough) as returned inside day view. */
export interface DayViewEvent {
  id: string;
  sessionId: string | null;
  type: 'BURP' | 'SPILL' | 'COUGH';
  timestamp: string;
}

/** Day-level summary with all sessions. */
export interface DayViewResponse {
  date: string;
  totalSessions: number;
  totalFeedingMinutes: number;
  totalBottleMl: number;
  /** All burps for the day (session + standalone). */
  totalBurps: number;
  /** All spills for the day (session + standalone). */
  totalSpills: number;
  /** All coughs for the day (session + standalone). */
  totalCoughs: number;
  sessions: FeedingSessionResponse[];
  /** All feeding events for the day, with sessionId for grouping onto cards. */
  events: DayViewEvent[];
}

/** Statistics across multiple days (for heatmap and averages). */
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

// ---------------------------------------------------------------------------
// Request types (sent by the client)
// ---------------------------------------------------------------------------

/** POST /feeding/sessions/:babyId — create a new session. */
export interface CreateSessionRequest {
  notes?: string;
}

/** PATCH /feeding/sessions/:sessionId/end — end a session. */
export interface EndSessionRequest {
  notes?: string;
}

/** POST /feeding/segments/:sessionId — start a new segment. */
export interface CreateSegmentRequest {
  side: SegmentSide;
  /** Only relevant for BOTTLE segments. */
  volumeMl?: number;
  notes?: string;
}

/** PATCH /feeding/segments/:segmentId/stop — stop a segment. */
export interface StopSegmentRequest {
  notes?: string;
}

// ---------------------------------------------------------------------------
// Internal types (add route params for the service/db layer)
// ---------------------------------------------------------------------------

/** {@link CreateSessionRequest} + babyId from the route. */
export interface CreateSessionInput extends CreateSessionRequest {
  babyId: string;
}

/** {@link CreateSegmentRequest} + sessionId from the route. */
export interface CreateSegmentInput extends CreateSegmentRequest {
  sessionId: string;
}
