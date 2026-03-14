/**
 * Hiccup module type definitions.
 * A Hiccup is a duration event with startedAt and endedAt.
 * Automatically linked to the active feeding session if one exists.
 */

// ---------------------------------------------------------------------------
// Response types (returned to the client)
// ---------------------------------------------------------------------------

/** A single hiccup episode. */
export interface HiccupResponse {
  id: string;
  babyId: string;
  sessionId: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Request types (sent by the client)
// ---------------------------------------------------------------------------

/** POST /hiccups/:babyId — start a hiccup episode. */
export interface CreateHiccupRequest {
  /** ISO string. Defaults to now() if omitted. */
  startedAt?: string;
}

/** PATCH /hiccups/:hiccupId/stop — stop a hiccup episode. */
export interface StopHiccupRequest {
  /** ISO string. Defaults to now() if omitted. */
  endedAt?: string;
}

// ---------------------------------------------------------------------------
// Internal types (add route params for the service/db layer)
// ---------------------------------------------------------------------------

/** {@link CreateHiccupRequest} + identifiers resolved by the service layer. */
export interface CreateHiccupInput extends CreateHiccupRequest {
  babyId: string;
  /** Resolved automatically from the active session. */
  sessionId?: string;
}
