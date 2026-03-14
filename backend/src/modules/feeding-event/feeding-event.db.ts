/** FeedingEvent database access layer — all Prisma queries for FeedingEvent. */
import prisma from '../../db/prisma';
import { CreateFeedingEventInput, FeedingEventType } from './feeding-event.types';
import { FeedingEvent as PrismaFeedingEvent } from '@prisma/client';

/** Creates a new feeding event (burp or spill). */
export const createFeedingEvent = async (
  input: CreateFeedingEventInput
): Promise<PrismaFeedingEvent> => {
  return prisma.feedingEvent.create({
    data: {
      babyId: input.babyId,
      sessionId: input.sessionId ?? null,
      type: input.type,
      timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
    },
  });
};

/** Deletes a feeding event by ID. */
export const deleteFeedingEvent = async (eventId: string): Promise<void> => {
  await prisma.feedingEvent.delete({ where: { id: eventId } });
};

/** Fetches all feeding events for a baby within a single calendar day. */
export const getEventsByBabyAndDate = async (
  babyId: string,
  date: Date,
  type?: FeedingEventType
): Promise<PrismaFeedingEvent[]> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.feedingEvent.findMany({
    where: {
      babyId,
      timestamp: { gte: startOfDay, lte: endOfDay },
      ...(type && { type }),
    },
    orderBy: { timestamp: 'desc' },
  });
};

/** Fetches all feeding events linked to a specific session. */
export const getEventsBySession = async (
  sessionId: string
): Promise<PrismaFeedingEvent[]> => {
  return prisma.feedingEvent.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' },
  });
};

/** Fetches all feeding events for a baby within a date range. */
export const getEventsByBabyAndDateRange = async (
  babyId: string,
  from: Date,
  to: Date,
  type?: FeedingEventType
): Promise<PrismaFeedingEvent[]> => {
  return prisma.feedingEvent.findMany({
    where: {
      babyId,
      timestamp: { gte: from, lte: to },
      ...(type && { type }),
    },
    orderBy: { timestamp: 'asc' },
  });
};
