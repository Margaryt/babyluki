/** Feeding database access layer — all Prisma queries for the Feeding model. */
import prisma from '../../db/prisma';
import { CreateFeedingInput } from './feeding.types';
import { Feeding as PrismaFeeding } from '@prisma/client';

/** Inserts a new feeding record into the database. */
export const saveFeeding = async (
  input: CreateFeedingInput
): Promise<PrismaFeeding> => {
  return prisma.feeding.create({
    data: {
      babyId: input.babyId,
      startedAt: new Date(input.startedAt),
      endedAt: input.endedAt ? new Date(input.endedAt) : null,
      type: input.type,
      notes: input.notes,
    },
  });
};

/** Fetches all feedings for a baby within a single calendar day. */
export const getFeedingsByBabyAndDate = async (
  babyId: string,
  date: Date
): Promise<PrismaFeeding[]> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.feeding.findMany({
    where: {
      babyId,
      startedAt: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { startedAt: 'desc' },
  });
};