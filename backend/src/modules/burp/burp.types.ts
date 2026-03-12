/**
 * Burp module type definitions.
 * Burps can be standalone (outside a session) or linked to a feeding session.
 */

// ---------------------------------------------------------------------------
// Response types (returned to the client)
// ---------------------------------------------------------------------------

/** A single burp event. */
export interface BurpResponse {
  id: string;
  babyId: string;
  sessionId: string | null;
  timestamp: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Request types (sent by the client)
// ---------------------------------------------------------------------------

/** POST /burp/:babyId */
export interface CreateBurpRequest {
  /** ISO string. Defaults to now() if omitted. */
  timestamp?: string;
  /** Link this burp to a feeding session. Null/omitted for standalone burps. */
  sessionId?: string;
}

// ---------------------------------------------------------------------------
// Internal types (add route params for the service/db layer)
// ---------------------------------------------------------------------------

/** {@link CreateBurpRequest} + identifiers from the route. */
export interface CreateBurpInput extends CreateBurpRequest {
  babyId: string;
  sessionId?: string;
}
