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

// ---------------------------------------------------------------------------
// Request types (sent by the client)
// ---------------------------------------------------------------------------

/** POST /feeding/:babyId — create a new session. */
export interface CreateSessionRequest {
  notes?: string;
}

/** PATCH /feeding/:babyId/:sessionId/end — end a session. */
export interface EndSessionRequest {
  notes?: string;
}

/** POST /feeding/:babyId/:sessionId/segment — start a new segment. */
export interface CreateSegmentRequest {
  side: SegmentSide;
  /** Only relevant for BOTTLE segments. */
  volumeMl?: number;
  notes?: string;
}

/** PATCH /feeding/:babyId/:sessionId/segment/:segmentId/stop — stop a segment. */
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

/** {@link EndSessionRequest} + identifiers from the route. */
export interface EndSessionInput extends EndSessionRequest {
  sessionId: string;
  babyId: string;
}

/** {@link CreateSegmentRequest} + identifiers from the route. */
export interface CreateSegmentInput extends CreateSegmentRequest {
  sessionId: string;
  babyId: string;
}

/** {@link StopSegmentRequest} + identifiers from the route. */
export interface StopSegmentInput extends StopSegmentRequest {
  segmentId: string;
  sessionId: string;
  babyId: string;
}