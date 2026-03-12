/** Burp service — domain logic for burp tracking. */
import { CreateBurpInput, BurpResponse } from './burp.types';
import { createBurp, deleteBurp, getBurpsByBabyAndDate } from './burp.db';
import { Burp as PrismaBurp } from '@prisma/client';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Logs a burp. Optionally linked to a feeding session via sessionId in the input. */
export async function logBurp(
  input: CreateBurpInput
): Promise<BurpResponse> {
  const burp = await createBurp(input);
  return serializeBurp(burp);
}

/** Deletes a burp by ID. */
export async function removeBurp(burpId: string): Promise<void> {
  await deleteBurp(burpId);
}

/** Returns all burps for a baby on a given date. */
export async function getBurps(
  babyId: string,
  date: Date
): Promise<BurpResponse[]> {
  const burps = await getBurpsByBabyAndDate(babyId, date);
  return burps.map(serializeBurp);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Converts a Prisma burp into a JSON-friendly response. */
export function serializeBurp(burp: PrismaBurp): BurpResponse {
  return {
    id: burp.id,
    babyId: burp.babyId,
    sessionId: burp.sessionId,
    timestamp: burp.timestamp.toISOString(),
    createdAt: burp.createdAt.toISOString(),
  };
}
