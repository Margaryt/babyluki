/** Values match the Prisma FeedingType enum (uppercase). */
export type FeedingType = 'BREAST' | 'BOTTLE';

/** Shape of the request body for creating a feeding. */
export interface CreateFeedingRequest {
  /** ISO 8601 datetime string. */
  startedAt: string;
  /** ISO 8601 datetime string. Optional for in-progress feedings. */
  endedAt?: string;
  type: FeedingType;
  notes?: string;
}

/**
 * Internal type used by the service/db layer.
 * Extends the request body with babyId from the route param.
 */
export interface CreateFeedingInput extends CreateFeedingRequest {
  babyId: string;
}

/** Serialised feeding record returned to the client. */
export interface Feeding {
  id: string;
  babyId: string;
  startedAt: string;
  endedAt: string | null;
  type: FeedingType;
  notes?: string;
  createdAt: string;
}