/**
 * FeedingEvent module type definitions.
 * A FeedingEvent is a point-in-time event (BURP, SPILL, or COUGH).
 * Automatically linked to the active feeding session if one exists.
 */

/** Values match the Prisma FeedingEventType enum. */
export type FeedingEventType = 'BURP' | 'SPILL' | 'COUGH';

// ---------------------------------------------------------------------------
// Response types (returned to the client)
// ---------------------------------------------------------------------------

/** A single feeding event. */
export interface FeedingEventResponse {
  id: string;
  babyId: string;
  sessionId: string | null;
  type: FeedingEventType;
  timestamp: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Request types (sent by the client)
// ---------------------------------------------------------------------------

/** POST /events/:babyId */
export interface CreateFeedingEventRequest {
  type: FeedingEventType;
  /** ISO string. Defaults to now() if omitted. */
  timestamp?: string;
}

// ---------------------------------------------------------------------------
// Internal types (add route params for the service/db layer)
// ---------------------------------------------------------------------------

/** {@link CreateFeedingEventRequest} + identifiers resolved by the service layer. */
export interface CreateFeedingEventInput extends CreateFeedingEventRequest {
  babyId: string;
  /** Resolved automatically from the active session. */
  sessionId?: string;
}
