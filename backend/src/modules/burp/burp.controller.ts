/** Burp controller — handles HTTP requests and delegates to the service layer. */
import { Request, Response } from 'express';
import { logBurp, removeBurp, getBurps } from './burp.service';
import { CreateBurpRequest } from './burp.types';

/**
 * POST /:babyId
 * Logs a burp. Optional sessionId in the body links it to a feeding session.
 */
export const postBurp = async (
  req: Request<{ babyId: string }, {}, CreateBurpRequest>,
  res: Response
) => {
  try {
    const { babyId } = req.params;
    const burp = await logBurp({ ...req.body, babyId });
    res.status(201).json(burp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log burp' });
  }
};

/**
 * GET /:babyId?date=YYYY-MM-DD
 * Returns all burps for a baby on a given date. Defaults to today.
 */
export const getBurpsByDate = async (
  req: Request<{ babyId: string }, {}, {}, { date?: string }>,
  res: Response
) => {
  try {
    const { babyId } = req.params;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const burps = await getBurps(babyId, date);
    res.json(burps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch burps' });
  }
};

/**
 * DELETE /:burpId
 * Deletes a single burp.
 */
export const deleteBurpHandler = async (
  req: Request<{ burpId: string }>,
  res: Response
) => {
  try {
    const { burpId } = req.params;
    await removeBurp(burpId);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete burp' });
  }
};
