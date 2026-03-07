/** Feeding service — domain logic sitting between controllers and the database layer. */
import { CreateFeedingInput } from './feeding.types';
import { saveFeeding, getFeedingsByBabyAndDate } from './feeding.db';
import { Feeding as PrismaFeeding } from '@prisma/client';

/** Persists a new feeding entry. */
export async function createFeeding(
  input: CreateFeedingInput
): Promise<PrismaFeeding> {
  return saveFeeding(input);
}

/** Returns all feedings for a baby on a given date. */
export async function getFeedings(
  babyId: string,
  date: Date
): Promise<PrismaFeeding[]> {
  return getFeedingsByBabyAndDate(babyId, date);
}