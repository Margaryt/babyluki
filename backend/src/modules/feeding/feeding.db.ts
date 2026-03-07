/** Feeding database access layer — all Prisma queries for FeedingSession and FeedingSegment. */
import prisma from '../../db/prisma';
import { CreateSessionInput, CreateSegmentInput } from './feeding.types';
import {
  FeedingSession as PrismaSession,
  FeedingSegment as PrismaSegment,
} from '@prisma/client';

/** The shape Prisma returns when we include segments on a session. */
export type SessionWithSegments = PrismaSession & { segments: PrismaSegment[] };

/** Shared include clause — segments ordered by sequence number. */
const includeSegments = { segments: { orderBy: { order: 'asc' as const } } };

// ---------------------------------------------------------------------------
// Session queries
// ---------------------------------------------------------------------------

/** Creates a new feeding session. Server-stamps startedAt. */
export const createSession = async (
  input: CreateSessionInput
): Promise<PrismaSession> => {
  return prisma.feedingSession.create({
    data: {
      babyId: input.babyId,
      startedAt: new Date(),
      notes: input.notes,
    },
  });
};

/** Fetches a session by ID with all its segments. */
export const getSessionById = async (
  sessionId: string
): Promise<SessionWithSegments | null> => {
  return prisma.feedingSession.findUnique({
    where: { id: sessionId },
    include: includeSegments,
  });
};

/** Stamps endedAt on a session. Returns the updated session with segments. */
export const endSession = async (
  sessionId: string,
  notes?: string
): Promise<SessionWithSegments> => {
  return prisma.feedingSession.update({
    where: { id: sessionId },
    data: {
      endedAt: new Date(),
      ...(notes != null && { notes }),
    },
    include: includeSegments,
  });
};

/** Fetches all sessions for a baby within a single calendar day. */
export const getSessionsByBabyAndDate = async (
  babyId: string,
  date: Date
): Promise<SessionWithSegments[]> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.feedingSession.findMany({
    where: {
      babyId,
      startedAt: { gte: startOfDay, lte: endOfDay },
    },
    include: includeSegments,
    orderBy: { startedAt: 'desc' },
  });
};

/** Returns true if the session exists and belongs to the given baby. */
export const sessionBelongsToBaby = async (
  sessionId: string,
  babyId: string
): Promise<boolean> => {
  const session = await prisma.feedingSession.findFirst({
    where: { id: sessionId, babyId },
  });
  return session !== null;
};

// ---------------------------------------------------------------------------
// Segment queries
// ---------------------------------------------------------------------------

/** Creates a new segment. Auto-calculates the next order number. Server-stamps startedAt. */
export const createSegment = async (
  input: CreateSegmentInput
): Promise<PrismaSegment> => {
  const lastSegment = await prisma.feedingSegment.findFirst({
    where: { sessionId: input.sessionId },
    orderBy: { order: 'desc' },
  });

  const nextOrder = (lastSegment?.order ?? 0) + 1;

  return prisma.feedingSegment.create({
    data: {
      sessionId: input.sessionId,
      order: nextOrder,
      side: input.side,
      startedAt: new Date(),
      volumeMl: input.volumeMl ?? null,
      notes: input.notes,
    },
  });
};

/** Stamps endedAt on a segment. */
export const stopSegment = async (
  segmentId: string,
  notes?: string
): Promise<PrismaSegment> => {
  return prisma.feedingSegment.update({
    where: { id: segmentId },
    data: {
      endedAt: new Date(),
      ...(notes != null && { notes }),
    },
  });
};