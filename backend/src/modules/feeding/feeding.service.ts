/** Feeding service — domain logic sitting between controllers and the database layer. */
import {
  CreateSessionInput,
  CreateSegmentInput,
  StopSegmentInput,
  EndSessionInput,
  FeedingSessionResponse,
  FeedingSegmentResponse,
} from './feeding.types';
import {
  createSession,
  getSessionById,
  endSession,
  createSegment,
  stopSegment,
  getSessionsByBabyAndDate,
  sessionBelongsToBaby,
  SessionWithSegments,
} from './feeding.db';
import {
  FeedingSession as PrismaSession,
  FeedingSegment as PrismaSegment,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Creates a new feeding session for a baby. */
export async function startSession(
  input: CreateSessionInput
): Promise<FeedingSessionResponse> {
  const session = await createSession(input);
  return serializeSession({ ...session, segments: [] });
}

/** Ends an active feeding session. Validates baby ownership first. */
export async function endFeedingSession(
  input: EndSessionInput
): Promise<FeedingSessionResponse> {
  await assertSessionBelongsToBaby(input.sessionId, input.babyId);
  const updated = await endSession(input.sessionId, input.notes);
  return serializeSession(updated);
}

/** Adds a new segment to an active session. Validates baby ownership first. */
export async function addSegment(
  input: CreateSegmentInput
): Promise<FeedingSessionResponse> {
  await assertSessionBelongsToBaby(input.sessionId, input.babyId);
  await createSegment(input);

  const updated = await getSessionById(input.sessionId);
  if (!updated) throw new Error(`Session ${input.sessionId} not found after creating segment`);
  return serializeSession(updated);
}

/** Stops an active segment. Validates baby ownership first. */
export async function stopFeedingSegment(
  input: StopSegmentInput
): Promise<FeedingSessionResponse> {
  await assertSessionBelongsToBaby(input.sessionId, input.babyId);
  await stopSegment(input.segmentId, input.notes);

  const updated = await getSessionById(input.sessionId);
  if (!updated) throw new Error(`Session ${input.sessionId} not found after stopping segment`);
  return serializeSession(updated);
}

/** Returns all feeding sessions (with segments) for a baby on a given date. */
export async function getSessions(
  babyId: string,
  date: Date
): Promise<FeedingSessionResponse[]> {
  const sessions = await getSessionsByBabyAndDate(babyId, date);
  return sessions.map(serializeSession);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Throws if the session does not belong to the baby. */
async function assertSessionBelongsToBaby(
  sessionId: string,
  babyId: string
): Promise<void> {
  const belongs = await sessionBelongsToBaby(sessionId, babyId);
  if (!belongs) {
    throw new Error(`Session ${sessionId} does not belong to baby ${babyId}`);
  }
}

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