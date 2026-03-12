/** Burp database access layer — all Prisma queries for Burp. */
import prisma from '../../db/prisma';
import { CreateBurpInput } from './burp.types';
import { Burp as PrismaBurp } from '@prisma/client';

/** Creates a new burp event. */
export const createBurp = async (
  input: CreateBurpInput
): Promise<PrismaBurp> => {
  return prisma.burp.create({
    data: {
      babyId: input.babyId,
      sessionId: input.sessionId ?? null,
      timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
    },
  });
};

/** Deletes a burp by ID. */
export const deleteBurp = async (burpId: string): Promise<void> => {
  await prisma.burp.delete({ where: { id: burpId } });
};

/** Fetches all burps for a baby within a single calendar day. */
export const getBurpsByBabyAndDate = async (
  babyId: string,
  date: Date
): Promise<PrismaBurp[]> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.burp.findMany({
    where: {
      babyId,
      timestamp: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { timestamp: 'desc' },
  });
};

/** Fetches all burps linked to a specific session. */
export const getBurpsBySession = async (
  sessionId: string
): Promise<PrismaBurp[]> => {
  return prisma.burp.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' },
  });
};

/** Fetches all burps for a baby within a date range. */
export const getBurpsByBabyAndDateRange = async (
  babyId: string,
  from: Date,
  to: Date
): Promise<PrismaBurp[]> => {
  return prisma.burp.findMany({
    where: {
      babyId,
      timestamp: { gte: from, lte: to },
    },
    orderBy: { timestamp: 'asc' },
  });
};
