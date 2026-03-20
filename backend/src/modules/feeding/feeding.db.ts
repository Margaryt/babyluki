/** Feeding database access layer — all Prisma queries for FeedingSession and FeedingSegment. */
import prisma from '../../db/prisma';
import { CreateSessionInput, CreateSegmentInput } from './feeding.types';
import {
  FeedingSession as PrismaSession,
  FeedingSegment as PrismaSegment,
  FeedingEvent as PrismaFeedingEvent,
} from '@prisma/client';

/** The shape Prisma returns when we include segments on a session. */
export type SessionWithSegments = PrismaSession & { segments: PrismaSegment[] };

/** Session with segments and feeding events — used for session detail view. */
export type SessionWithSegmentsAndEvents = SessionWithSegments & { feedingEvents: PrismaFeedingEvent[] };

/** Shared include clause — segments ordered by sequence number. */
const includeSegments = { segments: { orderBy: { order: 'asc' as const } } };

/** Include clause for segments + feeding events. */
const includeSegmentsAndEvents = {
  segments: { orderBy: { order: 'asc' as const } },
  feedingEvents: { orderBy: { timestamp: 'asc' as const } },
};

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

/**
 * Returns the currently active (not ended) session for a baby, if one exists.
 * Only one active session should exist at a time (enforced by the service layer).
 */
export const getActiveSession = async (
  babyId: string
): Promise<PrismaSession | null> => {
  return prisma.feedingSession.findFirst({
    where: { babyId, endedAt: null },
    orderBy: { startedAt: 'desc' },
  });
};

/** Deletes a session and all its segments (cascade). */
export const deleteSession = async (sessionId: string): Promise<void> => {
  await prisma.feedingSession.delete({ where: { id: sessionId } });
};

/** Fetches a single session with segments and feeding events for the detail view. */
export const getSessionWithEvents = async (
  sessionId: string
): Promise<SessionWithSegmentsAndEvents | null> => {
  return prisma.feedingSession.findUnique({
    where: { id: sessionId },
    include: includeSegmentsAndEvents,
  });
};

/** Fetches all sessions (with segments) for a baby within a date range. */
export const getSessionsByDateRange = async (
  babyId: string,
  from: Date,
  to: Date
): Promise<SessionWithSegments[]> => {
  return prisma.feedingSession.findMany({
    where: {
      babyId,
      startedAt: { gte: from, lte: to },
    },
    include: includeSegments,
    orderBy: { startedAt: 'asc' },
  });
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

/** Deletes a single segment by ID. */
export const deleteSegment = async (segmentId: string): Promise<void> => {
  await prisma.feedingSegment.delete({ where: { id: segmentId } });
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