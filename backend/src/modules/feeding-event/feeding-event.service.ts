/** FeedingEvent service — domain logic for burp and spill tracking. */
import {
  CreateFeedingEventInput,
  FeedingEventResponse,
  FeedingEventType,
} from './feeding-event.types';
import {
  createFeedingEvent,
  deleteFeedingEvent,
  getEventsByBabyAndDate,
} from './feeding-event.db';
import { getActiveSession } from '../feeding/feeding.db';
import { FeedingEvent as PrismaFeedingEvent } from '@prisma/client';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Logs a feeding event (burp or spill).
 * If no sessionId is provided, automatically links to the active feeding session (if exactly one exists).
 */
export async function logEvent(
  input: CreateFeedingEventInput
): Promise<FeedingEventResponse> {
  if (!input.sessionId) {
    const active = await getActiveSession(input.babyId);
    if (active) {
      input = { ...input, sessionId: active.id };
    }
  }
  const event = await createFeedingEvent(input);
  return serializeEvent(event);
}

/** Deletes a feeding event by ID. */
export async function removeEvent(eventId: string): Promise<void> {
  await deleteFeedingEvent(eventId);
}

/** Returns all feeding events for a baby on a given date. Optionally filtered by type. */
export async function getEvents(
  babyId: string,
  date: Date,
  type?: FeedingEventType
): Promise<FeedingEventResponse[]> {
  const events = await getEventsByBabyAndDate(babyId, date, type);
  return events.map(serializeEvent);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Converts a Prisma feeding event into a JSON-friendly response. */
export function serializeEvent(event: PrismaFeedingEvent): FeedingEventResponse {
  return {
    id: event.id,
    babyId: event.babyId,
    sessionId: event.sessionId,
    type: event.type as FeedingEventType,
    timestamp: event.timestamp.toISOString(),
    createdAt: event.createdAt.toISOString(),
  };
}
