/** Hiccup database access layer — all Prisma queries for Hiccup. */
import prisma from '../../db/prisma';
import { CreateHiccupInput } from './hiccup.types';
import { Hiccup as PrismaHiccup } from '@prisma/client';

/** Creates a new hiccup episode. */
export const createHiccup = async (
  input: CreateHiccupInput
): Promise<PrismaHiccup> => {
  return prisma.hiccup.create({
    data: {
      babyId: input.babyId,
      sessionId: input.sessionId ?? null,
      startedAt: input.startedAt ? new Date(input.startedAt) : new Date(),
    },
  });
};

/** Stamps endedAt on a hiccup. */
export const stopHiccup = async (
  hiccupId: string,
  endedAt?: string
): Promise<PrismaHiccup> => {
  return prisma.hiccup.update({
    where: { id: hiccupId },
    data: { endedAt: endedAt ? new Date(endedAt) : new Date() },
  });
};

/** Deletes a hiccup by ID. */
export const deleteHiccup = async (hiccupId: string): Promise<void> => {
  await prisma.hiccup.delete({ where: { id: hiccupId } });
};

/** Fetches all hiccups for a baby within a single calendar day. */
export const getHiccupsByBabyAndDate = async (
  babyId: string,
  date: Date
): Promise<PrismaHiccup[]> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.hiccup.findMany({
    where: {
      babyId,
      startedAt: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { startedAt: 'desc' },
  });
};

/** Fetches all hiccups for a baby within a date range. */
export const getHiccupsByBabyAndDateRange = async (
  babyId: string,
  from: Date,
  to: Date
): Promise<PrismaHiccup[]> => {
  return prisma.hiccup.findMany({
    where: {
      babyId,
      startedAt: { gte: from, lte: to },
    },
    orderBy: { startedAt: 'asc' },
  });
};
