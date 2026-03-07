/** Feeding controller — handles HTTP requests and delegates to the service layer. */
import { Request, Response } from 'express';
import { createFeeding, getFeedings } from './feeding.service';
import { CreateFeedingRequest } from './feeding.types';

/**
 * POST /:babyId
 * Creates a new feeding entry for the given baby.
 */
export const postFeeding = async (
  req: Request<{ babyId: string }, {}, CreateFeedingRequest>,
  res: Response
) => {
  try {
    const { babyId } = req.params;
    const feeding = await createFeeding({ ...req.body, babyId });
    res.status(201).json(feeding);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create feeding' });
  }
};

/**
 * GET /:babyId?date=YYYY-MM-DD
 * Returns all feedings for a baby on a given date. Defaults to today.
 */
export const getFeedingsByDate = async (
  req: Request<{ babyId: string }, {}, {}, { date?: string }>,
  res: Response
) => {
  try {
    const { babyId } = req.params;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const feedings = await getFeedings(babyId, date);
    res.json(feedings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get feedings' });
  }
};