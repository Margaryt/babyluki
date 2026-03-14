/** Hiccup service — domain logic for hiccup tracking. */
import { CreateHiccupInput, HiccupResponse } from './hiccup.types';
import {
  createHiccup,
  stopHiccup,
  deleteHiccup,
  getHiccupsByBabyAndDate,
} from './hiccup.db';
import { getActiveSession } from '../feeding/feeding.db';
import { Hiccup as PrismaHiccup } from '@prisma/client';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Starts a hiccup episode.
 * If no sessionId is provided, automatically links to the active feeding session (if exactly one exists).
 */
export async function startHiccup(
  input: CreateHiccupInput
): Promise<HiccupResponse> {
  if (!input.sessionId) {
    const active = await getActiveSession(input.babyId);
    if (active) {
      input = { ...input, sessionId: active.id };
    }
  }
  const hiccup = await createHiccup(input);
  return serializeHiccup(hiccup);
}

/** Stops an active hiccup episode. */
export async function stopHiccupEpisode(
  hiccupId: string,
  endedAt?: string
): Promise<HiccupResponse> {
  const hiccup = await stopHiccup(hiccupId, endedAt);
  return serializeHiccup(hiccup);
}

/** Deletes a hiccup by ID. */
export async function removeHiccup(hiccupId: string): Promise<void> {
  await deleteHiccup(hiccupId);
}

/** Returns all hiccups for a baby on a given date. */
export async function getHiccups(
  babyId: string,
  date: Date
): Promise<HiccupResponse[]> {
  const hiccups = await getHiccupsByBabyAndDate(babyId, date);
  return hiccups.map(serializeHiccup);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Converts a Prisma hiccup into a JSON-friendly response. */
export function serializeHiccup(hiccup: PrismaHiccup): HiccupResponse {
  return {
    id: hiccup.id,
    babyId: hiccup.babyId,
    sessionId: hiccup.sessionId,
    startedAt: hiccup.startedAt.toISOString(),
    endedAt: hiccup.endedAt?.toISOString() ?? null,
    createdAt: hiccup.createdAt.toISOString(),
  };
}
